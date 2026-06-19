"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const PropiedadesMap = dynamic(() => import("./PropiedadesMap.client"), { ssr: false });

type Pin = { id: number; address: string; lat: number; lng: number; price?: string; op: string };

export default function PropiedadesVistaToggle({ pins }: { pins: Pin[] }) {
  const [vista, setVista] = useState<"lista" | "mapa">("lista");

  if (vista === "lista") {
    return (
      <button
        onClick={() => setVista("mapa")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 10,
          border: "1px solid #ddd", background: "#fff",
          cursor: "pointer", fontWeight: 700, fontSize: 13,
          color: "#444",
        }}
      >
        🗺️ Ver en mapa
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#fff" }}>
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
        <button
          onClick={() => setVista("lista")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 12,
            background: "#2D3134", color: "#fff", border: "none",
            cursor: "pointer", fontWeight: 800, fontSize: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          }}
        >
          ← Volver al listado
        </button>
      </div>
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        background: "#fff", borderRadius: 12, padding: "8px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        fontSize: 13, fontWeight: 700, color: "#555" }}>
        {pins.length} propiedades en el mapa
      </div>
      <PropiedadesMap pins={pins} />
    </div>
  );
}
