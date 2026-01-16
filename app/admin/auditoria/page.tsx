// app/admin/auditoria/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAdminRole(role?: string | null) {
  return role === "admin" || role === "super_admin";
}

export default async function AuditoriaPage() {
  // sesión
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) redirect("/login?next=/admin/auditoria");

  // rol (service role para no depender de RLS)
  const admin = createSupabaseAdminClient();
  const { data: meProfile, error: meErr } = await admin
    .from("profiles")
    .select("id,role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr || !meProfile || !isAdminRole(meProfile.role)) {
    redirect("/admin?error=not_admin");
  }

  // Intento leer auditoría (si la tabla se llama distinto, después lo ajustamos)
  const { data: rows, error } = await admin
    .from("audit_log")
    .select("id,created_at,action,table_name,record_id,actor_id,meta")
    .order("created_at", { ascending: false })
    .limit(60);

  const list = (rows as any[]) ?? [];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div className="small" style={{ opacity: 0.7 }}>Gestión interna</div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Auditoría</h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Registro de acciones (altas, ediciones, publicaciones, etc.).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" href="/admin">Volver</Link>
          <Link className="btn" href="/logout">Cerrar sesión</Link>
        </div>
      </div>

      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <div className="small" style={{ opacity: 0.75 }}>
          Usuario: <b>{meProfile.full_name || user.email}</b>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: "16px 0 10px" }}>Eventos recientes</h2>

        {error ? (
          <div className="card" style={{ padding: 16, border: "1px solid #fecaca", background: "#fff1f2" }}>
            <div style={{ fontWeight: 900, color: "#b91c1c" }}>No se pudo cargar auditoría</div>
            <div className="small" style={{ opacity: 0.8, marginTop: 6 }}>
              {error.message}
            </div>
            <div className="small" style={{ opacity: 0.7, marginTop: 10 }}>
              Si tu tabla no se llama <code>audit_log</code>, decime el nombre y lo ajusto.
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900 }}>No hay eventos todavía</div>
            <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
              Cuando registremos acciones (alta/edición/publicación) van a aparecer acá.
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "170px 160px 1fr 260px",
                gap: 10,
                padding: "12px 14px",
                borderBottom: "1px solid #eee",
                background: "#fafafa",
                fontWeight: 800,
              }}
            >
              <div>Fecha</div>
              <div>Acción</div>
              <div>Detalle</div>
              <div>Registro</div>
            </div>

            {list.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "170px 160px 1fr 260px",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid #eee",
                  alignItems: "center",
                }}
              >
                <div className="small" style={{ opacity: 0.75 }}>
                  {r.created_at ? new Date(r.created_at).toLocaleString("es-AR") : "—"}
                </div>

                <div style={{ fontWeight: 900 }}>{r.action || "—"}</div>

                <div className="small" style={{ opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.table_name ? (
                    <>
                      <b>{r.table_name}</b>
                      {r.meta ? <span style={{ opacity: 0.7 }}> · {JSON.stringify(r.meta)}</span> : null}
                    </>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="small" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", opacity: 0.75 }}>
                  {r.record_id || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
