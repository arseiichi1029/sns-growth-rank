export const dynamic = "force-dynamic";

type WikiItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

async function getTop(): Promise<WikiItem[]> {
  // 同一デプロイ内のAPIを叩く（本番でもローカルでもOK）
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/wiki/top`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch /api/wiki/top");
  const data = await res.json();
  return data.items ?? [];
}

export default async function RankPage() {
  const items = await getTop();

  return (
    <main style={{ padding: 18 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        Wikipedia 今日の急上昇（日本語）
      </h1>

      <div style={{ opacity: 0.75, marginBottom: 12 }}>
        取得元: /api/wiki/top
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <a
            key={it.rank}
            href={it.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              gap: 12,
              alignItems: "baseline",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              textDecoration: "none",
              color: "inherit",
              background: "rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ width: 36, fontWeight: 900 }}>{it.rank}</div>
            <div style={{ flex: 1, fontWeight: 700 }}>{it.title}</div>
            <div style={{ opacity: 0.75 }}>{it.views.toLocaleString()} views</div>
          </a>
        ))}
      </div>
    </main>
  );
}
