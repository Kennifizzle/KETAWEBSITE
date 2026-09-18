import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

const refSchema = z.object({ reference: z.string().trim().min(4).max(40) });

export interface PaymentView {
  reference: string;
  side: "buy" | "sell";
  kind: "crypto" | "giftcard";
  asset: string;
  network: string | null;
  amount: number;
  amountCurrency: string;
  usdAmount: number | null;
  usdRate: number | null;
  assetPriceUsd: number | null;
  unitPriceNgn: number | null;
  quantity: number | null;
  paymentStatus: string;
  verificationRequired: boolean;
  verificationStatus: string;
  verificationUrl: string | null;
  account: {
    number: string;
    bank: string;
    name: string;
    expiresAt: string | null;
  } | null;
}

/**
 * Loads (and, on first call, provisions) the payment session for an order.
 * Creates the Anchor virtual account, and a DeepIDV check when the order is
 * worth more than $100.
 */
export const getPaymentSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => refSchema.parse(data))
  .handler(async ({ data }): Promise<PaymentView> => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const {
      createAnchorVirtualAccount,
      createDeepIdvSession,
      getUsdNgnRate,
      hashBvn,
      quoteOrder,
      VERIFICATION_USD_THRESHOLD,
    } = await import("@/lib/payments.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");
    const { decryptBvn } = await import("@/lib/crypto.server");

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error) {
      console.error("order lookup failed", error);
      throw new Error("Could not load this order");
    }
    if (!order) throw new Error("Order not found");

    // BVN is encrypted at rest; decrypt only transiently for the provider calls below.
    const bvn = order.bvn ? decryptBvn(order.bvn) : null;

    let usdAmount = order.usd_amount as number | null;
    let usdRate = (order as { usd_rate?: number | null }).usd_rate ?? null;
    let verificationRequired = order.verification_required as boolean;
    let verificationStatus = order.verification_status as string;
    let verificationUrl = order.verification_url as string | null;
    const patch: OrderUpdate = {};

    // 1. Value the order in USD once.
    if (usdAmount == null) {
      const rate = await getUsdNgnRate();
      usdRate = rate;
      usdAmount = Number(order.amount) / rate;
      verificationRequired = usdAmount > VERIFICATION_USD_THRESHOLD;
      patch["usd_amount"] = Number(usdAmount.toFixed(2));
      patch["usd_rate"] = rate;
      patch["verification_required"] = verificationRequired;
      if (verificationRequired && verificationStatus === "not_required") {
        verificationStatus = "pending";
        patch["verification_status"] = verificationStatus;
      }
    }

    // Live pricing for the order so the customer always sees the rate.
    const quote =
      order.kind === "crypto"
        ? await quoteOrder({
            asset: order.asset,
            side: order.side as "buy" | "sell",
            amountNgn: Number(order.amount),
          }).catch((e) => {
            console.error("quote failed", e);
            return null;
          })
        : null;
    if (quote) usdRate = quote.usdRate;

    // DeepIDV requires HTTPS for redirect_url. DEEPIDV_REDIRECT_BASE overrides
    // the origin (use it in local dev so DeepIDV redirects to your real domain
    // instead of https://localhost which has no HTTPS cert).
    const origin = (() => {
      const override = process.env["DEEPIDV_REDIRECT_BASE"];
      if (override) return override.replace(/\/$/, "");
      try {
        return new URL(getRequestUrl()).origin.replace(/^http:\/\//, "https://");
      } catch {
        return "https://example.com";
      }
    })();

    // 2. Identity verification for high-value orders.
    if (verificationRequired && !verificationUrl && verificationStatus !== "approved") {
      // One-time verification: if this person (by hashed BVN) has already
      // passed DeepIDV on a previous order, skip KYC entirely.
      if (bvn) {
        const { data: existing } = await supabase
          .from("verified_identities")
          .select("id")
          .eq("bvn_hash", hashBvn(bvn))
          .maybeSingle();
        if (existing) {
          verificationStatus = "approved";
          patch["verification_provider"] = "deepidv";
          patch["verification_status"] = "approved";
          patch["verified_at"] = new Date().toISOString();
        }
      }

      if (verificationStatus !== "approved") {
        try {
          const session = await createDeepIdvSession({
            reference: order.reference,
            fullName: order.full_name,
            email: order.email,
            phone: order.phone,
            redirectUrl: `${origin}/pay/${order.reference}`,
          });
          verificationUrl = session.url;
          patch["verification_provider"] = "deepidv";
          patch["verification_ref"] = session.ref;
          patch["verification_url"] = session.url;
          patch["verification_status"] = "pending";
          verificationStatus = "pending";
        } catch (e) {
          console.error("deepidv session failed", e);
        }
      }
    }

    // 3. Virtual account — only once verification is out of the way.
    const verificationBlocks = verificationRequired && verificationStatus !== "approved";
    let accountNumber = order.virtual_account_number as string | null;
    let bankName = order.virtual_account_bank as string | null;
    let accountName = order.virtual_account_name as string | null;
    let expiresAt = order.payment_expires_at as string | null;
    let paymentStatus = order.payment_status as string;

    if (!accountNumber && !verificationBlocks) {
      try {
        const account = await createAnchorVirtualAccount({
          reference: order.reference,
          fullName: order.full_name,
          email: order.email,
          phone: order.phone,
          bvn,
        });
        accountNumber = account.accountNumber;
        bankName = account.bankName;
        accountName = account.accountName;
        expiresAt = account.expiresAt;

        // Data minimization (NDPA): the BVN is no longer needed once the
        // account is created. Record a hashed identity so KYC is skipped on
        // future orders, then drop the (encrypted) BVN entirely.
        if (bvn) {
          patch["bvn"] = null;
          try {
            const { error: dupeError } = await supabase.from("verified_identities").upsert(
              {
                bvn_hash: hashBvn(bvn),
                full_name: order.full_name,
                provider: "anchor",
                provider_ref: account.providerRef,
                verified_at: new Date().toISOString(),
              },
              { onConflict: "bvn_hash" },
            );
            if (dupeError) console.error("verified_identity upsert failed", dupeError);
          } catch (e) {
            console.error("verified_identity upsert failed", e);
          }
        }

        paymentStatus = "awaiting_payment";
        patch["virtual_account_number"] = account.accountNumber;
        patch["virtual_account_bank"] = account.bankName;
        patch["virtual_account_name"] = account.accountName;
        patch["payment_provider"] = "anchor";
        patch["payment_provider_ref"] = account.providerRef;
        patch["payment_expires_at"] = account.expiresAt;
        patch["payment_status"] = paymentStatus;
      } catch (e) {
        console.error("anchor virtual account failed", e);
        // Provider not fully configured yet (e.g. business BVN missing) — the
        // desk settles this order manually instead of showing a hard error.
        const message = e instanceof Error ? e.message : "";
        const name = e instanceof Error ? e.name : "";
        paymentStatus =
          name === "BvnRejectedError"
            ? "bvn_rejected"
            : message.includes("ANCHOR_BVN")
              ? "manual_account"
              : "account_failed";
        patch["payment_status"] = paymentStatus;
      }
    }

    // Defensive retention: if this order got stuck without an account and still
    // holds a BVN (e.g. Anchor never responded), expire the BVN after the
    // account-creation window has long passed.
    const daysSinceCreated = order.created_at
      ? (Date.now() - new Date(order.created_at as string).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (
      bvn &&
      !accountNumber &&
      paymentStatus !== "bvn_rejected" &&
      paymentStatus !== "awaiting_account" &&
      daysSinceCreated > 7
    ) {
      patch["bvn"] = null;
    }

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (updateError) console.error("order payment update failed", updateError);
    }

    return {
      reference: order.reference,
      side: order.side as "buy" | "sell",
      kind: order.kind as "crypto" | "giftcard",
      asset: order.asset,
      network: order.network,
      amount: Number(order.amount),
      amountCurrency: order.amount_currency,
      usdAmount: usdAmount == null ? null : Number(usdAmount.toFixed(2)),
      usdRate,
      assetPriceUsd: quote?.assetPriceUsd ?? null,
      unitPriceNgn: quote?.unitPriceNgn ?? null,
      quantity: quote?.quantity ?? null,
      paymentStatus,
      verificationRequired,
      verificationStatus,
      verificationUrl,
      account: accountNumber
        ? {
            number: accountNumber,
            bank: bankName ?? "Bank",
            name: accountName ?? order.full_name,
            expiresAt,
          }
        : null,
    };
  });

const bvnSchema = z.object({
  reference: z.string().trim().min(4).max(40),
  bvn: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Enter your 11-digit BVN"),
});

/** Lets a buyer correct a BVN the provider rejected, then retry the account. */
export const updateOrderBvn = createServerFn({ method: "POST" })
  .validator((data: unknown) => bvnSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { encryptBvn } = await import("@/lib/crypto.server");
    const { error } = await supabase
      .from("orders")
      .update({ bvn: encryptBvn(data.bvn), payment_status: "awaiting_account" })
      .eq("reference", data.reference)
      .is("virtual_account_number", null);

    if (error) {
      console.error("order bvn update failed", error);
      throw new Error("Could not update your BVN right now");
    }
    return { ok: true as const };
  });
