import type { Metadata } from "next";
import PortfolioClient from "./PortfolioClient";

export const metadata: Metadata = {
  title: "Crypto Portfolio Tracker — Track Your Holdings Free",
  description:
    "Track your cryptocurrency portfolio value in real-time. Add your holdings, see total value, profit/loss, and allocation chart. Free, no signup, data stored locally.",
  alternates: { canonical: "https://market.toollo.org/portfolio" },
};

const faqItems = [
  {
    question: "Is my portfolio data stored online?",
    answer:
      "No. All your portfolio data is stored exclusively in your browser's localStorage. Nothing is sent to any server. Your holdings remain completely private and accessible only on your device.",
  },
  {
    question: "How are portfolio values calculated?",
    answer:
      "Each holding's value is calculated by multiplying the amount you hold by the current market price fetched from CoinGecko. Profit/loss is determined by comparing the current value against your recorded buy price multiplied by the amount held.",
  },
  {
    question: "Can I track multiple portfolios?",
    answer:
      "Currently the tracker supports a single portfolio per browser. You can use different browsers or browser profiles to maintain separate portfolios. You can also export your data as CSV for record-keeping.",
  },
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans">
      <PortfolioClient />

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-white/10 bg-[#111827] p-5"
            >
              <summary className="cursor-pointer text-lg font-medium text-white flex items-center justify-between">
                {item.question}
                <svg
                  className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <p className="mt-3 text-gray-400 leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

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
