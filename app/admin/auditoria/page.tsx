import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminAuditoria() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, entity_type, entity_id, is_outside_assignment, actor_user_id")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>Auditoría</h1>
        <Link className="btn" href="/admin">Volver</Link>
      </div>

      {error ? <p className="small">Error: {error.message}</p> : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Fecha","Acción","Entidad","ID","Fuera asignación","Actor"].map((h) => (
                <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.id}>
                <td style={{ borderBottom: "1px solid #f2f2f2", padding: 8 }}>{new Date(l.created_at).toLocaleString("es-AR")}</td>
                <td style={{ borderBottom: "1px solid #f2f2f2", padding: 8 }}>{l.action}</td>
                <td style={{ borderBottom: "1px solid #f2f2f2", padding: 8 }}>{l.entity_type}</td>
                <td style={{ borderBottom: "1px solid #f2f2f2", padding: 8 }}>{l.entity_id}</td>
                <td style={{ borderBottom: "1px solid #f2f2f2", padding: 8 }}>{l.is_outside_assignment ? "Sí" : "No"}</td>
                <td style={{ borderBottom: "1px solid #f2f2f2", padding: 8 }}>{l.actor_user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="small">Nota: el super admin puede filtrar “fuera de asignación” (lo agregamos en UI luego).</p>
    </div>
  );
}
