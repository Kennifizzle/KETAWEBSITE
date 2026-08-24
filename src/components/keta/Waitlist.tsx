import { useState } from "react";
import { ArrowLeftRight, Coins, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { submitWaitlist } from "@/lib/waitlist.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


type Kind = "trader" | "vendor";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30, "Phone is too long").optional(),
  country: z.string().trim().max(80, "Country is too long").optional(),
  note: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

const tabs: { key: Kind; label: string; icon: typeof Coins; blurb: string }[] = [
  {
    key: "trader",
    label: "I want to trade",
    icon: ArrowLeftRight,
    blurb: "Get first access to P2P currency exchange, giftcards and the KETA app at launch.",
  },
  {
    key: "vendor",
    label: "I'll provide liquidity",
    icon: Coins,
    blurb: "Vendors with NGN, FX or stablecoin liquidity earn on every matched order.",
  },
];

export function Waitlist() {
  const [kind, setKind] = useState<Kind>("trader");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      country: fd.get("country"),
      note: fd.get("note"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await submitWaitlist({
        data: {
          kind,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          country: parsed.data.country || null,
          note: parsed.data.note || null,
        },
      });
      setDone(true);
      toast.success("You're on the list — check your email for confirmation.");
    } catch {
      toast.error("Could not submit right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  const active = tabs.find((t) => t.key === kind)!;

  return (
    <section id="waitlist" className="scroll-mt-24 border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">Waitlist</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Get in before the <span className="text-gradient-brand">P2P launch</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Two lists, one form. Join as a trader for early access to peer-to-peer currency
            exchange, or as a liquidity vendor to fund orders and earn on the spread.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Priority onboarding when the app goes live",
              "Vendor rates and settlement terms shared ahead of launch",
              "No spam — we only email about launch and your slot",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="shadow-card rounded-3xl border border-border bg-surface p-6 sm:p-8">
          {done ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <active.icon className="size-7" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">You're on the list</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                We'll email you before launch. In the meantime you can already buy and sell crypto
                or giftcards right here on the site.
              </p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Add another person
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-background/60 p-1.5">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setKind(t.key)}
                    className={
                      "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors sm:text-sm " +
                      (kind === t.key
                        ? "bg-gradient-brand text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <t.icon className="size-4" />
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{active.blurb}</p>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wl-name">Full name</Label>
                    <Input id="wl-name" name="name" maxLength={100} required placeholder="Ada Obi" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wl-email">Email</Label>
                    <Input
                      id="wl-email"
                      name="email"
                      type="email"
                      maxLength={255}
                      required
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wl-phone">WhatsApp / phone</Label>
                    <Input id="wl-phone" name="phone" maxLength={30} placeholder="+234…" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wl-country">Country</Label>
                    <Input id="wl-country" name="country" maxLength={80} placeholder="Nigeria" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-note">
                    {kind === "vendor"
                      ? "Liquidity size and currencies you cover"
                      : "What do you plan to trade? (optional)"}
                  </Label>
                  <Textarea
                    id="wl-note"
                    name="note"
                    maxLength={500}
                    rows={3}
                    placeholder={
                      kind === "vendor"
                        ? "e.g. NGN 20M daily, USDT and GBP"
                        : "e.g. USD to NGN, USDT, Amazon giftcards"
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="shadow-brand inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {kind === "vendor" ? "Apply as liquidity vendor" : "Join the launch waitlist"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
