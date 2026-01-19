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

export default function AgentsOnlinePopup({
  open,
  onClose,
  rows,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  rows: Row[];
  loading: boolean;
}) {
  const offlineWhatsapp = (process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP || "").trim();
  const offlineEmail = (process.env.NEXT_PUBLIC_OFFLINE_EMAIL || "").trim();

  const hasOnline = rows.length > 0;

  // cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // evitar scroll fondo
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const title = useMemo(() => {
    if (loading) return "Conectando…";
    return hasOnline ? "Agentes disponibles" : "Ahora no hay agentes online";
  }, [loading, hasOnline]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // click fuera cierra
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: "min(760px, 100%)",
          borderRadius: 18,
          overflow: "hidden",
          background: "white",
          boxShadow: "0 30px 80px rgba(0,0,0,.25)",
          border: "1px solid #eee",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid #eee",
            background: "#fafafa",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900 }}>{title}</div>
            <div className="small" style={{ opacity: 0.7 }}>
              {hasOnline ? "Elegí un agente para chatear por WhatsApp o enviar email." : "Podés escribir igual a la inmobiliaria."}
            </div>
          </div>

          <button className="btn" onClick={onClose} style={{ marginLeft: "auto", borderRadius: 12 }}>
            Cerrar
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 14 }}>
          {loading ? (
            <div className="small" style={{ opacity: 0.75 }}>
              Cargando…
            </div>
          ) : hasOnline ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {rows.slice(0, 12).map((a) => {
                const name = a.full_name || a.email || "Agente";
                const waDigits = cleanPhone(a.whatsapp);
                const wa = waDigits ? `https://wa.me/${waDigits}` : null;

                return (
                  <div key={a.user_id} style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
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
                          {roleToEs(a.role)} • <span style={{ color: "#10b981", fontWeight: 900 }}>🟢 Online</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
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
            <div style={{ display: "grid", gap: 12 }}>
              <div className="small" style={{ opacity: 0.75 }}>
                Ahora no hay agentes conectados. Podés escribir igual:
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  className="btn btnPrimary"
                  href={offlineWhatsapp ? `https://wa.me/${cleanPhone(offlineWhatsapp)}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ opacity: offlineWhatsapp ? 1 : 0.5, pointerEvents: offlineWhatsapp ? "auto" : "none" }}
                >
                  💬 WhatsApp inmobiliaria
                </a>

                <a
                  className="btn"
                  href={offlineEmail ? `mailto:${offlineEmail}` : "#"}
                  style={{ opacity: offlineEmail ? 1 : 0.5, pointerEvents: offlineEmail ? "auto" : "none" }}
                >
                  ✉️ Email inmobiliaria
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
