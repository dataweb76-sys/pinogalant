import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditoriaPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/auditoria");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", data.user.id).maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) redirect("/");

  const { data: waLeads } = await admin
    .from("whatsapp_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const ahora = Date.now();
  const ayer = ahora - 86400000;
  const semana = ahora - 7 * 86400000;

  // Stats de los últimos 7 días
  const waUltimaSemana = (waLeads ?? []).filter((l: any) => new Date(l.created_at).getTime() > semana);
  const waHoy = (waLeads ?? []).filter((l: any) => new Date(l.created_at).getTime() > ayer);

  // Agrupar WA por día (últimos 7 días)
  const porDia: Record<string, number> = {};
  waUltimaSemana.forEach((l: any) => {
    const dia = new Date(l.created_at).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    porDia[dia] = (porDia[dia] || 0) + 1;
  });

  // Top agentes contactados
  const porAgente: Record<string, number> = {};
  (waLeads ?? []).forEach((l: any) => {
    const k = l.agent_name ?? "Inmobiliaria";
    porAgente[k] = (porAgente[k] || 0) + 1;
  });

  const topAgentes = Object.entries(porAgente).sort(([,a],[,b]) => b - a).slice(0, 5);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Resumen de actividad
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#2D3134" }}>Auditoría</h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Consultas WA hoy", value: waHoy.length, alert: waHoy.length > 0 },
          { label: "Consultas WA esta semana", value: waUltimaSemana.length, alert: false },
          { label: "Total registros", value: (waLeads ?? []).length, alert: false },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.alert ? "#fef3c7" : "#fff",
            border: s.alert ? "1.5px solid #f59e0b" : "1px solid #eee",
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#2D3134", letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start", marginBottom: 28 }}>

        {/* Actividad por día */}
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#2D3134", margin: "0 0 16px" }}>
            Consultas WA — últimos 7 días
          </h2>
          {Object.keys(porDia).length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 13 }}>Sin actividad esta semana</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {Object.entries(porDia).map(([dia, cant]) => (
                <div key={dia} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "#666", width: 100, flexShrink: 0 }}>{dia}</div>
                  <div style={{ flex: 1, background: "#f3f3f3", borderRadius: 999, height: 8 }}>
                    <div style={{
                      background: "#B48A73", borderRadius: 999, height: 8,
                      width: `${Math.min(100, (cant / Math.max(...Object.values(porDia))) * 100)}%`
                    }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2D3134", width: 20, textAlign: "right" }}>{cant}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top agentes */}
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#2D3134", margin: "0 0 16px" }}>
            Agentes más consultados
          </h2>
          {topAgentes.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 13 }}>Sin datos</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {topAgentes.map(([agente, cant], i) => (
                <div key={agente} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2D3134" }}>
                    <span style={{ color: "#B48A73", fontWeight: 800, marginRight: 6 }}>#{i + 1}</span>
                    {agente}
                  </div>
                  <span style={{ background: "#F3EDE7", color: "#B48A73", fontWeight: 800,
                    fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>
                    {cant}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas 20 consultas WA */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#2D3134", margin: 0 }}>Log de consultas recientes</h2>
          <Link href="/admin/consultas" style={{ fontSize: 12, fontWeight: 700, color: "#B48A73", textDecoration: "none" }}>
            Ver panel completo →
          </Link>
        </div>
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["Visitante", "Propiedad", "Agente", "Hora"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                    color: "#888", letterSpacing: 0.5, textTransform: "uppercase",
                    borderBottom: "1px solid #eee" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(waLeads ?? []).slice(0, 20).map((l: any, i: number, arr: any[]) => {
                const esReciente = new Date(l.created_at).getTime() > ayer;
                return (
                  <tr key={l.id} style={{ borderBottom: i < arr.length - 1 ? "1px solid #f3f3f3" : "none" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        {l.visitor_name ?? "Anónimo"}
                        {esReciente && <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e",
                          padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>NUEVO</span>}
                      </div>
                      {l.visitor_phone && <div style={{ fontSize: 11, color: "#25D366" }}>{l.visitor_phone}</div>}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#555", maxWidth: 200,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.property_address ?? "General"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#555" }}>
                      {l.agent_name ?? "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>
                      {new Date(l.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      {" "}
                      {new Date(l.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
              {(waLeads ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                    Sin actividad registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
