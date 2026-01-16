import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPendientes() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: items, error } = await supabase
    .from("properties")
    .select("id, title, status, created_at, city, neighborhood, owner_user_id")
    .eq("status", "en_revision")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>Pendientes de revisión</h1>
        <Link className="btn" href="/admin">Volver</Link>
      </div>
      {error ? <p className="small">Error: {error.message}</p> : null}

      <ul>
        {(items ?? []).map((p) => (
          <li key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
            <b>{p.title}</b> — {p.neighborhood} {p.city ? `(${p.city})` : ""} — <span className="small">{p.status}</span>
          </li>
        ))}
      </ul>

      <p className="small">Próximo: aprobar/rechazar + asignar agente + solicitar docs.</p>
    </div>
  );
}
