"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContratoFirmaClient({ contractId }: { contractId: string }) {
  const [loading, setLoading]   = useState(false);
  const [checked, setChecked]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const router = useRouter();

  async function handleSign() {
    if (!checked) {
      setError("Debés confirmar que leíste y aceptás el contrato.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alquileres/aceptar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contractId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al firmar");
      router.push("/mi-alquiler?ok=Contrato+firmado+exitosamente.+La+inmobiliaria+lo+activará+en+breve.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          style={{ marginTop: 2, accentColor: "#15803d", width: 16, height: 16, flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
          Leí el contrato completo y acepto todas sus cláusulas. Entiendo que esta firma digital tiene validez legal
          equivalente a la firma manuscrita, registrándose mi dirección IP y la fecha/hora actual.
        </span>
      </label>

      {error && (
        <div style={{
          background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c",
          padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12,
        }}>
          ❌ {error}
        </div>
      )}

      <button
        onClick={handleSign}
        disabled={loading}
        style={{
          background: loading ? "#9ca3af" : "#15803d",
          color: "#fff", border: "none",
          borderRadius: 12, padding: "14px 28px",
          fontWeight: 900, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
          width: "100%",
          transition: "background .2s",
        }}
      >
        {loading ? "Firmando..." : "✍️ Aceptar y firmar el contrato"}
      </button>
    </div>
  );
}
