import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { submitOrder } from "@/lib/orders.functions";
import { validateWalletAddress } from "@/lib/wallet-validation";
import { getQuote } from "@/lib/quote.functions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CRYPTO_ASSETS, GIFTCARD_BRANDS } from "./brand";

type Side = "buy" | "sell";
type Kind = "crypto" | "giftcard";

const schema = z.object({
  asset: z.string().trim().min(1, "Choose an asset"),
  amount: z
    .number({ message: "Enter an amount" })
    .positive("Enter an amount greater than zero")
    .max(100000000, "That amount is too large — contact the desk"),
  fullName: z.string().trim().min(1, "Your name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Your phone number is required").max(30),
  walletAddress: z.string().trim().max(200).optional(),
  bvn: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Enter your 11-digit BVN")
    .optional(),
  bankName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().max(30).optional(),
  accountName: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

function fmtNgn(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function fmtQty(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 8 : 6 });
}

const field = "mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40 text-foreground";

export function OrderForm({
  side,
  allowGiftcards = false,
}: {
  side: Side;
  allowGiftcards?: boolean;
}) {
  const [kind, setKind] = useState<Kind>("crypto");
  const [asset, setAsset] = useState(side === "buy" ? "USDT" : "USDT");
  const [network, setNetwork] = useState("TRC20");
  const [wallet, setWallet] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [debouncedAmount, setDebouncedAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = Number(amountInput.replace(/,/g, ""));
    const t = setTimeout(() => setDebouncedAmount(Number.isFinite(raw) ? raw : 0), 450);
    return () => clearTimeout(t);
  }, [amountInput]);

  const quoteFn = useServerFn(getQuote);
  const { data: quote, isFetching: quoting } = useQuery({
    queryKey: ["quote", side, asset, kind, debouncedAmount],
    queryFn: () => quoteFn({ data: { asset, side, amount: debouncedAmount } }),
    enabled: kind === "crypto" && debouncedAmount > 0,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const walletError = useMemo(
    () => (wallet.trim() === "" ? null : validateWalletAddress(wallet, network)),
    [wallet, network],
  );

  const networks = useMemo(
    () => CRYPTO_ASSETS.find((a) => a.symbol === asset)?.networks ?? [],
    [asset],
  );

  const isCrypto = kind === "crypto";

  function pickAsset(symbol: string) {
    setAsset(symbol);
    const next = CRYPTO_ASSETS.find((a) => a.symbol === symbol)?.networks ?? [];
    setNetwork(next[0] ?? "");
  }

  function switchKind(next: Kind) {
    setKind(next);
    if (next === "crypto") {
      setAsset("USDT");
      setNetwork("TRC20");
    } else {
      setAsset(GIFTCARD_BRANDS[0]);
      setNetwork("");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = (key: string) => {
      const v = fd.get(key);
      return typeof v === "string" && v.trim() !== "" ? v : undefined;
    };
    const rawAmount = (text("amount") ?? "").replace(/,/g, "");

    const parsed = schema.safeParse({
      asset,
      amount: rawAmount === "" ? Number.NaN : Number(rawAmount),
      fullName: text("fullName"),
      email: text("email"),
      phone: text("phone"),
      walletAddress: text("walletAddress"),
      bvn: text("bvn"),
      bankName: text("bankName"),
      accountNumber: text("accountNumber"),
      accountName: text("accountName"),
      note: text("note"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (side === "buy" && isCrypto) {
      const message = validateWalletAddress(parsed.data.walletAddress ?? "", network);
      if (message) {
        toast.error(message);
        return;
      }
    }

    if (side === "buy" && !parsed.data.bvn) {
      toast.error("Enter your 11-digit BVN so we can create your payment account");
      return;
    }

    setLoading(true);
    try {
      const res = await submitOrder({
        data: {
          side,
          kind,
          asset: parsed.data.asset,
          network: isCrypto ? network : null,
          amount: parsed.data.amount,
          amountCurrency: "NGN",
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          walletAddress: side === "buy" && isCrypto ? parsed.data.walletAddress || null : null,
          bvn: side === "buy" ? parsed.data.bvn || null : null,
          bankName: side === "sell" ? parsed.data.bankName || null : null,
          accountNumber: side === "sell" ? parsed.data.accountNumber || null : null,
          accountName: side === "sell" ? parsed.data.accountName || null : null,
          note: parsed.data.note || null,
        },
      });
      if (side === "buy") {
        toast.success("Order received — setting up your payment account.");
        navigate({
          to: "/pay/$reference",
          params: { reference: res.reference },
          search: { sessionId: undefined, status: undefined, reason: undefined },
        });
        return;
      }
      setReference(res.reference);
      toast.success("Order received — check your email.");
    } catch {
      toast.error("Could not place the order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (reference) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h3 className="mt-4 text-xl font-semibold">Order received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your reference is{" "}
          <span className="font-display font-bold text-foreground">{reference}</span>. We emailed
          you a copy — the desk confirms your rate and sends{" "}
          {side === "buy" ? "the payment account details" : "the deposit address"} next.
        </p>
        <button
          type="button"
          onClick={() => setReference(null)}
          className="mt-6 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="shadow-card rounded-3xl border border-border bg-surface p-6 sm:p-8"
    >
      {allowGiftcards && (
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/50 p-1">
          {(["crypto", "giftcard"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchKind(k)}
              className={
                kind === k
                  ? "rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  : "rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {k === "crypto" ? "Crypto" : "Giftcard"}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={isCrypto ? "" : "sm:col-span-2"}>
          <Label htmlFor="asset">{isCrypto ? "Asset" : "Giftcard brand"}</Label>
          <select
            id="asset"
            value={asset}
            onChange={(e) => pickAsset(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-md border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          >
            {(isCrypto ? CRYPTO_ASSETS.map((a) => `${a.symbol}`) : GIFTCARD_BRANDS).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {isCrypto && (
          <div>
            <Label htmlFor="network">Network</Label>
            <select
              id="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            >
              {networks.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="amount">
            {side === "buy" ? "Amount to spend (NGN)" : "Value to sell (NGN equivalent)"}
          </Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="e.g. 250000"
            className={field}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
          />

          {isCrypto && debouncedAmount > 0 && (
            <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
              {quote ? (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      You {side === "buy" ? "receive" : "send"}
                    </span>
                    <span className="font-display text-lg font-bold text-foreground">
                      {quote.quantity != null
                        ? `${fmtQty(quote.quantity)} ${asset}`
                        : "Rate on request"}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {quote.unitPriceNgn != null && (
                      <div className="flex justify-between gap-3">
                        <dt>Rate</dt>
                        <dd className="text-foreground">
                          ₦{fmtNgn(quote.unitPriceNgn)} / {asset}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt>Order value</dt>
                      <dd className="text-foreground">
                        ₦{fmtNgn(quote.amountNgn)} · ≈ ${fmtNgn(quote.usdAmount)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>USD/NGN</dt>
                      <dd className="text-foreground">₦{fmtNgn(quote.usdRate)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Indicative rate, refreshed every minute. Locked when the desk confirms your
                    order.
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  {quoting ? "Fetching live rate…" : "Rate unavailable — the desk will confirm."}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" placeholder="Ada Obi" className={field} required />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            className={field}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="phone">Phone / WhatsApp</Label>
          <Input id="phone" name="phone" placeholder="+234..." className={field} required />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Required for identity verification on orders above $100.
          </p>
        </div>

        {side === "buy" && isCrypto && (
          <div className="sm:col-span-2">
            <Label htmlFor="walletAddress">Wallet address to receive {asset}</Label>
            <Input
              id="walletAddress"
              name="walletAddress"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder={`Your ${network || asset} address`}
              className={field}
              required
            />
            {walletError ? (
              <p className="mt-1.5 text-xs text-destructive">{walletError}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Double-check this — {network || asset} transfers can't be reversed.
              </p>
            )}
          </div>
        )}

        {side === "buy" && (
          <div className="sm:col-span-2">
            <Label htmlFor="bvn">BVN (for your payment account)</Label>
            <Input
              id="bvn"
              name="bvn"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              placeholder="11-digit BVN"
              className={field}
              required
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your name, email and BVN are used only to verify you and open your dedicated transfer
              account. We never see or store your bank password or PIN.
            </p>
          </div>
        )}

        {side === "sell" && (
          <>
            <div>
              <Label htmlFor="bankName">Bank name</Label>
              <Input id="bankName" name="bankName" placeholder="e.g. GTBank" className={field} />
            </div>
            <div>
              <Label htmlFor="accountNumber">Account number</Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                inputMode="numeric"
                placeholder="0123456789"
                className={field}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="accountName">Account name</Label>
              <Input id="accountName" name="accountName" placeholder="Ada Obi" className={field} />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="note">Anything else? (optional)</Label>
          <Textarea
            id="note"
            name="note"
            rows={3}
            placeholder={
              side === "buy"
                ? "Preferred settlement time, questions about the rate…"
                : "Card type, receipt available, urgency…"
            }
            className={field}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="shadow-brand mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-70"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {side === "buy" ? "Place buy order" : "Place sell order"}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        No payment is taken now. We confirm your rate and send{" "}
        {side === "buy" ? "the bank details" : "the deposit address"} by email first.
      </p>
    </form>
  );
}
