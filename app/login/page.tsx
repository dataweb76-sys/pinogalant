import { signInAction } from "@/app/auth/actions";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string };
}) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Ingresar</h1>

      {searchParams?.error ? (
        <p className="small" style={{ color: "crimson" }}>
          ❌ {searchParams.error}
        </p>
      ) : null}

      {searchParams?.ok ? <p className="small">✅ {searchParams.ok}</p> : null}

      <form action={signInAction} style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="small">Email</label>
          <input className="input" name="email" type="email" required />
        </div>
        <div>
          <label className="small">Contraseña</label>
          <input className="input" name="password" type="password" required />
        </div>

        <button className="btn btnPrimary" type="submit">
          Ingresar
        </button>

        <div className="small">
          ¿No tenés cuenta? <Link href="/registro">Crear cuenta</Link>
        </div>
      </form>
    </div>
  );
}
