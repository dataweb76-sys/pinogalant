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

  const pageSize = 12;
  const page = Math.max(1, Number(toStr(searchParams?.page) || "1") || 1);

  // 1) Traemos un lote razonable (para poder filtrar + paginar bien)
  //    (Si querés, luego lo optimizamos con SQL puro y casts)
  const { data: rawProps, error: propsErr } = await admin
    .from("properties")
    .select("id,title,city,neighborhood,operation,type,price_ars,price_usd,is_published,status,published_at,created_at")
    .or("is_published.eq.true,status.eq.publicada")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  let props: PropertyRow[] = (rawProps as any as PropertyRow[]) ?? [];

  // 2) Filtros (en memoria, por robustez con strings/números)
  if (op) props = props.filter((p) => norm(p.operation ?? "") === op);
  if (type) props = props.filter((p) => norm(p.type ?? "") === type);
  if (city) props = props.filter((p) => (p.city ?? "").toLowerCase().includes(city.toLowerCase()));

  if (q) {
    props = props.filter((p) => {
      const hay = `${p.title ?? ""} ${p.city ?? ""} ${p.neighborhood ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (arsMin != null) {
    props = props.filter((p) => {
      const v = toNum(p.price_ars);
      return v != null ? v >= arsMin : false;
    });
  }
  if (arsMax != null) {
    props = props.filter((p) => {
      const v = toNum(p.price_ars);
      return v != null ? v <= arsMax : false;
    });
  }

  if (usdMin != null) {
    props = props.filter((p) => {
      const v = toNum(p.price_usd);
      return v != null ? v >= usdMin : false;
    });
  }
  if (usdMax != null) {
    props = props.filter((p) => {
      const v = toNum(p.price_usd);
      return v != null ? v <= usdMax : false;
    });
  }

  // 3) Paginación final
  const total = props.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = props.slice(start, start + pageSize);

  // 4) Media (cover image + hasVideo)
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

  // QS base para paginación conservando filtros
  const baseQS = {
    q: toStr(searchParams?.q),
    op: toStr(searchParams?.op),
    type: toStr(searchParams?.type),
    city: toStr(searchParams?.city),
    ars_min: toStr(searchParams?.ars_min),
    ars_max: toStr(searchParams?.ars_max),
    usd_min: toStr(searchParams?.usd_min),
    usd_max: toStr(searchParams?.usd_max),
  };

  const prevHref = buildQS({ ...baseQS, page: String(Math.max(1, safePage - 1)) });
  const nextHref = buildQS({ ...baseQS, page: String(Math.min(totalPages, safePage + 1)) });

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "26px 16px 90px" }}>
      {/* HERO */}
      <div
        className="card"
        style={{
          padding: 18,
          borderRadius: 18,
          background: "linear-gradient(180deg, #fafafa 0%, #ffffff 70%)",
          border: "1px solid #eee",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div className="small" style={{ opacity: 0.7 }}>
            Propiedades • Selección destacada
          </div>

          <h1 style={{ margin: 0, letterSpacing: -0.7, lineHeight: 1.05 }}>
            Encontrá tu próxima propiedad
            <br />
            <span style={{ opacity: 0.85 }}>con asesoría real.</span>
          </h1>

          <div className="small" style={{ opacity: 0.7, maxWidth: 820 }}>
            Filtrá por operación, tipo, ciudad o precio. Si hay agentes online, te responden al toque desde el widget.
          </div>

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
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 10 }}>
              <input className="input" name="q" placeholder="Buscar por título, barrio o ciudad…" defaultValue={toStr(searchParams?.q)} />

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

              {/* siempre reseteamos a página 1 cuando filtra */}
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
          </form>
        </div>
      </div>

      {/* LISTADO */}
      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Propiedades disponibles</h2>
            <div className="small" style={{ opacity: 0.65 }}>
              Fotos reales, detalle claro y contacto directo.
            </div>
          </div>
          <Link className="btn" href="/">
            Volver al inicio
          </Link>
        </div>

        {propsErr ? (
          <div className="card" style={{ padding: 14, marginTop: 12, border: "1px solid #fecaca" }}>
            <div style={{ color: "crimson", fontWeight: 800 }}>❌ Error cargando propiedades</div>
            <div className="small" style={{ opacity: 0.75 }}>{propsErr.message}</div>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 800 }}>No hay propiedades para esos filtros</div>
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
              {pageItems.map((p) => (
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
                    coverUrl: mediaMap.get(p.id)?.coverUrl ?? null,
                    hasVideo: mediaMap.get(p.id)?.hasVideo ?? false,
                  }}
                />
              ))}
            </div>

            {/* PAGINACIÓN */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <Link
                className="btn"
                href={`/propiedades${prevHref}`}
                style={{ opacity: safePage <= 1 ? 0.5 : 1, pointerEvents: safePage <= 1 ? "none" : "auto" }}
              >
                ← Anterior
              </Link>

              <div className="small" style={{ opacity: 0.75, alignSelf: "center" }}>
                Página <b>{safePage}</b> de <b>{totalPages}</b>
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
          <div style={{ fontWeight: 900 }}>¿Querés publicar tu propiedad?</div>
          <div className="small" style={{ opacity: 0.7 }}>
            Cargala en minutos y la revisamos para publicarla.
          </div>
        </div>
        <Link className="btn btnPrimary" href="/publicar">
          Publicar ahora
        </Link>
      </section>
    </main>
  );
}
