import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_CATEGORIES: Record<string, string> = {
  water_leak:  "💧 Pérdida de agua",
  electrical:  "⚡ Eléctrico",
  gas:         "🔥 Gas",
  structural:  "🏗️ Estructural",
  appliance:   "🔌 Electrodoméstico",
  security:    "🔒 Seguridad",
  pest:        "🐛 Plagas",
  cleaning:    "🧹 Limpieza",
  heating:     "🌡️ Calefacción",
  humidity:    "💦 Humedad",
  other:       "📋 Otro",
};

const CLAIM_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Abierto",     bg: "#fee2e2", color: "#dc2626" },
  in_progress: { label: "En gestión", bg: "#dbeafe", color: "#1d4ed8" },
  waiting:     { label: "Esperando",  bg: "#fef3c7", color: "#b45309" },
  resolved:    { label: "Resuelto",   bg: "#dcfce7", color: "#15803d" },
  closed:      { label: "Cerrado",    bg: "#f3f4f6", color: "#555" },
};

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",    color: "#888" },
  medium: { label: "Media",  color: "#b45309" },
  high:   { label: "Alta",   color: "#dc2626" },
  urgent: { label: "URGENTE",color: "#7c3aed" },
};

export default async function MisReclamosPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler/reclamos");

  const admin = createSupabaseAdminClient();

  // Obtener contratos del inquilino
  const { data: contracts } = await admin
    .from("rental_contracts")
    .select("id")
    .eq("tenant_id", data.user.id);

  const contractIds = (contracts ?? []).map(c => c.id);

  const { data: claims } = await admin
    .from("rental_claims")
    .select("*")
    .in("contract_id", contractIds)
    .order("created_at", { ascending: false });

  const rows = claims ?? [];
  const openCount = rows.filter(r => !["resolved", "closed"].includes(r.status)).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Mi alquiler
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "#2D3134" }}>Mis reclamos</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
            {openCount > 0
              ? `Tenés ${openCount} reclamo${openCount > 1 ? "s" : ""} activo${openCount > 1 ? "s" : ""}.`
              : "No tenés reclamos activos."}
          </p>
        </div>
        <Link
          href="/mi-alquiler/reclamos/nuevo"
          style={{
            marginLeft: "auto",
            background: "#2D3134", color: "#fff", textDecoration: "none",
            padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14,
          }}
        >
          + Nuevo reclamo
        </Link>
      </div>

      {searchParams?.ok && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ✅ {decodeURIComponent(searchParams.ok)}
        </div>
      )}
      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #eee",
          padding: "60px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔧</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#2D3134" }}>
            Sin reclamos registrados
          </h2>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>
            ¿Hay algo que no funciona bien en tu vivienda? Reportalo y lo gestionaremos a la brevedad.
          </p>
          <Link href="/mi-alquiler/reclamos/nuevo" style={{
            background: "#2D3134", color: "#fff", textDecoration: "none",
            padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          }}>
            Reportar un problema
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map(claim => {
            const st  = CLAIM_STATUS[claim.status]   ?? CLAIM_STATUS.open;
            const pri = PRIORITY_BADGE[claim.priority] ?? PRIORITY_BADGE.medium;
            return (
              <div key={claim.id} style={{
                background: "#fff", borderRadius: 16, border: "1px solid #eee",
                padding: "20px 22px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    {/* Categoría + prioridad */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>
                        {CLAIM_CATEGORIES[claim.category] ?? "📋 Otro"}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: pri.color }}>
                        [{pri.label}]
                      </span>
                    </div>

                    {/* Título */}
                    <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#2D3134" }}>
                      {claim.title}
                    </h3>

                    {/* Descripción */}
                    {claim.description && (
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                        {claim.description}
                      </p>
                    )}

                    {/* Descripción ya incluye ubicación si la ingresaron */}

                    {/* Respuesta del admin */}
                    {claim.admin_notes && (
                      <div style={{
                        background: "#f0f9ff", border: "1px solid #bae6fd",
                        borderRadius: 10, padding: "10px 14px", marginTop: 10,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", marginBottom: 4 }}>
                          💬 Respuesta de la inmobiliaria:
                        </div>
                        <div style={{ fontSize: 13, color: "#0c4a6e" }}>{claim.admin_notes}</div>
                        {claim.scheduled_for && (
                          <div style={{ fontSize: 12, color: "#0369a1", marginTop: 6, fontWeight: 700 }}>
                            🗓️ Visita programada: {claim.scheduled_for}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fecha */}
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>
                      Reportado el {new Date(claim.created_at).toLocaleDateString("es-AR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                      {claim.resolved_at && ` · Resuelto el ${new Date(claim.resolved_at).toLocaleDateString("es-AR")}`}
                    </div>
                  </div>

                  {/* Estado */}
                  <span style={{
                    background: st.bg, color: st.color,
                    padding: "6px 12px", borderRadius: 999,
                    fontWeight: 800, fontSize: 12,
                    whiteSpace: "nowrap",
                  }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
