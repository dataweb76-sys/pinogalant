// app/admin/page.tsx
import Link from "next/link";

export const runtime = "nodejs";

type ModuleTile = {
  title: string;
  desc: string;
  href?: string;
  status: "activo" | "proximamente" | "beta";
  icon: string;
};

function StatusPill({ status }: { status: ModuleTile["status"] }) {
  const label = status === "activo" ? "Activo" : status === "beta" ? "Beta" : "Próximamente";

  const bg = status === "activo" ? "#e9f7ef" : status === "beta" ? "#fff7e6" : "#f3f4f6";
  const color = status === "activo" ? "#167d3f" : status === "beta" ? "#b45309" : "#4b5563";

  return (
    <span
      className="small"
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Tile({ m }: { m: ModuleTile }) {
  const content = (
    <div
      className="card"
      style={{
        padding: 16,
        display: "grid",
        gap: 10,
        height: "100%",
        cursor: m.href ? "pointer" : "default",
        opacity: m.href ? 1 : 0.92,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#111",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              flex: "0 0 auto",
            }}
          >
            {m.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>{m.title}</div>
            <div className="small" style={{ opacity: 0.72 }}>
              {m.desc}
            </div>
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>

      {m.href ? (
        <div className="small" style={{ opacity: 0.7 }}>
          Abrir →
        </div>
      ) : (
        <div className="small" style={{ opacity: 0.55 }}>
          Disponible en próximos pasos.
        </div>
      )}
    </div>
  );

  if (m.href) {
    return (
      <Link href={m.href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return content;
}

export default async function AdminPage({ searchParams }: { searchParams?: { error?: string } }) {
  const core: ModuleTile[] = [
    {
      title: "Mi perfil",
      desc: "Foto, datos de contacto y cambio de contraseña.",
      href: "/perfil",
      status: "activo",
      icon: "🪪",
    },
    {
      title: "Usuarios",
      desc: "Crear agentes, ver roles y administrar accesos.",
      href: "/admin/usuarios",
      status: "activo",
      icon: "👤",
    },
    {
      title: "Propiedades",
      desc: "Alta, edición, publicación y asignación a agentes.",
      href: "/admin/propiedades",
      status: "activo",
      icon: "🏠",
    },
    {
      title: "Gestión de Caja",
      desc: "Ingresos/egresos, arqueos, saldos y conciliación.",
      href: "/admin/caja",
      status: "activo",
      icon: "💰",
    },
  ];

  const modules: ModuleTile[] = [
    {
      title: "Gestión de Cobranza",
      desc: "Cobranzas, avisos, vencimientos, morosidad.",
      status: "proximamente",
      icon: "💳",
    },
    {
      title: "Gestión de Liquidación",
      desc: "Liquidaciones a propietarios y cierres mensuales.",
      status: "proximamente",
      icon: "🧾",
    },
    {
      title: "Carga de Contratos con IA",
      desc: "Subís PDF/imagen y te arma los datos del contrato.",
      status: "beta",
      icon: "🤖",
    },
    {
      title: "Módulo de Indexación",
      desc: "Ajustes automáticos por índice y actualización masiva.",
      status: "proximamente",
      icon: "📈",
    },
    {
      title: "Facturación Electrónica",
      desc: "Emitir comprobantes y descargar reportes.",
      status: "proximamente",
      icon: "🧾",
    },
    {
      title: "Multifacturante",
      desc: "Varios CUIT / puntos de venta / perfiles fiscales.",
      status: "proximamente",
      icon: "🏢",
    },
    {
      title: "Cobranza Remota",
      desc: "Links de pago y seguimiento de estado.",
      status: "proximamente",
      icon: "📲",
    },
    {
      title: "Módulo de WhatsApp",
      desc: "Plantillas, respuestas rápidas y derivación por agente.",
      status: "proximamente",
      icon: "💬",
    },
    {
      title: "Módulo de Proveedores",
      desc: "Alta de proveedores, servicios, órdenes y pagos.",
      status: "proximamente",
      icon: "🧰",
    },
    {
      title: "Info de Transferencias",
      desc: "Registro y control de transferencias y comprobantes.",
      status: "proximamente",
      icon: "🏦",
    },
    {
      title: "Módulo de Carteles",
      desc: "Pedidos, stock, estados, colocación/retiro.",
      status: "proximamente",
      icon: "📌",
    },
    {
      title: "Signia / Firma Electrónica",
      desc: "Firmas, trazabilidad y adjuntos por operación.",
      status: "proximamente",
      icon: "✍️",
    },
    {
      title: "Reportes Múltiples",
      desc: "Reportes por operaciones, agentes, caja y propiedades.",
      status: "proximamente",
      icon: "📊",
    },
  ];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div className="small" style={{ opacity: 0.7 }}>
            Gestión interna
          </div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Panel Admin</h1>
        </div>

        <Link className="btn" href="/logout">
          Cerrar sesión
        </Link>
      </div>

      {searchParams?.error ? (
        <div className="card" style={{ padding: 12, marginTop: 14, border: "1px solid #fecaca" }}>
          <div style={{ color: "crimson", fontWeight: 800 }}>⚠️ {searchParams.error}</div>
        </div>
      ) : null}

      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "14px 0 10px" }}>Accesos rápidos</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {core.map((m) => (
            <Tile key={m.title} m={m} />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Módulos</h2>
            <div className="small" style={{ opacity: 0.65 }}>
              Los vamos activando uno por uno, sin romper lo existente.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {modules.map((m) => (
            <Tile key={m.title} m={m} />
          ))}
        </div>
      </section>
    </main>
  );
}
