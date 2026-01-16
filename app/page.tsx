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

  // Colores extraídos del logo
  const brandColor = "#B48A73"; // El tono bronce del logo
  const darkColor = "#2D3134";  // El gris oscuro de fondo

  const { data: props, error: propsErr } = await admin
    .from("properties")
    .select("id,title,city,neighborhood,operation,type,price_ars,price_usd,is_published,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(12);

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

  return (
    <>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 100px", fontFamily: "inherit" }}>
        
        {/* HEADER / HERO SECTION */}
        <section style={{ textAlign: "center", marginBottom: 60, paddingTop: 40 }}>
          <div style={{ 
            display: "inline-block", 
            padding: "6px 16px", 
            borderRadius: 50, 
            backgroundColor: `${brandColor}15`, 
            color: brandColor,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 20
          }}>
            Pino Galant • Servicios Inmobiliarios
          </div>

          <h1 style={{ 
            fontSize: "clamp(32px, 5vw, 56px)", 
            lineHeight: 1.1, 
            letterSpacing: "-0.03em", 
            fontWeight: 800, 
            color: darkColor,
            margin: "0 auto 20px",
            maxWidth: 800
          }}>
            Tu próxima propiedad <br /> 
            <span style={{ color: brandColor }}>con asesoría real.</span>
          </h1>

          <p style={{ maxWidth: 600, margin: "0 auto 40px", fontSize: 18, color: "#666", lineHeight: 1.6 }}>
            Buscá por ciudad, barrio o tipo. Consultá por WhatsApp en tiempo real con nuestros agentes.
          </p>

          {/* BUSCADOR ESTILO FLOATING CARD */}
          <div className="card" style={{ 
            padding: 24, 
            borderRadius: 20, 
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
            border: "1px solid #eee",
            backgroundColor: "#fff",
            maxWidth: 1000,
            margin: "0 auto"
          }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <select className="input" defaultValue="venta" style={{ flex: 1, height: 48, borderRadius: 10, border: "1px solid #ddd" }}>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="temporario">Temporario</option>
              </select>

              <select className="input" defaultValue="casa" style={{ flex: 1, height: 48, borderRadius: 10, border: "1px solid #ddd" }}>
                <option value="casa">Casa</option>
                <option value="depto">Departamento</option>
                <option value="quinta">Quinta</option>
                <option value="local">Local</option>
                <option value="terreno">Terreno</option>
              </select>

              <input 
                className="input" 
                placeholder="Ciudad, barrio o palabra clave…" 
                style={{ flex: 2, minWidth: 260, height: 48, borderRadius: 10, border: "1px solid #ddd" }} 
              />

              <button className="btn" style={{ 
                height: 48, 
                padding: "0 32px", 
                backgroundColor: brandColor, 
                color: "#fff", 
                borderRadius: 10, 
                fontWeight: 600,
                border: "none",
                cursor: "pointer"
              }}>
                Buscar
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f5f5f5" }}>
              <div className="small" style={{ opacity: 0.8, fontSize: 13 }}>
                Filtros rápidos:&nbsp;
                <Link href="/propiedades?op=venta" style={{ color: brandColor, fontWeight: 600 }}>Venta</Link> •&nbsp;
                <Link href="/propiedades?op=alquiler" style={{ color: brandColor, fontWeight: 600 }}>Alquiler</Link> •&nbsp;
                <Link href="/propiedades?op=temporario" style={{ color: brandColor, fontWeight: 600 }}>Temporario</Link>
              </div>
              <div style={{ display: "flex", gap: 15 }}>
                <Link href="/propiedades" className="small" style={{ fontWeight: 600, textDecoration: "none", color: darkColor }}>Ver catálogo</Link>
                <Link href="/admin" className="small" style={{ fontWeight: 600, textDecoration: "none", color: darkColor }}>Acceso Staff</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 80 }}>
          <div className="card" style={{ padding: 24, borderRadius: 16, border: "1px solid #f0f0f0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: darkColor }}>Tasación Real</div>
            <p className="small" style={{ opacity: 0.7, lineHeight: 1.5 }}>Precio sugerido con datos comparables para vender con estrategia.</p>
          </div>
          <div className="card" style={{ padding: 24, borderRadius: 16, border: "1px solid #f0f0f0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: darkColor }}>Gestión Completa</div>
            <p className="small" style={{ opacity: 0.7, lineHeight: 1.5 }}>Auditoría documental y seguimiento personalizado por cada agente.</p>
          </div>
          <div className="card" style={{ padding: 24, borderRadius: 16, border: "1px solid #f0f0f0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: darkColor }}>Respuesta Inmediata</div>
            <p className="small" style={{ opacity: 0.7, lineHeight: 1.5 }}>Conectamos clientes con agentes disponibles por WhatsApp al instante.</p>
          </div>
        </div>

        {/* PROPERTIES SECTION */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: darkColor }}>Propiedades destacadas</h2>
              <div style={{ width: 60, height: 4, backgroundColor: brandColor, marginTop: 12, borderRadius: 2 }}></div>
            </div>
            <Link className="btn" href="/propiedades" style={{ border: `1px solid ${brandColor}`, color: brandColor, borderRadius: 8, padding: "8px 20px" }}>
              Ver todas las propiedades
            </Link>
          </div>

          {propsErr ? (
            <p style={{ color: "crimson", textAlign: "center", padding: 40 }}>❌ Error: {propsErr.message}</p>
          ) : !props || props.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: "center", borderRadius: 20, border: "2px dashed #eee" }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Próximamente nuevas unidades</div>
              <div className="small" style={{ opacity: 0.6, marginTop: 8 }}>Estamos preparando las mejores opciones para vos.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
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

        {/* CTA SECTION - DISEÑO ÚNICO */}
        <section
          style={{
            padding: "60px 40px",
            borderRadius: 30,
            background: `linear-gradient(135deg, ${darkColor} 0%, #1a1d1f 100%)`,
            color: "#fff",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 40,
            alignItems: "center",
            boxShadow: "0 30px 60px -12px rgba(0,0,0,0.25)"
          }}
        >
          <div>
            <h3 style={{ fontSize: 36, fontWeight: 800, marginTop: 0, lineHeight: 1.2 }}>
              ¿Tenés una propiedad <br /> para publicar?
            </h3>
            <p style={{ opacity: 0.8, fontSize: 18, marginBottom: 32, lineHeight: 1.6 }}>
              Cargala en 2 minutos. Nosotros nos encargamos de las fotos, videos y la estrategia de venta para encontrar al cliente ideal.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link className="btn" href="/publicar" style={{ backgroundColor: brandColor, color: "#fff", padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 16 }}>
                Publicar ahora
              </Link>
              <Link className="btn" href="/propiedades" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", padding: "14px 32px", borderRadius: 12, fontWeight: 600 }}>
                Ver cómo se muestra
              </Link>
            </div>
          </div>

          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20, color: brandColor }}>Nuestro servicio incluye:</div>
            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {[
                "Reporte de precio real de mercado",
                "Fotografía y Video de alta calidad",
                "Publicidad en portales líderes",
                "Atención de consultas 24/7",
                "Gestoría y cierre de operación"
              ].map((item, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}>
                  <span style={{ color: brandColor }}>✔</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <AgentsOnlineWidget />
    </>
  );
}