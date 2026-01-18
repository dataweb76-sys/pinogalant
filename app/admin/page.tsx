// app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      ? { background: "#e9f7ef", color: "#167d3f" }
      : tone === "beta"
      ? { background: "#fef3c7", color: "#92400e" }
      : { background: "#f3f4f6", color: "#4b5563" };

  return (
    <span
      className="small"
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 900,
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
  const inner = (
    <div
      className="card"
      style={{
        padding: 16,
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        gap: 12,
        alignItems: "center",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "#111",
          color: "white",
          fontSize: 18,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900, lineHeight: 1.2 }}>{title}</div>
        <div className="small" style={{ opacity: 0.7, marginTop: 4 }}>
          {desc}
        </div>
        <div className="small" style={{ opacity: 0.7, marginTop: 10 }}>
          Abrir →
        </div>
      </div>

      <div style={{ justifySelf: "end" }}>{badge}</div>
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  );
}

export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as any)?.role ?? null;
  const roleLabel = roleToEs(role);

  // Solo staff
  if (role !== "admin" && role !== "super_admin") {
    redirect("/?error=not_allowed");
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div className="small" style={{ opacity: 0.7 }}>
            Gestión interna
          </div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Panel Admin</h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            {roleLabel}
            {profile?.full_name ? ` · ${profile.full_name}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" href="/perfil">
            Perfil
          </Link>
          <Link className="btn" href="/logout">
            Cerrar sesión
          </Link>
        </div>
      </div>

      {/* Accesos rápidos */}
      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: "0 0 10px" }}>Accesos rápidos</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <CardLink
            href="/perfil"
            title="Mi perfil"
            desc="Foto, datos de contacto y cambio de contraseña."
            badge={<Badge text="Activo" tone="ok" />}
            icon="🪪"
          />
          <CardLink
            href="/admin/usuarios"
            title="Usuarios"
            desc="Crear agentes, ver roles y administrar accesos."
            badge={<Badge text="Activo" tone="ok" />}
            icon="👤"
          />
          <CardLink
            href="/admin/propiedades"
            title="Propiedades"
            desc="Alta, edición, publicación y asignación a agentes."
            badge={<Badge text="Activo" tone="ok" />}
            icon="🏠"
          />
          <CardLink
            href="/admin/caja"
            title="Gestión de Caja"
            desc="Ingresos/egresos, arqueos, saldos y conciliación."
            badge={<Badge text="Activo" tone="ok" />}
            icon="💰"
          />
        </div>
      </section>

      {/* Módulos */}
      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "0 0 6px" }}>Módulos</h2>
        <div className="small" style={{ opacity: 0.7, marginBottom: 10 }}>
          Los vamos activando uno por uno, sin romper lo existente.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <CardLink
            href="/admin/cobranza"
            title="Gestión de Cobranza"
            desc="Cobranzas, avisos, vencimientos, morosidad."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="📲"
          />
          <CardLink
            href="/admin/liquidacion"
            title="Gestión de Liquidación"
            desc="Liquidaciones a propietarios y cierres mensuales."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="🧾"
          />
          <CardLink
            href="/admin/contratos-ia"
            title="Carga de Contratos con IA"
            desc="Subís PDF/imagen y te arma los datos del contrato."
            badge={<Badge text="Beta" tone="beta" />}
            icon="🤖"
          />

          <CardLink
            title="Módulo de Indexación"
            desc="Ajustes automáticos por índice y actualización masiva."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="📈"
          />
          <CardLink
            title="Facturación Electrónica"
            desc="Emitir comprobantes y descargar reportes."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="🧾"
          />
          <CardLink
            title="Multifacturante"
            desc="Varios CUIT / puntos de venta / perfiles fiscales."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="🏷️"
          />

          <CardLink
            title="Cobranza Remota"
            desc="Links de pago y seguimiento de estado."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="💳"
          />
          <CardLink
            title="Módulo de WhatsApp"
            desc="Plantillas, respuestas rápidas y derivación por agente."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="💬"
          />
          <CardLink
            title="Proveedores"
            desc="Alta de proveedores, servicios, órdenes y pagos."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="🧰"
          />

          <CardLink
            title="Info de Transferencias"
            desc="Registro y control de transferencias y comprobantes."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="🏦"
          />
          <CardLink
            title="Carteles"
            desc="Pedidos, stock, estados, colocación/retiro."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="📌"
          />
          <CardLink
            title="Signia / Firma Electrónica"
            desc="Firmas, trazabilidad y adjuntos por operación."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="✍️"
          />

          <CardLink
            title="Reportes Múltiples"
            desc="Reportes por operaciones, agentes, caja y propiedades."
            badge={<Badge text="Próximamente" tone="soon" />}
            icon="📊"
          />
        </div>
      </section>
    </main>
  );
}
