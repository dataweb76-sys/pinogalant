"use client";
import { useEffect, useRef } from "react";

type PropPin = {
  id: number;
  address: string;
  lat: number;
  lng: number;
  price?: string;
  op: string;
};

export default function PropiedadesMap({ pins }: { pins: PropPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

    // Cargar Leaflet dinámicamente
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current) return;

      const center = pins.length === 1
        ? [pins[0].lat, pins[0].lng]
        : [pins.reduce((s, p) => s + p.lat, 0) / pins.length, pins.reduce((s, p) => s + p.lng, 0) / pins.length];

      const map = L.map(mapRef.current).setView(center, pins.length === 1 ? 15 : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      pins.forEach(pin => {
        const icon = L.divIcon({
          html: `<div style="background:${pin.op === "venta" ? "#2D3134" : "#B48A73"};color:#fff;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${pin.price ?? pin.op}</div>`,
          className: "",
          iconAnchor: [0, 0],
        });
        L.marker([pin.lat, pin.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${pin.address}</b><br><a href="/propiedades/${pin.id}" style="color:#B48A73;font-weight:700">Ver propiedad →</a>`);
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
    };
  }, [pins]);

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
  );
}
