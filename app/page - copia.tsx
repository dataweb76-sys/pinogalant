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

function roleToEs(role?: string | null) {
  switch (role) {
    case "super_admin":
      return "Superadmin";
    case "admin":
      return "Administración";
    case "owner":
      return "Propietario";
    default:
      return "Usuario";
  }
}

function pickCover(list: MediaRow[]) {
  if (!list || list.length === 0) return null;

  // Orden por sort_order (null al final)
  const ordered = [...list].sort((a, b) => {
    const ao = a.sort_order ?? 999999;
    const bo = b.sort_order ?? 999999;
    return ao - bo;
  });

  // Preferimos imagen, si no hay imagen, tomamos el primer video, si no hay, el primero con url.
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

  // 1) Properties publicadas
  const { data: props, error: propsErr } = await admin
    .from("properties")
    .select("id,title,city,neighborhood,operation,type,price_ars,price_usd,is_published,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(12);

  // 2) Media (cover por property) -> usamos property_media.url (no storage)
  const mediaMap = new Map<string, { coverUrl?: string; coverKind?: "image" | "video" }>();

  if (props && props.length > 0) {
    const ids = props.map((p: any) => p?.id).filter(Boolean);

    if (ids.length > 0) {
      const { data: media, error: mediaErr } = await admin
        .from("property_media")
        .select("id,property_id,kind,url,sort_order")
        .in("property_id", ids)
        .order("sort_order", { ascending: true });

      if (!mediaErr && media && media.length > 0) {
        const byProp = new Map<string, MediaRow[]>();

        for (const raw of media as any[]) {
          const m = raw as MediaRow;
          if (!m?.property_id) continue;
          const list = byProp.get(m.property_id) ?? [];
          list.push(m);
          byProp.set(m.property_id, list);
        }

        for (const [pid, list] of byProp.entries()) {
          const cover = pickCover(list);
          if (!cover) continue;
          mediaMap.set(pid, { coverUrl: cover.url, coverKind: cover.kind });
        }
      }
    }
  }

  // (no lo usás en UI hoy, pero lo dejo por si lo querés mostrar en header)
  let roleLabel: string | null = null;
  if (user) {
    const { data: profile, error: profErr } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profErr) roleLabel = roleToEs((profile as any)?.role ?? null);
    else roleLabel = "Usuario";
  }

  return (
    <>
      <main style={{ maxWidth: 1050, margin: "0 auto", padding: "28px 16px 80px" }}>
        <div style={{ display: "grid", gap: 12, paddingTop: 20 }}>
          <div className="small" style={{ opacity: 0.7 }}>
            Inmo • Venta • Alquiler • Temporario
          </div>

          <h1 style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: -1 }}>
            Tu próxima propiedad
            <br /> con asesoría real.
          </h1>

          <p className="small" style={{ maxWidth: 720, opacity: 0.7 }}>
            Buscá por ciudad, barrio o tipo. Si hay agentes conectados, consultás por WhatsApp en el momento.
          </p>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <select className="input" defaultValue="venta" style={{ width: 140 }}>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="temporario">Temporario</option>
              </select>

              <select className="input" defaultValue="casa" style={{ width: 180 }}>
                <option value="casa">Casa</option>
                <option value="depto">Departamento</option>
                <option value="quinta">Quinta</option>
                <option value="local">Local</option>
                <option value="terreno">Terreno</option>
              </select>

              <input className="input" placeholder="Ciudad, barrio, dirección o palabra clave…" style={{ flex: 1, minWidth: 260 }} />

              <button className="btn btnPrimary" style={{ width: 120 }}>
                Buscar
              </button>
            </div>

            <div className="small" style={{ marginTop: 10, opacity: 0.75 }}>
              Filtros rápidos:&nbsp;
              <Link href="/propiedades?op=venta">Venta</Link>&nbsp;·&nbsp;
              <Link href="/propiedades?op=alquiler">Alquiler</Link>&nbsp;·&nbsp;
              <Link href="/propiedades?op=temporario">Temporario</Link>&nbsp;·&nbsp;
              <Link href="/publicar">Publicar propiedad</Link>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Link className="btn" href="/propiedades">
                Ver propiedades
              </Link>
              <Link className="btn" href="/publicar">
                Quiero vender / alquilar
              </Link>
              <Link className="btn" href="/admin">
                Administración
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 10 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700 }}>Tasación real</div>
              <div className="small" style={{ opacity: 0.7 }}>Precio sugerido + comparables para publicar con estrategia.</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700 }}>Gestión completa</div>
              <div className="small" style={{ opacity: 0.7 }}>Seguimiento, documentación, control por agente y auditoría.</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700 }}>Respuesta rápida</div>
              <div className="small" style={{ opacity: 0.7 }}>Si hay agentes online, consultás en tiempo real.</div>
            </div>
          </div>

          <section style={{ marginTop: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>Propiedades publicadas</h2>
                <div className="small" style={{ opacity: 0.65 }}>Selección destacada (últimas 12 publicadas).</div>
              </div>

              <Link className="btn" href="/propiedades">
                Ver todas
              </Link>
            </div>

            {propsErr ? (
              <p className="small" style={{ color: "crimson" }}>
                ❌ Error cargando propiedades: {propsErr.message}
              </p>
            ) : !props || props.length === 0 ? (
              <div className="card" style={{ padding: 16, marginTop: 10 }}>
                <div style={{ fontWeight: 700 }}>Todavía no hay propiedades publicadas</div>
                <div className="small" style={{ opacity: 0.7 }}>
                  Publicá una propiedad desde Admin y marcala como Publicada (is_published).
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
                {(props as any as PropertyRow[])
                  .filter((x) => x && x.id)
                  .map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={{
                        ...p,
                        coverUrl: mediaMap.get(p.id)?.coverUrl || null,
                        coverKind: mediaMap.get(p.id)?.coverKind || null,
                      }}
                    />
                  ))}
              </div>
            )}
          </section>

          <section
            className="card"
            style={{
              padding: 16,
              marginTop: 26,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ marginTop: 0 }}>¿Tenés una propiedad para publicar?</h3>
              <p className="small" style={{ opacity: 0.75 }}>
                Cargala en 2 minutos. Después completamos fotos, video, planos, mapa y todo el detalle.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="btn btnPrimary" href="/publicar">
                  Publicar ahora
                </Link>
                <Link className="btn" href="/propiedades">
                  Ver cómo se muestra
                </Link>
              </div>
              <div className="small" style={{ opacity: 0.65, marginTop: 10 }}>
                Tip: el admin puede asignar agentes y ver cada acción registrada.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700 }}>Incluye:</div>
              <ul className="small" style={{ opacity: 0.75, marginTop: 10, display: "grid", gap: 6 }}>
                <li>Venta / alquiler / temporario</li>
                <li>Precio ARS y USD + lo que pide el propietario</li>
                <li>Metros, ambientes, cochera, pisos</li>
                <li>Ubicación: ciudad, barrio y mapa</li>
                <li>Fotos, video y planos + observaciones internas</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <AgentsOnlineWidget />
    </>
  );
}
