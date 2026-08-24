import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/keta/Nav";
import { Footer } from "@/components/keta/Footer";
import { getPaymentSession, updateOrderBvn } from "@/lib/payments.functions";

function BvnFixCard({ reference, onFixed }: { reference: string; onFixed: () => void }) {
  const [bvn, setBvn] = useState("");
  const [saving, setSaving] = useState(false);
  const save = useServerFn(updateOrderBvn);

  return (
    <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
      <AlertTriangle className="size-5 text-destructive" />
      <h2 className="mt-2 text-base font-semibold">We couldn't verify that BVN</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your bank verification number didn't match the name on this order, so no payment account
        was created. Re-enter your correct 11-digit BVN below.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\d{11}$/.test(bvn.trim())) {
            toast.error("Enter your 11-digit BVN");
            return;
          }
          setSaving(true);
          try {
            await save({ data: { reference, bvn: bvn.trim() } });
            toast.success("BVN updated — creating your account…");
            onFixed();
          } catch {
            toast.error("Could not update your BVN. Please try again.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <input
          value={bvn}
          onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
          inputMode="numeric"
          maxLength={11}
          placeholder="11-digit BVN"
          className="h-11 flex-1 rounded-full border border-border bg-background/60 px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={saving}
          className="shadow-brand inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Update &amp; retry
        </button>
      </form>
    </div>
  );
}

const title = "Complete your payment | KETA Exchange";
const description =
  "Pay for your KETA order by bank transfer to the dedicated account generated for you. Coins are released as soon as payment confirms.";

export const Route = createFileRoute("/pay/$reference")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PayPage,
});

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function num(n: number, digits = 2) {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(`${label} copied`);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            toast.error("Could not copy — select it manually");
          }
        }}
        className="font-display inline-flex items-center gap-2 text-right text-base font-bold tracking-wide text-foreground transition-colors hover:text-primary"
      >
        {value}
        {copied ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <Copy className="size-4 opacity-60" />
        )}
      </button>
    </div>
  );
}

