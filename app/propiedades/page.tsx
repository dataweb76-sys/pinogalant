import Link from "next/link";
import WALeadButton from "@/app/components/WALeadButton.client";
import PropiedadesVistaToggle from "@/app/components/PropiedadesVistaToggle.client";
import AlertasPropiedades from "@/app/components/AlertasPropiedades.client";
import {
  getAllTokkoProperties,
  tokkoPrice,
  tokkoOperation,
  tokkoCover,
  tokkoType,
  tokkoLocation,
  type TokkoProperty,
} from "@/lib/tokko";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const revalidate = 300;
export const preferredRegion = ["gru1"];

// ─── Tipos de propiedad Tokko (type.id) ──────────────────────────────────────
const TYPE_OPTIONS = [
  { id: "3",  label: "Casa" },
  { id: "2",  label: "Departamento" },
  { id: "1",  label: "Terreno" },
  { id: "7",  label: "Local" },
  { id: "4",  label: "Quinta" },
  { id: "9",  label: "Campo" },
  { id: "13", label: "Condo" },
  { id: "19", label: "Rancho" },
];

const BADGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  valor_ajustado: { label: "💰 Valor ajustado", color: "#fff", bg: "#16a34a" },
  permuta:        { label: "🔄 Permuta",         color: "#fff", bg: "#7c3aed" },
  reservado:      { label: "🔒 Reservado",        color: "#fff", bg: "#dc2626" },
};

function fmt(n: number, currency: string) {
  if (currency === "USD") return `USD ${n.toLocaleString("es-AR")}`;
  return `$ ${n.toLocaleString("es-AR")}`;
}

