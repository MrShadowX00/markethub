import type { Metadata } from "next";
import TechnicalAnalysisClient from "./TechnicalAnalysisClient";

export const metadata: Metadata = {
  title: "Crypto Technical Analysis — RSI, MACD, Bollinger Bands",
  description:
    "Free crypto technical analysis with RSI, MACD, Moving Averages, Bollinger Bands. Get buy/sell signals for Bitcoin, Ethereum, and top cryptocurrencies.",
  alternates: { canonical: "https://market.toollo.org/technical-analysis" },
};

const faqItems = [
  {
    question: "What is technical analysis in crypto?",
    answer:
      "Technical analysis in crypto involves studying historical price data and using mathematical indicators like RSI, MACD, and Moving Averages to predict future price movements. It helps traders identify trends, support/resistance levels, and potential entry/exit points for trades.",
  },
  {
    question: "Is RSI a good indicator for crypto?",
    answer:
      "RSI (Relative Strength Index) is one of the most popular indicators for crypto trading. It measures momentum on a scale of 0-100 and helps identify overbought (above 70) and oversold (below 30) conditions. However, in strong trending markets, RSI can stay in extreme zones for extended periods, so it is best used alongside other indicators.",
  },
  {
    question: "How accurate are crypto trading signals?",
    answer:
      "No trading signal is 100% accurate. Technical indicators are tools that help assess probabilities, not certainties. Crypto markets are highly volatile and influenced by many factors including news, regulation, and market sentiment. Always combine multiple indicators, use proper risk management, and never invest more than you can afford to lose.",
  },
];

export default function TechnicalAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Crypto Technical Analysis
        </h1>
        <p className="mb-8 text-gray-400">
          Real-time technical indicators and buy/sell signals for top
          cryptocurrencies
        </p>

        <TechnicalAnalysisClient />

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
