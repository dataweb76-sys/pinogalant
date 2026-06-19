import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const revalidate = 30;

export default async function AdminConsultasPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/consultas");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("role, full_name").eq("id", data.user.id).maybeSingle();

  if (!["admin", "super_admin", "agent"].includes(profile?.role ?? "")) redirect("/");

  const tab = searchParams?.tab ?? "wa";

  // WA Leads
  const { data: waLeads } = await admin
    .from("whatsapp_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Consultas formulario
  const { data: formLeads } = await admin
    .from("property_inquiries")
    .select("id, name, email, phone, message, status, created_at, property_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const ahora = Date.now();
  const ayer = ahora - 86400000;

  const waHoy = (waLeads ?? []).filter((l: any) => new Date(l.created_at).getTime() > ayer).length;
  const formHoy = (formLeads ?? []).filter((l: any) => new Date(l.created_at).getTime() > ayer).length;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Gestión de leads
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#2D3134" }}>Consultas</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "wa",   label: `WhatsApp (${(waLeads ?? []).length})`,  hoy: waHoy   },
          { id: "form", label: `Formulario (${(formLeads ?? []).length})`, hoy: formHoy },
        ].map(t => (
          <Link key={t.id} href={`/admin/consultas?tab=${t.id}`} style={{
            padding: "8px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14,
            textDecoration: "none",
            background: tab === t.id ? "#2D3134" : "#fff",
            color: tab === t.id ? "#fff" : "#888",
            border: "1px solid " + (tab === t.id ? "#2D3134" : "#eee"),
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {t.label}
            {t.hoy > 0 && (
              <span style={{ background: "#f59e0b", color: "#fff", fontSize: 10,
                fontWeight: 900, padding: "2px 7px", borderRadius: 999 }}>
                {t.hoy} hoy
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* WA Leads */}
      {tab === "wa" && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["Visitante", "Teléfono", "Propiedad", "Agente contactado", "Fecha"].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                    color: "#888", letterSpacing: 0.5, textTransform: "uppercase",
                    borderBottom: "1px solid #eee" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(waLeads ?? []).map((l: any, i: number, arr: any[]) => {
                const esReciente = new Date(l.created_at).getTime() > ayer;
                return (
                  <tr key={l.id} style={{
                    borderBottom: i < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                    background: esReciente ? "rgba(245,158,11,0.04)" : undefined,
                  }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        {l.visitor_name ?? "Anónimo"}
                        {esReciente && (
                          <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e",
                            padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>NUEVO</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                        {l.source === "property_detail" ? "Detalle" : "Listado"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {l.visitor_phone ? (
                        <a href={`https://wa.me/${l.visitor_phone.replace(/\D/g,"")}`}
                          target="_blank"
                          style={{ color: "#25D366", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                          📱 {l.visitor_phone}
                        </a>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {l.property_address ? (
                        <Link href={`/propiedades/${l.property_id}`} target="_blank"
                          style={{ fontSize: 13, fontWeight: 600, color: "#2D3134", textDecoration: "none" }}>
                          {l.property_address}
                        </Link>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: 12 }}>General</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.agent_name ?? "—"}</div>
                      {l.agent_phone && (
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{l.agent_phone}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>
                      {new Date(l.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      <br />
                      {new Date(l.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
              {(waLeads ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                    Sin consultas de WhatsApp registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulario leads */}
      {tab === "form" && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["Nombre", "Contacto", "Mensaje", "Estado", "Fecha"].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
                    color: "#888", letterSpacing: 0.5, textTransform: "uppercase",
                    borderBottom: "1px solid #eee" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(formLeads ?? []).map((l: any, i: number, arr: any[]) => {
                const esReciente = new Date(l.created_at).getTime() > ayer;
                const statusColors: Record<string, string> = {
                  pending: "#2563eb", in_progress: "#ca8a04", hot: "#dc2626", closed: "#16a34a"
                };
                const statusLabels: Record<string, string> = {
                  pending: "Nuevo", in_progress: "Warm", hot: "Hot", closed: "Cerrado"
                };
                return (
                  <tr key={l.id} style={{
                    borderBottom: i < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                    background: esReciente ? "rgba(37,99,235,0.03)" : undefined,
                  }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{l.name ?? "—"}</div>
                      {l.property_id && (
                        <Link href={`/propiedades/${l.property_id}`} target="_blank"
                          style={{ fontSize: 11, color: "#B48A73", textDecoration: "none" }}>
                          Ver propiedad →
                        </Link>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {l.email && <div style={{ fontSize: 12 }}>{l.email}</div>}
                      {l.phone && (
                        <a href={`https://wa.me/${l.phone.replace(/\D/g,"")}`} target="_blank"
                          style={{ fontSize: 12, color: "#25D366", textDecoration: "none" }}>
                          📱 {l.phone}
                        </a>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#555", maxWidth: 250 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                        {l.message ?? "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: statusColors[l.status] ?? "#999", color: "#fff",
                        fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>
                        {statusLabels[l.status] ?? l.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>
                      {new Date(l.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                );
              })}
              {(formLeads ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                    Sin consultas de formulario
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
