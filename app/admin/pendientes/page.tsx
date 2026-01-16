// app/admin/pendientes/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAdminRole(role?: string | null) {
  return role === "admin" || role === "super_admin";
}

function statusToEs(s?: string | null) {
  switch (s) {
    case "borrador":
      return "Borrador";
    case "en_revision":
      return "En revisión";
    case "aprobada":
      return "Aprobada";
    case "publicada":
      return "Publicada";
    case "pausada":
      return "Pausada";
    case "reservada":
      return "Reservada";
    case "cerrada":
      return "Cerrada";
    case "rechazada":
      return "Rechazada";
    default:
      return s || "—";
  }
}

export default async function PendientesPage() {
  // sesión
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) redirect("/login?next=/admin/pendientes");

  // rol
  const admin = createSupabaseAdminClient();
  const { data: meProfile, error: meErr } = await admin
    .from("profiles")
    .select("id,role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr || !meProfile || !isAdminRole(meProfile.role)) {
    redirect("/admin?error=not_admin");
  }

  // Pendientes: properties en_revision
  const { data: rows, error } = await admin
    .from("properties")
    .select("id,title,city,neighborhood,status,created_at,created_by_user_id")
    .eq("status", "en_revision")
    .order("created_at", { ascending: false })
    .limit(80);

  const list = (rows as any[]) ?? [];

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div className="small" style={{ opacity: 0.7 }}>Gestión interna</div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Pendientes</h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Publicaciones en revisión para aprobar / rechazar.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" href="/admin">Volver</Link>
          <Link className="btn" href="/logout">Cerrar sesión</Link>
        </div>
      </div>

      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <div className="small" style={{ opacity: 0.75 }}>
          Sesión: <b>{meProfile.full_name || user.email}</b>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: "16px 0 10px" }}>En revisión</h2>

        {error ? (
          <div className="card" style={{ padding: 16, border: "1px solid #fecaca", background: "#fff1f2" }}>
            <div style={{ fontWeight: 900, color: "#b91c1c" }}>Error cargando pendientes</div>
            <div className="small" style={{ opacity: 0.8, marginTop: 6 }}>
              {error.message}
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900 }}>No hay pendientes</div>
            <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
              Cuando un cliente “envía a revisión”, van a aparecer acá.
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "170px 1.4fr 1fr 180px 220px",
                gap: 10,
                padding: "12px 14px",
                borderBottom: "1px solid #eee",
                background: "#fafafa",
                fontWeight: 800,
              }}
            >
              <div>Fecha</div>
              <div>Propiedad</div>
              <div>Ubicación</div>
              <div>Estado</div>
              <div>Acción</div>
            </div>

            {list.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "170px 1.4fr 1fr 180px 220px",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid #eee",
                  alignItems: "center",
                }}
              >
                <div className="small" style={{ opacity: 0.75 }}>
                  {p.created_at ? new Date(p.created_at).toLocaleString("es-AR") : "—"}
                </div>

                <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.title || "Propiedad"}
                  <div className="small" style={{ opacity: 0.65, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {p.id}
                  </div>
                </div>

                <div className="small" style={{ opacity: 0.8 }}>
                  {[p.neighborhood, p.city].filter(Boolean).join(" • ") || "—"}
                </div>

                <div>
                  <span
                    className="small"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#fff7e6",
                      color: "#b45309",
                      fontWeight: 900,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    ⏳ {statusToEs(p.status)}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Link className="btn" href={`/admin/propiedades/${p.id}`}>
                    Revisar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
