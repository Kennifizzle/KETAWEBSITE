// One-off backfill script (NDPA BVN encryption, Option B migration).
//
// Run locally or in a CI job with the same env as your server:
//   node src/scripts/migrate-bvn-encrypt.mjs            # dry run (prints only)
//   node src/scripts/migrate-bvn-encrypt.mjs --apply     # write changes
//
// Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BVN_ENCRYPTION_KEY and
// DEEPIDV_BVN_PEPPER from the environment. It mirrors the logic in
// src/lib/crypto.server.ts (encryptBvn) and src/lib/payments.server.ts
// (hashBvn) so keep them in sync if you change the KDF below.

import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const DRY = !APPLY;

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SERVICE_ROLE = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const KEY_B64 = process.env["BVN_ENCRYPTION_KEY"];
const PEPPER = process.env["DEEPIDV_BVN_PEPPER"] ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function loadKey() {
  if (!KEY_B64) throw new Error("BVN_ENCRYPTION_KEY is not configured");
  let buf;
  if (/^[A-Za-z0-9+/]{43}={0,2}$/.test(KEY_B64) && KEY_B64.length === 44) {
    buf = Buffer.from(KEY_B64, "base64");
  } else if (/^[0-9a-fA-F]{64}$/.test(KEY_B64)) {
    buf = Buffer.from(KEY_B64, "hex");
  } else {
    buf = Buffer.from(KEY_B64, "utf8");
  }
  if (buf.length !== 32) throw new Error(`BVN_ENCRYPTION_KEY must be 32 bytes, got ${buf.length}`);
  return buf;
}

function encryptBvn(bvn) {
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(bvn, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

function hashBvn(bvn) {
  return createHash("sha256").update(`${bvn.trim()}:${PEPPER}`).digest("hex");
}

const isEncrypted = (v) =>
  typeof v === "string" && /^v1:[A-Za-z0-9+/]+:[A-Za-z0-9+/]+:[A-Za-z0-9+/=]+$/.test(v);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { storage: undefined },
});

const RETENTION_DAYS = 7;
const BATCH = 100;

const stats = { scanned: 0, encrypted: 0, purged: 0, deduped: 0, skipped: 0 };

let offset = 0;
while (true) {
  const { data, error } = await admin
    .from("orders")
    .select("id,reference,bvn,full_name,virtual_account_number,payment_status,created_at")
    .not("bvn", "is", null)
    .range(offset, offset + BATCH - 1)
    .order("id", { ascending: true });

  if (error) {
    console.error("fetch failed", error);
    process.exit(1);
  }
  if (!data || data.length === 0) break;

  for (const row of data) {
    stats.scanned++;
    const hasAccount = !!row.virtual_account_number;
    const stale =
      !hasAccount &&
      !["bvn_rejected", "awaiting_account"].includes(row.payment_status) &&
      row.created_at &&
      Date.now() - new Date(row.created_at).getTime() > RETENTION_DAYS * 24 * 3600 * 1000;

    if (hasAccount || stale) {
      // Account already created (or stuck & stale): we no longer need the BVN.
      // Record a hash so KYC is skipped for returning customers, then redact.
      if (row.bvn && !isEncrypted(row.bvn)) {
        if (DRY) {
          stats.deduped++;
        } else {
          const { error: upsertErr } = await admin.from("verified_identities").upsert(
            {
              bvn_hash: hashBvn(row.bvn),
              full_name: row.full_name,
              provider: "anchor",
            },
            { onConflict: "bvn_hash" },
          );
          if (upsertErr) console.error(`hash upsert failed for ${row.reference}`, upsertErr);
          stats.deduped++;
        }
      }
      if (DRY) {
        stats.purged++;
      } else {
        const { error: updErr } = await admin.from("orders").update({ bvn: null }).eq("id", row.id);
        if (updErr) console.error(`purge failed for ${row.reference}`, updErr);
        stats.purged++;
      }
    } else if (!isEncrypted(row.bvn)) {
      // Recent, in-flight, plaintext legacy row: encrypt it in place.
      const token = encryptBvn(row.bvn.trim());
      if (DRY) {
        stats.encrypted++;
      } else {
        const { error: updErr } = await admin
          .from("orders")
          .update({ bvn: token })
          .eq("id", row.id);
        if (updErr) console.error(`encrypt failed for ${row.reference}`, updErr);
        stats.encrypted++;
      }
    } else {
      stats.skipped++;
    }
  }

  if (data.length < BATCH) break;
  offset += BATCH;
}

console.log(`Mode: ${DRY ? "DRY RUN (no writes)" : "APPLY"}\n`, stats);
