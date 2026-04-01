import type { MetadataRoute } from "next";

const BASE_URL = "https://market.toollo.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/crypto",
    "/forex",
    "/stocks",
    "/technical-analysis",
    "/converter",
    "/fear-greed",
    "/portfolio",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
