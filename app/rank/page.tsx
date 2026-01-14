"use client";

import { useEffect, useMemo, useState } from "react";

type WikiItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

export default function RankPage() {
  const [items, setItems] = useState<WikiItem[]>([]);
  const [date, setDate] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [q, setQ] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const res = await fetch("/api/wiki/top", { cache: "no-store" });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        setDate(String(data.date ?? ""));
      } catch (e: any) {
        setErr(e?.message ?? "Unknown error");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => it.title.toLowerCase().includes(s));
  }, [items, q]);

  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div style={styles.bg}>
      {/* PC用：左右の広告レール */}
      <div className="ad-rail ad-rail-left" aria-hidden>
        <div style={styles.adBox}>AD (Left)</div>
      </div>
      <div className="ad-rail ad-rail-right" aria-hidden>
        <div style={styles.adBox}>AD (Right)</div>
      </div>

      <div style={styles.wrap}>
        <header style={styles.header}>
          <div style={styles.brandRow}>
            <div style={styles.brandDot} />
            <div style={styles.brandText}>SNS Growth Rank</div>
            <div style={{ flex: 1 }} />
            <div style={styles.pill}>
              Wikipedia / JP {date ? `・${date}` : ""}
            </div>
          </div>

          <div style={styles.titleRow}>
            <div style={styles.title}>Wikipedia 今日の急上昇（日本）</div>
            <a
              href="/api/wiki/top"
              target="_blank"
              rel="noreferrer"
              style={styles.apiLink}
            >
              /api/wiki/top
            </a>
          </div>

          <div style={styles.controls}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="検索（例：俳優 / アニメ / 地名）"
              style={styles.input}
            />
            <div style={styles.count}>{err ? "取得失敗" : `${filtered.length}件`}</div>
          </div>

          {err ? (
            <div style={styles.errBox}>
              <span style={styles.errBadge}>ERROR</span>
              <span>{err}</span>
            </div>
          ) : null}
        </header>

        <main style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.smallLabel}>クリックでWikipediaへ</div>
            <div style={styles.smallLabelRight}>Views</div>
          </div>

          <div style={styles.list}>
            {filtered.length === 0 && !err ? (
              <div style={styles.empty}>データなし</div>
            ) : null}

            {filtered.map((it) => (
              <a
                key={it.rank}
                href={it.url}
                target="_blank"
                rel="noreferrer"
                style={styles.row}
              >
                <div style={styles.left}>
                  <div style={styles.rankBadge}>{it.rank}</div>
                  <div style={styles.titleCol}>
                    <div style={styles.itemTitle}>{it.title}</div>
                    <div style={styles.itemUrl}>{it.url}</div>
                  </div>
                </div>
                <div style={styles.views}>{fmt(it.views)}</div>
              </a>
            ))}
          </div>
        </main>

        <footer style={styles.footer}>
          <div style={styles.footerText}>MVP / 広告はレイアウト先に固める</div>
        </footer>
      </div>

      {/* スマホ用：下固定広告バー */}
      <div className="ad-bottom" aria-hidden>
        <div style={styles.bottomAdInner}>AD (Bottom)</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    padding: 24,
    paddingBottom: 90, // 下固定広告のぶん
    background:
      "radial-gradient(900px 500px at 15% 10%, rgba(255,60,60,0.18), transparent 60%)," +
      "radial-gradient(900px 700px at 85% 20%, rgba(120,200,255,0.14), transparent 60%)," +
      "radial-gradient(900px 700px at 50% 90%, rgba(255,120,180,0.12), transparent 60%)," +
      "linear-gradient(180deg, #0a0a0a, #0b0b0b)",
    color: "white",
  },

  // コンテンツ本体
  wrap: { maxWidth: 980, margin: "0 auto" },

  header: {
    padding: "14px 14px 10px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    background: "linear-gradient(90deg,#ff3c3c,#ffffff)",
    boxShadow: "0 0 18px rgba(255,60,60,0.35)",
  },
  brandText: { fontWeight: 800, letterSpacing: 0.2, opacity: 0.95 },
  pill: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.35)",
    opacity: 0.9,
  },
  titleRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  title: { fontSize: 16, fontWeight: 800, opacity: 0.95 },
  apiLink: {
    fontSize: 12,
    opacity: 0.75,
    textDecoration: "none",
    borderBottom: "1px dashed rgba(255,255,255,0.25)",
  },
  controls: { display: "flex", alignItems: "center", gap: 10, marginTop: 10 },
  input: {
    flex: 1,
    borderRadius: 12,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.35)",
    color: "white",
    outline: "none",
  },
  count: { minWidth: 70, textAlign: "right", opacity: 0.8, fontSize: 12 },
  errBox: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.12)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  errBadge: {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,80,80,0.25)",
    border: "1px solid rgba(255,80,80,0.35)",
  },

  card: {
    marginTop: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  cardTop: {
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.20)",
  },
  smallLabel: { fontSize: 12, opacity: 0.7 },
  smallLabelRight: { fontSize: 12, opacity: 0.7, marginLeft: "auto" },

  list: { display: "flex", flexDirection: "column" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    textDecoration: "none",
    color: "white",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    flex: 1,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    flex: "0 0 auto",
  },
  titleCol: { minWidth: 0 },
  itemTitle: {
    fontSize: 14,
    fontWeight: 700,
    opacity: 0.95,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemUrl: {
    fontSize: 11,
    opacity: 0.6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  views: { fontVariantNumeric: "tabular-nums", opacity: 0.9, fontWeight: 800 },
  empty: { padding: 18, opacity: 0.7, fontSize: 13 },

  footer: { padding: 14, opacity: 0.6, fontSize: 12 },
  footerText: { textAlign: "center" },

  // ===== 広告（ダミー） =====
  // PC左右レール（スマホでは見せない）
  adRailLeft: {
    position: "fixed",
    left: 12,
    top: 80,
    width: 220,
    height: "calc(100vh - 120px)",
    display: "none", // JSなしで出し分けしたいので、基本はCSSで出す（次の手順でglobals.cssに入れる）
    pointerEvents: "none",
  },
  adRailRight: {
    position: "fixed",
    right: 12,
    top: 80,
    width: 220,
    height: "calc(100vh - 120px)",
    display: "none",
    pointerEvents: "none",
  },
  adBox: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55,
    fontWeight: 800,
    letterSpacing: 0.5,
  },

  // スマホ下固定（PCでは消す）
  bottomAd: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    background: "rgba(0,0,0,0.45)",
    borderTop: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(10px)",
  },
  bottomAdInner: {
    width: "min(680px, 96vw)",
    height: 50,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
    fontWeight: 800,
  },
};
