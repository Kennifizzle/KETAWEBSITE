// Server-only. AES-256-GCM encryption for sensitive identity data (BVN).
// Never import this from client components.
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const VERSION = "v1";

function loadKey(): Buffer {
  const raw = process.env["BVN_ENCRYPTION_KEY"];
  if (!raw) throw new Error("BVN_ENCRYPTION_KEY is not configured");

  let buf: Buffer;
  // Accept 32-byte base64 (recommended), 32-byte hex, or a 32-char raw string.
  if (/^[A-Za-z0-9+/]{43}={0,2}$/.test(raw) && raw.length === 44) {
    buf = Buffer.from(raw, "base64");
  } else if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    buf = Buffer.from(raw, "hex");
  } else {
    buf = Buffer.from(raw, "utf8");
  }
  if (buf.length !== 32) {
    throw new Error(`BVN_ENCRYPTION_KEY must decode to 32 bytes (AES-256); got ${buf.length}.`);
  }
  return buf;
}

/** Encrypt a plaintext BVN for at-rest storage. */
export function encryptBvn(bvn: string): string {
  if (!bvn) return "";
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(bvn, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * Decrypt a BVN token produced by `encryptBvn`. For backward compatibility with
 * rows that still hold legacy plaintext (pre-migration), a value that does not
 * look like a `v1:` token is returned as-is. The backfill script
 * (src/scripts/migrate-bvn-encrypt.mjs) removes such rows; this just prevents
 * the pay page from crashing in the deploy window before the backfill runs.
 */
export function decryptBvn(token: string): string {
  if (!token) return "";
  if (!token.startsWith(`${VERSION}:`)) return token;
  const parts = token.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted BVN token format");
  }

  const key = loadKey();
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
