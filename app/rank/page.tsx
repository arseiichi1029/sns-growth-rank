import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type WikiItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

async function getTop(): Promise<WikiItem[]> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (!host) throw new Error("Host header not found");

  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/wiki/top`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch wiki top: ${res.status}`);

  const data = await res.json();
  return data.items ?? [];
}

export default async function RankPage() {
  const items = await getTop();

  return (
    <main style={{ padding: 18 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        Wikipedia 今日の急上昇（日本）
      </h1>

      <div style={{ opacity: 0.7, marginBottom: 12 }}>
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
              justifyContent: "space-between",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#111",
              background: "#fff",
            }}
          >
            <span>
              {it.rank}. {it.title}
            </span>
            <span style={{ opacity: 0.6 }}>{it.views.toLocaleString()}</span>
          </a>
        ))}
      </div>
    </main>
  );
}

