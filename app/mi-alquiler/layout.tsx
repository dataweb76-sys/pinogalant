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
    { href: "/mi-alquiler",           label: "Mi alquiler",  icon: "🏠" },
    { href: "/mi-alquiler/pagos",     label: "Pagos",        icon: "💳" },
    { href: "/mi-alquiler/contrato",  label: "Mi contrato",  icon: "📄" },
    { href: "/mi-alquiler/reclamos",  label: "Reclamos",     icon: "🔧" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F5F2" }}>
      {/* Header */}
      <header style={{
        background: "#2D3134",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 2px 12px rgba(0,0,0,.15)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#B48A73",
            display: "grid", placeItems: "center",
            fontSize: 12, fontWeight: 900, color: "#fff",
          }}>PG</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Pino Galant</span>
        </Link>

        <nav style={{ display: "flex", gap: 4, marginLeft: 32 }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "rgba(255,255,255,.75)",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: 999, objectFit: "cover" }} />
          ) : (
            <span style={{
              width: 34, height: 34, borderRadius: 999,
              background: "#B48A73", color: "#fff",
              display: "grid", placeItems: "center",
              fontWeight: 900, fontSize: 13,
            }}>{initials}</span>
          )}
          <span style={{ color: "rgba(255,255,255,.75)", fontSize: 13, fontWeight: 600 }}>
            {profile?.full_name?.split(" ")[0] ?? "Inquilino"}
          </span>
          <Link href="/logout" style={{
            color: "rgba(255,255,255,.4)", fontSize: 12,
            textDecoration: "none", marginLeft: 4,
          }}>↩</Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {children}
      </main>
    </div>
  );
}
