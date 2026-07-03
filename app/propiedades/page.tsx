import Link from "next/link";
import WALeadButton from "@/app/components/WALeadButton.client";
import ShareButton from "@/app/components/ShareButton.client";
import PropiedadesSidebar from "./PropiedadesSidebar.client";
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

export const metadata = {
  title: "Propiedades en venta y alquiler en Santa Rosa, La Pampa",
  description:
    "Explorá todas las propiedades disponibles: casas, departamentos, terrenos y campos en Santa Rosa y La Pampa. Filtrá por tipo, precio y operación.",
  alternates: { canonical: "https://pinogalant.com.ar/propiedades" },
  openGraph: {
    title: "Propiedades en Santa Rosa, La Pampa | Pino Galant",
    description: "Casas, departamentos, terrenos y campos en venta y alquiler en La Pampa.",
    url: "https://pinogalant.com.ar/propiedades",
    locale: "es_AR",
  },
};

const TYPE_OPTIONS = [
  { id: "3",  label: "Casa" },
  { id: "2,13", label: "Departamento" },
  { id: "1",  label: "Terreno" },
  { id: "7",  label: "Local" },
  { id: "4",  label: "Quinta" },
  { id: "9",  label: "Campo" },
  { id: "19", label: "Chacra" },
];

const BADGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  valor_ajustado: { label: "Valor ajustado", color: "#fff", bg: "#16a34a" },
  permuta:        { label: "Permuta",         color: "#fff", bg: "#7c3aed" },
  reservado:      { label: "Reservado",        color: "#fff", bg: "#dc2626" },
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
    prov?: string;
  };
}) {
  const sp = searchParams ?? {};

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
      if (a.agents?.phone) agentPhones[a.tokko_id] = a.agents.phone;
      if (a.agents?.name)  agentNames[a.tokko_id]  = a.agents.name;
    });
    (extras ?? []).forEach((e: any) => {
      if (e.badge) badgesPorProp[e.tokko_id] = e.badge;
    });
  } catch (e) {
    console.error("Fetch error:", e);
  }

  // Extraer provincias únicas
  const provinciasSet = new Set<string>();
  for (const p of all) {
    const parts = (p.location?.short_location ?? "").split("|").map(s => s.trim()).filter(Boolean);
    if (parts[0]) provinciasSet.add(parts[0]);
  }
  const provincias = [...provinciasSet].sort();

  const opFilter   = sp.op?.toLowerCase() ?? "";
  const typeFilter = sp.type ?? "";
  const qFilter    = (sp.q ?? "").toLowerCase().trim();
  const provFilter = sp.prov ?? "";
  const priceMin   = Number(sp.price_min) || 0;
  const priceMax   = Number(sp.price_max) || 0;
  const sort       = sp.sort ?? "recent";

  let props = all.filter((p) => {
    if (opFilter && tokkoOperation(p) !== opFilter) return false;
    if (typeFilter && !typeFilter.split(",").includes(String(p.type?.id))) return false;
    if (qFilter) {
      const hay = `${p.address} ${p.location?.full_location ?? ""} ${p.description ?? ""}`.toLowerCase();
      if (!hay.includes(qFilter)) return false;
    }
    if (provFilter) {
      const parts = (p.location?.short_location ?? "").split("|").map(s => s.trim());
      if (parts[0] !== provFilter) return false;
    }
    if (priceMin || priceMax) {
      const pr = tokkoPrice(p);
      if (!pr) return false;
      if (priceMin && pr.amount < priceMin) return false;
      if (priceMax && pr.amount > priceMax) return false;
    }
    return true;
  });

  if (sort === "price_asc") {
    props.sort((a, b) => (tokkoPrice(a)?.amount ?? Infinity) - (tokkoPrice(b)?.amount ?? Infinity));
  } else if (sort === "price_desc") {
    props.sort((a, b) => (tokkoPrice(b)?.amount ?? -Infinity) - (tokkoPrice(a)?.amount ?? -Infinity));
  }

  const PAGE_SIZE = 12;
  const page = Math.max(1, Number(sp.page) || 1);
  const total = props.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = props.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pages = pageWindow(safePage, totalPages);

  function qs(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const base = { op: opFilter, type: typeFilter, q: sp.q ?? "", price_min: sp.price_min ?? "", price_max: sp.price_max ?? "", sort, prov: provFilter, ...overrides };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  return (
    <>
      <style>{`
        .pg-header {
          background: #2D3134;
          background-image: linear-gradient(135deg, #1a1c1e 0%, #2D3134 60%, #3a3e42 100%);
          padding: 56px 40px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .pg-header::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url('/hero.jpg') center/cover no-repeat;
          opacity: 0.12;
        }
        .pg-header h1 {
          position: relative;
          color: #fff;
          font-size: 52px;
          font-weight: 900;
          letter-spacing: 6px;
          text-transform: uppercase;
          margin: 0 0 8px;
        }
        .pg-header p {
          position: relative;
          color: #B48A73;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          letter-spacing: 1px;
        }
        .pg-layout {
          display: flex;
          gap: 24px;
          max-width: 1600px;
          margin: 0 auto;
          padding: 28px 20px 80px;
          align-items: flex-start;
        }
        .pg-main { flex: 1; min-width: 0; }
        .pg-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pg-count {
          font-size: 14px;
          color: #888;
          font-weight: 600;
        }
        .pg-sort {
          padding: 8px 12px;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #2D3134;
          background: #fff;
          cursor: pointer;
        }
        .pg-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 600px) { .pg-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1000px) { .pg-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }

        /* CARD */
        .pg-card {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(0,0,0,0.13);
          background: #fff;
          display: flex;
          flex-direction: column;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .pg-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.18);
        }
        .pg-card-img {
          position: relative;
          display: block;
          text-decoration: none;
          overflow: hidden;
        }
        .pg-card-img img {
          width: 100%;
          height: auto;
          display: block;
        }
        .pg-card-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.05) 100%);
        }
        .pg-card-topleft {
          position: absolute;
          top: 14px;
          left: 16px;
        }
        .pg-card-op {
          font-size: 11px;
          font-weight: 800;
          color: rgba(255,255,255,0.85);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 3px;
        }
        .pg-card-type {
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          text-transform: uppercase;
          line-height: 1.1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .pg-card-logo {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 44px;
          height: 44px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.9;
        }
        .pg-card-badge {
          position: absolute;
          top: 12px;
          right: 64px;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .pg-card-photos {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.5);
          color: #fff;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .pg-card-bar {
          background: #B48A73;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .pg-card-bar-address {
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pg-card-bar-wa {
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .pg-card-body {
          padding: 14px 16px 12px;
          flex: 1;
        }
        .pg-card-price {
          font-size: 22px;
          font-weight: 900;
          color: #2D3134;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .pg-card-loc {
          font-size: 12px;
          color: #999;
        }
        .pg-card-actions {
          padding: 0 16px 16px;
          display: flex;
          gap: 8px;
        }
        .pg-card-btn-detail {
          flex: 1;
          text-align: center;
          padding: 9px 0;
          border-radius: 8px;
          border: 1.5px solid #2D3134;
          color: #2D3134;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
        }
        .pg-pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 32px;
          flex-wrap: wrap;
        }
        .pg-pag-btn {
          padding: 9px 16px;
          border-radius: 8px;
          border: 1.5px solid #ddd;
          background: #fff;
          color: #2D3134;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          cursor: pointer;
        }
        .pg-pag-btn.active {
          border-color: #B48A73;
          color: #B48A73;
        }
        .pg-pag-btn.disabled {
          opacity: 0.4;
          pointer-events: none;
        }
        /* Mobile filter bar */
        .pg-mobile-filters {
          display: none;
          padding: 12px 16px;
          background: #fff;
          border-bottom: 1px solid #eee;
          gap: 8px;
          overflow-x: auto;
        }
        @media (max-width: 768px) {
          .pg-mobile-filters { display: flex; }
          .pg-layout { padding: 20px 16px 60px; }
          .pg-header h1 { font-size: 32px; letter-spacing: 3px; }
        }
        .pg-mobile-chip {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1.5px solid #ddd;
          background: #fff;
          font-size: 12px;
          font-weight: 700;
          color: #2D3134;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
        }
        .pg-mobile-chip.active {
          background: #2D3134;
          color: #fff;
          border-color: #2D3134;
        }
      `}</style>

      {/* HEADER */}
      <div className="pg-header">
        <h1>Propiedades</h1>
        <p>{total} propiedad{total !== 1 ? "es" : ""} disponibles · Santa Rosa, La Pampa</p>
      </div>

      {/* MOBILE FILTERS */}
      <div className="pg-mobile-filters">
        <Link href="/propiedades" className={`pg-mobile-chip ${!opFilter && !typeFilter ? "active" : ""}`}>Todas</Link>
        <Link href="/propiedades?op=venta" className={`pg-mobile-chip ${opFilter === "venta" ? "active" : ""}`}>Venta</Link>
        <Link href="/propiedades?op=alquiler" className={`pg-mobile-chip ${opFilter === "alquiler" ? "active" : ""}`}>Alquiler</Link>
        {TYPE_OPTIONS.map(t => (
          <Link key={t.id} href={`/propiedades?type=${t.id}`} className={`pg-mobile-chip ${typeFilter === t.id ? "active" : ""}`}>{t.label}</Link>
        ))}
      </div>

      {/* LAYOUT */}
      <div className="pg-layout">

        {/* SIDEBAR */}
        <PropiedadesSidebar
          tipos={TYPE_OPTIONS}
          provincias={provincias}
          opFilter={opFilter}
          typeFilter={typeFilter}
          provFilter={provFilter}
        />

        {/* MAIN */}
        <main className="pg-main">

          {/* Top bar */}
          <div className="pg-topbar">
            <span className="pg-count">
              {total} propiedad{total !== 1 ? "es" : ""}
              {opFilter && ` · ${opFilter}`}
              {typeFilter && ` · ${TYPE_OPTIONS.find(t => t.id === typeFilter)?.label ?? ""}`}
              {provFilter && ` · ${provFilter}`}
            </span>
            <form action="/propiedades" method="GET" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {opFilter   && <input type="hidden" name="op"   value={opFilter} />}
              {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
              {provFilter && <input type="hidden" name="prov" value={provFilter} />}
              <input
                className="pg-sort"
                name="q"
                placeholder="Buscar dirección..."
                defaultValue={sp.q}
                style={{ width: 180 }}
              />
              <select className="pg-sort" name="sort" defaultValue={sort} onChange="this.form.submit()">
                <option value="recent">Por defecto</option>
                <option value="price_asc">Precio ↑</option>
                <option value="price_desc">Precio ↓</option>
              </select>
              <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: "#2D3134", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Buscar
              </button>
              {(opFilter || typeFilter || qFilter || provFilter) && (
                <Link href="/propiedades" style={{ fontSize: 12, color: "#888", textDecoration: "none", fontWeight: 600 }}>
                  × Limpiar
                </Link>
              )}
            </form>
          </div>

          {/* GRID */}
          {pageItems.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", background: "#fff", borderRadius: 14, border: "1px solid #eee" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Sin resultados para esos filtros</div>
              <div style={{ color: "#888", marginTop: 6 }}>Probá con otros parámetros.</div>
              <Link href="/propiedades" style={{ marginTop: 16, display: "inline-block", padding: "10px 22px", background: "#2D3134", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                Ver todas
              </Link>
            </div>
          ) : (
            <div className="pg-grid">
              {pageItems.map((p) => {
                const price = tokkoPrice(p);
                const op    = tokkoOperation(p);
                const cover = tokkoCover(p);
                const type  = tokkoType(p);
                const loc   = tokkoLocation(p);
                const badge = badgesPorProp[p.id] ? BADGE_LABELS[badgesPorProp[p.id]] : null;
                const raw   = agentPhones[p.id] ?? process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP ?? "";
                const wa    = raw.replace(/\D/g, "");
                const num   = wa.startsWith("54") ? wa : `54${wa}`;
                const msg   = encodeURIComponent(`Hola! Me interesa la propiedad en ${p.address}. ¿Me podés dar más información?`);

                return (
                  <article key={p.id} className="pg-card">

                    {/* IMAGE */}
                    <Link href={`/propiedades/${p.id}`} className="pg-card-img">
                      {cover ? (
                        <img src={cover} alt={p.address} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#2D3134", display: "grid", placeItems: "center" }}>
                          <span style={{ fontSize: 48, opacity: 0.3 }}>🏠</span>
                        </div>
                      )}
                      <div className="pg-card-img-overlay" />

                      {/* TOP LEFT: VENDE + TIPO */}
                      <div className="pg-card-topleft">
                        <div className="pg-card-op">{op === "venta" ? "Vende" : "Alquila"}</div>
                        <div className="pg-card-type">{type}</div>
                      </div>



                      {/* BADGE */}
                      {badge && (
                        <span className="pg-card-badge" style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      )}

                      {/* PHOTO COUNT */}
                      {p.photos.length > 1 && (
                        <span className="pg-card-photos">📷 {p.photos.length}</span>
                      )}
                    </Link>

                    {/* ORANGE BAR: address + WA */}
                    <div className="pg-card-bar">
                      <span className="pg-card-bar-address">
                        {p.address}{loc.city ? ` · ${loc.city}` : ""}
                      </span>
                      <WALeadButton
                        waNumber={num}
                        waMsg={msg}
                        propertyId={p.id}
                        propertyAddress={p.address}
                        agentName={agentNames[p.id]}
                        agentPhone={agentPhones[p.id]}
                        source="property_card"
                        className="pg-card-bar-wa"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Consultar
                      </WALeadButton>
                    </div>

                    {/* BODY: price + location */}
                    <div className="pg-card-body">
                      {price ? (
                        <div className="pg-card-price">{fmt(price.amount, price.currency)}</div>
                      ) : (
                        <div className="pg-card-price" style={{ fontSize: 15, color: "#aaa" }}>Consultar precio</div>
                      )}
                      <div className="pg-card-loc">
                        📍 {[loc.neighborhood, loc.city].filter(Boolean).join(", ") || "Santa Rosa, La Pampa"}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="pg-card-actions">
                      <Link href={`/propiedades/${p.id}`} className="pg-card-btn-detail">
                        Ver detalle
                      </Link>
                      <ShareButton propertyId={p.id} address={p.address} />
                    </div>

                  </article>
                );
              })}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pg-pagination">
              <Link
                className={`pg-pag-btn${safePage <= 1 ? " disabled" : ""}`}
                href={`/propiedades${qs({ page: String(Math.max(1, safePage - 1)) })}`}
              >← Anterior</Link>
              {pages.map((pg, i) =>
                pg === "..." ? (
                  <span key={`d${i}`} style={{ padding: "9px 4px", color: "#aaa" }}>…</span>
                ) : (
                  <Link key={pg} className={`pg-pag-btn${pg === safePage ? " active" : ""}`}
                    href={`/propiedades${qs({ page: String(pg) })}`}>
                    {pg}
                  </Link>
                )
              )}
              <Link
                className={`pg-pag-btn${safePage >= totalPages ? " disabled" : ""}`}
                href={`/propiedades${qs({ page: String(Math.min(totalPages, safePage + 1)) })}`}
              >Siguiente →</Link>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
