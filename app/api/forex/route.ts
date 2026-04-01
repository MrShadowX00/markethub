import { NextRequest } from "next/server";

const FRANKFURTER = "https://api.frankfurter.app";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

async function proxy(url: string): Promise<Response> {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    return Response.json(
      { error: `Upstream error: ${res.status}` },
      { status: res.status, headers: CACHE_HEADERS }
    );
  }
  const data = await res.json();
  return Response.json(data, { headers: CACHE_HEADERS });
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  switch (action) {
    case "latest": {
      const base = searchParams.get("base") || "USD";
      return proxy(
        `${FRANKFURTER}/latest?from=${encodeURIComponent(base)}`
      );
    }

    case "convert": {
      const from = searchParams.get("from") || "USD";
      const to = searchParams.get("to") || "EUR";
      const amount = searchParams.get("amount") || "1";
      return proxy(
        `${FRANKFURTER}/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`
      );
    }

    case "history": {
      const base = searchParams.get("base") || "USD";
      const target = searchParams.get("target") || "EUR";
      const days = parseInt(searchParams.get("days") || "30", 10);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      return proxy(
        `${FRANKFURTER}/${formatDate(start)}..${formatDate(end)}?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
      );
    }

    default:
      return Response.json(
        { error: "Invalid action. Use: latest, convert, history" },
        { status: 400 }
      );
  }
}
