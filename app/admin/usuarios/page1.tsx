// app/admin/usuarios/page.tsx
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Role = "super_admin" | "admin" | "owner" | string;

type ProfileRow = {
  id: string;
  role: Role | null;
  full_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  email: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type PresenceRow = {
  user_id: string;
  last_seen: string;
};

function roleToEs(role?: string | null) {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Administración";
  if (role === "owner") return "Cliente";
  return role || "Usuario";
}

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < 45_000; // 45s
}

function cleanPhone(raw?: string | null) {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  return d.length >= 8 ? d : null;
}

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const me = userRes.user;

  const admin = createSupabaseAdminClient();

  // Traemos perfiles
  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id,role,full_name,whatsapp,avatar_url,email,is_active,created_at")
    .order("created_at", { ascending: false });

  // Traemos presencia (si tu tabla es user_presence; si es otra, avisame y lo ajusto)
  const { data: presRows } = await admin
    .from("user_presence")
    .select("user_id,last_seen")
    .limit(500);

  const presenceMap = new Map<string, string>();
  (presRows as any as PresenceRow[] | null)?.forEach((r) => {
    if (r?.user_id) presenceMap.set(r.user_id, r.last_seen);
  });

  const list = (profiles as any as ProfileRow[]) ?? [];

  const meProfile = me
    ? list.find((p) => p.id === me.id) || null
    : null;

  const isMeSuperAdmin = meProfile?.role === "super_admin";

  async function createUserAction(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();

    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();
    const full_name = String(formData.get("full_name") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "").trim();
    const role = String(formData.get("role") || "admin").trim();

    if (!email || !password) {
      return;
    }

    // Crear usuario en Auth
    const { data, error } = await (admin as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error || !data?.user?.id) {
      // Si querés, lo mostramos con searchParams. Por ahora, revalidate y listo.
      revalidatePath("/admin/usuarios");
      return;
    }

    // Upsert en profiles
    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      role,
      full_name: full_name || null,
      whatsapp: whatsapp || null,
      is_active: true,
    });

    revalidatePath("/admin/usuarios");
  }

  async function updateRoleAction(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();

    const id = String(formData.get("id") || "");
    const role = String(formData.get("role") || "");

    if (!id || !role) return;

    await admin.from("profiles").update({ role }).eq("id", id);

    revalidatePath("/admin/usuarios");
  }

  async function toggleActiveAction(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();

    const id = String(formData.get("id") || "");
    const next = String(formData.get("next") || "");
    const is_active = next === "true";

    if (!id) return;

    await admin.from("profiles").update({ is_active }).eq("id", id);

    revalidatePath("/admin/usuarios");
  }

  async function deleteUserAction(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();

    const id = String(formData.get("id") || "");
    if (!id) return;

    // OJO: borrar Auth user es destructivo. Mejor soft-delete:
    await admin.from("profiles").update({ is_active: false }).eq("id", id);

    revalidatePath("/admin/usuarios");
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div className="small" style={{ opacity: 0.7 }}>
            Gestión interna
          </div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Administradores y agentes</h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Alta de usuarios, roles y estado online.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" href="/admin">
            Volver
          </Link>
          <Link className="btn" href="/logout">
            Cerrar sesión
          </Link>
        </div>
      </div>

      {/* Crear usuario */}
      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Crear usuario (admin/agente)</div>
            <div className="small" style={{ opacity: 0.7 }}>
              Crea en Auth + profiles. Recomendado: usar email real.
            </div>
          </div>
          {!isMeSuperAdmin ? (
            <div className="small" style={{ color: "#b45309" }}>
              Solo Superadmin debería crear usuarios.
            </div>
          ) : null}
        </div>

        <form
          action={createUserAction}
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
              Email
            </div>
            <input className="input" name="email" placeholder="agente@correo.com" required />
          </div>

          <div>
            <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
              Contraseña
            </div>
            <input className="input" name="password" type="password" placeholder="••••••••" required />
          </div>

          <div>
            <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
              Nombre
            </div>
            <input className="input" name="full_name" placeholder="Nombre y apellido" />
          </div>

          <div>
            <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
              WhatsApp
            </div>
            <input className="input" name="whatsapp" placeholder="+54911..." />
          </div>

          <div>
            <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
              Rol
            </div>
            <select className="input" name="role" defaultValue="admin">
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
              <option value="owner">owner</option>
            </select>
          </div>

          <div style={{ gridColumn: "span 3" }}>
            <button className="btn btnPrimary" type="submit" disabled={!isMeSuperAdmin}>
              Crear usuario
            </button>
            {!isMeSuperAdmin ? (
              <span className="small" style={{ marginLeft: 10, opacity: 0.7 }}>
                (Iniciá como superadmin para habilitar)
              </span>
            ) : null}
          </div>
        </form>
      </section>

      {/* Listado */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Usuarios</h2>
          <div className="small" style={{ opacity: 0.65 }}>
            Online = visto en los últimos 45 segundos.
          </div>
        </div>

        {profErr ? (
          <div className="small" style={{ color: "crimson", marginTop: 10 }}>
            ❌ Error cargando usuarios: {profErr.message}
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ padding: 16, marginTop: 10 }}>
            <div style={{ fontWeight: 800 }}>No hay usuarios</div>
            <div className="small" style={{ opacity: 0.7 }}>
              Creá un agente desde el formulario de arriba.
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 10 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1.2fr 1fr 1fr 180px 210px",
                gap: 10,
                padding: "12px 14px",
                borderBottom: "1px solid #eee",
                background: "#fafafa",
                fontWeight: 800,
              }}
            >
              <div>Estado</div>
              <div>Usuario</div>
              <div>Rol</div>
              <div>Contacto</div>
              <div>Última actividad</div>
              <div>Acciones</div>
            </div>

            {list.map((p) => {
              const lastSeen = presenceMap.get(p.id) || null;
              const online = isOnline(lastSeen);
              const phone = cleanPhone(p.whatsapp);
              const name = p.full_name || p.email || p.id.slice(0, 8);
              const active = p.is_active !== false;

              return (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1.2fr 1fr 1fr 180px 210px",
                    gap: 10,
                    padding: "12px 14px",
                    borderTop: "1px solid #eee",
                    alignItems: "center",
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  <div>
                    <span
                      className="small"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontWeight: 900,
                        color: online ? "#167d3f" : "#4b5563",
                        background: online ? "#e9f7ef" : "#f3f4f6",
                      }}
                    >
                      {online ? "● Online" : "○ Offline"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        overflow: "hidden",
                        background: "#111",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        flex: "0 0 auto",
                      }}
                    >
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (name?.[0] || "U").toUpperCase()
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                        {p.id === me?.id ? (
                          <span className="small" style={{ marginLeft: 8, opacity: 0.7 }}>
                            (vos)
                          </span>
                        ) : null}
                      </div>
                      <div className="small" style={{ opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.email || "—"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 800 }}>{roleToEs(p.role)}</div>
                    <div className="small" style={{ opacity: 0.7 }}>
                      {p.role || "—"}
                    </div>
                  </div>

                  <div className="small" style={{ opacity: 0.85 }}>
                    {phone ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <a className="btn btnPrimary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.6 }}>(sin WhatsApp)</span>
                    )}
                  </div>

                  <div className="small" style={{ opacity: 0.75 }}>
                    {lastSeen ? new Date(lastSeen).toLocaleString("es-AR") : "—"}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <form action={updateRoleAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <select
                        className="input"
                        name="role"
                        defaultValue={p.role || "owner"}
                        style={{ width: 140 }}
                        disabled={!isMeSuperAdmin}
                        onChange={(e) => {
                          // submit instantáneo (sin JS extra)
                          (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                        }}
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </form>

                    <form action={toggleActiveAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="next" value={active ? "false" : "true"} />
                      <button className="btn" type="submit" disabled={!isMeSuperAdmin || p.id === me?.id}>
                        {active ? "Desactivar" : "Activar"}
                      </button>
                    </form>

                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        className="btn"
                        type="submit"
                        disabled={!isMeSuperAdmin || p.id === me?.id}
                        style={{ borderColor: "#fecaca" }}
                      >
                        Quitar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
