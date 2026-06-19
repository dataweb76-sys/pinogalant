import Link from "next/link";
import MobileMenu from "./MobileMenu.client";
import HeaderChat from "./HeaderChat.client";
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
        height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>

        {/* LOGO */}
        <Link href="/" style={{
          fontWeight: 900, letterSpacing: -0.5, textDecoration: "none", color: "inherit",
          display: "inline-flex", alignItems: "center", gap: 9, fontSize: 16, flexShrink: 0,
        }}>
          <img src="/logo.png" alt="Pino Galant" style={{ width: 40, height: 40, flexShrink: 0 }} />
          <span className="hide-xs">Pino Galant</span>
        </Link>

        {/* CHAT â€” entre logo y nav */}
        <HeaderChat />

        {/* NAV â€” solo desktop */}
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
          {/* WhatsApp â€” solo desktop */}
          <div className="desktop-nav">
            <WhatsAppButton />
          </div>

          {/* Auth â€” solo desktop */}
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
