import Link from "next/link";

type PropertyCardProps = {
  property: {
    id: string;
    title?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    operation?: string | null;
    type?: string | null;
    price_ars?: string | number | null;
    price_usd?: string | number | null;
    coverUrl?: string | null;
    coverKind?: "image" | "video" | null;
  };
};

const OPERATION_LABELS: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
};

const TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
  campo: "Campo",
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const { id, title, city, neighborhood, operation, type, price_ars, price_usd, coverUrl } = property;

  const operationLabel = operation ? (OPERATION_LABELS[operation] ?? operation) : null;
  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : null;
  const isSale = operation === "venta";

  return (
    <article className="prop-card">
      {/* Image */}
      <Link href={`/propiedades/${id}`} style={{ display: "block", position: "relative" }}>
        <div style={{ aspectRatio: "4/3", background: "#f3f4f6", position: "relative", overflow: "hidden" }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title ?? "Propiedad"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#bbb", fontSize: 13, flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 32 }}>🏠</span>
              <span>Sin imagen</span>
            </div>
          )}

          {/* Operation badge */}
          {operationLabel && (
            <span style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: isSale ? "#2D3134" : "#B48A73",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              padding: "5px 13px",
              borderRadius: 999,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}>
              {operationLabel}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: "18px 20px 14px", display: "flex", flexDirection: "column", gap: 8, flexGrow: 1 }}>
        {typeLabel && (
          <span style={{ fontSize: 11, fontWeight: 800, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1.2 }}>
            {typeLabel}
          </span>
        )}

        <Link href={`/propiedades/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a", lineHeight: 1.35 }}>
            {title}
          </div>
        </Link>

        <div style={{ fontSize: 13, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
          📍 {[neighborhood, city].filter(Boolean).join(", ") || "Ubicación no especificada"}
        </div>

        <div style={{ marginTop: 6 }}>
          {price_usd && (
            <div style={{ fontSize: 22, fontWeight: 900, color: "#2D3134", letterSpacing: -0.5 }}>
              USD {Number(price_usd).toLocaleString("es-AR")}
            </div>
          )}
          {price_ars && !price_usd && (
            <div style={{ fontSize: 22, fontWeight: 900, color: "#2D3134", letterSpacing: -0.5 }}>
              ARS {Number(price_ars).toLocaleString("es-AR")}
            </div>
          )}
          {price_ars && price_usd && (
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>
              ARS {Number(price_ars).toLocaleString("es-AR")}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
        <Link
          href={`/propiedades/${id}`}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "11px 0",
            borderRadius: 12,
            border: "1.5px solid #2D3134",
            color: "#2D3134",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Ver detalle
        </Link>
        <Link
          href={`/propiedades/${id}/consultar`}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "11px 0",
            borderRadius: 12,
            background: "#B48A73",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Consultar
        </Link>
      </div>
    </article>
  );
}
