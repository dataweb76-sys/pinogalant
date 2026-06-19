import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MiAlquilerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler");

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();

  const initials = (profile?.full_name ?? data.user.email ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const NAV = [
    { href: "/mi-alquiler",           label: "Mi alquiler",  icon: "ðŸ " },
    { href: "/mi-alquiler/pagos",     label: "Pagos",        icon: "ðŸ’³" },
    { href: "/mi-alquiler/contrato",  label: "Mi contrato",  icon: "ðŸ“„" },
    { href: "/mi-alquiler/reclamos",  label: "Reclamos",     icon: "ðŸ”§" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F5F2" }}>
      {/* Header */}
      <header className="mi-alquiler-header" style={{
        background: "#2D3134",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        minHeight: 56,
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 12px rgba(0,0,0,.15)",
        gap: 0,
      }}>
        {/* Logo + nombre */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", padding: "10px 0" }}>
          <img src="/logo.svg" alt="Pino Galant" style={{ width: 34, height: 34, flexShrink: 0 }} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Pino Galant</span>
        </Link>

        {/* Nav â€” scrollable en mobile */}
        <nav className="mi-alquiler-nav" style={{ display: "flex", gap: 2, marginLeft: 16, flex: 1, overflowX: "auto" }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "rgba(255,255,255,.8)",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Avatar + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: 999, objectFit: "cover" }} />
          ) : (
            <span style={{
              width: 30, height: 30, borderRadius: 999,
              background: "#B48A73", color: "#fff",
              display: "grid", placeItems: "center",
              fontWeight: 900, fontSize: 12, flexShrink: 0,
            }}>{initials}</span>
          )}
          <Link href="/logout" style={{
            color: "rgba(255,255,255,.5)", fontSize: 18,
            textDecoration: "none",
          }}>â†©</Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {children}
      </main>
    </div>
  );
}
