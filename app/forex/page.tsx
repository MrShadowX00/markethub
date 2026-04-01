import type { Metadata } from "next";
import ForexClient from "./ForexClient";

export const metadata: Metadata = {
  title: "Live Forex Rates — Currency Exchange Rates & Charts",
  description:
    "Real-time forex exchange rates for 30+ world currencies. Track USD, EUR, GBP, JPY, UZS, RUB, TRY rates with historical charts. Free forex tracker.",
  alternates: { canonical: "https://market.toollo.org/forex" },
};

const faqItems = [
  {
    question: "What are forex exchange rates?",
    answer:
      "Forex (foreign exchange) rates represent the value of one currency relative to another. They fluctuate based on economic factors such as interest rates, inflation, political stability, and market supply and demand. Forex is the largest financial market in the world, with over $6 trillion traded daily.",
  },
  {
    question: "How often are forex rates updated?",
    answer:
      "Our forex rates are sourced from the European Central Bank and are updated every business day around 16:00 CET. Rates represent official reference rates and may differ slightly from live interbank rates during trading hours.",
  },
  {
    question: "Where do the exchange rates come from?",
    answer:
      "Our exchange rates are sourced from the European Central Bank (ECB) via the Frankfurter API. The ECB publishes reference exchange rates for major world currencies on every business day. These rates are widely used for accounting, invoicing, and financial reporting.",
  },
];

export default function ForexPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Live Forex Exchange Rates
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Track real-time currency exchange rates for 30+ world currencies.
            Select a base currency and click any currency to view its historical
            chart.
          </p>
        </header>

        <ForexClient />

        {/* FAQ Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-[#111827] border border-gray-800 rounded-xl"
              >
                <summary className="cursor-pointer px-6 py-4 text-white font-medium flex items-center justify-between">
                  {item.question}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    &#9662;
                  </span>
                </summary>
                <p className="px-6 pb-4 text-gray-400 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
