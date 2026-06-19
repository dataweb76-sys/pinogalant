import Link from "next/link";
import MobileMenu from "./MobileMenu.client";
import WhatsAppButton from "./WhatsAppButton.client";

type HeaderUser = {
  email: string;
  role?: string | null;
  roleLabel?: string | null;
};

export default function SiteHeader({ user }: { user: HeaderUser | null }) {
  const isAdmin  = user?.role === "admin" || user?.role === "super_admin" || user?.role === "agent";
  const isTenant = user?.role === "tenant";
  const isOwner  = user?.role === "owner";

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
        height: 70,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>

        {/* LOGO */}
        <Link href="/" style={{
          fontWeight: 900, letterSpacing: -0.5, textDecoration: "none", color: "inherit",
          display: "inline-flex", alignItems: "center", gap: 10, fontSize: 19, flexShrink: 0,
        }}>
          <img src="/logo.png" alt="Pino Galant" style={{ width: 50, height: 50, objectFit: "contain", flexShrink: 0 }} />
          <span className="hide-xs">Pino Galant</span>
        </Link>

        {/* NAV — solo desktop */}
        <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { href: "/propiedades",                   label: "Propiedades" },
            { href: "/propiedades?operation=venta",   label: "Venta" },
            { href: "/propiedades?operation=alquiler", label: "Alquiler" },
            { href: "/tasacion",                      label: "Tasación" },
            { href: "/publicar",                      label: "Publicar" },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              textDecoration: "none", color: "#444", fontSize: 14, fontWeight: 600,
              padding: "8px 13px", borderRadius: 10,
            }}>
              {link.label}
            </Link>
          ))}
          {isTenant && (
            <Link href="/mi-alquiler" style={{
              textDecoration: "none", color: "#B48A73", fontSize: 14, fontWeight: 700,
              padding: "8px 13px", borderRadius: 10,
            }}>
              Mi alquiler
            </Link>
          )}
          {isOwner && (
            <Link href="/mi-propiedad" style={{
              textDecoration: "none", color: "#B48A73", fontSize: 14, fontWeight: 700,
              padding: "8px 13px", borderRadius: 10,
            }}>
              Mi propiedad
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
          {/* Instagram — solo desktop */}
          <a
            href="https://www.instagram.com/pinogalant/"
            target="_blank"
            rel="noopener noreferrer"
            className="desktop-nav"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
              color: "#fff", flexShrink: 0,
            }}
            title="Instagram Pino Galant"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          {/* WhatsApp — solo desktop */}
          <div className="desktop-nav">
            <WhatsAppButton />
          </div>

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
          <div className="mobile-only" style={{ display: "none" }}>
            <WhatsAppButton />
          </div>

          {/* Hamburger */}
          <div className="mobile-only" style={{ display: "none" }}>
            <MobileMenu isAdmin={isAdmin} isLoggedIn={!!user} isTenant={isTenant} isOwner={isOwner} />
          </div>
        </div>
      </div>
    </header>
  );
}
