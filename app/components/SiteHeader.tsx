// app/components/SiteHeader.tsx
import Link from "next/link";

type HeaderUser = {
  email: string;
  roleLabel?: string | null;
};

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteHeader({ user }: { user: HeaderUser | null }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "white", borderBottom: "1px solid #eee" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" style={{ fontWeight: 900, textDecoration: "none", color: "inherit" }}>
          Inmo
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link className="small" href="/propiedades" style={{ textDecoration: "none", color: "inherit", opacity: 0.75 }}>
            Propiedades
          </Link>
          <Link className="small" href="/publicar" style={{ textDecoration: "none", color: "inherit", opacity: 0.75 }}>
            Publicar
          </Link>
          <Link className="small" href="/admin" style={{ textDecoration: "none", color: "inherit", opacity: 0.75 }}>
            Admin
          </Link>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user.roleLabel ? (
                <span className="small" style={{ opacity: 0.7 }}>
                  {user.roleLabel}
                </span>
              ) : null}

              <Link className="btn" href="/perfil" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <UserIcon />
                Perfil
              </Link>
            </div>
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
