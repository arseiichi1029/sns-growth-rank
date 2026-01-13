"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RangeKey = "1d" | "3d" | "7d";
type PlatformKey = "youtube" | "instagram" | "x" | "tiktok";

const rangeToDays = (r: RangeKey) => (r === "1d" ? 1 : r === "3d" ? 3 : 7);

function normalizePlatform(p: string | null): PlatformKey {
  if (p === "instagram" || p === "x" || p === "tiktok" || p === "youtube") return p;
  return "youtube";
}
function normalizeRange(r: string | null): RangeKey {
  if (r === "1d" || r === "3d" || r === "7d") return r;
  return "1d";
}

function themeVars(platform: PlatformKey): React.CSSProperties {
  switch (platform) {
    case "youtube":
      return {
        ["--bg" as any]: "#ffffff",
        ["--card" as any]: "rgba(255,255,255,0.75)",
        ["--text" as any]: "#111111",
        ["--muted" as any]: "rgba(0,0,0,0.6)",
        ["--accent" as any]: "#ff0033",
        ["--accent2" as any]: "#ff6a00",
        ["--border" as any]: "rgba(0,0,0,0.10)",
      };
    case "instagram":
      return {
        ["--bg" as any]:
          "radial-gradient(1200px 500px at 20% 10%, rgba(255,196,0,0.55), transparent 55%), radial-gradient(900px 450px at 80% 30%, rgba(255,0,128,0.50), transparent 55%), radial-gradient(900px 450px at 55% 85%, rgba(160,64,255,0.55), transparent 55%), #0b0614",
        ["--card" as any]: "rgba(255,255,255,0.10)",
        ["--text" as any]: "#ffffff",
        ["--muted" as any]: "rgba(255,255,255,0.70)",
        ["--accent" as any]: "#ff3aa5",
        ["--accent2" as any]: "#ffb100",
        ["--border" as any]: "rgba(255,255,255,0.18)",
      };
    case "x":
      return {
        ["--bg" as any]:
          "radial-gradient(900px 450px at 50% 15%, rgba(255,255,255,0.08), transparent 60%), #000000",
        ["--card" as any]: "rgba(255,255,255,0.06)",
        ["--text" as any]: "#ffffff",
        ["--muted" as any]: "rgba(255,255,255,0.65)",
        ["--accent" as any]: "#ffffff",
        ["--accent2" as any]: "rgba(255,255,255,0.35)",
        ["--border" as any]: "rgba(255,255,255,0.14)",
      };
    case "tiktok":
      return {
        ["--bg" as any]:
          "radial-gradient(900px 450px at 15% 20%, rgba(0, 255, 210, 0.25), transparent 60%), radial-gradient(900px 450px at 85% 30%, rgba(255, 60, 165, 0.22), transparent 60%), #050507",
        ["--card" as any]: "rgba(255,255,255,0.07)",
        ["--text" as any]: "#ffffff",
        ["--muted" as any]: "rgba(255,255,255,0.70)",
        ["--accent" as any]: "#00ffd2",
        ["--accent2" as any]: "#ff3ca5",
        ["--border" as any]: "rgba(255,255,255,0.16)",
      };
  }
}

function platformLabel(p: PlatformKey) {
  switch (p) {
    case "youtube":
      return "YouTube";
    case "instagram":
      return "Instagram";
    case "x":
      return "X";
    case "tiktok":
      return "TikTok";
  }
}

function RankInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const platform = normalizePlatform(sp.get("platform"));
  const range = normalizeRange(sp.get("range"));
  const days = rangeToDays(range);

  const [rows, setRows] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const setPlatform = (p: PlatformKey) => {
    router.push(`/rank?platform=${p}&range=${range}`);
  };
  const setRange = (r: RangeKey) => {
    router.push(`/rank?platform=${platform}&range=${r}`);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("metrics")
        .select("date,value")
        .eq("platform", platform)
        .eq("metric", "views")
        .order("date", { ascending: false })
        .limit(180);

      if (error) {
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(
        (data ?? []).map((d: any) => ({
          date: String(d.date),
          value: Number(d.value ?? 0),
        }))
      );
      setLoading(false);
    })();
  }, [platform]);

  const result = useMemo(() => {
    if (!rows.length) return null;

    const now = rows.slice(0, days).reduce((a, b) => a + b.value, 0);
    const prev = rows.slice(days, days * 2).reduce((a, b) => a + b.value, 0);

    const delta = now - prev;
    const rate = prev <= 0 ? (now > 0 ? 100 : 0) : (delta / prev) * 100;

    return { now, prev, delta, rate };
  }, [rows, days]);

  const css = themeVars(platform);

  const TabButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        border: `1px solid var(--border)`,
        background: active ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "rgba(255,255,255,0.06)",
        color: active ? "#000" : "var(--text)",
        padding: "10px 14px",
        borderRadius: 999,
        fontWeight: 700,
        cursor: "pointer",
        transition: "transform 120ms ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );

  const Pill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        border: `1px solid var(--border)`,
        background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
        color: "var(--text)",
        padding: "8px 10px",
        borderRadius: 999,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        ...css,
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        padding: 18,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, letterSpacing: 0.2, opacity: 0.95 }}>
            SNS Growth Rank
            <span style={{ marginLeft: 10, fontWeight: 800, opacity: 0.75, fontSize: 12 }}>
              ({platformLabel(platform)})
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* SNS tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TabButton active={platform === "youtube"} onClick={() => setPlatform("youtube")}>
              YouTube
            </TabButton>
            <TabButton active={platform === "tiktok"} onClick={() => setPlatform("tiktok")}>
              TikTok
            </TabButton>
            <TabButton active={platform === "x"} onClick={() => setPlatform("x")}>
              X
            </TabButton>
            <TabButton active={platform === "instagram"} onClick={() => setPlatform("instagram")}>
              Instagram
            </TabButton>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            marginTop: 16,
            border: `1px solid var(--border)`,
            background: "var(--card)",
            backdropFilter: "blur(10px)",
            borderRadius: 18,
            padding: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              再生数 成長率ランキング（仮）
            </h1>
            <div style={{ color: "var(--muted)", fontWeight: 700, fontSize: 12 }}>
              ※ 今はまずUI完成 → 次に自動取得（API / Cron）で完全自動化
            </div>
          </div>

          {/* Range pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Pill active={range === "1d"} onClick={() => setRange("1d")}>
              🔥 1日
            </Pill>
            <Pill active={range === "3d"} onClick={() => setRange("3d")}>
              ⚡ 3日
            </Pill>
            <Pill active={range === "7d"} onClick={() => setRange("7d")}>
              🏆 週間
            </Pill>
          </div>

          <div style={{ height: 14 }} />

          {loading && <div style={{ color: "var(--muted)", fontWeight: 700 }}>読み込み中…</div>}

          {!loading && !result && (
            <div style={{ color: "var(--muted)", fontWeight: 700 }}>
              データがない。まずはDBに入ってるか確認（次の自動取得でここは完全自動になる）
            </div>
          )}

          {!loading && result && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 10,
                marginTop: 6,
              }}
            >
              <div style={kpiBoxStyle()}>
                <div style={kpiLabelStyle()}>今期合計</div>
                <div style={kpiValueStyle()}>{result.now.toLocaleString()}</div>
              </div>
              <div style={kpiBoxStyle()}>
                <div style={kpiLabelStyle()}>前期合計</div>
                <div style={kpiValueStyle()}>{result.prev.toLocaleString()}</div>
              </div>
              <div style={kpiBoxStyle()}>
                <div style={kpiLabelStyle()}>増分</div>
                <div style={kpiValueStyle()}>{result.delta.toLocaleString()}</div>
              </div>
              <div style={kpiBoxStyle(true)}>
                <div style={kpiLabelStyle()}>成長率</div>
                <div style={kpiValueStyle()}>{result.rate.toFixed(2)}%</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>
            ※ “入力ページ”は最終的に消す（今は土台なので残ってるだけ）。自動取得に移行したら完全に不要。
          </div>
        </div>
      </div>
    </div>
  );
}

function kpiBoxStyle(accent = false): React.CSSProperties {
  return {
    border: `1px solid var(--border)`,
    background: accent ? "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))" : "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
  };
}
function kpiLabelStyle(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 800, opacity: 0.8 };
}
function kpiValueStyle(): React.CSSProperties {
  return { fontSize: 22, fontWeight: 900, marginTop: 6 };
}

export default function RankPage() {
  return (
    <Suspense fallback={<div style={{ padding: 18 }}>Loading...</div>}>
      <RankInner />
    </Suspense>
  );
}
