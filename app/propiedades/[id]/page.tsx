import Link from "next/link";
import { notFound } from "next/navigation";
import GallerySlider from "./GallerySlider";
import WALeadButton from "@/app/components/WALeadButton.client";
import MortgageCalc from "@/app/components/MortgageCalc.client";
import PropiedadesSimilares from "@/app/components/PropiedadesSimilares";
import {
  getTokkoProperty,
  getAllTokkoProperties,
  tokkoPrice,
  tokkoOperation,
  tokkoType,
  tokkoLocation,
} from "@/lib/tokko";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const revalidate = 300;
export const preferredRegion = ["gru1"];

export async function generateStaticParams() {
  try {
    const props = await getAllTokkoProperties();
    return props.map((p) => ({ id: String(p.id) }));
  } catch {
    return [];
  }
}

function fmt(amount: number, currency: string) {
  if (currency === "USD") return `USD ${amount.toLocaleString("es-AR")}`;
  return `$ ${amount.toLocaleString("es-AR")}`;
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const p = await getTokkoProperty(params.id);
  if (!p) notFound();

  const price   = tokkoPrice(p);
  const op      = tokkoOperation(p);
  const type    = tokkoType(p);
  const loc     = tokkoLocation(p);
  const photos  = p.photos ?? [];

  // Agente: primero busca asignación en Supabase, fallback al producer de Tokko
  let agent: { name: string; phone: string; photo: string | null; position: string } | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: assignment } = await admin
      .from("tokko_agent_assignments")
      .select("agents(name, phone, photo_url, position)")
      .eq("tokko_id", p.id)
      .maybeSingle();
    const a = (assignment as any)?.agents;
    if (a) {
      agent = { name: a.name, phone: a.phone ?? "", photo: a.photo_url ?? null, position: a.position ?? "Agente" };
    }
  } catch {}

  if (!agent && p.producer) {
    agent = {
      name: p.producer.name,
      phone: p.producer.cellphone || p.producer.phone || "",
      photo: p.producer.picture?.includes("user.png") ? null : p.producer.picture,
      position: "Agente",
    };
  }

  const rawPhone = agent?.phone?.replace(/\D/g, "") ?? "";
  const waNumber = rawPhone.startsWith("54") ? rawPhone
    : rawPhone ? `54${rawPhone}`
    : process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP ?? "";
  const waMsg = encodeURIComponent(`Hola${agent ? ` ${agent.name.split(" ")[0]}` : ""}! Vi la propiedad en ${p.address} y me interesa. ¿Podés contarme más?`);

  const hasGeo = p.geo_lat && p.geo_long && p.geo_lat !== "0" && p.geo_long !== "0";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 80px" }}>

      {/* BREADCRUMB */}
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 16, display: "flex", gap: 6 }}>
        <Link href="/" style={{ color: "#aaa", textDecoration: "none" }}>Inicio</Link>
        <span>›</span>
        <Link href="/propiedades" style={{ color: "#aaa", textDecoration: "none" }}>Propiedades</Link>
        <span>›</span>
        <span style={{ color: "#555" }}>{p.address}</span>
      </div>

      {/* GALERÍA */}
      <GallerySlider photos={photos} address={p.address} />

      <style>{`
        .detail-grid { display: grid; grid-template-columns: 1fr; gap: 20; align-items: start; }
        @media (min-width: 768px) { .detail-grid { grid-template-columns: 1fr 320px; gap: 28px; } }
        .detail-sidebar { display: flex; flex-direction: column; gap: 14px; }
        @media (min-width: 768px) { .detail-sidebar { position: sticky; top: 20px; } }
      `}</style>
      <div className="detail-grid">

        {/* COLUMNA IZQUIERDA */}
        <div>
          {/* Badges */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ background: op === "venta" ? "#2D3134" : "#B48A73", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 999, textTransform: "uppercase" }}>
              {op === "venta" ? "Venta" : "Alquiler"}
            </span>
            <span style={{ background: "#F3EDE7", color: "#B48A73", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 999 }}>
              {type}
            </span>
          </div>

          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>
            {p.address}
          </h1>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
            📍 {[loc.neighborhood, loc.city].filter(Boolean).join(", ") || "Santa Rosa, La Pampa"}
          </div>

          {/* Precio */}
          {price && (
            <div style={{ fontSize: 32, fontWeight: 900, color: "#2D3134", letterSpacing: -1, marginBottom: 24 }}>
              {fmt(price.amount, price.currency)}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 28 }}>
            {p.bathroom_amount > 0 && <Stat icon="🚿" label="Baños" value={p.bathroom_amount} />}
            {(p.rooms_amount ?? 0) > 0 && <Stat icon="🛏" label="Ambientes" value={p.rooms_amount} />}
            {(p.suite_amount ?? 0) > 0 && <Stat icon="🛏" label="Dormitorios" value={p.suite_amount} />}
            {(p.parking_lot_amount ?? 0) > 0 && <Stat icon="🚗" label="Cochera" value={p.parking_lot_amount} />}
            {p.roofed_surface && p.roofed_surface !== "0.00" && (
              <Stat icon="📐" label="Cubierta" value={`${parseFloat(p.roofed_surface)} m²`} />
            )}
            {p.total_surface && p.total_surface !== "0.00" && (
              <Stat icon="📏" label="Total" value={`${parseFloat(p.total_surface)} m²`} />
            )}
          </div>

          {/* Descripción */}
          {p.description && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Descripción</h2>
              <div style={{ color: "#555", lineHeight: 1.7, fontSize: 15, whiteSpace: "pre-line" }}>
                {p.description}
              </div>
            </div>
          )}

          {/* Mapa */}
          {hasGeo && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Ubicación</h2>
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #eee" }}>
                <iframe
                  width="100%"
                  height="280"
                  loading="lazy"
                  style={{ display: "block" }}
                  src={`https://maps.google.com/maps?q=${p.geo_lat},${p.geo_long}&z=15&output=embed`}
                />
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA — sticky en desktop */}
        <div className="detail-sidebar">

          {/* Card agente */}
          {agent && (
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Agente responsable
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                {agent.photo ? (
                  <img src={agent.photo} alt={agent.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #F3EDE7" }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F3EDE7", display: "grid", placeItems: "center", fontSize: 22 }}>
                    👤
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{agent.name}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>Pino Galant</div>
                </div>
              </div>
              <WALeadButton
                waNumber={waNumber}
                waMsg={waMsg}
                propertyId={p.id}
                propertyAddress={p.address}
                agentName={agent.name}
                agentPhone={agent.phone}
                source="property_detail"
                style={{
                  display: "block", width: "100%", textAlign: "center", padding: "13px 0",
                  borderRadius: 12, background: "#25D366", color: "#fff",
                  fontWeight: 800, fontSize: 15, cursor: "pointer", border: "none",
                }}
              >
                💬 Consultar por WhatsApp
              </WALeadButton>
            </div>
          )}

          {/* Formulario de consulta */}
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Dejar una consulta</div>
            <form action="/api/consultas" method="POST" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="hidden" name="property_id" value={String(p.id)} />
              <input type="hidden" name="property_address" value={p.address} />
              <input className="input" name="name" placeholder="Tu nombre" required />
              <input className="input" name="email" type="email" placeholder="Email" required />
              <input className="input" name="phone" placeholder="Teléfono / WhatsApp" />
              <textarea className="input" name="message" rows={3} placeholder="Tu mensaje…"
                defaultValue={`Hola, me interesa la propiedad en ${p.address}.`} />
              <button className="btn btnPrimary" type="submit">Enviar consulta</button>
            </form>
          </div>

          {/* Calculadora hipotecaria — solo en ventas */}
          {op === "venta" && price && (
            <MortgageCalc priceUSD={price.currency === "USD" ? price.amount : undefined} />
          )}

          <Link href="/propiedades" className="btn" style={{ textAlign: "center" }}>
            ← Volver al listado
          </Link>
        </div>
      </div>

      {/* Propiedades similares */}
      <PropiedadesSimilares currentId={p.id} operation={op} typeId={p.type?.id ?? 0} />

    </main>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: any }) {
  return (
    <div style={{ background: "#F9F6F3", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#2D3134" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{label}</div>
    </div>
  );
}
