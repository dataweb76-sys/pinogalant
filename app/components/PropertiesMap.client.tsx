"use client";
import { useEffect, useRef } from "react";

type MapPin = {
  id: number;
  address: string;
  lat: number;
  lng: number;
  price: string;
  op: string;
  url: string;
};

export default function PropertiesMap({ pins }: { pins: MapPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current || pins.length === 0) return;

    // Carga Leaflet dinámicamente
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      const map = L.map(mapRef.current, { scrollWheelZoom: false });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          background:#B48A73; color:#fff; font-weight:900; font-size:12px;
          padding:5px 9px; border-radius:20px; white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.25); border:2px solid #fff;
          cursor:pointer;">PG</div>`,
        iconAnchor: [20, 16],
      });

      const group = L.featureGroup();
      pins.forEach((pin) => {
        const marker = L.marker([pin.lat, pin.lng], { icon });
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:180px">
            <div style="font-weight:800; font-size:13px; margin-bottom:4px">${pin.address}</div>
            <div style="font-size:12px; color:#B48A73; font-weight:700; margin-bottom:6px">${pin.price}</div>
            <a href="${pin.url}" style="
              display:block; text-align:center; padding:6px 0;
              background:#2D3134; color:#fff; text-decoration:none;
              border-radius:8px; font-weight:700; font-size:12px;">
              Ver propiedad →
            </a>
          </div>
        `);
        marker.addTo(map);
        group.addLayer(marker);
      });

      if (pins.length === 1) {
        map.setView([pins[0].lat, pins[0].lng], 14);
      } else {
        map.fitBounds(group.getBounds(), { padding: [40, 40] });
      }
    };
    document.head.appendChild(script);

    return () => {};
  }, [pins]);

  if (pins.length === 0) return null;

  return (
    <div ref={mapRef} style={{ width: "100%", height: 420, borderRadius: 16, overflow: "hidden", zIndex: 0 }} />
  );
}
