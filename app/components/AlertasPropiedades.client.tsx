"use client";
import { useState } from "react";

export default function AlertasPropiedades() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    operation: "ambas", type_name: "", price_max: "", zones: "",
  });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/property-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      alert("Error al guardar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    border: "1.5px solid #e5e7eb", fontSize: 14,
    boxSizing: "border-box" as const,
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 18px", borderRadius: 10,
          background: "#2D3134", color: "#fff", border: "none",
          cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}
      >
        🔔 Recibir alertas
      </button>

      {open && (
        <div onClick={e => e.target === e.currentTarget && setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "grid", placeItems: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
            maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ padding: "24px 24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>Alertas de propiedades</h2>
                <button onClick={() => setOpen(false)} style={{ background: "none", border: "none",
                  fontSize: 20, cursor: "pointer", color: "#aaa" }}>×</button>
              </div>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
                Te avisamos cuando entre una propiedad que te interese.
              </p>
            </div>

            {sent ? (
              <div style={{ padding: "24px 24px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>¡Alerta creada!</div>
                <p style={{ color: "#666", fontSize: 14 }}>
                  Te notificaremos cuando entre una propiedad que coincida con tu búsqueda.
                </p>
                <button onClick={() => setOpen(false)}
                  style={{ marginTop: 16, padding: "10px 28px", borderRadius: 10, border: "1.5px solid #ddd",
                    background: "#fff", cursor: "pointer", fontWeight: 700 }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>Nombre *</label>
                    <input value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Tu nombre" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>WhatsApp</label>
                    <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="2954 000000" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>Email</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="tucorreo@email.com" style={inputStyle} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>Operación</label>
                    <select value={form.operation} onChange={e => set("operation", e.target.value)} style={inputStyle}>
                      <option value="ambas">Venta y alquiler</option>
                      <option value="venta">Solo venta</option>
                      <option value="alquiler">Solo alquiler</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>Tipo</label>
                    <select value={form.type_name} onChange={e => set("type_name", e.target.value)} style={inputStyle}>
                      <option value="">Cualquier tipo</option>
                      {["Casa", "Departamento", "Terreno", "Local", "Quinta", "Campo"].map(t =>
                        <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>
                    Precio máximo (ARS, opcional)
                  </label>
                  <input type="number" value={form.price_max} onChange={e => set("price_max", e.target.value)}
                    placeholder="Ej: 50000000" style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>
                    Zona / Barrio preferido (opcional)
                  </label>
                  <input value={form.zones} onChange={e => set("zones", e.target.value)}
                    placeholder="Ej: Centro, Villa del Parque..." style={inputStyle} />
                </div>

                <button type="submit" disabled={!form.name || loading}
                  style={{ padding: "12px 0", borderRadius: 12, background: "#2D3134",
                    color: "#fff", border: "none", cursor: "pointer", fontWeight: 800,
                    fontSize: 15, marginTop: 4 }}>
                  {loading ? "Guardando…" : "🔔 Activar alerta"}
                </button>

                <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", margin: 0 }}>
                  No compartimos tus datos con terceros.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
