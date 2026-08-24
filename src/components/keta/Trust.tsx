import { BadgeCheck, Building2, FileLock2, ScanFace, ShieldCheck } from "lucide-react";

const pillars = [
  {
    icon: Building2,
    title: "Dedicated virtual accounts",
    copy: "Every trader gets a bank account number in their own name, issued through our licensed virtual-account partner. Transfer to it and the payment reconciles instantly — no screenshots, no waiting on a human.",
    tag: "Partner integration",
  },
  {
    icon: ScanFace,
    title: "Identity verification by DeepIDV",
    copy: "BVN/NIN plus a liveness selfie check, verified by DeepIDV in seconds. One-time, and your account is cleared for higher limits.",
    tag: "Partner integration",
  },
  {
    icon: ShieldCheck,
    title: "Escrow on both sides",
    copy: "Assets and cash sit in escrow until both legs are confirmed. Disputes go straight to our support desk with the full trade record attached.",
    tag: "Live",
  },
  {
    icon: FileLock2,
    title: "AML monitoring & receipts",
    copy: "Sanction and risk screening on payouts, and a downloadable receipt for every single trade you make with us.",
    tag: "Live",
  },
];

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Trust &amp; compliance
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Built so your money never sits in the dark
          </h2>
          <p className="mt-3 text-muted-foreground">
            KETA is being built on regulated rails: virtual accounts for instant bank settlement,
            DeepIDV for identity verification, and escrow on every peer-to-peer trade.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <p.icon className="size-6" />
                </div>
                <span
                  className={
                    p.tag === "Live"
                      ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
                      : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
                  }
                >
                  {p.tag}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.copy}</p>
            </article>
          ))}
        </div>

        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <BadgeCheck className="size-4 text-primary" />
          Virtual account and DeepIDV verification roll out with the full platform. Trades today are
          placed on this site and settled by our desk with manual escrow.
        </p>
      </div>
    </section>
  );
}
