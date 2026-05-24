"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
          <option value="casa">Casa</option>
          <option value="depto">Departamento</option>
          <option value="terreno">Terreno</option>
          <option value="local">Local comercial</option>
          <option value="oficina">Oficina</option>
          <option value="campo">Campo / Chacra</option>
        </select>
        <button className="hero-search-btn" onClick={handleSearch}>
          🔍 Buscar
        </button>
      </div>
    </div>
  );
}