function PayPage() {
  const { reference } = Route.useParams();
  const load = useServerFn(getPaymentSession);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["payment", reference],
    queryFn: () => load({ data: { reference } }),
    refetchInterval: (query) =>
      query.state.data?.paymentStatus === "paid" ? false : 15000,
    retry: 1,
  });

  useEffect(() => {
    if (data?.paymentStatus === "paid") toast.success("Payment confirmed");
  }, [data?.paymentStatus]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="glow-top relative overflow-hidden">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-2xl px-5 pb-24 pt-14 lg:pt-20">
          <Link to="/buy" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to buy
          </Link>

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Complete your <span className="text-gradient-brand">payment</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Order reference{" "}
            <span className="font-display font-bold text-foreground">{reference}</span>
          </p>

          {isLoading && (
            <div className="mt-10 flex items-center gap-3 rounded-3xl border border-border bg-surface p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Setting up your payment account…
            </div>
          )}

          {error && (
            <div className="mt-10 rounded-3xl border border-destructive/40 bg-destructive/5 p-8">
              <AlertTriangle className="size-6 text-destructive" />
              <h2 className="mt-3 text-lg font-semibold">We couldn't load this order</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Double-check the reference, or reach the desk on WhatsApp and we'll finish it
                manually.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
              >
                Try again
              </button>
            </div>
          )}

          {data && (
            <div className="mt-8 space-y-6">
              <div className="shadow-card rounded-3xl border border-border bg-surface p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      You are {data.side === "buy" ? "buying" : "selling"}
                    </p>
                    <p className="font-display mt-1 text-xl font-bold">
                      {data.asset}
                      {data.network ? ` · ${data.network}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount</p>
                    <p className="font-display mt-1 text-xl font-bold">
                      {money(data.amount, data.amountCurrency)}
                    </p>
                    {data.usdAmount != null && (
                      <p className="text-xs text-muted-foreground">≈ ${data.usdAmount}</p>
                    )}
                  </div>
                </div>

                <dl className="mt-6 space-y-2 border-t border-border/60 pt-5 text-sm">
                  {data.quantity != null && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        You {data.side === "buy" ? "receive" : "send"}
                      </dt>
                      <dd className="font-display font-bold text-foreground">
                        {num(data.quantity, data.quantity < 1 ? 8 : 6)} {data.asset}
                      </dd>
                    </div>
                  )}
                  {data.unitPriceNgn != null && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Rate</dt>
                      <dd className="text-foreground">
                        ₦{num(data.unitPriceNgn)} / {data.asset}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Order value</dt>
                    <dd className="text-foreground">
                      {money(data.amount, data.amountCurrency)}
                      {data.usdAmount != null ? ` · ≈ $${num(data.usdAmount)}` : ""}
                    </dd>
                  </div>
                  {data.usdRate != null && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">USD/NGN</dt>
                      <dd className="text-foreground">₦{num(data.usdRate)}</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Rate shown is indicative and confirmed by the desk when your transfer lands.
                </p>
              </div>

              {data.verificationRequired && data.verificationStatus !== "approved" && (
                <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
                  <ShieldCheck className="size-6 text-primary" />
                  <h2 className="mt-3 text-lg font-semibold">Quick identity check required</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Orders above $100 need a one-time identity verification with our partner
                    DeepIDV. It takes about two minutes — your payment account is generated right
                    after.
                  </p>
                  {data.verificationUrl ? (
                    <a
                      href={data.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shadow-brand mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      <BadgeCheck className="size-4" />
                      Verify my identity
                    </a>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      We're preparing your verification link — refresh in a moment.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Status: {data.verificationStatus}
                  </p>
                </div>
              )}

              {data.account && (
                <div className="shadow-card rounded-3xl border border-border bg-surface p-6 sm:p-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Building2 className="size-5 text-primary" />
                    Transfer to this account
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This account was created for this order only. Send exactly{" "}
                    <span className="font-semibold text-foreground">
                      {money(data.amount, data.amountCurrency)}
                    </span>{" "}
                    from your bank app.
                  </p>
                  <div className="mt-5">
                    <CopyRow label="Account number" value={data.account.number} />
                    <CopyRow label="Bank" value={data.account.bank} />
                    <CopyRow label="Account name" value={data.account.name} />
                    <CopyRow
                      label="Amount"
                      value={String(data.amount)}
                    />
                  </div>
                  {data.account.expiresAt && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Expires {new Date(data.account.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {data.paymentStatus === "manual_account" && (
                <div className="shadow-card rounded-3xl border border-border bg-surface p-6 sm:p-8">
                  <Building2 className="size-5 text-primary" />
                  <h2 className="mt-2 text-base font-semibold">
                    Your payment details are on the way
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Automatic bank accounts are being switched on. For now the desk sends your
                    transfer details by email within minutes — keep this reference{" "}
                    <span className="font-semibold text-foreground">{reference}</span> handy, or
                    message us on WhatsApp to finish right away.
                  </p>
                </div>
              )}

              {data.paymentStatus === "bvn_rejected" && (
                <BvnFixCard reference={reference} onFixed={() => refetch()} />
              )}

              {data.paymentStatus === "account_failed" && (
                <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6">
                  <AlertTriangle className="size-5 text-destructive" />
                  <h2 className="mt-2 text-base font-semibold">Account not ready yet</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We couldn't generate your payment account. Retry below — the desk has your
                    order either way and will reach out by email.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
                  >
                    Retry
                  </button>
                </div>
              )}




              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {data.paymentStatus === "paid" ? (
                  <>
                    <CheckCircle2 className="size-4 text-primary" />
                    Payment confirmed — your {data.asset} is on the way.
                  </>
                ) : (
                  <>
                    {isFetching ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <span className="size-2 animate-pulse rounded-full bg-primary" />
                    )}
                    Waiting for your transfer — this page updates automatically.
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
