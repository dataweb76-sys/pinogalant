import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export default async function AuditoriaPage() {
  const supabase = await createSupabaseServerClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Auditoría</h1>
        <Link className="btn" href="/admin">
          Volver
        </Link>
      </div>

      {error ? (
        <p style={{ color: "crimson" }}>❌ Error cargando auditoría: {error.message}</p>
      ) : !logs || logs.length === 0 ? (
        <p className="small">No hay registros todavía.</p>
      ) : (
        <div className="card" style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString("es-AR")}</td>
                  <td>{l.user_id?.slice(0, 8) ?? "—"}</td>
                  <td>{l.action}</td>
                  <td>{l.entity}</td>
                  <td>{l.meta ? JSON.stringify(l.meta) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
