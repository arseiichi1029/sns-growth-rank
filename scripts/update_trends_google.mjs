import fs from "fs";

const OUT_PATH = "docs/data/trends_google.json";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept": "*/*",
    },
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.text();
}

function extractXml(text) {
  const i = text.indexOf("<?xml");
  const j = text.indexOf("<rss");
  const k = text.indexOf("<feed");
  const start = [i, j, k].filter(x => x >= 0).sort((a,b)=>a-b)[0];
  if (start == null) throw new Error("xml not found");
  return text.slice(start);
}

// 超雑でもRSSからタイトル拾えればOK（依存減らす）
function decodeRss(xml) {
  const items = [];
  const parts = xml.split("<item>").slice(1);
  for (const p of parts) {
    const title = (p.split("<title>")[1] || "").split("</title>")[0] || "";
    const link  = (p.split("<link>")[1]  || "").split("</link>")[0]  || "";
    const approx = (p.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] || "").trim();
    const n = Number((approx.replace(/,/g,"").match(/\d+/)?.[0] || "0"));
    items.push({ title: title.replace(/<!\[CDATA\[|\]\]>/g,"").trim(), url: link.trim(), views: n });
  }
  // viewsで降順
  items.sort((a,b)=>b.views-a.views);
  // rank付け
  return items.slice(0,50).map((x, idx)=>({ rank: idx+1, ...x }));
}

const RSS_CANDIDATES = [
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
  "https://trends.google.co.jp/trends/trendingsearches/daily/rss?geo=JP",
  // ブロック回避（テキストプロキシ）
  "https://r.jina.ai/https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
  "https://r.jina.ai/https://trends.google.co.jp/trends/trendingsearches/daily/rss?geo=JP",
];

(async () => {
  try {
    let lastErr = null;
    let xml = "";

    for (const url of RSS_CANDIDATES) {
      try {
        const t = await fetchText(url);
        xml = extractXml(t);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;

    const items = decodeRss(xml);

    const out = {
      ok: true,
      source: "google_trends_rss",
      geo: "JP",
      lang: "ja",
      updatedAt: new Date().toISOString(),
      items,
    };

    fs.mkdirSync("docs/data", { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`updated ${OUT_PATH}: ${items.length}`);
  } catch (e) {
    const out = {
      ok: false,
      source: "google_trends_rss",
      geo: "JP",
      lang: "ja",
      updatedAt: new Date().toISOString(),
      error: String(e?.message ?? e),
      items: [],
    };
    fs.mkdirSync("docs/data", { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`failed ${OUT_PATH}: ${out.error}`);
    process.exitCode = 0; // 失敗でもワークフロー落とさない
  }
})();
