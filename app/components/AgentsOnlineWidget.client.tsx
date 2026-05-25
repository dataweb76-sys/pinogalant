"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Agent = {
  user_id: string;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  email: string | null;
  last_seen: string;
};

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
  agent?: { name: string | null; whatsapp: string | null; email: string | null; avatar_url: string | null } | null;
};

function cleanPhone(raw?: string | null) {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  return d.length >= 8 ? d : null;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase() || "A";
}

function roleLabel(role?: string | null) {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Admin";
  return "Agente";
}

function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" }} />;
  return (
    <span style={{
      width: size, height: size, borderRadius: 999, background: "#B48A73", color: "#fff",
      display: "grid", placeItems: "center", fontWeight: 900, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials(name)}
    </span>
  );
}

export default function AgentsOnlineWidget() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"agents" | "chat">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const offlineWa = (process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP || "").trim();
  const offlineEmail = (process.env.NEXT_PUBLIC_OFFLINE_EMAIL || "").trim();

  // Detectar propertyId de la URL
  const [propertyId, setPropertyId] = useState<string | null>(null);
  useEffect(() => {
    const m = window.location.pathname.match(/^\/propiedades\/([^/]+)/);
    setPropertyId(m?.[1] ?? null);
  }, []);

  // Cargar agentes cada 20s
  async function loadAgents() {
    try {
      const res = await fetch("/api/agents-online", { cache: "no-store" });
      const json = await res.json();
      setAgents((json?.rows as Agent[]) ?? []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
    const t = setInterval(loadAgents, 20_000);
    return () => clearInterval(t);
  }, []);

  // Scroll al fondo cuando llegan mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Mensaje inicial cuando abre el chat
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: "welcome",
        from: "bot",
        text: agents.length > 0
          ? `¡Hola! 👋 Tenemos ${agents.length} agente(s) disponibles ahora. También podés preguntarme lo que necesites.`
          : "¡Hola! 👋 Ahora no hay agentes conectados, pero puedo responder tus consultas frecuentes. ¿En qué te puedo ayudar?",
      }]);
    }
  }, [open]);

  const hasAgents = agents.length > 0;
  const statusColor = loading ? "#9ca3af" : hasAgents ? "#22c55e" : "#f59e0b";
  const chipText = loading ? "Conectando…" : hasAgents ? `Chat (${agents.length} online)` : "Chat";

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: Date.now().toString(), from: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, propertyId }),
      });
      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: data.answer || "No tengo esa información. Te conecto con un agente.",
        agent: data.needsAgent ? data.agent : null,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: "Hubo un error. Por favor intentá de nuevo o contactanos por WhatsApp.",
      }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <div className="chat-fab" style={{ position: "fixed", right: 18, bottom: 18, zIndex: 70 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "#2D3134", color: "#fff", border: "none", borderRadius: 999,
            padding: "12px 18px", cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,.25)",
            display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 20 }}>💬</span>
          <div className="chat-fab-label" style={{ textAlign: "left", lineHeight: 1.2 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{chipText}</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>Consultá aquí</div>
          </div>
          <span style={{
            width: 10, height: 10, borderRadius: 999, background: statusColor,
            boxShadow: `0 0 0 3px rgba(255,255,255,.2)`, flexShrink: 0,
          }} />
        </button>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="chat-modal"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(0,0,0,.4)",
            display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
            padding: 18,
          }}
        >
          <div
            className="chat-box"
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(420px, 100%)", height: "min(580px, 85vh)",
              background: "#fff", borderRadius: 20,
              boxShadow: "0 24px 80px rgba(0,0,0,.3)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "1px solid #eee",
            }}
          >
            {/* HEADER */}
            <div style={{
              background: "#2D3134", color: "#fff", padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10, background: "#B48A73",
                display: "grid", placeItems: "center", fontWeight: 900, fontSize: 14, flexShrink: 0,
              }}>PG</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>Pino Galant</div>
                <div style={{ fontSize: 11, opacity: 0.65, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: statusColor, display: "inline-block" }} />
                  {loading ? "Verificando..." : hasAgents ? `${agents.length} agente(s) online` : "Sin agentes online ahora"}
                </div>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {[{ id: "chat", label: "Chat" }, { id: "agents", label: "Agentes" }].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as "chat" | "agents")}
                    style={{
                      background: tab === t.id ? "#B48A73" : "rgba(255,255,255,.12)",
                      color: "#fff", border: "none", borderRadius: 8,
                      padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* TAB: CHAT */}
            {tab === "chat" && (
              <>
                {/* Mensajes */}
                <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "82%",
                        background: msg.from === "user" ? "#2D3134" : "#f4f4f5",
                        color: msg.from === "user" ? "#fff" : "#2D3134",
                        borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        padding: "10px 13px",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}>
                        {msg.text}

                        {/* Botones de agente cuando el bot deriva */}
                        {msg.agent && (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid #eee" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <Avatar src={msg.agent.avatar_url} name={msg.agent.name || "Agente"} size={34} />
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: "#2D3134" }}>{msg.agent.name || "Agente"}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>Tu agente asignado</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {msg.agent.whatsapp && (
                                <a
                                  href={`https://wa.me/${cleanPhone(msg.agent.whatsapp)}`}
                                  target="_blank" rel="noreferrer"
                                  style={{
                                    background: "#25D366", color: "#fff", textDecoration: "none",
                                    padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                                    display: "flex", alignItems: "center", gap: 5,
                                  }}
                                >
                                  <span>💬</span> WhatsApp
                                </a>
                              )}
                              {msg.agent.email && (
                                <a
                                  href={`mailto:${msg.agent.email}`}
                                  style={{
                                    background: "#f4f4f5", color: "#2D3134", textDecoration: "none",
                                    padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                                  }}
                                >
                                  ✉️ Email
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Fallback sin agente asignado */}
                        {msg.from === "bot" && msg.agent === null && msg.id !== "welcome" && (
                          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {offlineWa && (
                              <a
                                href={`https://wa.me/${cleanPhone(offlineWa)}`}
                                target="_blank" rel="noreferrer"
                                style={{
                                  background: "#25D366", color: "#fff", textDecoration: "none",
                                  padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                                }}
                              >
                                💬 WhatsApp
                              </a>
                            )}
                            {offlineEmail && (
                              <a href={`mailto:${offlineEmail}`} style={{
                                background: "#f4f4f5", color: "#2D3134", textDecoration: "none",
                                padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                              }}>
                                ✉️ Email
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {sending && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{ background: "#f4f4f5", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 20, letterSpacing: 3 }}>
                        •••
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #eee", display: "flex", gap: 8, flexShrink: 0 }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Escribí tu consulta…"
                    disabled={sending}
                    style={{
                      flex: 1, border: "1px solid #eee", borderRadius: 10, padding: "10px 12px",
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                      background: sending ? "#f9f9f9" : "#fff",
                    }}
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    style={{
                      background: input.trim() && !sending ? "#B48A73" : "#e5e7eb",
                      color: input.trim() && !sending ? "#fff" : "#9ca3af",
                      border: "none", borderRadius: 10, padding: "10px 14px",
                      fontSize: 18, cursor: input.trim() && !sending ? "pointer" : "default",
                      transition: "all .15s",
                    }}
                  >
                    ↑
                  </button>
                </div>
              </>
            )}

            {/* TAB: AGENTES */}
            {tab === "agents" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {loading ? (
                  <p style={{ color: "#aaa", fontSize: 14 }}>Cargando…</p>
                ) : agents.length === 0 ? (
                  <>
                    <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
                      Ningún agente conectado en este momento. Podés escribirnos igual:
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      {offlineWa && (
                        <a href={`https://wa.me/${cleanPhone(offlineWa)}`} target="_blank" rel="noreferrer"
                          style={{ background: "#25D366", color: "#fff", textDecoration: "none", padding: "9px 16px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
                          💬 WhatsApp
                        </a>
                      )}
                      {offlineEmail && (
                        <a href={`mailto:${offlineEmail}`}
                          style={{ background: "#f4f4f5", color: "#2D3134", textDecoration: "none", padding: "9px 16px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
                          ✉️ Email
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  agents.map(a => {
                    const name = a.full_name || a.email || "Agente";
                    const wa = cleanPhone(a.whatsapp);
                    return (
                      <div key={a.user_id} style={{
                        border: "1px solid #eee", borderRadius: 14, padding: "12px 14px",
                        display: "flex", gap: 12, alignItems: "center",
                      }}>
                        <Avatar src={a.avatar_url} name={name} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>{name}</div>
                          <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
                            🟢 Online · {roleLabel(a.role)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {wa && (
                            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"
                              style={{ background: "#25D366", color: "#fff", textDecoration: "none", padding: "7px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                              💬
                            </a>
                          )}
                          {a.email && (
                            <a href={`mailto:${a.email}`}
                              style={{ background: "#f4f4f5", color: "#333", textDecoration: "none", padding: "7px 12px", borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                              ✉️
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
