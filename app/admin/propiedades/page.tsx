import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllTokkoProperties } from "@/lib/tokko";

export const runtime = "nodejs";
export const revalidate = 300;

export default async function AdminPropiedadesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/propiedades");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", data.user.id).maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) redirect("/");

  const [tokkoProps, { data: assignments }, { data: waLeads }] = await Promise.all([
    getAllTokkoProperties().catch(() => []),
    admin.from("tokko_agent_assignments").select("tokko_id, agents(id, name, phone)"),
    admin.from("whatsapp_leads").select("property_id, created_at").order("created_at", { ascending: false }),
  ]);

  // Agente por propiedad
  const agentePorProp: Record<number, { name: string; phone: string }> = {};
  (assignments ?? []).forEach((a: any) => {
    if (a.agents) agentePorProp[a.tokko_id] = { name: a.agents.name, phone: a.agents.phone };
  });

  // Consultas WA por propiedad
  const consultasPorProp: Record<number, { total: number; ultima: string }> = {};
  (waLeads ?? []).forEach((l: any) => {
    if (!l.property_id) return;
    if (!consultasPorProp[l.property_id]) {
      consultasPorProp[l.property_id] = { total: 0, ultima: l.created_at };
    }
    consultasPorProp[l.property_id].total++;
  });

  const ahora = Date.now();
  const ayer = ahora - 86400000;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Tokko Broker
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#2D3134" }}>
            Propiedades ({tokkoProps.length})
          </h1>
        </div>
        <Link href="/admin/agentes" style={{
          background: "#2D3134", color: "#fff", textDecoration: "none",
          padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14,
        }}>
          Gestionar agentes →
        </Link>
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f8f8" }}>
              {["Propiedad", "Tipo / Operación", "Precio", "Agente asignado", "Consultas WA", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                  color: "#888", letterSpacing: 0.5, textTransform: "uppercase",
                  borderBottom: "1px solid #eee" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokkoProps.map((p: any, i: number) => {
              const agente = agentePorProp[p.id];
              const consultas = consultasPorProp[p.id];
              const tieneAlerta = consultas && new Date(consultas.ultima).getTime() > ayer;
              const foto = p.photos?.[0]?.image ?? null;

              return (
                <tr key={p.id} style={{
                  borderBottom: i < tokkoProps.length - 1 ? "1px solid #f3f3f3" : "none",
                  background: tieneAlerta ? "rgba(245,158,11,0.03)" : undefined,
                }}>
                  {/* Propiedad */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {foto ? (
                        <img src={foto} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 42, borderRadius: 8, background: "#f3f3f3", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 18 }}>🏠</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.address ?? `Propiedad #${p.id}`}
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{p.location?.name ?? ""}</div>
                      </div>
                    </div>
                  </td>

                  {/* Tipo / Operación */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {p.type?.name ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                      {p.operations?.map((o: any) => o.operation_type === 1 ? "Venta" : "Alquiler").join(" · ") ?? "—"}
                    </div>
                  </td>

                  {/* Precio */}
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#2D3134", whiteSpace: "nowrap" }}>
                    {p.operations?.[0]?.prices?.[0]
                      ? `${p.operations[0].prices[0].currency === 2 ? "USD" : "ARS"} ${Number(p.operations[0].prices[0].price).toLocaleString("es-AR")}`
                      : "—"}
                  </td>

                  {/* Agente */}
                  <td style={{ padding: "14px 16px" }}>
                    {agente ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{agente.name}</div>
                        <a href={`https://wa.me/${agente.phone?.replace(/\D/g,"")}` }
                          target="_blank" style={{ fontSize: 11, color: "#25D366", textDecoration: "none", fontWeight: 600 }}>
                          📱 {agente.phone}
                        </a>
                      </div>
                    ) : (
                      <Link href="/admin/agentes" style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textDecoration: "none" }}>
                        + Asignar agente
                      </Link>
                    )}
                  </td>

                  {/* Consultas WA */}
                  <td style={{ padding: "14px 16px" }}>
                    {consultas ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ background: tieneAlerta ? "#fef3c7" : "#F3EDE7",
                            color: tieneAlerta ? "#92400e" : "#B48A73",
                            fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>
                            {consultas.total} {tieneAlerta ? "⚡" : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: "#aaa", marginTop: 3 }}>
                          Última: {new Date(consultas.ultima).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#ccc" }}>Sin consultas</span>
                    )}
                  </td>

                  {/* Ver */}
                  <td style={{ padding: "14px 16px" }}>
                    <Link href={`/propiedades/${p.id}`} target="_blank"
                      style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                      Ver →
                    </Link>
                  </td>
                </tr>
              );
            })}

            {tokkoProps.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                  No se pudieron cargar las propiedades de Tokko
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
