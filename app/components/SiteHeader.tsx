import Link from "next/link";
import MobileMenu from "./MobileMenu.client";
import HeaderChat from "./HeaderChat.client";

type HeaderUser = {
  email: string;
  role?: string | null;
  roleLabel?: string | null;
};

export default function SiteHeader({ user }: { user: HeaderUser | null }) {
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(14px)",
      borderBottom: "1px solid #eee",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        padding: "0 16px",
        height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>

        {/* LOGO */}
        <Link href="/" style={{
          fontWeight: 900, letterSpacing: -0.5, textDecoration: "none", color: "inherit",
          display: "inline-flex", alignItems: "center", gap: 9, fontSize: 16, flexShrink: 0,
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 11, background: "#B48A73",
            color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900,
          }}>PG</span>
          <span className="hide-xs">Pino Galant</span>
        </Link>

        {/* CHAT — entre logo y nav */}
        <HeaderChat />

        {/* NAV — solo desktop */}
        <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { href: "/propiedades",                   label: "Propiedades" },
            { href: "/propiedades?operation=venta",   label: "Venta" },
            { href: "/propiedades?operation=alquiler", label: "Alquiler" },
            { href: "/publicar",                      label: "Publicar" },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              textDecoration: "none", color: "#444", fontSize: 14, fontWeight: 600,
              padding: "8px 13px", borderRadius: 10,
            }}>
              {link.label}
            </Link>
          ))}
          {user && !isAdmin && (
            <Link href="/mi-alquiler" style={{
              textDecoration: "none", color: "#B48A73", fontSize: 14, fontWeight: 700,
              padding: "8px 13px", borderRadius: 10,
            }}>
              Mi alquiler
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" style={{
              textDecoration: "none", color: "#B48A73", fontSize: 14, fontWeight: 700,
              padding: "8px 13px", borderRadius: 10,
            }}>
              Admin
            </Link>
          )}
        </nav>

        {/* RIGHT */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* WhatsApp — solo desktop */}
          <a
            href="https://wa.me/549112345678"
            target="_blank" rel="noopener noreferrer"
            className="desktop-nav"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#25D366", color: "#fff", padding: "8px 14px",
              borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700,
            }}
          >
            💬 WhatsApp
          </a>

          {/* Auth — solo desktop */}
          {user ? (
            <Link href="/perfil" className="desktop-nav" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 10, border: "1px solid #eee",
              textDecoration: "none", color: "inherit", fontSize: 13,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 999, background: "#2D3134",
                color: "#fff", display: "grid", placeItems: "center",
                fontWeight: 900, fontSize: 10, flexShrink: 0,
              }}>
                {(user.email?.[0] || "U").toUpperCase()}
              </span>
              <span style={{ opacity: 0.7 }} className="hide-sm">{user.roleLabel ?? "Usuario"}</span>
            </Link>
          ) : (
            <Link href="/login" className="desktop-nav" style={{
              display: "inline-flex", alignItems: "center", padding: "8px 14px",
              borderRadius: 10, border: "1px solid #ddd", textDecoration: "none",
              color: "inherit", fontSize: 13, fontWeight: 600,
            }}>
              Ingresar
            </Link>
          )}

          {/* WhatsApp mobile (solo icono) */}
          <a
            href="https://wa.me/549112345678"
            target="_blank" rel="noopener noreferrer"
            className="mobile-only"
            style={{
              display: "none",
              width: 38, height: 38, borderRadius: 10,
              background: "#25D366", color: "#fff",
              alignItems: "center", justifyContent: "center",
              textDecoration: "none", fontSize: 18,
            }}
          >
            💬
          </a>

          {/* Hamburger */}
          <div className="mobile-only" style={{ display: "none" }}>
            <MobileMenu isAdmin={isAdmin} isLoggedIn={!!user} />
          </div>
        </div>
      </div>
    </header>
  );
}
