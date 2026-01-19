// app/components/SiteHeader.tsx
import Link from "next/link";

type HeaderUser = {
  email: string;
  roleLabel?: string | null;
};

export default function SiteHeader({ user }: { user: HeaderUser | null }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "white",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* LOGO + BRAND */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "inherit",
            minWidth: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Pino Galant"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              objectFit: "cover",
              border: "1px solid #eee",
            }}
          />
          <div style={{ lineHeight: 1.05, minWidth: 0 }}>
            <div style={{ fontWeight: 900, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Pino Galant
            </div>
            <div className="small" style={{ opacity: 0.65 }}>
              Servicios inmobiliarios
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link className="small" href="/propiedades" style={{ textDecoration: "none", color: "inherit", opacity: 0.75 }}>
            Propiedades
          </Link>
          <Link className="small" href="/publicar" style={{ textDecoration: "none", color: "inherit", opacity: 0.75 }}>
            Publicar
          </Link>

          {user ? (
            <Link
              className="btn"
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}
              title={user.roleLabel || "Staff"}
            >
              <span className="small" style={{ opacity: 0.7 }}>
                {user.roleLabel || "Staff"}
              </span>
              <span
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "#111",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {String(user.email?.[0] || "S").toUpperCase()}
              </span>
            </Link>
          ) : (
            <Link className="btn" href="/login">
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
