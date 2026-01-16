// app/components/SiteHeader.tsx
import Link from "next/link";
import { User as UserIcon } from "lucide-react";

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
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
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
            <Link
              href="/perfil"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "inherit",
              }}
              title="Ir a mi perfil"
            >
              {user.roleLabel ? (
                <span className="small" style={{ opacity: 0.7 }}>
                  {user.roleLabel}
                </span>
              ) : null}

              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid #eee",
                  display: "grid",
                  placeItems: "center",
                  background: "#fff",
                }}
              >
                <UserIcon size={18} />
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
