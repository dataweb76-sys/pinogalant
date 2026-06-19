"use client";
import { useEffect, useRef, useState } from "react";

type PropPin = {
  id: number;
  address: string;
  lat: number;
  lng: number;
  price?: string;
  op: string;
  type?: string;
  photo?: string;
};

const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  "Casa":         { emoji: "🏠", color: "#1e6b3c" },
  "Departamento": { emoji: "🏢", color: "#1565C0" },
  "Terreno":      { emoji: "📐", color: "#795548" },
  "Local":        { emoji: "🏪", color: "#E65100" },
  "Quinta":       { emoji: "🌳", color: "#558B2F" },
  "Campo":        { emoji: "🌾", color: "#c47f00" },
  "Condo":        { emoji: "🏘️", color: "#6A1B9A" },
  "Rancho":       { emoji: "🏡", color: "#4E342E" },
};

function getStyle(type?: string) {
  return TYPE_ICONS[type ?? ""] ?? { emoji: "🏠", color: "#2D3134" };
}

export default function PropiedadesMap({ pins }: { pins: PropPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  const allTypes = Array.from(new Set(pins.map(p => p.type ?? "Otro"))).filter(Boolean);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(() => new Set(allTypes));
  const [activeOps, setActiveOps] = useState<Set<string>>(() => new Set(["venta", "alquiler"]));

  // 1. Cargar Leaflet una sola vez
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadLeaflet = () => {
      if ((window as any).L) { initMap(); return; }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;
      const L = (window as any).L;

      const lats = pins.map(p => p.lat);
      const lngs = pins.map(p => p.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      const map = L.map(mapRef.current).setView([centerLat, centerLng], pins.length === 1 ? 15 : 11);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      setReady(true);
    };

    loadLeaflet();
  }, []);

  // 2. Re-dibujar markers cuando cambian filtros o Leaflet está listo
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const visible = pins.filter(p =>
      activeTypes.has(p.type ?? "Otro") && activeOps.has(p.op)
    );

    visible.forEach(pin => {
      const { emoji, color } = getStyle(pin.type);
      const icon = L.divIcon({
        html: `<div style="
          background:${color};
          width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(0,0,0,0.4);border:2px solid rgba(255,255,255,0.8);
          font-size:15px;
        "><span style="transform:rotate(45deg);display:block">${emoji}</span></div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      const popup = `
        <div style="min-width:190px;font-family:sans-serif;padding:2px">
          ${pin.photo ? `<img src="${pin.photo}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block" />` : ""}
          <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">
            ${pin.type ?? ""} · ${pin.op === "venta" ? "Venta" : "Alquiler"}
          </div>
          <div style="font-weight:700;font-size:13px;margin-bottom:5px;line-height:1.3;color:#1a1a1a">${pin.address}</div>
          ${pin.price ? `<div style="font-size:16px;font-weight:900;color:#2D3134;margin-bottom:10px">${pin.price}</div>` : ""}
          <a href="/propiedades/${pin.id}"
            style="display:block;text-align:center;padding:8px;background:#2D3134;color:#fff;border-radius:8px;font-weight:800;font-size:12px;text-decoration:none">
            Ver propiedad →
          </a>
        </div>`;

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup, { maxWidth: 210 });

      markersRef.current.push(marker);
    });
  }, [ready, activeTypes, activeOps]);

  function toggleType(t: string) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function toggleOp(op: string) {
    setActiveOps(prev => {
      const next = new Set(prev);
      next.has(op) ? next.delete(op) : next.add(op);
      return next;
    });
  }

  const visibleCount = pins.filter(p =>
    activeTypes.has(p.type ?? "Otro") && activeOps.has(p.op)
  ).length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>

      {/* Filtros arriba */}
      <div style={{
        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center",
        padding: "8px 12px",
        background: "rgba(255,255,255,0.95)", borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        backdropFilter: "blur(6px)",
        maxWidth: "calc(100vw - 80px)",
      }}>
        {/* Operación */}
        {(["venta", "alquiler"] as const).map(op => (
          <button key={op} onClick={() => toggleOp(op)} style={{
            padding: "5px 12px", borderRadius: 999,
            border: `2px solid ${activeOps.has(op) ? "#2D3134" : "#ddd"}`,
            background: activeOps.has(op) ? "#2D3134" : "#f5f5f5",
            color: activeOps.has(op) ? "#fff" : "#aaa",
            fontWeight: 800, fontSize: 11, cursor: "pointer",
          }}>
            {op === "venta" ? "🏷️ Venta" : "🔑 Alquiler"}
          </button>
        ))}

        <div style={{ width: 1, background: "#ddd", alignSelf: "stretch" }} />

        {/* Tipos */}
        {allTypes.map(t => {
          const { emoji, color } = getStyle(t);
          const active = activeTypes.has(t);
          return (
            <button key={t} onClick={() => toggleType(t)} style={{
              padding: "5px 12px", borderRadius: 999,
              border: `2px solid ${active ? color : "#ddd"}`,
              background: active ? color : "#f5f5f5",
              color: active ? "#fff" : "#aaa",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {emoji} {t}
            </button>
          );
        })}
      </div>

      {/* Contador abajo */}
      <div style={{
        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, background: "rgba(45,49,52,0.88)", color: "#fff",
        padding: "6px 18px", borderRadius: 999, fontSize: 12, fontWeight: 700,
        whiteSpace: "nowrap", boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      }}>
        {visibleCount} propiedad{visibleCount !== 1 ? "es" : ""} en el mapa
      </div>

      {/* Mapa */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
