import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAgentAction, updateUserRoleAction } from "./actions";

export const runtime = "nodejs";

type Role = "owner" | "admin" | "super_admin";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  // Ver sesión
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/usuarios");

  const admin = createSupabaseAdminClient();

  // Ver rol del usuario actual
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!me.data || me.data.role !== "super_admin") redirect("/admin?error=not_super_admin");

  // Traer usuarios de Auth (emails)
  const usersRes = await admin.auth.admin.listUsers({
    perPage: 200,
    page: 1,
  });

  if (usersRes.error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Usuarios</h1>
        <p style={{ color: "crimson" }}>
          Error listando usuarios: {usersRes.error.message}
        </p>
        <p>
          <Link href="/admin">Volver</Link>
        </p>
      </div>
    );
  }

  const authUsers = usersRes.data.users;

  // Traer profiles
  const profRes = await admin
    .from("profiles")
    .select("id, role, full_name, created_at, updated_at");

  const profiles = profRes.data ?? [];

  const profMap = new Map<string, any>();
  for (const p of profiles) profMap.set(p.id, p);

  // Unir
  const rows = authUsers.map((u) => {
    const p = profMap.get(u.id);
    const role: Role = (p?.role as Role) || "owner";
    return {
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      role,
      full_name: p?.full_name ?? null,
    };
  });

  // Orden: super_admin primero, luego admin, luego owner
  const rank = (r: Role) => (r === "super_admin" ? 0 : r === "admin" ? 1 : 2);
  rows.sort((a, b) => rank(a.role) - rank(b.role) || (a.email > b.email ? 1 : -1));

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Usuarios</h1>
        <span className="small" style={{ color: "#666" }}>
          (solo super_admin)
        </span>
        <div style={{ marginLeft: "auto" }}>
          <Link className="btn" href="/admin">
            ← Volver
          </Link>
        </div>
      </div>

      {searchParams?.error ? (
        <p className="small" style={{ color: "crimson" }}>
          ❌ {searchParams.error}
        </p>
      ) : null}
      {searchParams?.ok ? (
        <p className="small" style={{ color: "green" }}>
          ✅ {searchParams.ok}
        </p>
      ) : null}

      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Crear agente (rol admin)</h2>
        <form action={createAgentAction} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <div>
            <label className="small">Email</label>
            <input className="input" type="email" name="email" required />
          </div>
          <div>
            <label className="small">Contraseña temporal (mín 8)</label>
            <input className="input" type="text" name="password" required minLength={8} />
          </div>
          <button className="btn btnPrimary" type="submit">
            Crear agente
          </button>
          <p className="small" style={{ color: "#666", margin: 0 }}>
            Luego el agente puede cambiar su contraseña desde Supabase Auth (más adelante lo hacemos en UI).
          </p>
        </form>
      </section>

      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Listado</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Rol</th>
                <th style={th}>Nombre</th>
                <th style={th}>ID</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.email}</td>
                  <td style={td}>
                    <form action={updateUserRoleAction} style={{ display: "flex", gap: 8 }}>
                      <input type="hidden" name="user_id" value={r.id} />
                      <select className="input" name="role" defaultValue={r.role}>
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                      <button className="btn" type="submit">
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td style={td}>{r.full_name ?? "-"}</td>
                  <td style={{ ...td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {r.id}
                  </td>
                  <td style={td}>
                    {/* más adelante: reset password / desactivar / asignar propiedades */}
                    <span className="small" style={{ color: "#666" }}>
                      —
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td style={td} colSpan={5}>
                    No hay usuarios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "#666",
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f1f1f1",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 14,
};
