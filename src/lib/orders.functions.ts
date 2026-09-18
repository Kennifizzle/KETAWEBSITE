import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validateWalletAddress } from "@/lib/wallet-validation";

const orderSchema = z
  .object({
    side: z.enum(["buy", "sell"]),
    kind: z.enum(["crypto", "giftcard"]),
    asset: z.string().trim().min(1).max(40),
    network: z.string().trim().max(40).optional().nullable(),
    amount: z.number().positive().max(100000000),
    amountCurrency: z.string().trim().min(1).max(10).default("NGN"),
    fullName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(30).optional().nullable(),
    walletAddress: z.string().trim().max(200).optional().nullable(),
    bvn: z
      .string()
      .trim()
      .regex(/^\d{11}$/)
      .optional()
      .nullable(),
    bankName: z.string().trim().max(100).optional().nullable(),
    accountNumber: z.string().trim().max(30).optional().nullable(),
    accountName: z.string().trim().max(100).optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.side !== "buy" || data.kind !== "crypto") return;
    const message = validateWalletAddress(data.walletAddress ?? "", data.network ?? "");
    if (message) ctx.addIssue({ code: "custom", message, path: ["walletAddress"] });
  });

export const submitOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => orderSchema.parse(data))

  .handler(async ({ data }) => {
    // Server-side, input already validated. Admin client is used so we can read
    // back the generated reference (the table has no public SELECT policy).
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { encryptBvn } = await import("@/lib/crypto.server");
    // BVN is sensitive (NDPA). Encrypt at rest; never store plaintext.
    const encryptedBvn = data.bvn ? encryptBvn(data.bvn) : null;

    const { data: inserted, error } = await supabase
      .from("orders")
      .insert({
        side: data.side,
        kind: data.kind,
        asset: data.asset,
        network: data.network || null,
        amount: data.amount,
        amount_currency: data.amountCurrency,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        wallet_address: data.walletAddress || null,
        bvn: encryptedBvn,
        bank_name: data.bankName || null,
        account_number: data.accountNumber || null,
        account_name: data.accountName || null,
        note: data.note || null,
      })
      .select("id, reference")
      .single();

    if (error) {
      console.error("order insert failed", error);
      throw new Error("Could not place the order right now");
    }

    const reference = inserted?.reference ?? "KETA";
    const id = inserted?.id ?? reference;

    const amountLabel = `${data.amountCurrency} ${data.amount.toLocaleString("en-US")}`;

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("order-confirmation", data.email, {
        templateData: {
          name: data.fullName,
          reference,
          side: data.side,
          kind: data.kind,
          asset: data.asset,
          network: data.network || "",
          amount: amountLabel,
        },
        idempotencyKey: `order-confirmation-${id}`,
        replyTo: "KETAEXCHANGE@GMAIL.COM",
      });
      await sendTemplateEmail("order-notification", "KETAEXCHANGE@GMAIL.COM", {
        templateData: {
          reference,
          side: data.side,
          kind: data.kind,
          asset: data.asset,
          network: data.network || "",
          amount: amountLabel,
          name: data.fullName,
          email: data.email,
          phone: data.phone || "",
          walletAddress: data.walletAddress || "",
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          accountName: data.accountName || "",
          note: data.note || "",
        },
        idempotencyKey: `order-notification-${id}`,
        replyTo: data.email,
      });
    } catch (emailError) {
      console.error("order email send failed", emailError);
    }

    try {
      const { logActivity } = await import("@/lib/activity.server");
      await logActivity({
        event: "order.created",
        reference,
        actor: data.email,
        message: `${data.side.toUpperCase()} ${data.asset} · ${data.amount}`,
      });
    } catch (logError) {
      console.error("order activity log failed", logError);
    }

    return { ok: true as const, reference };
  });
