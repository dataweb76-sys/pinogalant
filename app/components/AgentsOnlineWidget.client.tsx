// app/components/AgentsOnlineWidget.client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  user_id: string;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  email: string | null;
  last_seen: string;
};

function roleToEs(role?: string | null) {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Admin";
  return "Agente";
}

function cleanPhone(raw?: string | null) {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  return d.length >= 8 ? d : null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const a = parts[0]?.[0] ?? "A";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function AgentsOnlineWidget() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const offlineWhatsapp = (process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP || "").trim();
  const offlineEmail = (process.env.NEXT_PUBLIC_OFFLINE_EMAIL || "").trim();

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/agents-online", { cache: "no-store" });
      const json = await res.json();
      setList((json?.rows as Row[]) ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const onlineCount = list.length;
  const hasOnline = onlineCount > 0;

  const chipText = useMemo(() => {
    if (loading) return "Conectando…";
    return hasOnline ? `Chat (${onlineCount} online)` : "Chat (offline)";
  }, [loading, hasOnline, onlineCount]);

  const subtitle = useMemo(() => {
    if (loading) return "Verificando disponibilidad…";
    return hasOnline ? "Atención en tiempo real" : "Dejanos tu consulta";
  }, [loading, hasOnline]);

  // Cerrar modal con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenModal(false);
    }
    if (openModal) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openModal]);

  return (
    <>
      {/* FLOATING CHAT BUTTON */}
      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 70,
          display: "grid",
          gap: 10,
          justifyItems: "end",
        }}
      >
        <button
          className="btn btnPrimary"
          type="button"
          onClick={() => setOpenModal(true)}
          style={{
            borderRadius: 999,
            padding: "12px 14px",
            boxShadow: "0 18px 50px rgba(0,0,0,.18)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "calc(100vw - 36px)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.22)",
              overflow: "hidden",
            }}
            title="Pino Galant"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" style={{ width: 34, height: 34, objectFit: "cover" }} />
          </span>

          <div style={{ display: "grid", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 900 }}>{chipText}</span>
            <span className="small" style={{ opacity: 0.85 }}>
              {subtitle}
            </span>
          </div>

          <span
            aria-hidden
            style={{
              marginLeft: 6,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: loading ? "#9ca3af" : hasOnline ? "#22c55e" : "#ef4444",
              boxShadow: "0 0 0 4px rgba(255,255,255,0.14)",
            }}
            title={loading ? "Cargando" : hasOnline ? "Online" : "Offline"}
          />
        </button>
      </div>

      {/* MODAL / POPUP */}
      {!openModal ? null : (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.45)",
            display: "grid",
            placeItems: "end center",
            padding: 14,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              borderRadius: 18,
              overflow: "hidden",
              background: "white",
              border: "1px solid #eee",
              boxShadow: "0 22px 80px rgba(0,0,0,.28)",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: "1px solid #eee",
                background: hasOnline ? "linear-gradient(90deg, #ecfdf5 0%, #ffffff 70%)" : "#fafafa",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Pino Galant"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "1px solid #eee",
                }}
              />

              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, lineHeight: 1.1 }}>
                  {loading ? "Conectando…" : hasOnline ? `${onlineCount} agente(s) online` : "Ahora no hay agentes online"}
                </div>
                <div className="small" style={{ opacity: 0.75 }}>
                  {loading
                    ? "Estamos verificando disponibilidad."
                    : hasOnline
                    ? "Elegí con quién querés hablar."
                    : "Podés escribir igual a la inmobiliaria."}
                </div>
              </div>

              <button className="btn" type="button" onClick={() => setOpenModal(false)} style={{ marginLeft: "auto" }}>
                Cerrar
              </button>
            </div>

            {/* BODY */}
            <div style={{ padding: 14, display: "grid", gap: 12, maxHeight: "70vh", overflow: "auto" }}>
              {loading ? (
                <div className="small" style={{ opacity: 0.7 }}>
                  Cargando…
                </div>
              ) : hasOnline ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {list.map((a) => {
                    const name = a.full_name || a.email || "Agente";
                    const waDigits = cleanPhone(a.whatsapp);
                    const wa = waDigits ? `https://wa.me/${waDigits}` : null;

                    return (
                      <div
                        key={a.user_id}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 14,
                          padding: 12,
                          display: "grid",
                          gap: 10,
                          background: "white",
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 999,
                              overflow: "hidden",
                              background: "#111",
                              color: "#fff",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 900,
                              flex: "0 0 auto",
                            }}
                          >
                            {a.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initials(name)
                            )}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {name}
                            </div>
                            <div className="small" style={{ opacity: 0.7 }}>
                              {roleToEs(a.role)} • <span style={{ color: "#10b981", fontWeight: 800 }}>🟢 Online</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {wa ? (
                            <a className="btn btnPrimary" href={wa} target="_blank" rel="noreferrer">
                              💬 WhatsApp
                            </a>
                          ) : null}

                          {a.email ? (
                            <a className="btn" href={`mailto:${a.email}`}>
                              ✉️ Email
                            </a>
                          ) : null}

                          {!wa && !a.email ? (
                            <span className="small" style={{ opacity: 0.65 }}>
                              Contacto no configurado
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="small" style={{ opacity: 0.75 }}>
                    Ahora no hay agentes conectados. Podés escribir igual y te respondemos apenas volvamos.
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <a
                      className="btn btnPrimary"
                      href={offlineWhatsapp ? `https://wa.me/${cleanPhone(offlineWhatsapp)}` : "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        opacity: offlineWhatsapp ? 1 : 0.5,
                        pointerEvents: offlineWhatsapp ? "auto" : "none",
                        flex: "1 1 auto",
                        justifyContent: "center",
                      }}
                    >
                      💬 WhatsApp inmobiliaria
                    </a>

                    <a
                      className="btn"
                      href={offlineEmail ? `mailto:${offlineEmail}` : "#"}
                      style={{
                        opacity: offlineEmail ? 1 : 0.5,
                        pointerEvents: offlineEmail ? "auto" : "none",
                        flex: "1 1 auto",
                        justifyContent: "center",
                      }}
                    >
                      ✉️ Email
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
