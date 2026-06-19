"use client";
import { useEffect, useState } from "react";

type Lugar = { name: string; type: string; dist: number };

const CATEGORIAS: Record<string, { label: string; icon: string; tags: string }> = {
  school:       { label: "Educación",    icon: "🏫", tags: '["amenity"="school"]["amenity"="kindergarten"]["amenity"="university"]' },
  supermarket:  { label: "Supermercados",icon: "🛒", tags: '["shop"="supermarket"]["shop"="convenience"]' },
  park:         { label: "Plazas/Parques",icon:"🌳", tags: '["leisure"="park"]["leisure"="playground"]' },
  health:       { label: "Salud",        icon: "🏥", tags: '["amenity"="hospital"]["amenity"="clinic"]["amenity"="pharmacy"]' },
  transport:    { label: "Transporte",   icon: "🚌", tags: '["highway"="bus_stop"]["amenity"="bus_station"]' },
  bank:         { label: "Bancos/ATM",   icon: "🏦", tags: '["amenity"="bank"]["amenity"="atm"]' },
};

function distancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function ElBarrio({ lat, lng }: { lat: number; lng: number }) {
  const [lugares, setLugares] = useState<Record<string, Lugar[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("school");

  useEffect(() => {
    const radio = 800; // metros
    const query = `
[out:json][timeout:10];
(
  node["amenity"~"school|kindergarten|university|hospital|clinic|pharmacy|bank|atm|bus_station"](around:${radio},${lat},${lng});
  node["shop"~"supermarket|convenience"](around:${radio},${lat},${lng});
  node["leisure"~"park|playground"](around:${radio},${lat},${lng});
  node["highway"="bus_stop"](around:${radio},${lat},${lng});
  way["leisure"~"park"](around:${radio},${lat},${lng});
)->._;
out body center;
`;
    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
      .then(r => r.json())
      .then(data => {
        const result: Record<string, Lugar[]> = {};
        for (const el of data.elements ?? []) {
          const tags = el.tags ?? {};
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) continue;
          const dist = distancia(lat, lng, elLat, elLng);
          const name = tags.name ?? tags["name:es"] ?? null;
          if (!name) continue;

          let cat = "";
          if (["school","kindergarten","university"].includes(tags.amenity)) cat = "school";
          else if (["hospital","clinic","pharmacy"].includes(tags.amenity)) cat = "health";
          else if (["bank","atm"].includes(tags.amenity)) cat = "bank";
          else if (tags.amenity === "bus_station" || tags.highway === "bus_stop") cat = "transport";
          else if (["supermarket","convenience"].includes(tags.shop)) cat = "supermarket";
          else if (["park","playground"].includes(tags.leisure)) cat = "park";
          else continue;

          if (!result[cat]) result[cat] = [];
          if (result[cat].length < 5) {
            result[cat].push({ name, type: cat, dist });
          }
        }
        // Ordenar por distancia
        for (const cat of Object.keys(result)) {
          result[cat].sort((a, b) => a.dist - b.dist);
        }
        setLugares(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lat, lng]);

  const tabs = Object.keys(CATEGORIAS).filter(k => (lugares[k]?.length ?? 0) > 0 || loading);

  if (!loading && Object.keys(lugares).length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>El barrio</h2>

      {loading ? (
        <div style={{ background: "#f9f6f3", borderRadius: 14, padding: 24, textAlign: "center", color: "#aaa", fontSize: 13 }}>
          Cargando servicios cercanos…
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #eee" }}>
            {Object.entries(CATEGORIAS).filter(([k]) => lugares[k]?.length > 0).map(([key, cat]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ padding: "10px 14px", border: "none", background: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 12, whiteSpace: "nowrap",
                  borderBottom: activeTab === key ? "2px solid #B48A73" : "2px solid transparent",
                  color: activeTab === key ? "#B48A73" : "#888" }}>
                {cat.icon} {cat.label}
                <span style={{ marginLeft: 5, background: "#F3EDE7", color: "#B48A73",
                  fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 999 }}>
                  {lugares[key]?.length}
                </span>
              </button>
            ))}
          </div>

          {/* Lista */}
          <div style={{ padding: "4px 0" }}>
            {(lugares[activeTab] ?? []).map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 16px", borderBottom: i < (lugares[activeTab]?.length - 1) ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 12 }}>
                  {l.dist < 1000 ? `${l.dist} m` : `${(l.dist/1000).toFixed(1)} km`}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: "8px 16px 10px", fontSize: 10, color: "#ccc" }}>
            Datos: OpenStreetMap · Radio {800}m
          </div>
        </div>
      )}
    </div>
  );
}
