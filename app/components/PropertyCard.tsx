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

export default function PropertyCard({ property }: PropertyCardProps) {
  const {
    id,
    title,
    city,
    neighborhood,
    operation,
    type,
    price_ars,
    price_usd,
    coverUrl,
  } = property;

  return (
    <article
      className="property-card"
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid #eee",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Imagen */}
      <Link href={`/propiedades/${id}`} style={{ textDecoration: "none" }}>
        <div style={{ aspectRatio: "4 / 3", background: "#f3f4f6" }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title ?? "Propiedad"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
              Sin imagen
            </div>
          )}
        </div>
      </Link>

      {/* Contenido */}
      <div style={{ padding: 16, display: "grid", gap: 8, flexGrow: 1 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          {[neighborhood, city].filter(Boolean).join(", ")}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>{operation} · {type}</div>
          <div>
            {price_ars && <>ARS {Number(price_ars).toLocaleString()}</>}
            {price_usd && <>USD {Number(price_usd).toLocaleString()}</>}
          </div>
        </div>
      </div>

      {/* ACCIONES */}
      <div style={{ display: "flex", gap: 10, padding: 16 }}>
        <Link href={`/propiedades/${id}`} className="btn" style={{ flex: 1 }}>
          Ver detalle
        </Link>

        {/* ✅ ESTE ES EL LINK CORRECTO */}
        <Link
          href={`/propiedades/${id}/consultar`}
          className="btn btnPrimary"
          style={{ flex: 1 }}
        >
          Dejar consulta
        </Link>
      </div>
    </article>
  );
}
