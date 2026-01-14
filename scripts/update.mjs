import fs from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "docs", "data");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeJson(name, obj) {
  const p = path.join(OUT_DIR, name);
  await fs.writeFile(p, JSON.stringify(obj, null, 2), "utf8");
  console.log("updated", "docs/data/" + name);
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "sns-growth-rank" } });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
  return await res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "sns-growth-rank" } });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
  return await res.json();
}

/** Wikipedia: 日本語 / 前日トップ */
async function buildWikipediaJP() {
  // JSTで「昨日」を作る
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCHours(0, 0, 0, 0);
  const y = new Date(jst.getTime() - 24 * 60 * 60 * 1000);

  const yyyy = y.getUTCFullYear();
  const mm = String(y.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(y.getUTCDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;

  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/ja.wikipedia/all-access/${yyyy}/${mm}/${dd}`;
  const data = await fetchJson(url);

  const items = (data?.items?.[0]?.articles || [])
    .filter(a => a.article && a.article !== "Main_Page" && a.article !== "特別:検索")
    .slice(0, 50)
    .map((a, i) => ({
      rank: i + 1,
      title: decodeURIComponent(a.article.replaceAll("_", " ")),
      views: a.views,
      url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(a.article)}`
    }));

  return { ok: true, date, lang: "ja", items };
}

/** Google Trends: JP Daily Trending Searches (RSS) */
function decodeXml(s) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function pickTag(text, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = text.match(re);
  return m ? decodeXml(m[1]) : "";
}

async function buildGoogleTrendsJP() {
  // RSS（日本）
  const rssUrl = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP";
  const xml = await fetchText(rssUrl);

  // <item> を雑に分割して title と traffic を取る（依存ゼロ）
  const itemsXml = xml.split(/<item>/i).slice(1).map(s => s.split(/<\/item>/i)[0]);

  const items = itemsXml.slice(0, 50).map((ix, i) => {
    const title = pickTag(ix, "title");
    const traffic = pickTag(ix, "ht:approx_traffic") || pickTag(ix, "approx_traffic");
    const pubDate = pickTag(ix, "pubDate");
    // RSSのリンク
    const link = pickTag(ix, "link");
    return {
      rank: i + 1,
      title,
      traffic,
      pubDate,
      url: link || `https://trends.google.com/trends/trendingsearches/daily?geo=JP`
    };
  });

  // 日付はRSS内を信用せず「今日(JST)」で表示用に作る
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;

  return { ok: true, date, geo: "JP", items };
}

/** Hacker News: Front Page (Algolia API) */
async function buildHackerNews() {
  const url = "https://hn.algolia.com/api/v1/search?tags=front_page";
  const data = await fetchJson(url);

  const hits = data?.hits || [];
  const items = hits.slice(0, 50).map((h, i) => ({
    rank: i + 1,
    title: h.title || "(no title)",
    points: h.points ?? 0,
    comments: h.num_comments ?? 0,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    hn: `https://news.ycombinator.com/item?id=${h.objectID}`
  }));

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return { ok: true, date, items };
}

/** App Store: Top Free Apps (JP) - Apple Marketing Tools JSON */
async function buildTopFreeAppsJP() {
  const url = "https://rss.applemarketingtools.com/api/v2/jp/apps/top-free/50/apps.json";
  const data = await fetchJson(url);

  const items = (data?.feed?.results || []).map((a, i) => ({
    rank: i + 1,
    name: a.name,
    artistName: a.artistName,
    url: a.url,
    artworkUrl100: a.artworkUrl100
  }));

  const date = data?.feed?.updated ? String(data.feed.updated).slice(0, 10) : new Date().toISOString().slice(0, 10);
  return { ok: true, date, country: "jp", items };
}

async function main() {
  await ensureDir(OUT_DIR);

  // 1) Wikipedia
  const wiki = await buildWikipediaJP();
  await writeJson("wiki.json", wiki);

  // 2) Google Trends
  const trends = await buildGoogleTrendsJP();
  await writeJson("trends.json", trends);

  // 3) Hacker News
  const hn = await buildHackerNews();
  await writeJson("hn.json", hn);

  // 4) App Store
  const apps = await buildTopFreeAppsJP();
  await writeJson("apps.json", apps);
}

main().catch(async (e) => {
  console.error(e);
  // 失敗しても古いJSONが残ってサイトが真っ白になりにくいように、エラーファイルだけ出す
  await ensureDir(OUT_DIR);
  await writeJson("last_error.json", { ok: false, at: new Date().toISOString(), error: String(e?.message || e) });
  process.exit(1);
});
