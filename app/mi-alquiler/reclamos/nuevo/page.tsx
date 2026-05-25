import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClaimAction } from "../../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "water_leak",  icon: "💧", label: "Pérdida de agua",     desc: "Canillas, cañerías, humedad por filtraciones" },
  { value: "electrical",  icon: "⚡", label: "Eléctrico",           desc: "Tomacorrientes, interruptores, cortocircuitos" },
  { value: "gas",         icon: "🔥", label: "Gas",                 desc: "Calefón, estufa, pérdida de gas" },
  { value: "structural",  icon: "🏗️", label: "Estructural",         desc: "Grietas, humedad, techos, paredes" },
  { value: "appliance",   icon: "🔌", label: "Electrodoméstico",    desc: "Heladera, aire acondicionado, lavarropas" },
  { value: "security",    icon: "🔒", label: "Seguridad",           desc: "Cerradura, puerta, ventana, rejas" },
  { value: "pest",        icon: "🐛", label: "Plagas",              desc: "Cucarachas, ratas, insectos" },
  { value: "heating",     icon: "🌡️", label: "Calefacción",         desc: "Caldera, radiadores, split" },
  { value: "humidity",    icon: "💦", label: "Humedad",             desc: "Manchas de humedad, goteras" },
  { value: "other",       icon: "📋", label: "Otro",                desc: "Cualquier otro tipo de problema" },
];

export default async function NuevoReclamoPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler/reclamos/nuevo");

  const admin = createSupabaseAdminClient();

  // Obtener el contrato activo del inquilino
  const { data: contract } = await admin
    .from("rental_contracts")
    .select("id, reference_code, status, properties(title, city)")
    .eq("tenant_id", data.user.id)
    .in("status", ["active", "pending_admin", "pending_tenant"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contract) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#2D3134" }}>
          Sin contrato activo
        </h2>
        <p style={{ color: "#888" }}>Para reportar un reclamo necesitás tener un contrato vigente.</p>
      </div>
    );
  }

  const prop = (contract as any).properties;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/mi-alquiler/reclamos" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>
          ← Volver a reclamos
        </a>
        <h1 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 900, color: "#2D3134" }}>
          Nuevo reclamo
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
          {prop?.title ?? "Tu propiedad"} · {prop?.city ?? ""}
        </p>
      </div>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={createClaimAction}>
        <input type="hidden" name="contract_id" value={contract.id} />

        {/* Categoría */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "20px 22px", marginBottom: 14 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#2D3134", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
            🗂️ Tipo de problema
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {CATEGORIES.map(c => (
              <label key={c.value} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#f9f9f9", borderRadius: 12, padding: "12px 14px",
                cursor: "pointer", border: "2px solid transparent",
              }}>
                <input type="radio" name="category" value={c.value} required
                  style={{ accentColor: "#B48A73" }}
                  defaultChecked={c.value === "other"}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#2D3134" }}>
                    {c.icon} {c.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{c.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Prioridad */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "20px 22px", marginBottom: 14 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#2D3134", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
            🚨 Urgencia
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { value: "low",    label: "Baja",     color: "#f3f4f6",  text: "#555",    desc: "No es urgente" },
              { value: "medium", label: "Media",    color: "#fef3c7",  text: "#b45309", desc: "Dentro de la semana" },
              { value: "high",   label: "Alta",     color: "#fee2e2",  text: "#dc2626", desc: "Cuanto antes" },
              { value: "urgent", label: "URGENTE",  color: "#ede9fe",  text: "#7c3aed", desc: "Hoy o mañana" },
            ].map(p => (
              <label key={p.value} style={{ textAlign: "center", cursor: "pointer" }}>
                <input type="radio" name="priority" value={p.value}
                  defaultChecked={p.value === "medium"}
                  style={{ display: "none" }}
                />
                <div style={{
                  background: p.color, borderRadius: 12, padding: "12px 8px",
                  border: "2px solid transparent",
                }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: p.text }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: p.text, opacity: 0.8, marginTop: 2 }}>{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Detalles */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "20px 22px", marginBottom: 14 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#2D3134", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
            📝 Detalles del problema
          </h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Título del problema *
            </label>
            <input
              className="input"
              type="text"
              name="title"
              required
              placeholder="Ej: Pérdida de agua en la cocina"
              maxLength={150}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Descripción detallada
            </label>
            <textarea
              className="input"
              name="description"
              rows={5}
              placeholder="Describí en detalle el problema: cuándo comenzó, con qué frecuencia ocurre, si ya lo intentaste resolver, etc."
              style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Ubicación en la vivienda
            </label>
            <input
              className="input"
              type="text"
              name="location"
              placeholder="Ej: Baño principal, Cocina, Habitación 2..."
              maxLength={100}
            />
          </div>
        </div>

        {/* Aviso */}
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          fontSize: 12, color: "#92400e",
        }}>
          💡 Te responderemos a la brevedad. Para problemas urgentes de gas o riesgo eléctrico, llamá directamente a los servicios de emergencia antes de enviar el reclamo.
        </div>

        <button type="submit" style={{
          background: "#2D3134", color: "#fff", border: "none",
          borderRadius: 14, padding: "16px 0", width: "100%",
          fontWeight: 900, fontSize: 16, cursor: "pointer",
        }}>
          Enviar reclamo →
        </button>
      </form>
    </div>
  );
}
