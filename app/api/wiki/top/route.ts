import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") || "ja").toLowerCase(); // ja/en など
    const project = `${lang}.wikipedia`;
    const access = "all-access";

    // Wikimediaは日次データなので「昨日」を使う
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");

    const api = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${project}/${access}/${year}/${month}/${day}`;

    const r = await fetch(api, {
      headers: { "User-Agent": "sns-growth-rank (demo)" },
      // Vercelでキャッシュ効かせたいなら next: { revalidate: 3600 } とかも可
    });

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, status: r.status, message: "Wikimedia API error" },
        { status: 500 }
      );
    }

    const json = await r.json();

    // 形を使いやすく整える（上位50件）
    const items =
      json?.items?.[0]?.articles
        ?.filter((a: any) => a.article && a.article !== "Main_Page")
        ?.slice(0, 50)
        ?.map((a: any) => ({
          title: a.article,
          views: a.views,
          rank: a.rank,
          url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(a.article)}`,
        })) || [];

    return NextResponse.json({
      ok: true,
      date: `${year}-${month}-${day}`,
      lang,
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
