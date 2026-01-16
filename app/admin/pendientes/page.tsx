import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export default async function PendientesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id,title,created_at,status")
    .eq("status", "en_revision")
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Propiedades en revisión</h1>
        <Link className="btn" href="/admin">
          Volver
        </Link>
      </div>

      {error ? (
        <p style={{ color: "crimson" }}>❌ Error cargando pendientes: {error.message}</p>
      ) : !properties || properties.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <p>No hay propiedades pendientes.</p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{new Date(p.created_at).toLocaleDateString("es-AR")}</td>
                  <td>{p.status}</td>
                  <td>
                    <Link className="btn" href={`/admin/propiedades/${p.id}`}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