function pageWindow(cur: number, total: number) {
  const set = new Set([1, total]);
  for (let i = cur - 2; i <= cur + 2; i++) if (i >= 1 && i <= total) set.add(i);
  const arr = Array.from(set).sort((a, b) => a - b);
  const out: Array<number | "..."> = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("...");
  }
  return out;
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams?: {
    op?: string;
    type?: string;
    q?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
    page?: string;
  };
}) {
  const sp = searchParams ?? {};

  // ── Fetch propiedades + asignaciones en paralelo ────────────────────────
  let all: TokkoProperty[] = [];
  let agentPhones: Record<number, string> = {};
  let agentNames: Record<number, string> = {};
  let badgesPorProp: Record<number, string> = {};
  try {
    const admin = createSupabaseAdminClient();
    const [props, { data: assignments }, { data: extras }] = await Promise.all([
      getAllTokkoProperties(),
      admin.from("tokko_agent_assignments").select("tokko_id, agents(name, phone)"),
      admin.from("property_extras").select("tokko_id, badge"),
    ]);
    all = props;
    (assignments ?? []).forEach((a: any) => {
      const phone = a.agents?.phone;
      const name = a.agents?.name;
      if (phone) agentPhones[a.tokko_id] = phone;
      if (name) agentNames[a.tokko_id] = name;
    });
    (extras ?? []).forEach((e: any) => {
      if (e.badge) badgesPorProp[e.tokko_id] = e.badge;
    });
  } catch (e) {
    console.error("Fetch error:", e);
  }

  // ── Filtros ──────────────────────────────────────────────────────────────
  const opFilter   = sp.op?.toLowerCase() ?? "";      // "venta" | "alquiler"
  const typeFilter = sp.type ?? "";                    // type.id como string
  const qFilter    = (sp.q ?? "").toLowerCase().trim();
  const priceMin   = Number(sp.price_min) || 0;
  const priceMax   = Number(sp.price_max) || 0;
  const sort       = sp.sort ?? "recent";

  let props = all.filter((p) => {
    if (opFilter) {
      const op = tokkoOperation(p);
      if (op !== opFilter) return false;
    }
    if (typeFilter && String(p.type?.id) !== typeFilter) return false;
    if (qFilter) {
      const hay = `${p.address} ${p.location?.full_location ?? ""} ${p.description ?? ""}`.toLowerCase();
      if (!hay.includes(qFilter)) return false;
    }
    if (priceMin || priceMax) {
      const pr = tokkoPrice(p);
      if (!pr) return false;
      if (priceMin && pr.amount < priceMin) return false;
      if (priceMax && pr.amount > priceMax) return false;
    }
    return true;
  });

  // ── Orden ────────────────────────────────────────────────────────────────
  if (sort === "price_asc") {
    props.sort((a, b) => (tokkoPrice(a)?.amount ?? Infinity) - (tokkoPrice(b)?.amount ?? Infinity));
  } else if (sort === "price_desc") {
    props.sort((a, b) => (tokkoPrice(b)?.amount ?? -Infinity) - (tokkoPrice(a)?.amount ?? -Infinity));
  }

  // ── Paginación ───────────────────────────────────────────────────────────
  const PAGE_SIZE = 12;
  const page = Math.max(1, Number(sp.page) || 1);
  const total = props.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = props.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pages = pageWindow(safePage, totalPages);

  function qs(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const base = { op: opFilter, type: typeFilter, q: sp.q ?? "", price_min: sp.price_min ?? "", price_max: sp.price_max ?? "", sort, ...overrides };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 16px 80px" }}>

      {/* HERO FILTROS */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 18, padding: "18px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
          <div>
            <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
              Propiedades disponibles
            </h1>
            <p style={{ margin: "0 0 14px", color: "#888", fontSize: 13 }}>
              {total} propiedad{total !== 1 ? "es" : ""} · Santa Rosa, La Pampa
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <AlertasPropiedades />
            <PropiedadesVistaToggle pins={props
            .filter(p => p.geo_lat && p.geo_long && p.geo_lat !== "0" && p.geo_long !== "0")
            .map(p => {
              const pr = tokkoPrice(p);
              const op = tokkoOperation(p);
              return {
                id: p.id,
                address: p.address,
                lat: parseFloat(p.geo_lat),
                lng: parseFloat(p.geo_long),
                price: pr ? `${pr.currency === "USD" ? "USD" : "$"} ${pr.amount.toLocaleString("es-AR")}` : undefined,
                op,
                type: tokkoType(p),
                photo: p.photos?.[0]?.image ?? undefined,
              };
            })
          } />
        </div>
        </div>

        <style>{`
          .filtros-row1 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
          .filtros-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
          .filtros-row3 { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
          .filtros-buscar { width: 100%; }
          @media (min-width: 640px) {
            .filtros-row1 { grid-template-columns: 2fr 1fr 1fr auto; }
            .filtros-row2 { grid-template-columns: 140px 140px 1fr auto; }
            .filtros-buscar { display: none; }
          }
        `}</style>

        <form action="/propiedades" method="GET">
          {/* Fila 1: búsqueda + operación + tipo */}
          <div className="filtros-row1">
            <input className="input" name="q" placeholder="Buscar por dirección o zona…" defaultValue={sp.q} style={{ gridColumn: "1 / -1" }} />
            <select className="input" name="op" defaultValue={opFilter}>
              <option value="">Operación (todas)</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
            <select className="input" name="type" defaultValue={typeFilter}>
              <option value="">Tipo (todos)</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button className="btn btnPrimary filtros-buscar" type="submit">Buscar</button>
          </div>

          {/* Fila 2: precios + orden + buscar desktop */}
          <div className="filtros-row2">
            <input className="input" name="price_min" placeholder="Precio mín." defaultValue={sp.price_min} />
            <input className="input" name="price_max" placeholder="Precio máx." defaultValue={sp.price_max} />
            <select className="input" name="sort" defaultValue={sort}>
              <option value="recent">Ordenar: por defecto</option>
              <option value="price_asc">Precio ↑</option>
              <option value="price_desc">Precio ↓</option>
            </select>
            <button className="btn btnPrimary" type="submit" style={{ whiteSpace: "nowrap" }}>Buscar</button>
          </div>

          <input type="hidden" name="page" value="1" />
          <Link href="/propiedades" className="btn" style={{ fontSize: 13 }}>Limpiar filtros</Link>
        </form>
      </div>

      {/* LISTADO */}
      {pageItems.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#fff", borderRadius: 14, border: "1px solid #eee" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>No hay propiedades para esos filtros</div>
          <div style={{ color: "#888", marginTop: 6 }}>Probá con otros parámetros o limpiar los filtros.</div>
          <Link href="/propiedades" className="btn btnPrimary" style={{ marginTop: 16, display: "inline-block" }}>
            Ver todas
          </Link>
        </div>
      ) : (
        <>
          <style>{`.props-grid { display: grid; grid-template-columns: 1fr; gap: 12px; } @media(min-width:480px){.props-grid{grid-template-columns:1fr 1fr;}} @media(min-width:900px){.props-grid{grid-template-columns:repeat(3,1fr);gap:16px;}}`}</style>
          <div className="props-grid">
            {pageItems.map((p) => {
              const price = tokkoPrice(p);
              const op    = tokkoOperation(p);
              const cover = tokkoCover(p);
              const type  = tokkoType(p);
              const loc   = tokkoLocation(p);
              const badge = badgesPorProp[p.id] ? BADGE_LABELS[badgesPorProp[p.id]] : null;
              return (
                <article key={p.id} className="prop-card">
                  <Link href={`/propiedades/${p.id}`} style={{ display: "block", position: "relative" }}>
                    <div style={{ aspectRatio: "4/3", background: "#f3f4f6", overflow: "hidden", position: "relative" }}>
                      {cover ? (
                        <img src={cover} alt={p.address} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#bbb" }}>
                          <span style={{ fontSize: 36 }}>🏠</span>
                        </div>
                      )}
                      <span style={{
                        position: "absolute", top: 12, left: 12,
                        background: op === "venta" ? "#2D3134" : "#B48A73",
                        color: "#fff", fontSize: 11, fontWeight: 800,
                        padding: "4px 12px", borderRadius: 999, textTransform: "uppercase",
                      }}>
                        {op === "venta" ? "Venta" : "Alquiler"}
                      </span>
                      {badge && (
                        <span style={{
                          position: "absolute", top: 12, right: 12,
                          background: badge.bg, color: badge.color,
                          fontSize: 11, fontWeight: 800,
                          padding: "4px 12px", borderRadius: 999,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}>
                          {badge.label}
                        </span>
                      )}
                      {p.photos.length > 1 && (
                        <span style={{
                          position: "absolute", bottom: 10, right: 10,
                          background: "rgba(0,0,0,0.55)", color: "#fff",
                          fontSize: 11, padding: "3px 8px", borderRadius: 8,
                        }}>
                          📷 {p.photos.length}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div style={{ padding: "12px 14px 8px", flexGrow: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                      {type}
                    </div>
                    <Link href={`/propiedades/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.3, marginBottom: 6 }}>
                        {p.address}
                      </div>
                    </Link>
                    <div style={{ fontSize: 13, color: "#999", marginBottom: 10 }}>
                      📍 {[loc.neighborhood, loc.city].filter(Boolean).join(", ") || "Santa Rosa, La Pampa"}
                    </div>
                    {price && (
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#2D3134", letterSpacing: -0.5 }}>
                        {fmt(price.amount, price.currency)}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "0 14px 14px", display: "flex", gap: 8 }}>
                    <Link href={`/propiedades/${p.id}`} style={{
                      flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10,
                      border: "1.5px solid #2D3134", color: "#2D3134",
                      textDecoration: "none", fontWeight: 700, fontSize: 14,
                    }}>
                      Ver detalle
                    </Link>
                    {(() => {
                      const raw = agentPhones[p.id] ?? process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP ?? "";
                      const wa = raw.replace(/\D/g, "");
                      const num = wa.startsWith("54") ? wa : `54${wa}`;
                      const msg = encodeURIComponent(`Hola! Me interesa la propiedad en ${p.address}. ¿Podés darme más información?`);
                      return (
                        <WALeadButton
                          waNumber={num}
                          waMsg={msg}
                          propertyId={p.id}
                          propertyAddress={p.address}
                          agentName={agentNames[p.id]}
                          agentPhone={agentPhones[p.id]}
                          source="property_card"
                          style={{
                            flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10,
                            background: "#25D366", color: "#fff", border: "none",
                            fontWeight: 700, fontSize: 14, cursor: "pointer",
                          }}
                        >
                          WhatsApp
                        </WALeadButton>
                      );
                    })()}
                  </div>
                </article>
              );
            })}
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28, flexWrap: "wrap" }}>
              <Link className="btn" href={`/propiedades${qs({ page: String(Math.max(1, safePage - 1)) })}`}
                style={{ opacity: safePage <= 1 ? 0.4 : 1, pointerEvents: safePage <= 1 ? "none" : "auto" }}>
                ← Anterior
              </Link>
              {pages.map((pg, i) =>
                pg === "..." ? (
                  <span key={`d${i}`} style={{ padding: "8px 4px", color: "#aaa" }}>…</span>
                ) : (
                  <Link key={pg} className="btn" href={`/propiedades${qs({ page: String(pg) })}`}
                    style={{ fontWeight: pg === safePage ? 900 : 700, border: pg === safePage ? "2px solid #B48A73" : undefined }}>
                    {pg}
                  </Link>
                )
              )}
              <Link className="btn" href={`/propiedades${qs({ page: String(Math.min(totalPages, safePage + 1)) })}`}
                style={{ opacity: safePage >= totalPages ? 0.4 : 1, pointerEvents: safePage >= totalPages ? "none" : "auto" }}>
                Siguiente →
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}
