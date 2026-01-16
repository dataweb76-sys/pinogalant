// app/propiedades/page.tsx
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import PropertyCard from "@/app/components/PropertyCard";

export const runtime = "nodejs";

type PropertyRow = {
  id: string;
  title: string | null;
  city: string | null;
  neighborhood: string | null;
  operation: string | null;
  type: string | null;
  price_ars: string | number | null;
  price_usd: string | number | null;
  is_published: boolean | null;
  status?: string | null; // enum: borrador/en_revision/aprobada/publicada/...
  published_at?: string | null;
  created_at?: string | null;
};

type MediaRow = {
  id: string;
  property_id: string;
  kind: string | null; // image | video
  url: string | null;  // URL pública
  sort_order: number | null;
  created_at: string;
};

function toStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function buildQS(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).length > 0) sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

function pageWindow(current: number, total: number) {
  // 1 … (c-2) (c-1) c (c+1) (c+2) … total
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) set.add(i);
  }
  const arr = Array.from(set).sort((a, b) => a - b);

  // convertimos a lista con "..." cuando hay saltos
  const out: Array<number | "..."> = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("...");
  }
  return out;
}

function isRecent(dateStr?: string | null, days = 10) {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (!Number.isFinite(t)) return false;
  const now = Date.now();
  return now - t <= days * 24 * 60 * 60 * 1000;
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    op?: string;
    type?: string;
    city?: string;
    ars_min?: string;
    ars_max?: string;
    usd_min?: string;
    usd_max?: string;
    sort?: string;
    page?: string;
  };
}) {
  const admin = createSupabaseAdminClient();

  const q = norm(toStr(searchParams?.q));
  const op = norm(toStr(searchParams?.op));
  const type = norm(toStr(searchParams?.type));
  const city = toStr(searchParams?.city).trim();

  const arsMin = toNum(searchParams?.ars_min);
  const arsMax = toNum(searchParams?.ars_max);
  const usdMin = toNum(searchParams?.usd_min);
  const usdMax = toNum(searchParams?.usd_max);

  const sort = toStr(searchParams?.sort) || "recent"; // recent | ars_asc | ars_desc | usd_asc | usd_desc

  const pageSize = 12;
  const page = Math.max(1, Number(toStr(searchParams?.page) || "1") || 1);

  // 1) Traemos un lote razonable (filtrado robusto en memoria)
  const { data: rawProps, error: propsErr } = await admin
    .from("properties")
    .select("id,title,city,neighborhood,operation,type,price_ars,price_usd,is_published,status,published_at,created_at")
    .or("is_published.eq.true,status.eq.publicada")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(800);

  let props: PropertyRow[] = (rawProps as any as PropertyRow[]) ?? [];

  // 2) Filtros
  if (op) props = props.filter((p) => norm(p.operation ?? "") === op);
  if (type) props = props.filter((p) => norm(p.type ?? "") === type);
  if (city) props = props.filter((p) => (p.city ?? "").toLowerCase().includes(city.toLowerCase()));

  if (q) {
    props = props.filter((p) => {
      const hay = `${p.title ?? ""} ${p.city ?? ""} ${p.neighborhood ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (arsMin != null) props = props.filter((p) => (toNum(p.price_ars) ?? -Infinity) >= arsMin);
  if (arsMax != null) props = props.filter((p) => (toNum(p.price_ars) ?? Infinity) <= arsMax);
  if (usdMin != null) props = props.filter((p) => (toNum(p.price_usd) ?? -Infinity) >= usdMin);
  if (usdMax != null) props = props.filter((p) => (toNum(p.price_usd) ?? Infinity) <= usdMax);

  // 3) Orden
  if (sort === "ars_asc") {
    props.sort((a, b) => (toNum(a.price_ars) ?? Infinity) - (toNum(b.price_ars) ?? Infinity));
  } else if (sort === "ars_desc") {
    props.sort((a, b) => (toNum(b.price_ars) ?? -Infinity) - (toNum(a.price_ars) ?? -Infinity));
  } else if (sort === "usd_asc") {
    props.sort((a, b) => (toNum(a.price_usd) ?? Infinity) - (toNum(b.price_usd) ?? Infinity));
  } else if (sort === "usd_desc") {
    props.sort((a, b) => (toNum(b.price_usd) ?? -Infinity) - (toNum(a.price_usd) ?? -Infinity));
  } else {
    // recent
    props.sort((a, b) => {
      const ta = new Date(a.published_at || a.created_at || 0).getTime();
      const tb = new Date(b.published_at || b.created_at || 0).getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
  }

  // 4) Paginación
  const total = props.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = props.slice(start, start + pageSize);

  // 5) Media (cover image + hasVideo)
  const mediaMap = new Map<string, { coverUrl: string | null; hasVideo: boolean }>();

  if (pageItems.length > 0) {
    const ids = pageItems.map((p) => p.id);

    const { data: media, error: mediaErr } = await admin
      .from("property_media")
      .select("id,property_id,kind,url,sort_order,created_at")
      .in("property_id", ids)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!mediaErr && media && media.length > 0) {
      const byProp = new Map<string, MediaRow[]>();
      for (const m of media as any as MediaRow[]) {
        if (!m?.property_id) continue;
        const list = byProp.get(m.property_id) ?? [];
        list.push(m);
        byProp.set(m.property_id, list);
      }

      for (const [pid, list] of byProp.entries()) {
        const images = list.filter((x) => (x.kind ?? "").toLowerCase() === "image" && x.url);
        const videos = list.filter((x) => (x.kind ?? "").toLowerCase() === "video" && x.url);
        const cover = images.length > 0 ? images[0].url! : null;
        mediaMap.set(pid, { coverUrl: cover, hasVideo: videos.length > 0 });
      }
    }
  }

  // QS base
  const baseQS = {
    q: toStr(searchParams?.q),
    op: toStr(searchParams?.op),
    type: toStr(searchParams?.type),
    city: toStr(searchParams?.city),
    ars_min: toStr(searchParams?.ars_min),
    ars_max: toStr(searchParams?.ars_max),
    usd_min: toStr(searchParams?.usd_min),
    usd_max: toStr(searchParams?.usd_max),
    sort: toStr(searchParams?.sort) || "recent",
  };

  const prevHref = buildQS({ ...baseQS, page: String(Math.max(1, safePage - 1)) });
  const nextHref = buildQS({ ...baseQS, page: String(Math.min(totalPages, safePage + 1)) });

  // Chips de filtros activos
  const chips: Array<{ label: string; href: string }> = [];
  if (q) chips.push({ label: `Buscar: "${toStr(searchParams?.q)}"`, href: `/propiedades${buildQS({ ...baseQS, q: "", page: "1" })}` });
  if (op) chips.push({ label: `Operación: ${op}`, href: `/propiedades${buildQS({ ...baseQS, op: "", page: "1" })}` });
  if (type) chips.push({ label: `Tipo: ${type}`, href: `/propiedades${buildQS({ ...baseQS, type: "", page: "1" })}` });
  if (city) chips.push({ label: `Ciudad: ${city}`, href: `/propiedades${buildQS({ ...baseQS, city: "", page: "1" })}` });
  if (arsMin != null) chips.push({ label: `ARS min: ${arsMin.toLocaleString("es-AR")}`, href: `/propiedades${buildQS({ ...baseQS, ars_min: "", page: "1" })}` });
  if (arsMax != null) chips.push({ label: `ARS max: ${arsMax.toLocaleString("es-AR")}`, href: `/propiedades${buildQS({ ...baseQS, ars_max: "", page: "1" })}` });
  if (usdMin != null) chips.push({ label: `USD min: ${usdMin.toLocaleString("en-US")}`, href: `/propiedades${buildQS({ ...baseQS, usd_min: "", page: "1" })}` });
  if (usdMax != null) chips.push({ label: `USD max: ${usdMax.toLocaleString("en-US")}`, href: `/propiedades${buildQS({ ...baseQS, usd_max: "", page: "1" })}` });

  const pages = pageWindow(safePage, totalPages);

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "26px 16px 90px" }}>
      {/* HERO */}
      <div
        className="card"
        style={{
          padding: 18,
          borderRadius: 18,
          border: "1px solid #eee",
          background: "radial-gradient(1000px 420px at 50% 0%, rgba(0,0,0,.06), transparent 55%), #fff",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div className="small" style={{ opacity: 0.7 }}>
            Propiedades • Fotos, video y contacto directo
          </div>

          <h1 style={{ margin: 0, letterSpacing: -0.8, lineHeight: 1.05 }}>
            Propiedades disponibles
            <br />
            <span style={{ opacity: 0.78 }}>Encontrá tu próxima casa con asesoría real.</span>
          </h1>

          {/* FILTROS */}
          <form
            action="/propiedades"
            method="GET"
            className="card"
            style={{
              padding: 12,
              borderRadius: 14,
              display: "grid",
              gap: 10,
              border: "1px solid #eee",
              background: "white",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10 }}>
              <input
                className="input"
                name="q"
                placeholder="Buscar por título, barrio o ciudad…"
                defaultValue={toStr(searchParams?.q)}
              />

              <select className="input" name="op" defaultValue={toStr(searchParams?.op) || ""}>
                <option value="">Operación (todas)</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="temporario">Temporario</option>
              </select>

              <select className="input" name="type" defaultValue={toStr(searchParams?.type) || ""}>
                <option value="">Tipo (todos)</option>
                <option value="casa">Casa</option>
                <option value="depto">Departamento</option>
                <option value="quinta">Quinta</option>
                <option value="local">Local</option>
                <option value="terreno">Terreno</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input className="input" name="city" placeholder="Ciudad (opcional)" defaultValue={toStr(searchParams?.city)} style={{ width: 240 }} />

              <input className="input" name="ars_min" placeholder="ARS mín." defaultValue={toStr(searchParams?.ars_min)} style={{ width: 130 }} />
              <input className="input" name="ars_max" placeholder="ARS máx." defaultValue={toStr(searchParams?.ars_max)} style={{ width: 130 }} />

              <input className="input" name="usd_min" placeholder="USD mín." defaultValue={toStr(searchParams?.usd_min)} style={{ width: 130 }} />
              <input className="input" name="usd_max" placeholder="USD máx." defaultValue={toStr(searchParams?.usd_max)} style={{ width: 130 }} />

              <select className="input" name="sort" defaultValue={sort} style={{ width: 210 }}>
                <option value="recent">Ordenar: más recientes</option>
                <option value="ars_asc">Precio ARS: menor a mayor</option>
                <option value="ars_desc">Precio ARS: mayor a menor</option>
                <option value="usd_asc">Precio USD: menor a mayor</option>
                <option value="usd_desc">Precio USD: mayor a menor</option>
              </select>

              {/* reset página al filtrar */}
              <input type="hidden" name="page" value="1" />

              <button className="btn btnPrimary" type="submit">
                Buscar
              </button>

              <Link className="btn" href="/propiedades">
                Limpiar
              </Link>

              <div className="small" style={{ marginLeft: "auto", opacity: 0.7 }}>
                {total} resultado{total === 1 ? "" : "s"} • Página {safePage} / {totalPages}
              </div>
            </div>

            {chips.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {chips.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="small"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid #eee",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: "#fafafa",
                      fontWeight: 700,
                    }}
                    title="Quitar filtro"
                  >
                    ✕ {c.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </form>
        </div>
      </div>

      {/* LISTADO */}
      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Resultados</h2>
            <div className="small" style={{ opacity: 0.65 }}>
              Seleccioná una publicación para ver detalle y consultar.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" href="/">
              Inicio
            </Link>
            <Link className="btn btnPrimary" href="/publicar">
              Publicar propiedad
            </Link>
          </div>
        </div>

        {propsErr ? (
          <div className="card" style={{ padding: 14, marginTop: 12, border: "1px solid #fecaca" }}>
            <div style={{ color: "crimson", fontWeight: 900 }}>❌ Error cargando propiedades</div>
            <div className="small" style={{ opacity: 0.75 }}>{propsErr.message}</div>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 900 }}>No hay propiedades para esos filtros</div>
            <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
              Probá aflojar filtros o limpiar búsqueda.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {pageItems.map((p) => {
                const coverUrl = mediaMap.get(p.id)?.coverUrl ?? null;
                const hasVideo = mediaMap.get(p.id)?.hasVideo ?? false;
                const isNew = isRecent(p.published_at || p.created_at, 10);

                return (
                  <PropertyCard
                    key={p.id}
                    property={{
                      id: p.id,
                      title: p.title,
                      city: p.city,
                      neighborhood: p.neighborhood,
                      operation: p.operation,
                      type: p.type,
                      price_ars: p.price_ars,
                      price_usd: p.price_usd,
                      coverUrl,
                      hasVideo,
                      isNew,
                    }}
                  />
                );
              })}
            </div>

            {/* PAGINACIÓN */}
            <div
              className="card"
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                className="btn"
                href={`/propiedades${prevHref}`}
                style={{ opacity: safePage <= 1 ? 0.5 : 1, pointerEvents: safePage <= 1 ? "none" : "auto" }}
              >
                ← Anterior
              </Link>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="small" style={{ opacity: 0.6, padding: "0 6px" }}>
                      …
                    </span>
                  ) : (
                    <Link
                      key={p}
                      className="btn"
                      href={`/propiedades${buildQS({ ...baseQS, page: String(p) })}`}
                      style={{
                        fontWeight: p === safePage ? 900 : 700,
                        border: p === safePage ? "1px solid #111" : undefined,
                        opacity: p === safePage ? 1 : 0.9,
                      }}
                    >
                      {p}
                    </Link>
                  )
                )}
              </div>

              <Link
                className="btn"
                href={`/propiedades${nextHref}`}
                style={{ opacity: safePage >= totalPages ? 0.5 : 1, pointerEvents: safePage >= totalPages ? "none" : "auto" }}
              >
                Siguiente →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <section
        className="card"
        style={{
          padding: 16,
          marginTop: 18,
          borderRadius: 18,
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 950 }}>¿Querés vender o alquilar tu propiedad?</div>
          <div className="small" style={{ opacity: 0.7 }}>
            Publicala en minutos y la revisamos para salir online.
          </div>
        </div>
        <Link className="btn btnPrimary" href="/publicar">
          Publicar ahora
        </Link>
      </section>
    </main>
  );
}
