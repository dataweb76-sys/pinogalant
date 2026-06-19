"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type MobileMenuProps = {
  isAdmin: boolean;
  isLoggedIn: boolean;
  isTenant?: boolean;
  isOwner?: boolean;
};

export default function MobileMenu({ isAdmin, isLoggedIn, isTenant, isOwner }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Cerrar con escape / scroll
  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "/propiedades",                  label: "Propiedades",    icon: "🏠" },
    { href: "/propiedades?operation=venta",  label: "En venta",       icon: "🔑" },
    { href: "/propiedades?operation=alquiler", label: "En alquiler",  icon: "📋" },
    { href: "/publicar",                     label: "Publicar",       icon: "📤" },
    ...(isTenant ? [{ href: "/mi-alquiler",   label: "Mi alquiler",   icon: "🏡" }] : []),
    ...(isOwner  ? [{ href: "/mi-propiedad", label: "Mi propiedad",  icon: "🏢" }] : []),
    ...(isAdmin  ? [{ href: "/admin",         label: "Panel Agentes", icon: "⚙️" }] : []),
  ];

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setOpen(!open)}
        className="mobile-menu-btn"
        aria-label="Menú"
        style={{
          display: "none",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          flexDirection: "column",
          gap: 5,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ width: 22, height: 2, background: "#2D3134", borderRadius: 2, display: "block", transition: "all .2s", transform: open ? "rotate(45deg) translate(5px,5px)" : "none" }} />
        <span style={{ width: 22, height: 2, background: "#2D3134", borderRadius: 2, display: "block", opacity: open ? 0 : 1, transition: "opacity .2s" }} />
        <span style={{ width: 22, height: 2, background: "#2D3134", borderRadius: 2, display: "block", transition: "all .2s", transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
      </button>

      {/* Overlay + drawer */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 90,
              background: "rgba(0,0,0,.45)",
            }}
          />
          <div style={{
            position: "fixed",
            top: 0, right: 0,
            width: "min(300px, 85vw)",
            height: "100dvh",
            background: "#fff",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-8px 0 40px rgba(0,0,0,.2)",
            overflow: "auto",
          }}>
            {/* Header del drawer */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/logo.png" alt="Pino Galant" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%" }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: "#2D3134" }}>Pino Galant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}
              >✕</button>
            </div>

            {/* Links */}
            <nav style={{ padding: "12px 10px", flex: 1 }}>
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 14px", borderRadius: 12, marginBottom: 2,
                    textDecoration: "none", color: "#2D3134",
                    fontWeight: 600, fontSize: 15,
                  }}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Bottom */}
            <div style={{ padding: "14px 14px 20px", borderTop: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP ?? "5491123456789"}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#25D366", color: "#fff", padding: "13px",
                  borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 15,
                }}
              >
                💬 WhatsApp
              </a>
              {isLoggedIn ? (
                <Link href="/perfil" onClick={() => setOpen(false)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #eee", borderRadius: 12, padding: "12px",
                  textDecoration: "none", color: "#555", fontWeight: 600, fontSize: 14,
                }}>Mi perfil</Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #ddd", borderRadius: 12, padding: "12px",
                  textDecoration: "none", color: "#2D3134", fontWeight: 700, fontSize: 14,
                }}>Ingresar</Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
