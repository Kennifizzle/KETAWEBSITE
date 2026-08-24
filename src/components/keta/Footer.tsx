import { Mail, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/keta-logo.png";
import { WHATSAPP_URL } from "./brand";

export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-border/60 py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="KETA" className="h-8 w-8" />
            <span className="font-bold text-lg">KETA</span>
              Africa's peer-to-peer currency exchange, with a crypto and giftcard desk.
              Escrow-backed, rate-first — all on the website.
            
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link to="/buy" className="text-muted-foreground hover:text-foreground">
              Buy crypto
            </Link>
            <Link to="/sell" className="text-muted-foreground hover:text-foreground">
              Sell crypto &amp; giftcards
            </Link>
            <Link to="/" hash="trust" className="text-muted-foreground hover:text-foreground">
              Trust &amp; verification
            </Link>
            <Link to="/" hash="waitlist" className="text-muted-foreground hover:text-foreground">
              Join the waitlist
            </Link>
          </nav>

          <div className="flex flex-col gap-3 sm:items-end">
            <a
              href="mailto:KETAEXCHANGE@GMAIL.COM"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              <Mail className="size-4 text-primary" />
              KETAEXCHANGE@GMAIL.COM
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              <MessageCircle className="size-4 text-whatsapp" />
              Support on WhatsApp
            </a>
          </div>
        </div>
        <p className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} KETA Exchange. Trading digital assets carries risk.
        </p>
      </div>
    </footer>
  );
}
