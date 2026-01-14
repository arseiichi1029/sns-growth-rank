import fs from "fs";

const OUT_PATH = "docs/data/trends_google.json";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept": "*/*",
      "accept-language": "ja,en-US;q=0.9,en;q=0.8",
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

function decodeRss(xml) {
  const items = [];
  const parts = xml.split("<item>").slice(1);
  for (const p of parts) {
    const title = (p.split("<title>")[1] || "").split("</title>")[0] || "";
    const link  = (p.split("<link>")[1]  || "").split("</link>")[0]  || "";
    const approx = (p.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] || "").trim();
    const n = Number((approx.replace(/,/g,"").match(/\d+/)?.[0] || "0"));
    items.push({
      title: title.replace(/<!\[CDATA\[|\]\]>/g,"").trim(),
      url: link.trim(),
      views: n
    });
  }
  items.sort((a,b)=>b.views-a.views);
  return items.slice(0, 50).map((x, idx)=>({ rank: idx+1, ...x }));
}

const RSS_CANDIDATES = [
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
  "https://trends.google.co.jp/trends/trendingsearches/daily/rss?geo=JP",
  "https://r.jina.ai/https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
  "https://r.jina.ai/https://trends.google.co.jp/trends/trendingsearches/daily/rss?geo=JP",
];

function readExisting() {
  try {
    if (fs.existsSync(OUT_PATH)) {
      return JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
    }
  } catch {}
  return null;
}

(async () => {
  const prev = readExisting();

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
    // ★ここが重要：失敗しても「失敗JSONで上書きしない」
    // ＝最後の成功データが残るので、サイトがerrorに戻らない
    const msg = String(e?.message ?? e);
    console.log(`trends fetch failed (kept previous): ${msg}`);

    // もし過去データが無い初回だけは、空データを作る（サイトが落ちないように）
    if (!prev) {
      const out = {
        ok: false,
        source: "google_trends_rss",
        geo: "JP",
        lang: "ja",
        updatedAt: new Date().toISOString(),
        error: msg,
        items: [],
      };
      fs.mkdirSync("docs/data", { recursive: true });
      fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
      console.log(`created ${OUT_PATH} (first time only)`);
    }

    process.exitCode = 0; // workflowは落とさない
  }
})();
