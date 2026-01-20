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
  if (role === "admin") return "Asesor";
  return "Usuario";
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
  const [open, setOpen] = useState(true);

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

  const hasOnline = list.length > 0;

  const headline = useMemo(() => {
    if (loading) return "Conectando…";
    return hasOnline ? "Asesores online" : "Sin asesores online";
  }, [loading, hasOnline]);

  const sub = useMemo(() => {
    if (loading) return "Verificando disponibilidad…";
    return hasOnline
      ? "Respondemos ahora mismo por WhatsApp o Email."
      : "Dejanos tu consulta y respondemos apenas estemos disponibles.";
  }, [loading, hasOnline]);

  const statusColor = hasOnline ? "#10b981" : "#9ca3af";
  const statusBg = hasOnline ? "rgba(10,185,129,.10)" : "#f3f4f6";

  return (
    <div
      style={{
        position: "fixed",
        right: 2,
        bottom: 2,
        width: 350,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 60,
      }}
    >
      <div
        className="card"
        style={{
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(0,0,0,.16)",
          border: "1px solid #eee",
          background: "white",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: statusBg,
            borderBottom: "1px solid #eee",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              background: statusColor,
              color: "white",
              flex: "0 0 auto",
            }}
            title={hasOnline ? "Online" : "Offline"}
          >
            {hasOnline ? "●" : "○"}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, lineHeight: 1.15 }}>{headline}</div>
            <div className="small" style={{ opacity: 0.78 }}>
              {sub}
            </div>
          </div>

          <button
            className="btn"
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              marginLeft: "auto",
              padding: "8px 10px",
              borderRadius: 12,
              height: 36,
            }}
          >
            {open ? "—" : "+"}
          </button>
        </div>

        {/* BODY */}
        {!open ? null : (
          <div style={{ padding: 14, display: "grid", gap: 12 }}>
            {loading ? (
              <div className="small" style={{ opacity: 0.7 }}>
                Cargando…
              </div>
            ) : hasOnline ? (
              <>
                <div style={{ display: "grid", gap: 10 }}>
                  {list.slice(0, 3).map((a) => {
                    const name = a.full_name || a.email || "Asesor";
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
                              width: 46,
                              height: 46,
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
                              <img
                                src={a.avatar_url}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              initials(name)
                            )}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {name}
                            </div>
                            <div className="small" style={{ opacity: 0.72 }}>
                              {roleToEs(a.role)} • <span style={{ color: "#10b981", fontWeight: 900 }}>🟢 Online</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {wa ? (
                            <a className="btn btnPrimary" href={wa} target="_blank" rel="noreferrer" style={{ flex: "1 1 auto" }}>
                              💬 WhatsApp
                            </a>
                          ) : null}

                          {a.email ? (
                            <a className="btn" href={`mailto:${a.email}`} style={{ flex: "1 1 auto" }}>
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

                <div
                  className="card"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px dashed #e5e7eb",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>¿Querés respuesta inmediata?</div>
                  <div className="small" style={{ opacity: 0.75, marginTop: 4 }}>
                    Escribinos por WhatsApp y te asesoramos ahora.
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="small" style={{ opacity: 0.78 }}>
                  Ahora no hay asesores conectados. Podés escribir igual y lo tomamos apenas volvamos.
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
                    }}
                  >
                    💬 WhatsApp Inmobiliaria
                  </a>

                  <a
                    className="btn"
                    href={offlineEmail ? `mailto:${offlineEmail}` : "#"}
                    style={{
                      opacity: offlineEmail ? 1 : 0.5,
                      pointerEvents: offlineEmail ? "auto" : "none",
                      flex: "1 1 auto",
                    }}
                  >
                    ✉️ Email
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
