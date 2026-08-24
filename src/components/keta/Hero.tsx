import { ArrowUpRight, Banknote, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import mark from "@/assets/keta-mark.png";
import { WHATSAPP_URL } from "./brand";

export function Hero() {
  return (
    <section id="top" className="glow-top relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Buy &amp; sell right here on the site
          </span>

          <h1 className="mt-6 text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl">
            Swap naira, cash and crypto{" "}
            <span className="text-gradient-brand">without the guesswork</span>
          </h1>

          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            KETA is Africa’s peer-to-peer currency exchange. Buy crypto with a plain bank transfer
            or sell crypto and giftcards for cash — all from this website, settled through escrow.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/buy"
              className="shadow-brand inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Banknote className="size-4" />
              Buy crypto now
            </Link>
            <Link
              to="/sell"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
            >
              Sell crypto &amp; giftcards
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
            {[
              { k: "Escrow", v: "on every trade" },
              { k: "Bank transfer", v: "in & out" },
              { k: "Real humans", v: "on standby" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="font-display text-sm font-semibold text-foreground">{s.k}</dt>
                <dd className="text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <BuyCard />
      </div>
    </section>
  );
}

function BuyCard() {
  return (
    <div id="buy-crypto" className="relative scroll-mt-24">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-brand opacity-20 blur-3xl" />
      <div className="shadow-card relative rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <img src={mark} alt="" aria-hidden className="size-9" />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Live right now
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold">Buy crypto seamlessly</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              With a plain bank transfer, straight from this website.
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            { icon: Banknote, text: "Pay by bank transfer — no card, no crypto onramp fees" },
            { icon: Zap, text: "Rate locked and coins delivered in minutes" },
            { icon: ShieldCheck, text: "Escrow-backed, with a human on standby if you need one" },
          ].map((row) => (
            <li key={row.text} className="flex items-start gap-3 text-sm text-muted-foreground">
              <row.icon className="mt-0.5 size-4 shrink-0 text-primary" />
              {row.text}
            </li>
          ))}
        </ul>

        <Link
          to="/buy"
          className="group mt-7 flex items-center justify-between gap-3 rounded-2xl bg-gradient-brand px-5 py-4 text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <span className="flex items-center gap-3">
            <Banknote className="size-5" />
            <span className="text-left">
              <span className="block text-sm font-bold">Start a buy order</span>
              <span className="block text-xs opacity-80">Takes about a minute</span>
            </span>
          </span>
          <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <MessageCircle className="size-4 text-whatsapp" />
          Need help? Chat with support
        </a>
      </div>
    </div>
  );
}
