"use client";

import { useEffect, useState } from "react";

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
  if (role === "admin") return "Administración";
  return "Usuario";
}

function cleanPhone(raw?: string | null) {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  return d.length >= 8 ? d : null;
}

export default function AgentsOnlineWidget() {
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const offlineWhatsapp = (process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP || "").replace(/[^\d]/g, "");
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

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 360,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 50,
      }}
    >
      <div
        className="card"
        style={{
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 18px 50px rgba(0,0,0,.16)",
          overflow: "hidden",
          background: "white",
          border: "1px solid #eee",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: hasOnline ? "#e9f7ef" : "#f3f4f6",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 900,
            }}
            aria-hidden
          >
            {hasOnline ? "🟢" : "⚪"}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.1 }}>
              {loading ? "Consultá ahora" : hasOnline ? "Agentes online" : "Sin agentes online"}
            </div>
            <div className="small" style={{ opacity: 0.75 }}>
              {loading
                ? "Cargando disponibilidad…"
                : hasOnline
                ? "Respuesta rápida por WhatsApp o Email"
                : "Dejanos tu mensaje y respondemos apenas estemos online"}
            </div>
          </div>

          <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: 12, opacity: 0.7 }}>
            {hasOnline ? "ONLINE" : "OFFLINE"}
          </div>
        </div>

        {/* Body */}
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {loading ? (
            <div className="small" style={{ opacity: 0.7 }}>
              Cargando…
            </div>
          ) : hasOnline ? (
            <>
              {list.slice(0, 3).map((a) => {
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
                        }}
                      >
                        {a.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          name.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </div>
                        <div className="small" style={{ opacity: 0.7 }}>
                          {roleToEs(a.role)}
                        </div>
                      </div>

                      <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 900, color: "#167d3f" }}>
                        🟢 Disponible
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {wa ? (
                        <a
                          className="btn btnPrimary"
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          style={{ flex: 1, textAlign: "center" }}
                        >
                          WhatsApp
                        </a>
                      ) : null}

                      {a.email ? (
                        <a className="btn" href={`mailto:${a.email}`} style={{ flex: 1, textAlign: "center" }}>
                          Email
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <a className="btn" href="/contacto" style={{ textAlign: "center" }}>
                Enviar consulta (formulario)
              </a>
            </>
          ) : (
            <>
              <a
                className="btn btnPrimary"
                href={offlineWhatsapp ? `https://wa.me/${offlineWhatsapp}` : "#"}
                target="_blank"
                rel="noreferrer"
                style={{ opacity: offlineWhatsapp ? 1 : 0.5, pointerEvents: offlineWhatsapp ? "auto" : "none" }}
              >
                WhatsApp de la inmobiliaria
              </a>

              <a
                className="btn"
                href={offlineEmail ? `mailto:${offlineEmail}` : "#"}
                style={{ opacity: offlineEmail ? 1 : 0.5, pointerEvents: offlineEmail ? "auto" : "none" }}
              >
                Email de la inmobiliaria
              </a>

              <div className="small" style={{ opacity: 0.65 }}>
                Tip: configurá <code>NEXT_PUBLIC_OFFLINE_WHATSAPP</code> y <code>NEXT_PUBLIC_OFFLINE_EMAIL</code> en <code>.env.local</code>.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
