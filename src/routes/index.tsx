import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/keta/Nav";
import { Hero } from "@/components/keta/Hero";
import { Faq, HowItWorks, LaunchingSoon, SellNow, Services } from "@/components/keta/Sections";
import { Trust } from "@/components/keta/Trust";
import { Waitlist } from "@/components/keta/Waitlist";
import { Footer } from "@/components/keta/Footer";


const title = "KETA — Buy & sell crypto and giftcards | P2P currency exchange";
const description =
  "Buy crypto with a bank transfer and sell crypto or giftcards for cash — all on the KETA website. Join the waitlist for P2P currency exchange and liquidity vendors at launch.";


export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Services />
        <SellNow />
        <HowItWorks />
        <Trust />
        <LaunchingSoon />
        <Waitlist />
        <Faq />

      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

