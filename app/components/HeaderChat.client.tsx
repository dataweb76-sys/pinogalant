"use client";

import { useEffect, useRef, useState } from "react";

type Agent = {
  user_id: string;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  email: string | null;
  last_seen: string;
};

const FAQS = [
  {
    q: "¿Cómo organizo una visita a una propiedad?",
    a: "Podés coordinar una visita directamente por WhatsApp o desde la página de la propiedad haciendo clic en \"Consultar\". Te confirmamos día y horario en menos de 24 hs.",
  },
  {
    q: "¿Dónde están ubicadas las oficinas?",
    a: "Nuestras oficinas están en Av. Ejemplo 1234, Ciudad. Atendemos de lunes a viernes de 9 a 18 hs y sábados de 9 a 13 hs.",
  },
  {
    q: "¿Cuál es el horario de atención?",
    a: "Lunes a viernes de 9:00 a 18:00 hs. Sábados de 9:00 a 13:00 hs. Fuera de ese horario podés escribirnos por WhatsApp y te respondemos a la brevedad.",
  },
  {
    q: "¿Cuánto cobran de comisión?",
    a: "Para alquileres, la comisión equivale a un mes de alquiler (IVA incluido), abonado en partes iguales entre locador y locatario. Para compraventas, aplicamos el 3% sobre el valor de la operación por cada parte.",
  },
  {
    q: "¿Qué documentación necesito para alquilar?",
    a: "DNI, últimos 3 recibos de sueldo o documentación de ingresos, garantía (propietario en zona o recibo de sueldo), y en algunos casos seguro de caución. Te asesoramos sin compromiso.",
  },
  {
    q: "¿Aceptan mascotas en los alquileres?",
    a: "Depende de cada propietario. En los listados de propiedades indicamos si se aceptan mascotas. También podés consultarnos por WhatsApp y buscamos opciones que se ajusten.",
  },
  {
    q: "¿Cuánto tiempo tarda el trámite de compraventa?",
    a: "Una vez acordado el precio, la boleta de reserva se firma en 48-72 hs. La escritura demora entre 30 y 60 días según la documentación del inmueble y los tiempos del escribano.",
  },
  {
    q: "¿Tienen propiedades en financiación?",
    a: "Sí, trabajamos con propiedades en financiación directa con el vendedor y también asesoramos en créditos hipotecarios de distintos bancos. Consultanos por WhatsApp con tu situación y te orientamos.",
  },
  {
    q: "¿Cómo publico mi propiedad para vender o alquilar?",
    a: "Ingresá a la sección \"Publicar\" del sitio, completá el formulario con los datos de tu propiedad y nos contactamos en el día para tasarla y agregarla a nuestra cartera.",
  },
  {
    q: "¿Qué garantías aceptan para alquilar?",
    a: "Aceptamos propietarios (de la zona o de otras provincias), recibo de sueldo del doble del alquiler y seguro de caución. El tipo de garantía depende de cada propietario y se acuerda al inicio.",
  },
];

function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const ini = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase() || "A";
  if (src) return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 999, objectFit: "cover", flexShrink: 0 }} />;
  return (
    <span style={{
      width: size, height: size, borderRadius: 999,
      background: "#B48A73", color: "#fff",
      display: "grid", placeItems: "center",
      fontWeight: 900, fontSize: size * 0.35, flexShrink: 0,
    }}>{ini}</span>
  );
}

function roleLabel(role?: string | null) {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Admin";
  return "Agente";
}

function cleanPhone(raw?: string | null) {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  return d.length >= 8 ? d : null;
}

