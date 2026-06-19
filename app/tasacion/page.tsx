import TasacionForm from "./TasacionForm.client";

export const metadata = {
  title: "Tasación gratuita de propiedades en Santa Rosa, La Pampa",
  description:
    "Solicitá una tasación gratuita de tu propiedad en Santa Rosa y La Pampa. Nuestros agentes te dan un valor actualizado del mercado inmobiliario pampeano.",
  keywords: ["tasación inmueble La Pampa", "valuar propiedad Santa Rosa", "cuánto vale mi casa La Pampa"],
  alternates: { canonical: "https://pinogalant.com.ar/tasacion" },
};

export default function TasacionPage() {
  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "48px 16px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, letterSpacing: 2,
          textTransform: "uppercase", marginBottom: 10 }}>
          Servicio gratuito
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, margin: "0 0 12px" }}>
          Tasación online
        </h1>
        <p style={{ color: "#666", fontSize: 16, lineHeight: 1.7, margin: 0 }}>
          Completá los datos de tu propiedad y recibís una estimación de valor de referencia
          directamente por WhatsApp, sin costo y sin compromiso.
        </p>
      </div>

      <TasacionForm />

      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { icon: "⚡", title: "Rápido", desc: "Respuesta en menos de 24 hs hábiles" },
          { icon: "🎯", title: "Preciso", desc: "Basado en valores reales del mercado local" },
          { icon: "🤝", title: "Sin compromiso", desc: "Gratuito, sin obligación de vender con nosotros" },
        ].map(c => (
          <div key={c.title} style={{ textAlign: "center", padding: "20px 12px",
            background: "#fff", border: "1px solid #eee", borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
