import {
  ArrowLeftRight,
  Bitcoin,
  Gift,
  Handshake,
  LineChart,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Wallet,
  FileText,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WHATSAPP_URL } from "./brand";

function SectionHead({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      {copy && <p className="mt-3 text-muted-foreground">{copy}</p>}
    </div>
  );
}

export function SellNow() {
  const rows = [
    {
      icon: Bitcoin,
      title: "Sell crypto for cash",
      copy: "USDT, BTC and other major coins — send the coins, we pay to your bank account.",
    },
    {
      icon: Gift,
      title: "Sell giftcards",
      copy: "Amazon, Steam, iTunes, Apple and more. Submit the card details, get a rate, get paid.",
    },
  ];

  return (
    <section id="sell" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-8 sm:p-12">
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-gradient-brand opacity-15 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <FileText className="size-3.5" />
                Live on the site today
              </span>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                Selling? Do it{" "}
                <span className="text-gradient-brand">right here on the site</span>
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Fill the sell form with the coin or giftcard, the amount and your bank details. A
                KETA trader confirms your rate, escrow holds the trade, and cash lands in your
                account.
              </p>
              <Link
                to="/sell"
                className="shadow-brand mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Start a sell order
              </Link>
            </div>

            <ul className="space-y-3">
              {rows.map((r) => (
                <li
                  key={r.title}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-background/40 px-5 py-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <r.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{r.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{r.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  const items = [
    {
      icon: Bitcoin,
      title: "Buy crypto, bank-transfer simple",
      copy: "Buy USDT, BTC and more with local bank payment — order directly on the site.",
      live: true,
    },
    {
      icon: Gift,
      title: "Sell crypto & giftcards",
      copy: "Cash out coins or Amazon, Steam, iTunes and Apple cards through the sell form.",
      live: true,
    },
    {
      icon: ArrowLeftRight,
      title: "P2P currency exchange",
      copy: "NGN, USD, GBP, EUR and more, matched peer-to-peer at rates that beat the counter.",
      live: false,
    },
    {
      icon: LineChart,
      title: "Invest & earn",
      copy: "Put idle balances to work with curated, transparent earning options.",
      live: false,
    },
  ];

  return (
    <section id="services" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead
          eyebrow="What KETA does"
          title="One desk for every swap you make"
          copy="Buying and selling run on this site today. The rest arrives with the full platform."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {items.map((s) => (
            <article
              key={s.title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <s.icon className="size-6" />
                </div>
                <span
                  className={
                    s.live
                      ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
                      : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
                  }
                >
                  {s.live ? "Live now" : "Coming soon"}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Fill the buy or sell form",
      copy: "Tell us what you want to buy or sell and the amount — no app, no chat required.",
    },
    {
      icon: Wallet,
      title: "Lock the rate, send the transfer",
      copy: "You see the exact rate and fee before anything moves. Pay with a normal bank transfer.",
    },
    {
      icon: ShieldCheck,
      title: "Escrow holds both sides",
      copy: "Funds and assets sit in escrow until both parties are confirmed.",
    },
    {
      icon: Handshake,
      title: "Settled, usually in minutes",
      copy: "Crypto hits your wallet or cash hits your account. Receipt every time.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHead eyebrow="How it works" title="Four steps, no mystery" />
        <ol className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="font-display flex size-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <s.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LaunchingSoon() {
  return (
    <section id="app" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-8 sm:p-12">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Smartphone className="size-3.5" />
                Launching soon
              </span>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                The full KETA service — and the app — are on the way
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Full peer-to-peer currency exchange, giftcards, crypto and investing in one account,
                on iOS and Android. Until then, every trade runs through the buy and sell forms on
                this site — same rates, same escrow, same team.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/buy"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Trade on the site meanwhile
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-surface-2"
                >
                  <MessageCircle className="size-4 text-whatsapp" />
                  Talk to support
                </a>
              </div>
            </div>

            <ul className="space-y-3">
              {[
                "P2P currency exchange with matched local partners",
                "Wallets for NGN and stablecoins in one place",
                "Giftcard rates updated live",
                "Trade history, receipts and dispute support",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const faqs = [
    {
      q: "How do I buy crypto with a bank transfer?",
      a: "Open the Buy page, choose the asset, network and amount, and submit the form with your wallet address. We confirm the locked rate and email you the account to pay into. Coins are released once payment confirms.",
    },
    {
      q: "Can I sell crypto or giftcards right now?",
      a: "Yes. Use the Sell page — pick the coin or giftcard, enter the amount and your bank details, and a trader confirms your rate. We pay to your bank account once escrow confirms.",
    },
    {
      q: "Do I need Telegram or WhatsApp to trade?",
      a: "No. Everything happens on this website. WhatsApp is only there if you'd like to speak to support.",
    },
    {
      q: "Is my money protected?",
      a: "Every peer-to-peer trade runs through escrow. Funds are only released when both sides are confirmed, and disputes go to our support team.",
    },
    {
      q: "When is the app launching?",
      a: "The full service — P2P currency exchange, giftcards, crypto and investing — plus the iOS and Android apps are launching soon. Trading on the website continues in the meantime.",
    },
    {
      q: "What currencies and assets do you support?",
      a: "NGN and major foreign currencies, USDT, BTC and other leading coins, plus the popular giftcard brands. Ask the desk if you need something specific.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead eyebrow="FAQ" title="Questions people actually ask" />
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
