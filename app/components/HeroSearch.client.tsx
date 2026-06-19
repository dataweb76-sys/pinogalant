"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BusquedaSuenos from "./BusquedaSuenos.client";

type TypeOption = { id: string; label: string };

type Props = {
  types: TypeOption[];
  provincias: string[];
  localidadesPorProvincia: Record<string, string[]>;
};

export default function HeroSearch({ types, provincias, localidadesPorProvincia }: Props) {
  const router = useRouter();
  const [tipo, setTipo]           = useState("");
  const [op, setOp]               = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");

  const localidades = provincia ? (localidadesPorProvincia[provincia] ?? []) : [];

  function handleSearch() {
    const params = new URLSearchParams();
    if (op)        params.set("op", op);
    if (tipo)      params.set("type", tipo);
    if (localidad) params.set("q", localidad);
    else if (provincia) params.set("q", provincia);
    router.push(`/propiedades?${params.toString()}`);
  }

  const selectStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.09)",
    color: "#fff",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  return (
    <>
      <div className="hero-search">
        {/* Fila 1: Tipo + Operación */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <select style={selectStyle} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Cualquier propiedad</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <select style={selectStyle} value={op} onChange={e => setOp(e.target.value)}>
            <option value="">Venta o Alquiler</option>
            <option value="venta">En Venta</option>
            <option value="alquiler">En Alquiler</option>
          </select>
        </div>

        {/* Fila 2: Provincia + Localidad + Buscar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            style={selectStyle}
            value={provincia}
            onChange={e => { setProvincia(e.target.value); setLocalidad(""); }}
          >
            <option value="">Todas las provincias</option>
            {provincias.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            style={{ ...selectStyle, opacity: localidades.length ? 1 : 0.45 }}
            value={localidad}
            onChange={e => setLocalidad(e.target.value)}
            disabled={!localidades.length}
          >
            <option value="">Todas las localidades</option>
            {localidades.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <button className="hero-search-btn" onClick={handleSearch} style={{ flexShrink: 0 }}>
            🔍 Buscar
          </button>
        </div>
      </div>
      <BusquedaSuenos />
    </>
  );
}
