import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Building2, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/keta/Nav";
import { Footer } from "@/components/keta/Footer";
import { OrderForm } from "@/components/keta/OrderForm";
import { CRYPTO_ASSETS } from "@/components/keta/brand";

const title = "Buy crypto with bank transfer | KETA Exchange";
const description =
  "Buy USDT, BTC, ETH and more with a Nigerian bank transfer on KETA. Place your order on the site, lock your rate, and get coins delivered in minutes.";

export const Route = createFileRoute("/buy")({
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
  component: BuyPage,
});

const steps = [
  {
    icon: Banknote,
    title: "Tell us what you want",
    copy: "Pick the coin, network and the naira amount you want to spend.",
  },
  {
    icon: Zap,
    title: "We lock your rate",
    copy: "A trader confirms the exact rate and fee — no surprises after you pay.",
  },
  {
    icon: Building2,
    title: "Pay by bank transfer",
    copy: "We email you a dedicated account to pay into. Normal transfer, no card needed.",
  },
  {
    icon: Wallet,
    title: "Coins land in your wallet",
    copy: "Once payment confirms, the crypto goes straight to the address you gave us.",
  },
];

function BuyPage() {
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
                Buy crypto with a{" "}
                <span className="text-gradient-brand">plain bank transfer</span>
              </h1>
              <p className="mt-5 max-w-lg text-muted-foreground">
                No card, no offshore onramp, no chat app. Fill the form, pay from your bank, and
                get your coins — with escrow and a real trader behind every order.
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

              <div className="mt-10 rounded-2xl border border-border bg-surface p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-primary" />
                  Supported assets
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
            </div>

            <div className="lg:sticky lg:top-28">
              <OrderForm side="buy" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
