import Link from "next/link";
import { getAllTokkoProperties, tokkoPrice, tokkoOperation, tokkoType, tokkoCover } from "@/lib/tokko";

export default async function PropiedadesSimilares({
  currentId, operation, typeId,
}: {
  currentId: number;
  operation: string;
  typeId: number;
}) {
  let similares: any[] = [];
  try {
    const all = await getAllTokkoProperties();
    similares = all
      .filter(p =>
        p.id !== currentId &&
        tokkoOperation(p) === operation &&
        (p.type?.id === typeId || true) // mismo tipo preferido pero no excluyente
      )
      .filter(p => p.type?.id === typeId || similares.length < 3)
      .slice(0, 3);

    // Si no hay del mismo tipo, tomar del mismo operation
    if (similares.length === 0) {
      similares = all.filter(p => p.id !== currentId && tokkoOperation(p) === operation).slice(0, 3);
    }
  } catch {
    return null;
  }

  if (similares.length === 0) return null;

  return (
    <section style={{ marginTop: 48, paddingTop: 40, borderTop: "1px solid #eee" }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: "#2D3134", margin: "0 0 20px" }}>
        Propiedades similares
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {similares.map(p => {
          const cover = tokkoCover(p);
          const price = tokkoPrice(p);
          const op = tokkoOperation(p);
          const type = tokkoType(p);

          return (
            <Link key={p.id} href={`/propiedades/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <article style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden",
                transition: "box-shadow .2s" }}>
                <div style={{ position: "relative", height: 180 }}>
                  {cover ? (
                    <img src={cover} alt={p.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#F3EDE7", display: "grid", placeItems: "center", fontSize: 40 }}>🏠</div>
                  )}
                  <span style={{ position: "absolute", top: 10, left: 10, background: op === "venta" ? "#2D3134" : "#B48A73",
                    color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase" }}>
                    {op === "venta" ? "Venta" : "Alquiler"}
                  </span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>{type}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.address}
                  </div>
                  {price && (
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#2D3134" }}>
                      {price.currency === "USD" ? "USD" : "$"} {price.amount.toLocaleString("es-AR")}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
