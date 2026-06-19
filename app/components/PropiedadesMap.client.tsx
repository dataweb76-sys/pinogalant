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
  typeId?: number;
  photo?: string;
};

const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  "Casa":         { emoji: "🏠", color: "#2D6A4F" },
  "Departamento": { emoji: "🏢", color: "#1565C0" },
  "Terreno":      { emoji: "📐", color: "#795548" },
  "Local":        { emoji: "🏪", color: "#E65100" },
  "Quinta":       { emoji: "🌳", color: "#558B2F" },
  "Campo":        { emoji: "🌾", color: "#F9A825" },
  "Condo":        { emoji: "🏘️", color: "#6A1B9A" },
  "Rancho":       { emoji: "🏡", color: "#4E342E" },
};

function getTypeStyle(type?: string, op?: string) {
  if (type && TYPE_ICONS[type]) return TYPE_ICONS[type];
  return op === "alquiler"
    ? { emoji: "🏠", color: "#B48A73" }
    : { emoji: "🏠", color: "#2D3134" };
}

export default function PropiedadesMap({ pins }: { pins: PropPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const allTypes = Array.from(new Set(pins.map(p => p.type ?? "Otro"))).filter(Boolean);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(allTypes));
  const [activeOps, setActiveOps] = useState<Set<string>>(new Set(["venta", "alquiler"]));

  const visiblePins = pins.filter(p =>
    activeTypes.has(p.type ?? "Otro") && activeOps.has(p.op)
  );

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

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current) return;

      const lats = pins.map(p => p.lat);
      const lngs = pins.map(p => p.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      const map = L.map(mapRef.current).setView([centerLat, centerLng], pins.length === 1 ? 15 : 12);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, []);

  // Re-render markers cuando cambian filtros
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visiblePins.forEach(pin => {
      const { emoji, color } = getTypeStyle(pin.type, pin.op);
      const icon = L.divIcon({
        html: `<div style="
          background:${color};color:#fff;
          width:38px;height:38px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(0,0,0,0.35);
          border:2px solid rgba(255,255,255,0.7);
          font-size:16px;
        "><span style="transform:rotate(45deg)">${emoji}</span></div>`,
        className: "",
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -40],
      });

      const popup = `
        <div style="min-width:200px;font-family:sans-serif">
          ${pin.photo ? `<img src="${pin.photo}" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px" />` : ""}
          <div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">
            ${pin.type ?? ""} · ${pin.op === "venta" ? "Venta" : "Alquiler"}
          </div>
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;line-height:1.3">${pin.address}</div>
          ${pin.price ? `<div style="font-size:15px;font-weight:900;color:#2D3134;margin-bottom:10px">${pin.price}</div>` : ""}
          <a href="/propiedades/${pin.id}" style="
            display:block;text-align:center;padding:8px;
            background:#2D3134;color:#fff;border-radius:8px;
            font-weight:800;font-size:12px;text-decoration:none
          ">Ver propiedad →</a>
        </div>`;

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup, { maxWidth: 220 });

      markersRef.current.push(marker);
    });
  }, [activeTypes, activeOps, pins]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* Filtros */}
      <div style={{
        position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)",
        zIndex: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center",
        padding: "0 16px", maxWidth: "90vw",
      }}>
        {/* Operación */}
        {(["venta", "alquiler"] as const).map(op => (
          <button key={op} onClick={() => toggleOp(op)} style={{
            padding: "5px 12px", borderRadius: 999, border: "2px solid",
            borderColor: activeOps.has(op) ? "#2D3134" : "#ccc",
            background: activeOps.has(op) ? "#2D3134" : "#fff",
            color: activeOps.has(op) ? "#fff" : "#999",
            fontWeight: 800, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
          }}>
            {op === "venta" ? "Venta" : "Alquiler"}
          </button>
        ))}
        <div style={{ width: 1, background: "#ddd", margin: "0 4px" }} />
        {/* Tipos */}
        {allTypes.map(t => {
          const { emoji, color } = getTypeStyle(t);
          const active = activeTypes.has(t);
          return (
            <button key={t} onClick={() => toggleType(t)} style={{
              padding: "5px 12px", borderRadius: 999, border: "2px solid",
              borderColor: active ? color : "#ddd",
              background: active ? color : "#fff",
              color: active ? "#fff" : "#999",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
            }}>
              {emoji} {t}
            </button>
          );
        })}
      </div>

      {/* Contador */}
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
        zIndex: 10, background: "rgba(45,49,52,0.85)", color: "#fff",
        padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700,
        backdropFilter: "blur(4px)",
      }}>
        {visiblePins.length} propiedad{visiblePins.length !== 1 ? "es" : ""} visibles
      </div>

      <div ref={mapRef} style={{ flex: 1, width: "100%", minHeight: 0 }} />
    </div>
  );
}
