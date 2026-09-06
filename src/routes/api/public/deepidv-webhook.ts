import { createFileRoute } from "@tanstack/react-router";

interface DeepIdvSession {
  id?: string;
  external_id?: string;
  status?: string;
  type?: string;
}

interface DeepIdvWebhookPayload {
  type?: string;
  data?: DeepIdvSession;
}

/**
 * DeepIDV verification webhook — unblocks the payment step once approved.
 *
 * DeepIDV sends `{ type, data }` where `data` is the session object
 * (same shape as the Retrieve Session API). The `deepidv-signature` header
 * contains the plain signing secret (`whsec_…`) configured in the dashboard.
 */
export const Route = createFileRoute("/api/public/deepidv-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["DEEPIDV_WEBHOOK_SECRET"];
        const body = await request.text();

        if (secret) {
          const signature = request.headers.get("deepidv-signature") ?? "";
          if (signature !== secret) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: DeepIdvWebhookPayload;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const session: DeepIdvSession = payload?.data ?? {};
        const sessionId: string | undefined = session.id;
        const externalId: string | undefined = session.external_id;
        const rawStatus = String(session.status ?? payload.type ?? "").toUpperCase();

        if (!sessionId && !externalId) {
          return new Response("Missing session id", { status: 400 });
        }

        const status =
          rawStatus === "VERIFIED"
            ? "approved"
            : /REJECT|FAILED/.test(rawStatus)
              ? "rejected"
              : "pending";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const query = supabaseAdmin.from("orders").update({
          verification_status: status,
          verified_at: status === "approved" ? new Date().toISOString() : null,
        });

        const { error } = externalId
          ? await query.eq("reference", externalId)
          : await query.eq("verification_ref", sessionId!);

        if (error) {
          console.error("deepidv webhook update failed", error);
          return new Response("Update failed", { status: 500 });
        }

        // One-time verification: remember this person (by hashed BVN) so
        // future orders skip KYC. We look up the order's BVN to hash it.
        if (status === "approved") {
          try {
            const { data: order } = await supabaseAdmin
              .from("orders")
              .select("bvn, full_name")
              .eq(externalId ? "reference" : "verification_ref", externalId ?? sessionId!)
              .maybeSingle();

            if (order?.bvn) {
              const { hashBvn } = await import("@/lib/payments.server");
              await supabaseAdmin.from("verified_identities").upsert(
                {
                  bvn_hash: hashBvn(order.bvn),
                  full_name: order.full_name,
                  provider: "deepidv",
                  provider_ref: sessionId ?? null,
                },
                { onConflict: "bvn_hash" },
              );
            }
          } catch (e) {
            console.error("verified_identities upsert failed", e);
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
