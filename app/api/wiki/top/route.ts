import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Wikipedia 日本語版「今日の閲覧数上位」
    const url =
      "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/ja.wikipedia/all-access/2026/01/12";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "sns-growth-rank/1.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch wikipedia" },
        { status: 500 }
      );
    }

    const json = await res.json();

    const items =
      json?.items?.[0]?.articles
        ?.slice(0, 50)
        .map((a: any, i: number) => ({
          title: decodeURIComponent(a.article.replace(/_/g, " ")),
          views: a.views,
          rank: i + 1,
          url: `https://ja.wikipedia.org/wiki/${a.article}`,
        })) ?? [];

    return NextResponse.json({
      ok: true,
      date: "2026-01-12",
      lang: "ja",
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
