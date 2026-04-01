import type { Metadata } from "next";
import FearGreedClient from "./FearGreedClient";

export const metadata: Metadata = {
  title: "Crypto Fear & Greed Index — Market Sentiment Today",
  description:
    "Check today's Crypto Fear & Greed Index. Understand market sentiment — extreme fear, fear, neutral, greed, or extreme greed. Historical chart included.",
  alternates: { canonical: "https://market.toollo.org/fear-greed" },
};

const faqItems = [
  {
    question: "What is the Crypto Fear and Greed Index?",
    answer:
      "The Crypto Fear and Greed Index is a metric that measures the overall sentiment of the cryptocurrency market on a scale from 0 (Extreme Fear) to 100 (Extreme Greed). It aggregates data from multiple sources including volatility, market volume, social media, surveys, Bitcoin dominance, and Google Trends to provide a single number representing market sentiment.",
  },
  {
    question: "Should I buy when fear is extreme?",
    answer:
      'The famous investing advice "Be fearful when others are greedy, and greedy when others are fearful" suggests that extreme fear can present buying opportunities. Historically, periods of extreme fear have often coincided with market bottoms. However, this is not guaranteed — markets can stay fearful for extended periods. Always do your own research and use proper risk management.',
  },
  {
    question: "How often is the Fear & Greed Index updated?",
    answer:
      "The Crypto Fear and Greed Index is updated once every day. The data is collected and processed from multiple sources at the same time each day to provide a consistent daily reading of market sentiment.",
  },
];

export default function FearGreedPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Crypto Fear & Greed Index
        </h1>
        <p className="mb-8 text-gray-400">
          Measure market sentiment — from extreme fear to extreme greed
        </p>

        <FearGreedClient />

        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-800 bg-[#111827] p-5"
              >
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {item.question}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* JSON-LD FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          }),
        }}
      />
    </div>
  );
}
