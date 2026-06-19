import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Descargá la App — Pino Galant",
  description: "Instalá la app de Pino Galant en tu celular y buscá propiedades desde donde estés.",
};

export default function AppPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1a1e21 0%, #2D3134 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 20px",
    }}>
      {/* Logo */}
      <img src="/logo.png" alt="Pino Galant" style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 20 }} />
      <div style={{ color: "#B48A73", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        Pino Galant · Negocios Inmobiliarios
      </div>
      <h1 style={{ color: "#fff", fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 900, textAlign: "center", margin: "0 0 10px", letterSpacing: -0.5 }}>
        Llevá las propiedades<br />en tu bolsillo
      </h1>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, textAlign: "center", maxWidth: 340, lineHeight: 1.6, margin: "0 0 40px" }}>
        Buscá casas, departamentos, terrenos y campos desde tu celular, en cualquier momento.
      </p>

      {/* Pasos */}
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>

        {/* Android */}
        <div style={{
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 18, padding: "20px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>🤖</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Android</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Chrome · Samsung Browser</div>
            </div>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 2 }}>
            <li>Abrí <strong style={{ color: "#fff" }}>pinogalant.com.ar</strong> en Chrome</li>
            <li>Tocá los <strong style={{ color: "#fff" }}>tres puntos ⋮</strong> arriba a la derecha</li>
            <li>Seleccioná <strong style={{ color: "#fff" }}>"Agregar a pantalla de inicio"</strong></li>
            <li>Tocá <strong style={{ color: "#fff" }}>Instalar</strong> y listo ✓</li>
          </ol>
        </div>

        {/* iOS */}
        <div style={{
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 18, padding: "20px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>🍎</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>iPhone / iPad</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Safari</div>
            </div>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 2 }}>
            <li>Abrí <strong style={{ color: "#fff" }}>pinogalant.com.ar</strong> en Safari</li>
            <li>Tocá el ícono de <strong style={{ color: "#fff" }}>compartir</strong> <span style={{ fontSize: 16 }}>⬆️</span></li>
            <li>Seleccioná <strong style={{ color: "#fff" }}>"Agregar a pantalla de inicio"</strong></li>
            <li>Tocá <strong style={{ color: "#fff" }}>Agregar</strong> y listo ✓</li>
          </ol>
        </div>
      </div>

      {/* CTA */}
      <a
        href="/"
        style={{
          display: "inline-block",
          background: "#B48A73", color: "#fff",
          padding: "14px 36px", borderRadius: 14,
          fontWeight: 800, fontSize: 15, textDecoration: "none",
          letterSpacing: 0.3,
        }}
      >
        Abrir la app →
      </a>

      <Link href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 20, textDecoration: "none" }}>
        pinogalant.com.ar
      </Link>
    </main>
  );
}
