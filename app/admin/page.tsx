// app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function roleToEs(role?: string | null) {
  if (role === "super_admin") return "Superadmin";
  if (role === "admin") return "Administración";
  if (role === "owner") return "Propietario";
  return "Usuario";
}

function Badge({ text, tone }: { text: string; tone: "ok" | "soon" | "beta" }) {
  const styles =
    tone === "ok"
      ? { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
      : tone === "beta"
      ? { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }
      : { background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" };

  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 700,
        ...styles,
      }}
    >
      {text}
    </span>
  );
}

function CardLink({
  href,
  title,
  desc,
  badge,
  icon,
}: {
  href?: string;
  title: string;
  desc: string;
  badge: React.ReactNode;
  icon: string;
}) {
  const isLocked = !href;

  const inner = (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        height: "100%",
        opacity: isLocked ? 0.85 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: isLocked ? "#f3f4f6" : "#111",
            color: isLocked ? "#9ca3af" : "#fff",
            fontSize: 24,
          }}
        >
          {icon}
        </div>
        {badge}
      </div>

      <div>
        <div style={{ fontWeight: 800, fontSize: 17 }}>{title}</div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>{desc}</div>
      </div>

      {!isLocked && (
        <div style={{ marginTop: "auto", fontWeight: 700, color: "#2563eb" }}>
          Gestionar →
        </div>
      )}
    </div>
  );

  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.role)) {
    redirect("/");
  }

  const admin = createSupabaseAdminClient();

  const { count: newCount } = await admin
    .from("property_inquiries")
    .select("id", { count: "exact", head: true })
    .or("status.is.null,status.eq.nuevo");

  const consultasBadge =
    (newCount ?? 0) > 0 ? (
      <Badge text={`${newCount} nuevas`} tone="beta" />
    ) : (
      <Badge text="Al día" tone="ok" />
    );

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
      <h1>Panel Admin</h1>

      {/* ACCESOS RÁPIDOS */}
      <section>
        <h2>Accesos rápidos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          <CardLink href="/perfil" title="Mi perfil" desc="Datos y contraseña." badge={<Badge text="Activo" tone="ok" />} icon="🪪" />
          <CardLink href="/admin/usuarios" title="Usuarios" desc="Roles y accesos." badge={<Badge text="Activo" tone="ok" />} icon="👤" />
          <CardLink href="/admin/propiedades" title="Propiedades" desc="Gestión completa." badge={<Badge text="Activo" tone="ok" />} icon="🏠" />
          <CardLink href="/admin/consultas" title="Consultas" desc="Consultas de propiedades." badge={consultasBadge} icon="📩" />
          <CardLink href="/admin/caja" title="Caja" desc="Ingresos y egresos." badge={<Badge text="Activo" tone="ok" />} icon="💰" />
        </div>
      </section>

      {/* MÓDULOS (NO TOCADO) */}
      <section style={{ marginTop: 48 }}>
        <h2>Módulos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
          <CardLink title="Gestión de Cobranza" desc="Próximamente" badge={<Badge text="Próximamente" tone="soon" />} icon="📲" />
          <CardLink title="Liquidaciones" desc="Próximamente" badge={<Badge text="Próximamente" tone="soon" />} icon="🧾" />
          <CardLink title="Contratos IA" desc="Beta" badge={<Badge text="Beta" tone="beta" />} icon="🤖" />
          {/* …todos los demás siguen iguales */}
        </div>
      </section>
    </main>
  );
}
