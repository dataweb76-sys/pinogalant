"use client";
import { useState } from "react";

export default function MortgageCalc({ priceUSD }: { priceUSD?: number }) {
  const [precio, setPrecio] = useState(priceUSD ? Math.round(priceUSD * 1050) : 50000000);
  const [anios, setAnios] = useState(20);
  const [tasa, setTasa] = useState(8.5);

  const r = tasa / 100 / 12;
  const n = anios * 12;
  const cuota = r === 0 ? precio / n : (precio * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPagado = cuota * n;

  function fmt(n: number) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: "#2D3134", marginBottom: 14 }}>
        🏦 Calculadora hipotecaria
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 4 }}>
            Precio (ARS)
          </label>
          <input
            type="number"
            value={precio}
            onChange={e => setPrecio(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd",
              fontSize: 14, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 4 }}>
              Plazo (años)
            </label>
            <select value={anios} onChange={e => setAnios(Number(e.target.value))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}>
              {[5, 10, 15, 20, 25, 30].map(a => <option key={a} value={a}>{a} años</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 4 }}>
              Tasa anual (%)
            </label>
            <input type="number" step="0.1" value={tasa} onChange={e => setTasa(Number(e.target.value))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ background: "#F3EDE7", borderRadius: 12, padding: "14px 16px", marginTop: 4 }}>
          <div style={{ fontSize: 11, color: "#B48A73", fontWeight: 700, marginBottom: 4 }}>Cuota mensual estimada</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#2D3134", letterSpacing: -1 }}>
            {fmt(cuota)}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
            Total a pagar: {fmt(totalPagado)} · Intereses: {fmt(totalPagado - precio)}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>
          Estimación orientativa. Consultá con tu banco las condiciones reales.
        </p>
      </div>
    </div>
  );
}
