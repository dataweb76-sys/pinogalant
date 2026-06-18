import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NAV_ITEMS = [
  { href: "/admin",              icon: "▦",  label: "Dashboard"    },
  { href: "/admin/propiedades",  icon: "🏠", label: "Propiedades"  },
  { href: "/admin/agentes",      icon: "🧑‍💼", label: "Agentes"      },
  { href: "/admin/alquileres",   icon: "📄", label: "Alquileres"   },
  { href: "/admin/consultas",    icon: "📩", label: "Consultas"    },
  { href: "/admin/usuarios",     icon: "👤", label: "Usuarios"     },
  { href: "/admin/caja",         icon: "💰", label: "Caja"         },
  { href: "/admin/auditoria",    icon: "📋", label: "Auditoría"    },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login?next=/admin");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const initials = (profile?.full_name ?? user.email ?? "A")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    profile?.role === "super_admin" ? "Coordinadora"
    : profile?.role === "admin"     ? "Agente"
    : profile?.role === "agent"     ? "Agente"
    :                                 "Usuario";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f4f5" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220,
        background: "#2D3134",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            textDecoration: "none",
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#B48A73",
              display: "grid", placeItems: "center",
              fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0,
            }}>PG</span>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Pino Galant</span>
          </Link>
          <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            Panel Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 10px", flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 2,
                textDecoration: "none", color: "rgba(255,255,255,.7)",
                fontSize: 14, fontWeight: 600,
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Perfil + logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <Link href="/perfil" style={{
            display: "flex", alignItems: "center", gap: 10,
            textDecoration: "none", padding: "10px 10px", borderRadius: 10,
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: 999, objectFit: "cover" }} />
            ) : (
              <span style={{
                width: 34, height: 34, borderRadius: 999,
                background: "#B48A73", color: "#fff",
                display: "grid", placeItems: "center",
                fontWeight: 900, fontSize: 13, flexShrink: 0,
              }}>{initials}</span>
            )}
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                {profile?.full_name ?? user.email?.split("@")[0] ?? "Usuario"}
              </div>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11 }}>{roleLabel}</div>
            </div>
          </Link>
          <Link href="/logout" style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "rgba(255,255,255,.4)", fontSize: 13, fontWeight: 600,
            textDecoration: "none", padding: "8px 10px", borderRadius: 8, marginTop: 4,
          }}>
            ↩ Salir
          </Link>
        </div>
      </aside>

      {/* ── CONTENIDO ── */}
      <main style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
