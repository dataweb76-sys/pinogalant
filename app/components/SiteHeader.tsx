import Link from "next/link";

type HeaderUser = {
  email: string;
  role?: string | null;
  roleLabel?: string | null;
};

export default function SiteHeader({ user }: { user: HeaderUser | null }) {
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* LOGO */}
        <Link
          href="/"
          style={{
            fontWeight: 950,
            letterSpacing: -0.4,
            textDecoration: "none",
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            PG
          </span>
          <span>Pino Galant</span>
        </Link>

        {/* NAV */}
        <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link className="small" href="/propiedades" style={navLink}>
            Propiedades
          </Link>

          <Link className="small" href="/publicar" style={navLink}>
            Publicar
          </Link>

          {/* 🔒 SOLO ADMIN / SUPERADMIN */}
          {isAdmin && (
            <Link className="small" href="/admin" style={navLink}>
              Admin
            </Link>
          )}

          {/* USUARIO */}
          {user ? (
            <Link
              className="btn"
              href="/perfil"
              title="Mi perfil"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span className="small" style={{ opacity: 0.75 }}>
                {user.roleLabel ?? "Usuario"}
              </span>

              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: "#111",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                {(user.email?.[0] || "U").toUpperCase()}
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

const navLink: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  opacity: 0.8,
};
