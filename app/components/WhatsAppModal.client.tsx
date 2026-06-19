"use client";
import { useState } from "react";

const WA_NUMBER = "5492954228356";
const BUSINESS_START = 9;
const BUSINESS_END = 20;

function isBusinessHours() {
  const now = new Date();
  // Argentina (UTC-3)
  const ar = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const h = ar.getHours();
  const day = ar.getDay(); // 0=dom, 6=sab
  if (day === 0) return false; // domingo cerrado
  return h >= BUSINESS_START && h < BUSINESS_END;
}

export default function WhatsAppModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [offHours, setOffHours] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const open = isBusinessHours();
    setOffHours(!open);
    setSent(true);

    const texto = open
      ? `Hola, mi nombre es ${name}${phone ? `, mi telÃ©fono es ${phone}` : ""}. ${message}`
      : `Hola, mi nombre es ${name}${phone ? `, mi telÃ©fono es ${phone}` : ""}. ${message}\n\n_(EnvÃ­o fuera de horario comercial)_`;

    setTimeout(() => {
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texto)}`, "_blank");
    }, 1800);
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        width: "100vw", height: "100vh",
        zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #2D3134 0%, #3d4449 100%)",
          padding: "24px 24px 20px", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.12)", border: "none",
            color: "#fff", width: 30, height: 30, borderRadius: "50%",
            cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center",
          }}>Ã—</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/logo.svg" alt="Pino Galant" style={{ width: 52, height: 52, flexShrink: 0 }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>Pino Galant</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 2 }}>Negocios Inmobiliarios</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: isBusinessHours() ? "#4ade80" : "#f59e0b", display: "block" }} />
                <span style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>
                  {isBusinessHours() ? "En lÃ­nea Â· Lun a SÃ¡b 9 a 20 hs" : "Fuera de horario Â· Lun a SÃ¡b 9 a 20 hs"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleSend} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              CompletÃ¡ el formulario y te contactaremos a la brevedad. PodÃ©s consultarnos sobre cualquier propiedad.
            </p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 5 }}>
                Nombre completo *
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)} required
                placeholder="Ej: Juan GarcÃ­a"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 5 }}>
                TelÃ©fono / WhatsApp
              </label>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Ej: 2954 000000"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 5 }}>
                Â¿En quÃ© podemos ayudarte? *
              </label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)} required rows={3}
                placeholder="Ej: Estoy interesado en conocer propiedades en venta en Santa Rosa..."
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none",
                  resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>
            <button type="submit" style={{
              background: "#25D366", color: "#fff", border: "none",
              padding: "13px 0", borderRadius: 12, fontWeight: 800,
              fontSize: 15, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.529 5.845L.057 23.535a.75.75 0 0 0 .908.908l5.69-1.472A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.501-5.254-1.378l-.374-.217-3.882 1.004 1.003-3.882-.217-.374A9.953 9.953 0 0 1 2 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"/>
              </svg>
              Enviar consulta por WhatsApp
            </button>
            <p style={{ margin: 0, fontSize: 11, color: "#aaa", textAlign: "center" }}>
              Al continuar, serÃ¡s redirigido a WhatsApp con tu mensaje listo para enviar.
            </p>
          </form>
        ) : (
          <div style={{ padding: 32, textAlign: "center" }}>
            {offHours ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 16 }}>ðŸŒ™</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: "#2D3134" }}>
                  Recibimos tu consulta
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Hola <strong>{name}</strong>, gracias por contactarte con <strong>Pino Galant</strong>.<br /><br />
                  En este momento nuestra oficina se encuentra cerrada. Nuestro horario de atenciÃ³n es de <strong>lunes a sÃ¡bado de 9:00 a 20:00 hs</strong>.<br /><br />
                  Tu consulta fue recibida y serÃ¡ atendida por uno de nuestros asesores en el primer turno disponible. PodÃ©s enviar el mensaje igualmente y te respondemos a la brevedad.
                </p>
                <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700 }}>Abriendo WhatsAppâ€¦</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 16 }}>âœ…</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: "#2D3134" }}>
                  Â¡Listo, {name.split(" ")[0]}!
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Tu consulta estÃ¡ lista para enviar. Te redirigimos a WhatsApp en un momento.
                </p>
                <div style={{ fontSize: 12, color: "#25D366", fontWeight: 700 }}>Abriendo WhatsAppâ€¦</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
