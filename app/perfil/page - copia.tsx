import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveProfileAction } from "./actions";

export const runtime = "nodejs";

function roleToEs(role?: string | null) {
  switch (role) {
    case "super_admin":
      return "Superadmin";
    case "admin":
      return "Administración";
    case "owner":
      return "Propietario";
    default:
      return "Usuario";
  }
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <h1>Perfil</h1>
        <p>Tenés que iniciar sesión.</p>
        <Link className="btn btnPrimary" href="/login?next=/perfil">
          Ingresar
        </Link>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, phone, whatsapp, address, avatar_url, agent_code")
    .eq("id", user.id)
    .maybeSingle();

  const roleLabel = roleToEs(profile?.role ?? null);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Mi perfil</h1>
        <Link className="btn" href="/admin">
          Volver al admin
        </Link>
      </div>

      {searchParams?.ok ? (
        <div className="card" style={{ border: "1px solid #d1fae5", background: "#ecfdf5" }}>
          ✅ Guardado
        </div>
      ) : null}

      {searchParams?.error ? (
        <div className="card" style={{ border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c" }}>
          ❌ {searchParams.error}
        </div>
      ) : null}

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              overflow: "hidden",
              background: "#f3f4f6",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
            }}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              ((profile?.full_name?.[0] || user.email?.[0] || "U") as string).toUpperCase()
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.full_name || user.email}
            </div>
            <div className="small" style={{ opacity: 0.7 }}>
              {roleLabel}
              {profile?.agent_code ? ` · ID Agente: ${profile.agent_code}` : ""}
            </div>
          </div>
        </div>
      </div>

      <form action={saveProfileAction} className="card" style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="small">Nombre y apellido</label>
          <input className="input" name="full_name" defaultValue={profile?.full_name ?? ""} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="small">Teléfono</label>
            <input className="input" name="phone" defaultValue={profile?.phone ?? ""} />
          </div>
          <div>
            <label className="small">WhatsApp</label>
            <input className="input" name="whatsapp" defaultValue={profile?.whatsapp ?? ""} />
          </div>
        </div>

        <div>
          <label className="small">Dirección</label>
          <input className="input" name="address" defaultValue={profile?.address ?? ""} />
        </div>

        <div>
          <label className="small">Foto de perfil</label>
          <input className="input" type="file" name="avatar" accept="image/*" />
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Se guarda al presionar “Guardar cambios”.
          </div>
        </div>

        <button className="btn btnPrimary" type="submit">
          Guardar cambios
        </button>
      </form>
    </main>
  );
}
