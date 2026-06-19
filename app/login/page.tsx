import { signInAction } from "@/app/auth/actions";
import GoogleSignInButton from "@/app/components/GoogleSignInButton.client";
import Link from "next/link";

export const runtime = "nodejs";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string; next?: string };
}) {
  const next = searchParams?.next ?? "/";

  return (
    <div style={{ maxWidth: 460, margin: "48px auto", padding: "0 16px 80px" }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <img src="/logo.png" alt="Pino Galant" style={{ width: 80, height: 80, objectFit: "contain" }} />
        <div style={{ marginTop: 10, fontWeight: 900, fontSize: 20, color: "#2D3134" }}>Pino Galant</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>IngresÃ¡ a tu cuenta</div>
      </div>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
          âŒ {decodeURIComponent(searchParams.error)}
        </div>
      )}
      {searchParams?.ok && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
          âœ… {decodeURIComponent(searchParams.ok)}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "24px 20px", display: "grid", gap: 16 }}>

        {/* Google */}
        <GoogleSignInButton next={next} label="Continuar con Google" />

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#eee" }} />
          <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>o ingresÃ¡ con email</span>
          <div style={{ flex: 1, height: 1, background: "#eee" }} />
        </div>

        {/* Formulario email/pass */}
        <form action={signInAction} style={{ display: "grid", gap: 12 }}>
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label>
            <input className="input" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>ContraseÃ±a</label>
            <input className="input" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button
            type="submit"
            style={{
              background: "#2D3134", color: "#fff",
              border: "none", borderRadius: 12,
              padding: "12px", fontSize: 14, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Ingresar
          </button>
        </form>

        <div className="small" style={{ textAlign: "center", color: "#888" }}>
          Â¿No tenÃ©s cuenta?{" "}
          <Link href="/registro?tipo=inquilino" style={{ color: "#B48A73", fontWeight: 700 }}>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
