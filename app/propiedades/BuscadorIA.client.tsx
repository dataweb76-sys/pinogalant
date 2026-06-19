"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuscadorIA() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/buscar-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const filters = await res.json();

      const params = new URLSearchParams();
      if (filters.op) params.set("op", filters.op);
      if (filters.type) params.set("type", filters.type);
      if (filters.price_min) params.set("price_min", String(filters.price_min));
      if (filters.price_max) params.set("price_max", String(filters.price_max));
      if (filters.q) params.set("q", filters.q);

      router.push(`/propiedades?${params.toString()}`);
    } catch {
      setError("No se pudo procesar la búsqueda. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      borderRadius: 12,
      background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
      padding: "14px 16px",
    }}>
      <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
        ✨ Buscá con palabras naturales — IA
      </p>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ej: "casa con patio, 3 dormitorios, menos de 100 mil dólares"'
          disabled={loading}
          style={{
            flex: 1,
            minWidth: 200,
            borderRadius: 8,
            border: "none",
            padding: "10px 14px",
            fontSize: 13,
            color: "#111",
            background: "#fff",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            borderRadius: 8,
            border: "none",
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            cursor: loading || !query.trim() ? "not-allowed" : "pointer",
            opacity: loading || !query.trim() ? 0.6 : 1,
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Buscando…" : "Buscar con IA"}
        </button>
      </form>
      {error && (
        <p style={{ margin: "8px 0 0", color: "#fca5a5", fontSize: 12 }}>{error}</p>
      )}
    </div>
  );
}
