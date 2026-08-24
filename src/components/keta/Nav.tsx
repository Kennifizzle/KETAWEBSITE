import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/keta-logo.png";

const links = [
  { label: "Buy", to: "/buy" },
  { label: "Sell", to: "/sell" },
  { label: "Trust & KYC", to: "/", hash: "trust" },
  { label: "Waitlist", to: "/", hash: "waitlist" },
  { label: "FAQ", to: "/", hash: "faq" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
         <div className ="flex items-center gap-2">
          <img src={logo} alt="KETA logo" className="h-8 w-8" />
          <span className="font-bold text-lg">KETA</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/buy"
            className="hidden rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            Buy crypto
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-border p-2 text-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-background px-5 py-4 md:hidden">
          <ul className="space-y-3">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  hash={l.hash}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-muted-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
