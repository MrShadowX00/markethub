import type { Metadata } from "next";
import CryptoTracker from "./CryptoTracker";

export const metadata: Metadata = {
  title: "Crypto Market Tracker — Live Prices, Charts & Analysis",
  description:
    "Track real-time cryptocurrency prices, market cap, volume, and 24h changes. Top 100 coins with sparkline charts. Free crypto market tracker.",
  alternates: { canonical: "https://market.toollo.org" },
};

export default function Home() {
  return (
    <>
      <CryptoTracker />

      {/* JSON-LD WebApplication schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Crypto Market Tracker",
            url: "https://market.toollo.org",
            description:
              "Track real-time cryptocurrency prices, market cap, volume, and 24h changes. Top 100 coins with sparkline charts.",
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </>
  );
}
