"use client";

import { useState } from "react";

const LAT = -36.6167;
const LNG = -64.2833;
const ADDRESS = 'General Pico 364 1° "A"';
const MAPS_QUERY = encodeURIComponent("General Pico 364, Santa Rosa, La Pampa, Argentina");

export default function OficinaModal() {
  const [open, setOpen] = useState(false);

  function comoLlegar() {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`, "_blank");
  }

  function iniciarViaje() {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}&travelmode=driving`, "_blank");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 14,
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#2D3134", color: "#fff",
          border: "none", borderRadius: 12,
          padding: "12px 22px", fontSize: 14, fontWeight: 700,
          cursor: "pointer", textDecoration: "none",
        }}
      >
        📍 Oficinas comerciales
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 20,
              width: "100%", maxWidth: 520,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div style={{
              background: "#2D3134", padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ color: "#B48A73", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
                  Pino Galant
                </div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>Oficinas Comerciales</div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
                width: 34, height: 34, color: "#fff", fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>

            {/* Dirección */}
            <div style={{ padding: "16px 24px 12px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>📍</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1c1e" }}>{ADDRESS}</div>
                  <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>Santa Rosa, La Pampa, Argentina</div>
                </div>
              </div>
            </div>

            {/* Mapa — OpenStreetMap, sin API key */}
            <div style={{ height: 260 }}>
              <iframe
                title="Oficina Pino Galant"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-64.2900%2C-36.6220%2C-64.2760%2C-36.6120&layer=mapnik&marker=-36.6167%2C-64.2833"
                width="100%"
                height="260"
                style={{ border: 0, display: "block" }}
                loading="lazy"
              />
            </div>

            {/* Botones */}
            <div style={{ padding: "16px 24px 20px", display: "flex", gap: 10 }}>
              <button
                onClick={comoLlegar}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "2px solid #2D3134",
                  background: "#fff", color: "#2D3134", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                🗺️ Cómo llegar
              </button>
              <button
                onClick={iniciarViaje}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                  background: "#2D3134", color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                🚗 Iniciar viaje
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
