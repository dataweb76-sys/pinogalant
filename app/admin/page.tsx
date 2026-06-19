import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllTokkoProperties, tokkoOperation, tokkoType, tokkoPrice } from "@/lib/tokko";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) redirect("/");

  // Datos en paralelo
  const [tokkoProps, { data: waLeads }, { data: assignments }] = await Promise.all([
    getAllTokkoProperties().catch(() => []),
    admin.from("whatsapp_leads").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("tokko_agent_assignments").select("tokko_id, agents(name, phone)"),
  ]);

  // Consultas por propiedad
  const consultasPorProp: Record<number, number> = {};
  (waLeads ?? []).forEach((l: any) => {
    if (l.property_id) consultasPorProp[l.property_id] = (consultasPorProp[l.property_id] || 0) + 1;
  });

  // Agente por propiedad
  const agentePorProp: Record<number, string> = {};
  (assignments ?? []).forEach((a: any) => {
    if (a.agents?.name) agentePorProp[a.tokko_id] = a.agents.name;
  });

  // Stats
  const totalProps = tokkoProps.length;
  const totalConsultas = (waLeads ?? []).length;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const consultasHoy = (waLeads ?? []).filter((l: any) => new Date(l.created_at) >= hoy).length;
  const propsConConsulta = Object.keys(consultasPorProp).length;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          Panel de control
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#2D3134" }}>
          {saludo}, {profile?.full_name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p style={{ margin: "6px 0 0", color: "#888", fontSize: 14 }}>
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { icon: "🏠", value: totalProps, label: "Propiedades en Tokko" },
          { icon: "💬", value: totalConsultas, label: "Consultas WhatsApp" },
          { icon: "🔔", value: consultasHoy, label: "Consultas hoy", alert: consultasHoy > 0 },
          { icon: "📊", value: propsConConsulta, label: "Props con consultas" },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.alert ? "#fef3c7" : "#fff",
            border: s.alert ? "1.5px solid #f59e0b" : "1px solid #eee",
            borderRadius: 16, padding: "20px 18px",
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#2D3134", letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            {s.alert && <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, marginTop: 4 }}>⚡ Nueva actividad</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

        {/* Accesos rápidos */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2D3134", margin: "0 0 14px" }}>Accesos rápidos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { href: "/admin/propiedades", icon: "🏠", title: "Propiedades", desc: `${totalProps} en Tokko · agentes y consultas` },
              { href: "/admin/consultas",   icon: "📩", title: "Consultas",   desc: `${totalConsultas} total · ${consultasHoy} hoy`, alert: consultasHoy > 0 },
              { href: "/admin/agentes",     icon: "🧑‍💼", title: "Agentes",    desc: "Asignación de propiedades" },
              { href: "/admin/auditoria",   icon: "📋", title: "Auditoría",  desc: "Actividad reciente del sistema" },
            ].map((c) => (
              <Link key={c.href} href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  background: c.alert ? "#fef3c7" : "#fff",
                  border: c.alert ? "1.5px solid #f59e0b" : "1px solid #eee",
                  borderRadius: 14, padding: 18,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, fontSize: 20,
                    background: "#2D3134", color: "#fff",
                    display: "grid", placeItems: "center",
                  }}>{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{c.desc}</div>
                  </div>
                  <div style={{ color: "#B48A73", fontWeight: 700, fontSize: 13, marginTop: "auto" }}>
                    {c.alert ? "⚡ Ver ahora →" : "Gestionar →"}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Top 5 props con más consultas */}
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2D3134", margin: "0 0 12px" }}>Propiedades más consultadas</h2>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
            {Object.entries(consultasPorProp)
              .sort(([,a],[,b]) => b - a)
              .slice(0, 5)
              .map(([propId, count], i, arr) => {
                const prop = tokkoProps.find(p => p.id === Number(propId));
                const agente = agentePorProp[Number(propId)] ?? "Sin asignar";
                return (
                  <Link key={propId} href={`/propiedades/${propId}`} target="_blank"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 18px", textDecoration: "none", color: "inherit",
                      borderBottom: i < arr.length - 1 ? "1px solid #f3f3f3" : "none" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{prop?.address ?? `Propiedad #${propId}`}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Agente: {agente}</div>
                    </div>
                    <span style={{ background: "#F3EDE7", color: "#B48A73", fontWeight: 800,
                      fontSize: 12, padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {count} consultas
                    </span>
                  </Link>
                );
              })}
            {Object.keys(consultasPorProp).length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                Aún no hay consultas registradas
              </div>
            )}
          </div>
        </div>

        {/* Últimas consultas WA */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2D3134", margin: 0 }}>Últimas consultas WhatsApp</h2>
            <Link href="/admin/consultas" style={{ fontSize: 12, fontWeight: 700, color: "#B48A73", textDecoration: "none" }}>
              Ver todas →
            </Link>
          </div>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
            {(waLeads ?? []).slice(0, 8).map((l: any, i: number, arr: any[]) => {
              const esReciente = (new Date().getTime() - new Date(l.created_at).getTime()) < 86400000;
              return (
                <div key={l.id} style={{
                  padding: "13px 16px",
                  borderBottom: i < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                  background: esReciente ? "rgba(245,158,11,0.04)" : undefined,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        {l.visitor_name ?? "Anónimo"}
                        {esReciente && <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e",
                          padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>NUEVO</span>}
                      </div>
                      {l.visitor_phone && (
                        <div style={{ fontSize: 11, color: "#25D366", fontWeight: 600, marginTop: 1 }}>
                          📱 {l.visitor_phone}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 2, whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis" }}>
                        {l.property_address ?? "Propiedad general"}
                      </div>
                      <div style={{ fontSize: 11, color: "#B48A73", marginTop: 1 }}>
                        → {l.agent_name ?? "Inmobiliaria"}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#bbb", whiteSpace: "nowrap", marginLeft: 8 }}>
                      {new Date(l.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      <br />
                      {new Date(l.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            {(waLeads ?? []).length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                Sin consultas registradas aún
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
