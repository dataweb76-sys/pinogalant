import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import PropertyCard from "@/app/components/PropertyCard";
import AgentsOnlineWidget from "@/app/components/AgentsOnlineWidget.client";

export const runtime = "nodejs";

type PropertyRow = {
  id: string;
  title: string;
  city: string | null;
  neighborhood: string | null;
  operation: string;
  type: string;
  price_ars: string | number | null;
  price_usd: string | number | null;
  is_published: boolean;
};

type MediaRow = {
  id: string;
  property_id: string;
  kind: string | null;
  url: string | null;
  sort_order: number | null;
};

function pickCover(list: MediaRow[]) {
  if (!list || list.length === 0) return null;

  const ordered = [...list].sort((a, b) => {
    const ao = a.sort_order ?? 999999;
    const bo = b.sort_order ?? 999999;
    return ao - bo;
  });

  const img = ordered.find((m) => (m.kind || "").toLowerCase() === "image" && m.url);
  if (img) return { url: img.url!, kind: "image" as const };

  const vid = ordered.find((m) => (m.kind || "").toLowerCase() === "video" && m.url);
  if (vid) return { url: vid.url!, kind: "video" as const };

  const first = ordered.find((m) => !!m.url);
  if (first?.url) return { url: first.url, kind: (first.kind || "image") as "image" | "video" };

  return null;
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user ?? null;

  const admin = createSupabaseAdminClient();

  const brandColor = "#B48A73";
  const darkColor = "#2D3134";

  const { data: props, error: propsErr } = await admin
    .from("properties")
    .select("id,title,city,neighborhood,operation,type,price_ars,price_usd,is_published,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(12);

  const mediaMap = new Map<string, { coverUrl?: string; coverKind?: "image" | "video" }>();

  if (props?.length) {
    const ids = props.map((p) => p.id);
    const { data: media } = await admin
      .from("property_media")
      .select("property_id,kind,url,sort_order")
      .in("property_id", ids)
      .order("sort_order", { ascending: true });

    if (media) {
      const byProp = new Map<string, MediaRow[]>();
      media.forEach((m) => {
        const list = byProp.get(m.property_id) ?? [];
        list.push(m);
        byProp.set(m.property_id, list);
      });

      byProp.forEach((list, pid) => {
        const cover = pickCover(list);
        if (cover) mediaMap.set(pid, { coverUrl: cover.url, coverKind: cover.kind });
      });
    }
  }

  return (
    <>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 100px" }}>
        {/* HERO */}
        <section style={{ textAlign: "center", marginBottom: 70 }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 999,
              background: `${brandColor}15`,
              color: brandColor,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 20,
            }}
          >
            PINO GALANT · SERVICIOS INMOBILIARIOS
          </span>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: darkColor,
              marginBottom: 20,
            }}
          >
            Tu próxima propiedad <br />
            <span style={{ color: brandColor }}>con asesoría real.</span>
          </h1>

          <p style={{ maxWidth: 640, margin: "0 auto 36px", fontSize: 18, color: "#666" }}>
            Buscá por ciudad, barrio o tipo. Consultá en tiempo real con nuestros agentes.
          </p>
        </section>

        {/* PROPIEDADES */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: darkColor }}>
                Propiedades destacadas
              </h2>
              <div style={{ width: 60, height: 4, background: brandColor, marginTop: 10 }} />
            </div>

            <Link
              href="/propiedades"
              className="btn"
              style={{
                border: `1px solid ${brandColor}`,
                color: brandColor,
                padding: "8px 20px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Ver todas
            </Link>
          </div>

          {propsErr ? (
            <p style={{ color: "crimson", textAlign: "center" }}>Error cargando propiedades</p>
          ) : (
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  }}
>

              {props?.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={{
                    ...p,
                    coverUrl: mediaMap.get(p.id)?.coverUrl ?? null,
                    coverKind: mediaMap.get(p.id)?.coverKind ?? null,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <AgentsOnlineWidget />
    </>
  );
}
