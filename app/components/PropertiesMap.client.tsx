"use client";
import { useEffect, useRef, useState } from "react";

type MapPin = {
  id: number;
  address: string;
  lat: number;
  lng: number;
  price: string;
  op: string;
  url: string;
  type?: string;
  photo?: string;
};

const TYPE_TRANSLATE: Record<string, string> = {
  "Countryside": "Campo", "Ranch": "Chacra", "Condo": "Departamento",
  "Bussiness Premises": "Local", "Business Premises": "Local",
  "House": "Casa", "Apartment": "Departamento", "Land": "Terreno",
  "Office": "Oficina", "Warehouse": "Depósito",
};

const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  "Casa":         { emoji: "🏠", color: "#1e6b3c" },
  "Departamento": { emoji: "🏢", color: "#1565C0" },
  "Terreno":      { emoji: "📐", color: "#795548" },
  "Local":        { emoji: "🏪", color: "#E65100" },
  "Quinta":       { emoji: "🌳", color: "#558B2F" },
  "Campo":        { emoji: "🌾", color: "#c47f00" },
  "Chacra":       { emoji: "🌿", color: "#4E342E" },
  "Oficina":      { emoji: "🏛️", color: "#37474F" },
  "Depósito":     { emoji: "🏗️", color: "#546E7A" },
};

function translate(type?: string) {
  if (!type) return "Otro";
  return TYPE_TRANSLATE[type] ?? type;
}

function getStyle(type?: string) {
  const t = translate(type);
  return TYPE_ICONS[t] ?? { emoji: "🏠", color: "#B48A73" };
}

export default function PropertiesMap({ pins }: { pins: MapPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  const allTypes = Array.from(new Set(pins.map(p => translate(p.type)))).filter(Boolean);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(() => new Set(allTypes));
  const [activeOps, setActiveOps] = useState<Set<string>>(() => new Set(["venta", "alquiler"]));

  // Cargar Leaflet e inicializar mapa
  useEffect(() => {
    if (typeof window === "undefined" || pins.length === 0) return;

    const init = () => {
      if (!mapRef.current || mapInstance.current) return;
      const L = (window as any).L;

      const map = L.map(mapRef.current, { scrollWheelZoom: true });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Centrar en todas las propiedades
      const lats = pins.map(p => p.lat);
      const lngs = pins.map(p => p.lng);
      if (pins.length === 1) {
        map.setView([lats[0], lngs[0]], 14);
      } else {
        map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [40, 40] });
      }

      setReady(true);
    };

    if ((window as any).L) { init(); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = init;
    document.head.appendChild(script);
  }, []);

  // Re-dibujar markers cuando cambian filtros
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const visible = pins.filter(p =>
      activeTypes.has(translate(p.type)) && activeOps.has(p.op)
    );

    visible.forEach(pin => {
      const typeEs = translate(pin.type);
      const { emoji, color } = getStyle(pin.type);
      const icon = L.divIcon({
        html: `<div style="
          background:${color};width:36px;height:36px;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2px solid rgba(255,255,255,0.85);
          font-size:15px;">
          <span style="transform:rotate(45deg);display:block">${emoji}</span>
        </div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      const popup = `
        <div style="min-width:190px;font-family:sans-serif;padding:2px">
          ${pin.photo ? `<img src="${pin.photo}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block"/>` : ""}
          <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">
            ${typeEs} · ${pin.op === "venta" ? "Venta" : "Alquiler"}
          </div>
          <div style="font-weight:700;font-size:13px;margin-bottom:5px;line-height:1.3;color:#1a1a1a">${pin.address}</div>
          <div style="font-size:15px;font-weight:900;color:#2D3134;margin-bottom:10px">${pin.price}</div>
          <a href="${pin.url}" style="display:block;text-align:center;padding:8px;background:#2D3134;color:#fff;border-radius:8px;font-weight:800;font-size:12px;text-decoration:none">
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
    setActiveTypes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }
  function toggleOp(op: string) {
    setActiveOps(prev => { const n = new Set(prev); n.has(op) ? n.delete(op) : n.add(op); return n; });
  }

  const visibleCount = pins.filter(p => activeTypes.has(translate(p.type)) && activeOps.has(p.op)).length;

  if (pins.length === 0) return null;

  return (
    <div>
      {/* Filtros FUERA del mapa */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        marginBottom: 14, padding: "10px 14px",
        background: "#f8f8f8", borderRadius: 12, border: "1px solid #eee",
      }}>
        {(["venta", "alquiler"] as const).map(op => (
          <button key={op} onClick={() => toggleOp(op)} style={{
            padding: "6px 14px", borderRadius: 999,
            border: `2px solid ${activeOps.has(op) ? "#2D3134" : "#ddd"}`,
            background: activeOps.has(op) ? "#2D3134" : "#fff",
            color: activeOps.has(op) ? "#fff" : "#aaa",
            fontWeight: 800, fontSize: 12, cursor: "pointer",
          }}>
            {op === "venta" ? "🏷️ Venta" : "🔑 Alquiler"}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: "#ddd" }} />

        {allTypes.map(t => {
          const { emoji, color } = getStyle(t);
          const active = activeTypes.has(t);
          return (
            <button key={t} onClick={() => toggleType(t)} style={{
              padding: "6px 14px", borderRadius: 999,
              border: `2px solid ${active ? color : "#ddd"}`,
              background: active ? color : "#fff",
              color: active ? "#fff" : "#aaa",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {emoji} {t}
            </button>
          );
        })}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#888", fontWeight: 700 }}>
          {visibleCount} propiedad{visibleCount !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Mapa */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
        <div ref={mapRef} style={{ width: "100%", height: 460 }} />
      </div>
    </div>
  );
}
