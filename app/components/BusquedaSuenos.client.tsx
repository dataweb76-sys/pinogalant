"use client";

import { useState } from "react";

export default function BusquedaSuenos() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [iaOpen, setIaOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openPopup() { setPopupOpen(true); }
  function closePopup() { setPopupOpen(false); setIaOpen(false); setQuery(""); setError(""); }

  async function handleIA(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buscar-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Error: ${data?.error ?? res.status}`);
        return;
      }
      const params = new URLSearchParams();
      if (data.op) params.set("op", data.op);
      if (data.type) params.set("type", data.type);
      if (data.price_min) params.set("price_min", String(data.price_min));
      if (data.price_max) params.set("price_max", String(data.price_max));
      if (data.q) params.set("q", data.q);
      closePopup();
      window.location.href = `/propiedades?${params.toString()}`;
    } catch (e: any) {
      setError(`Error: ${e?.message ?? "desconocido"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botón debajo del buscador */}
      <button onClick={openPopup} style={{
        marginTop: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: 50,
        padding: "9px 20px",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        transition: "background 0.2s",
        letterSpacing: 0.2,
      }}>
        ✨ Búsqueda de tus sueños
      </button>

      {/* Overlay / Popup */}
      {popupOpen && (
        <div
          onClick={closePopup}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f1923",
              borderRadius: 20,
              width: "100%",
              maxWidth: 480,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Video */}
            <div style={{ position: "relative", background: "#000" }}>
              <video
                src="/buscar-sonado.mp4"
                autoPlay
                playsInline
                controls
                style={{ width: "100%", display: "block", maxHeight: 300, objectFit: "cover" }}
              />
              <button
                onClick={closePopup}
                style={{
                  position: "absolute", top: 10, right: 12,
                  background: "rgba(0,0,0,0.5)", border: "none",
                  borderRadius: "50%", width: 32, height: 32,
                  color: "#fff", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            {/* Contenido */}
            <div style={{ padding: "20px 24px 28px" }}>
              {!iaOpen ? (
                <>
                  <h2 style={{ margin: "0 0 8px", color: "#fff", fontSize: 20, fontWeight: 800 }}>
                    Encontrá la propiedad de tus sueños
                  </h2>
                  <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                    Describila con tus palabras y la IA la encuentra por vos.
                  </p>
                  <button
                    onClick={() => setIaOpen(true)}
                    style={{
                      width: "100%",
                      background: "linear-gradient(135deg, #c8894a 0%, #e6a86a 100%)",
                      border: "none", borderRadius: 12,
                      padding: "14px 0", color: "#fff",
                      fontSize: 15, fontWeight: 700, cursor: "pointer",
                      letterSpacing: 0.3,
                    }}
                  >
                    ✨ A tu medida
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ margin: "0 0 8px", color: "#fff", fontSize: 18, fontWeight: 800 }}>
                    ¿Qué propiedad soñás?
                  </h2>
                  <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                    Escribilo como quieras, la IA interpreta tu búsqueda.
                  </p>
                  <form onSubmit={handleIA} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder='Ej: "quiero una casa con patio, 3 dormitorios, menos de 100 mil dólares"'
                      rows={3}
                      style={{
                        borderRadius: 10, border: "none", padding: "12px 14px",
                        fontSize: 13, resize: "none", background: "rgba(255,255,255,0.08)",
                        color: "#fff", outline: "none",
                      }}
                    />
                    {error && <p style={{ margin: 0, color: "#fca5a5", fontSize: 12 }}>{error}</p>}
                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      style={{
                        background: "linear-gradient(135deg, #c8894a 0%, #e6a86a 100%)",
                        border: "none", borderRadius: 10,
                        padding: "13px 0", color: "#fff",
                        fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                        opacity: loading || !query.trim() ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Buscando…" : "🔍 Buscar mi propiedad"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
