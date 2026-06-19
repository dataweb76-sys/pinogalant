"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BusquedaSuenos from "./BusquedaSuenos.client";

export default function HeroSearch() {
  const router = useRouter();
  const [operation, setOperation] = useState<"venta" | "alquiler">("venta");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    params.set("operation", operation);
    if (type) params.set("type", type);
    if (query) params.set("q", query);
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <>
    <div className="hero-search">
      <div className="hero-search-tabs">
        <button
          className={`hero-tab${operation === "venta" ? " active" : ""}`}
          onClick={() => setOperation("venta")}
        >
          Comprar
        </button>
        <button
          className={`hero-tab${operation === "alquiler" ? " active" : ""}`}
          onClick={() => setOperation("alquiler")}
        >
          Alquilar
        </button>
      </div>

      <div className="hero-search-row">
        <input
          className="hero-search-input"
          placeholder="Ciudad, barrio o zona..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <select
          className="hero-search-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tipo de propiedad</option>
          <option value="3">Casa</option>
          <option value="2">Departamento</option>
          <option value="1">Terreno</option>
          <option value="7">Local comercial</option>
          <option value="4">Quinta</option>
          <option value="9">Campo</option>
        </select>
        <button className="hero-search-btn" onClick={handleSearch}>
          🔍 Buscar
        </button>
      </div>
    </div>
    <BusquedaSuenos />
    </>
  );
}
