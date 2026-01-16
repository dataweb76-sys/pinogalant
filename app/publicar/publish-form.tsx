"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function PublishForm() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      operation: String(fd.get("operation") || "venta"),
      type: String(fd.get("type") || "depto"),
      title: String(fd.get("title") || ""),
      neighborhood: String(fd.get("neighborhood") || ""),
      city: String(fd.get("city") || ""),
      price_ars: fd.get("price_ars") ? Number(fd.get("price_ars")) : null,
      price_usd: fd.get("price_usd") ? Number(fd.get("price_usd")) : null,
      status: "en_revision",
    };

    const { error } = await supabase.from("properties").insert(payload);
    if (error) setMsg(error.message);
    else {
      setMsg("✅ Publicación enviada. Quedó en revisión.");
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <div className="row">
        <div>
          <label className="small">Operación</label>
          <select className="input" name="operation" defaultValue="venta">
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </div>
        <div>
          <label className="small">Tipo</label>
          <select className="input" name="type" defaultValue="depto">
            <option value="casa">Casa</option>
            <option value="depto">Departamento</option>
            <option value="terreno">Terreno</option>
            <option value="local">Local</option>
            <option value="oficina">Oficina</option>
          </select>
        </div>
      </div>

      <div>
        <label className="small">Título</label>
        <input className="input" name="title" placeholder="Ej: Depto 2 amb con balcón" required />
      </div>

      <div className="row">
        <div>
          <label className="small">Ciudad</label>
          <input className="input" name="city" placeholder="San Juan" />
        </div>
        <div>
          <label className="small">Barrio / Zona</label>
          <input className="input" name="neighborhood" placeholder="Capital" />
        </div>
      </div>

      <div className="row">
        <div>
          <label className="small">Precio ARS (opcional)</label>
          <input className="input" name="price_ars" inputMode="numeric" />
        </div>
        <div>
          <label className="small">Precio USD (opcional)</label>
          <input className="input" name="price_usd" inputMode="numeric" />
        </div>
      </div>

      <button className="btn btnPrimary" disabled={loading}>
        {loading ? "Enviando..." : "Enviar a revisión"}
      </button>

      {msg ? <p className="small">{msg}</p> : null}
    </form>
  );
}
