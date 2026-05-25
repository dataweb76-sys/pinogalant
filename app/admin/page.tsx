import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ─────────────────────────────────────── helpers */

function StatCard({
  value, label, sub, color, icon,
}: {
  value: string | number; label: string; sub?: string; color?: string; icon: string;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "24px 22px",
      border: "1px solid #eee", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          width: 44, height: 44, borderRadius: 12,
          background: color ?? "#F8F5F2",
          display: "grid", placeItems: "center", fontSize: 22,
        }}>{icon}</span>
        {sub && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#B48A73",
            background: "rgba(180,138,115,.1)", padding: "4px 10px", borderRadius: 999 }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#2D3134", letterSpacing: -1, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

function NavCard({
  href, icon, title, desc, badge,
}: {
  href?: string; icon: string; title: string; desc: string; badge?: React.ReactNode;
}) {
  const inner = (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 22,
      border: "1px solid #eee", height: "100%",
      display: "flex", flexDirection: "column", gap: 14,
      transition: "all .2s",
      opacity: href ? 1 : 0.6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          width: 48, height: 48, borderRadius: 13, fontSize: 22,
          background: href ? "#2D3134" : "#f3f4f6",
          color: href ? "#fff" : "#999",
          display: "grid", placeItems: "center",
        }}>{icon}</span>
        {badge}
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>{desc}</div>
      </div>
      {href && (
        <div style={{ marginTop: "auto", color: "#B48A73", fontWeight: 700, fontSize: 14 }}>
          Gestionar →
        </div>
      )}
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
      {inner}
    </Link>
  );
}

function Badge({ text, tone }: { text: string; tone: "ok" | "warn" | "soon" }) {
  const s =
    tone === "ok"   ? { bg: "#dcfce7", color: "#166534" } :
    tone === "warn" ? { bg: "#fef3c7", color: "#92400e" } :
                     { bg: "#f3f4f6", color: "#4b5563" };
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>{text}</span>
  );
}

/* ─────────────────────────────────────── page */

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin");

  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) redirect("/");

  const isSuperAdmin = profile?.role === "super_admin";

  /* ── Stats en paralelo ── */
  const [
    { count: totalPublicadas },
    { count: totalRevision },
    { count: consultasNuevas },
    { count: totalUsers },
    { count: alquileresActivos },
    { count: pagosPendientes },
  ] = await Promise.all([
    admin.from("properties").select("id", { count: "exact", head: true }).eq("is_published", true),
    admin.from("properties").select("id", { count: "exact", head: true }).eq("status", "en_revision"),
    admin.from("property_inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("rental_contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("rental_payments").select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("due_date", new Date().toISOString().split("T")[0]),
  ]);

  /* ── Últimas 5 consultas ── */
  const { data: ultimasConsultas } = await admin
    .from("property_inquiries")
    .select("id, name, email, status, created_at, properties(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: "#B48A73", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          Panel de control
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#2D3134" }}>
          {saludo}, {profile?.full_name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p style={{ margin: "6px 0 0", color: "#888", fontSize: 15 }}>
          Resumen del día ·{" "}
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard icon="🏠" value={totalPublicadas ?? 0} label="Propiedades publicadas" />
        <StatCard icon="🕓" value={totalRevision ?? 0}  label="En revisión"
          sub={(totalRevision ?? 0) > 0 ? "Pendiente" : undefined} />
        <StatCard icon="📩" value={consultasNuevas ?? 0} label="Consultas nuevas"
          sub={(consultasNuevas ?? 0) > 0 ? "Sin leer" : undefined} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 36 }}>
        <StatCard icon="📄" value={alquileresActivos ?? 0} label="Contratos activos"
          sub={(alquileresActivos ?? 0) > 0 ? "Activos" : undefined} />
        <StatCard icon="💸" value={pagosPendientes ?? 0} label="Pagos vencidos"
          sub={(pagosPendientes ?? 0) > 0 ? "Atención" : undefined} />
        <StatCard icon="👤" value={totalUsers ?? 0} label="Usuarios registrados" />
      </div>

      {/* ── Accesos rápidos + últimas consultas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* Módulos */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#2D3134", margin: "0 0 14px" }}>
            Accesos rápidos
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <NavCard href="/admin/propiedades" icon="🏠" title="Propiedades"
              desc="Gestión completa" badge={<Badge text="Activo" tone="ok" />} />
            <NavCard href="/admin/consultas" icon="📩" title="Consultas"
              desc="Seguimiento de leads"
              badge={<Badge text={(consultasNuevas ?? 0) > 0 ? `${consultasNuevas} nuevas` : "Al día"} tone={(consultasNuevas ?? 0) > 0 ? "warn" : "ok"} />} />
            <NavCard href="/admin/caja" icon="💰" title="Caja"
              desc="Ingresos y egresos" badge={<Badge text="Activo" tone="ok" />} />
            {isSuperAdmin && (
              <NavCard href="/admin/usuarios" icon="👤" title="Usuarios"
                desc="Roles y accesos" badge={<Badge text="Activo" tone="ok" />} />
            )}
            <NavCard href="/admin/auditoria" icon="📋" title="Auditoría"
              desc="Historial de cambios" badge={<Badge text="Activo" tone="ok" />} />
            <NavCard href="/admin/alquileres" icon="📄" title="Alquileres"
              desc="Contratos y pagos"
              badge={<Badge text={(alquileresActivos ?? 0) > 0 ? `${alquileresActivos} activos` : "Activo"} tone="ok" />} />
          </div>
        </div>

        {/* Últimas consultas */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#2D3134", margin: 0 }}>
              Últimas consultas
            </h2>
            <Link href="/admin/consultas" style={{ fontSize: 13, fontWeight: 700, color: "#B48A73", textDecoration: "none" }}>
              Ver todas →
            </Link>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
            {ultimasConsultas?.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                Sin consultas aún
              </div>
            )}
            {ultimasConsultas?.map((c: any, i: number) => (
              <Link
                key={c.id}
                href="/admin/consultas"
                style={{
                  display: "block", padding: "14px 18px", textDecoration: "none", color: "inherit",
                  borderBottom: i < (ultimasConsultas.length - 1) ? "1px solid #f3f3f3" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                      {(c as any).properties?.title ?? "Propiedad"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
                    background: c.status === "pending" ? "#dbeafe" : c.status === "hot" ? "#fee2e2" : "#f3f4f6",
                    color: c.status === "pending" ? "#1d4ed8" : c.status === "hot" ? "#dc2626" : "#555",
                  }}>
                    {c.status === "pending" ? "Nuevo" : c.status === "in_progress" ? "Warm" : c.status === "hot" ? "Hot" : "Cerrado"}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Link rápido a nueva propiedad */}
          <Link href="/admin/propiedades" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: 14, padding: "12px 0", borderRadius: 12,
            background: "#2D3134", color: "#fff", textDecoration: "none",
            fontWeight: 700, fontSize: 14,
          }}>
            + Cargar nueva propiedad
          </Link>
        </div>
      </div>
    </div>
  );
}
