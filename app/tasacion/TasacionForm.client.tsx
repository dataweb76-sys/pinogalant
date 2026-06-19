"use client";
import { useState } from "react";

const WA = "5492954228356";

const TIPOS = ["Casa", "Departamento", "Terreno", "Local comercial", "Oficina", "Quinta / Campo", "PH", "Otro"];
const ZONAS = ["Centro", "Macrocentro", "Villa del Parque", "Avellaneda", "Castelar", "Barrio Norte", "Zona sur", "Zona norte", "Otro"];
const ESTADOS = ["Excelente", "Muy bueno", "Bueno", "Regular", "A refaccionar"];

export default function TasacionForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    tipo: "", zona: "", superficie: "", ambientes: "", estado: "", extras: "",
    nombre: "", telefono: "",
  });
  const [sent, setSent] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = `Hola Pino Galant! Quiero una tasación de mi propiedad:

🏠 *Tipo:* ${form.tipo}
📍 *Zona:* ${form.zona}
📐 *Superficie:* ${form.superficie} m²
🚪 *Ambientes:* ${form.ambientes}
✨ *Estado:* ${form.estado}
${form.extras ? `📝 *Extras:* ${form.extras}\n` : ""}
👤 *Mi nombre:* ${form.nombre}
📱 *Teléfono:* ${form.telefono}`;

    setSent(true);
    setTimeout(() => {
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
    }, 1000);
  }

  const BRONCE = "#B48A73";
  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const, fontFamily: "inherit",
  };
  const btnStyle = (active: boolean) => ({
    padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${active ? BRONCE : "#e5e7eb"}`,
    background: active ? BRONCE : "#fff", color: active ? "#fff" : "#555",
    cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left" as const,
  });

  if (sent) return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 20, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>¡Listo, {form.nombre.split(" ")[0]}!</div>
      <p style={{ color: "#666", lineHeight: 1.7 }}>
        Te estamos redirigiendo a WhatsApp con todos los datos.<br />
        Un asesor de Pino Galant te contactará a la brevedad.
      </p>
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 20, padding: 32 }}>

      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 999,
            background: s <= step ? BRONCE : "#eee", transition: "background .3s" }} />
        ))}
      </div>

      <form onSubmit={handleSend}>

        {/* STEP 1: Datos de la propiedad */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900 }}>Datos de la propiedad</h2>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 8 }}>
                Tipo de propiedad *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TIPOS.map(t => (
                  <button key={t} type="button" onClick={() => set("tipo", t)} style={btnStyle(form.tipo === t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 8 }}>
                Zona / Barrio *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ZONAS.map(z => (
                  <button key={z} type="button" onClick={() => set("zona", z)} style={btnStyle(form.zona === z)}>
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" disabled={!form.tipo || !form.zona}
              onClick={() => setStep(2)}
              style={{ padding: "13px 0", borderRadius: 12, background: (!form.tipo || !form.zona) ? "#eee" : "#2D3134",
                color: (!form.tipo || !form.zona) ? "#aaa" : "#fff", border: "none",
                cursor: (!form.tipo || !form.zona) ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 15 }}>
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 2: Características */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900 }}>Características</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
                  Superficie total (m²) *
                </label>
                <input type="number" value={form.superficie} onChange={e => set("superficie", e.target.value)}
                  placeholder="Ej: 120" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
                  Ambientes
                </label>
                <select value={form.ambientes} onChange={e => set("ambientes", e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {["1", "2", "3", "4", "5", "6+"].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 8 }}>
                Estado de la propiedad *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ESTADOS.map(e => (
                  <button key={e} type="button" onClick={() => set("estado", e)} style={btnStyle(form.estado === e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
                Extras (opcional)
              </label>
              <textarea value={form.extras} onChange={e => set("extras", e.target.value)}
                placeholder="Cochera, pileta, jardín, baulera, vista panorámica..."
                rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setStep(1)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #ddd",
                  background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                ← Atrás
              </button>
              <button type="button" disabled={!form.superficie || !form.estado}
                onClick={() => setStep(3)}
                style={{ flex: 2, padding: "11px 0", borderRadius: 12,
                  background: (!form.superficie || !form.estado) ? "#eee" : "#2D3134",
                  color: (!form.superficie || !form.estado) ? "#aaa" : "#fff", border: "none",
                  cursor: (!form.superficie || !form.estado) ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 15 }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Datos de contacto */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900 }}>Tus datos</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
              Para enviarte la tasación por WhatsApp.
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
                Nombre *
              </label>
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                placeholder="Tu nombre completo" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
                WhatsApp *
              </label>
              <input type="tel" value={form.telefono} onChange={e => set("telefono", e.target.value)}
                placeholder="Ej: 2954 000000" required style={inputStyle} />
            </div>

            <div style={{ background: "#F3EDE7", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: BRONCE, marginBottom: 6 }}>Resumen</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                {form.tipo} · {form.zona} · {form.superficie} m² · {form.estado}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setStep(2)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #ddd",
                  background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                ← Atrás
              </button>
              <button type="submit" disabled={!form.nombre || !form.telefono}
                style={{ flex: 2, padding: "13px 0", borderRadius: 12, background: "#25D366",
                  color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                💬 Enviar por WhatsApp
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
