"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function PropertyInquiryForm({ propertyId }: { propertyId: string }) {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      property_id: propertyId,
      name: data.get("name") as string,
      email: data.get("email") as string,
      phone: data.get("phone") as string,
      message: data.get("message") as string,
      status: "nuevo",
    };

    const { error } = await supabase
      .from("property_inquiries")
      .insert(payload);

    if (error) {
      setError("No se pudo enviar la consulta. Intente nuevamente.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    form.reset();
  }

  if (sent) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <strong>✅ Consulta enviada</strong>
        <p style={{ marginTop: 8 }}>
          Un agente se va a comunicar con vos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ padding: 24, display: "grid", gap: 12 }}
    >
      <h3 style={{ margin: 0 }}>Dejar consulta</h3>

      <input name="name" required placeholder="Nombre" className="input" />
      <input name="email" type="email" required placeholder="Email" className="input" />
      <input name="phone" placeholder="Teléfono" className="input" />

      <textarea
        name="message"
        required
        placeholder="Mensaje"
        rows={4}
        className="input"
      />

      {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}

      <button
        className="btn btnPrimary"
        disabled={loading}
        type="submit"
      >
        {loading ? "Enviando..." : "Enviar consulta"}
      </button>
    </form>
  );
}