export default function HeaderChat() {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const offlineWa = (process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP || "5491123456789").trim();

  async function loadAgents() {
    try {
      const res = await fetch("/api/agents-online", { cache: "no-store" });
      const json = await res.json();
      setAgents((json?.rows as Agent[]) ?? []);
    } catch { setAgents([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadAgents();
    const t = setInterval(loadAgents, 20_000);
    return () => clearInterval(t);
  }, []);

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasAgents = agents.length > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* ── TRIGGER BUTTON ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: open ? "#2D3134" : "#f4f4f5",
          border: "none",
          borderRadius: 999,
          padding: "7px 14px 7px 10px",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all .15s",
        }}
      >
        {/* Dot de estado */}
        {loading ? (
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#d1d5db", display: "block" }} />
        ) : hasAgents ? (
          <span style={{ position: "relative", width: 8, height: 8, display: "block", flexShrink: 0 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#22c55e", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#22c55e" }} />
          </span>
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#f59e0b", display: "block" }} />
        )}

        <div style={{ lineHeight: 1.2, textAlign: "left" }}>
          {hasAgents && !loading ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, color: open ? "#fff" : "#2D3134", whiteSpace: "nowrap" }}>
                Estamos disponibles
              </div>
              <div style={{ fontSize: 10, color: open ? "rgba(255,255,255,.6)" : "#888", fontWeight: 600, whiteSpace: "nowrap" }}>
                Resolvemos tus consultas
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: open ? "#fff" : "#555", whiteSpace: "nowrap" }}>
              💬 Consultas
            </div>
          )}
        </div>

        <span style={{ fontSize: 11, color: open ? "rgba(255,255,255,.5)" : "#aaa", marginLeft: 2 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* ── PANEL ── */}
      {open && (
        <div style={{
          position: "fixed",
          top: 62,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(440px, 96vw)",
          maxHeight: "80dvh",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,.2)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 200,
        }}>

          {/* Header del panel */}
          <div style={{
            background: "#2D3134", padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10, background: "#B48A73",
              display: "grid", placeItems: "center", fontWeight: 900, fontSize: 14, color: "#fff", flexShrink: 0,
            }}>PG</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#fff" }}>Pino Galant</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                {hasAgents ? (
                  <><span style={{ width: 6, height: 6, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
                  {agents.length} agente{agents.length > 1 ? "s" : ""} disponible{agents.length > 1 ? "s" : ""}</>
                ) : (
                  <><span style={{ width: 6, height: 6, borderRadius: 999, background: "#f59e0b", display: "inline-block" }} />
                  Sin agentes conectados ahora</>
                )}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "rgba(255,255,255,.12)", color: "#fff", border: "none",
              borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14,
              display: "grid", placeItems: "center",
            }}>✕</button>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* ── CON AGENTES ONLINE ── */}
            {hasAgents ? (
              <div style={{ padding: "16px 16px 20px" }}>

                {/* Saludo */}
                <div style={{
                  background: "#f4f4f5", borderRadius: 14, padding: "12px 14px",
                  marginBottom: 16, fontSize: 14, color: "#2D3134", lineHeight: 1.5,
                }}>
                  👋 ¡Hola! Dejanos tu consulta. Nuestros agentes están disponibles para ayudarte ahora mismo.
                </div>

                {/* Lista de agentes */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Agentes online
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                  {agents.map(agent => {
                    const phone = cleanPhone(agent.whatsapp);
                    return (
                      <div key={agent.user_id} style={{
                        background: "#f9f9f9", borderRadius: 14, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 12,
                        border: "1px solid #f0f0f0",
                      }}>
                        <Avatar src={agent.avatar_url} name={agent.full_name || "Agente"} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#2D3134" }}>
                            {agent.full_name || "Agente"}
                          </div>
                          <div style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
                            {roleLabel(agent.role)} · Disponible
                          </div>
                        </div>
                        {phone && (
                          <a
                            href={`https://wa.me/${phone}?text=${encodeURIComponent("Hola! Te contacto desde la web de Pino Galant.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: "#25D366", color: "#fff",
                              padding: "8px 14px", borderRadius: 10,
                              textDecoration: "none", fontWeight: 800, fontSize: 13,
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* WhatsApp general */}
                <a
                  href={`https://wa.me/${offlineWa}?text=${encodeURIComponent("Hola! Me contacto desde la web de Pino Galant.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#2D3134", color: "#fff", padding: "13px",
                    borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14,
                    width: "100%",
                  }}
                >
                  📲 Contactar a la inmobiliaria
                </a>
              </div>

            ) : (

              /* ── SIN AGENTES: FAQ ── */
              <div style={{ padding: "16px 16px 20px" }}>
                <div style={{
                  background: "#fff7ed", border: "1px solid #fde68a", borderRadius: 12,
                  padding: "11px 14px", marginBottom: 16, fontSize: 13, color: "#92400e",
                }}>
                  ⏰ Ahora no hay agentes conectados. Dejanos tu consulta por WhatsApp y te respondemos a la brevedad.
                </div>

                <a
                  href={`https://wa.me/${offlineWa}?text=${encodeURIComponent("Hola! Me contacto desde la web de Pino Galant.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#25D366", color: "#fff", padding: "12px",
                    borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  💬 Escribirnos por WhatsApp
                </a>

                {/* FAQ */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Preguntas frecuentes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {FAQS.map((faq, i) => (
                    <div key={i} style={{
                      border: "1px solid #eee", borderRadius: 12, overflow: "hidden",
                      background: openFaq === i ? "#f9f9f9" : "#fff",
                    }}>
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        style={{
                          width: "100%", background: "none", border: "none",
                          padding: "12px 14px", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                          textAlign: "left", fontFamily: "inherit",
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#2D3134", lineHeight: 1.4 }}>
                          {faq.q}
                        </span>
                        <span style={{
                          fontSize: 12, color: "#B48A73", flexShrink: 0, fontWeight: 900,
                          transition: "transform .2s",
                          display: "inline-block",
                          transform: openFaq === i ? "rotate(180deg)" : "none",
                        }}>▼</span>
                      </button>
                      {openFaq === i && (
                        <div style={{
                          padding: "0 14px 13px", fontSize: 13, color: "#555",
                          lineHeight: 1.6, borderTop: "1px solid #eee",
                          paddingTop: 10,
                        }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
