import type { MetadataRoute } from "next";

const BASE_URL = "https://market.toollo.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1.0, freq: "hourly" as const },
    { path: "/forex", priority: 0.9, freq: "daily" as const },
    { path: "/technical-analysis", priority: 0.9, freq: "daily" as const },
    { path: "/fear-greed", priority: 0.9, freq: "daily" as const },
    { path: "/converter", priority: 0.8, freq: "daily" as const },
    { path: "/stocks", priority: 0.8, freq: "weekly" as const },
    { path: "/portfolio", priority: 0.7, freq: "weekly" as const },
  ];

  const topCoins = [
    "bitcoin", "ethereum", "binancecoin", "solana", "ripple",
    "cardano", "dogecoin", "polkadot", "avalanche-2", "chainlink",
    "tron", "polygon-ecosystem-token", "shiba-inu", "litecoin", "uniswap",
  ];

  const coinPages = topCoins.map((id) => ({
    url: `${BASE_URL}/crypto/${id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  return [
    ...pages.map((p) => ({
      url: `${BASE_URL}${p.path}`,
      lastModified: new Date(),
      changeFrequency: p.freq,
      priority: p.priority,
    })),
    ...coinPages,
  ];
}
