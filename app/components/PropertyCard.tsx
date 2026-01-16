import Link from "next/link";

type PropertyCardData = {
  id: string;
  title?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  operation?: string | null;
  type?: string | null;
  price_ars?: string | number | null;
  price_usd?: string | number | null;
  coverUrl?: string | null;
  hasVideo?: boolean | null;
  isNew?: boolean | null;
};

function formatARS(v: string | number | null | undefined) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("es-AR");
}

function formatUSD(v: string | number | null | undefined) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("en-US");
}

export default function PropertyCard({ property }: { property: PropertyCardData }) {
  if (!property?.id) return null;

  const subtitle = [property.neighborhood, property.city].filter(Boolean).join(" • ");
  const priceARS = formatARS(property.price_ars);
  const priceUSD = formatUSD(property.price_usd);

  const opLabel = (property.operation ?? "").trim();
  const typeLabel = (property.type ?? "").trim();

  return (
    <Link
      href={`/propiedades/${property.id}`}
      className="card"
      style={{
        textDecoration: "none",
        color: "inherit",
        padding: 12,
        display: "grid",
        gap: 10,
        borderRadius: 16,
        transition: "transform .12s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 200,
          borderRadius: 14,
          background: "#f3f4f6",
          overflow: "hidden",
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* BADGES */}
        <div style={{ position: "absolute", left: 10, top: 10, display: "flex", gap: 8, zIndex: 2, flexWrap: "wrap" }}>
          {opLabel || typeLabel ? (
            <span
              className="small"
              style={{
                background: "rgba(17,17,17,.78)",
                color: "white",
                padding: "5px 10px",
                borderRadius: 999,
                fontWeight: 900,
                letterSpacing: 0.2,
                textTransform: "uppercase",
              }}
            >
              {opLabel || "—"}
              {typeLabel ? ` · ${typeLabel}` : ""}
            </span>
          ) : null}

          {property.hasVideo ? (
            <span
              className="small"
              style={{
                background: "rgba(16,185,129,.92)",
                color: "white",
                padding: "5px 10px",
                borderRadius: 999,
                fontWeight: 900,
              }}
              title="Incluye video"
            >
              🎥 Video
            </span>
          ) : null}

          {property.isNew ? (
            <span
              className="small"
              style={{
                background: "rgba(59,130,246,.92)",
                color: "white",
                padding: "5px 10px",
                borderRadius: 999,
                fontWeight: 900,
              }}
              title="Publicación reciente"
            >
              🆕 Nuevo
            </span>
          ) : null}
        </div>

        {property.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.coverUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="small" style={{ opacity: 0.6 }}>
            Sin foto
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 950, letterSpacing: -0.2 }}>
          {property.title ?? "Propiedad"}
        </div>

        <div className="small" style={{ opacity: 0.75 }}>
          {subtitle || "—"}
        </div>

        <div className="small" style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          {priceARS ? <b>${priceARS} ARS</b> : null}
          {priceUSD ? <span style={{ opacity: 0.7 }}>USD {priceUSD}</span> : null}
        </div>

        <div className="small" style={{ opacity: 0.65 }}>
          Ver detalle →
        </div>
      </div>
    </Link>
  );
}
