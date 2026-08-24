import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Gift, ShieldCheck, Coins, FileText } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/keta/Nav";
import { Footer } from "@/components/keta/Footer";
import { OrderForm } from "@/components/keta/OrderForm";
import { CRYPTO_ASSETS, GIFTCARD_BRANDS } from "@/components/keta/brand";

const title = "Sell crypto & giftcards for cash | KETA Exchange";
const description =
  "Sell USDT, BTC and giftcards like Amazon, Steam and iTunes on KETA. Submit your order on the site, get a locked rate, and receive a bank payout through escrow.";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
});

const steps = [
  {
    icon: FileText,
    title: "Submit your sell order",
    copy: "Choose crypto or giftcard, enter the amount and your bank details.",
  },
  {
    icon: Coins,
    title: "Get a locked quote",
    copy: "A trader confirms the rate and emails you where to send the asset.",
  },
  {
    icon: ShieldCheck,
    title: "Escrow holds the trade",
    copy: "Your asset is verified and held until the payout is confirmed.",
  },
  {
    icon: Banknote,
    title: "Cash hits your account",
    copy: "Bank payout, usually within minutes of confirmation. Receipt every time.",
  },
];

function SellPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="glow-top relative overflow-hidden border-b border-border/60">
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1fr_1fr] lg:items-start lg:pt-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Live now
              </span>
              <h1 className="mt-6 text-4xl leading-tight font-bold sm:text-5xl">
                Sell crypto &amp; giftcards{" "}
                <span className="text-gradient-brand">for cash in your bank</span>
              </h1>
              <p className="mt-5 max-w-lg text-muted-foreground">
                Everything happens on this page — no chat app needed. Submit the order, get your
                rate, send the asset, get paid through escrow.
              </p>

              <ol className="mt-10 space-y-5">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex items-start gap-4">
                    <span className="font-display flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-semibold">
                        <s.icon className="size-4 text-primary" />
                        {s.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Coins className="size-4 text-primary" />
                    Coins we buy
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CRYPTO_ASSETS.map((a) => (
                      <span
                        key={a.symbol}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        {a.symbol}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Gift className="size-4 text-primary" />
                    Giftcards we buy
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GIFTCARD_BRANDS.map((g) => (
                      <span
                        key={g}
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28">
              <OrderForm side="sell" allowGiftcards />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
