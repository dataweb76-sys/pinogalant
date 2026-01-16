import { signUpAction } from "@/app/auth/actions";
import Link from "next/link";

export default function RegistroPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string };
}) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Crear cuenta</h1>

      {searchParams?.error ? (
        <p className="small" style={{ color: "crimson" }}>
          ❌ {searchParams.error}
        </p>
      ) : null}

      <form action={signUpAction} style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="small">Email</label>
          <input className="input" name="email" type="email" required />
        </div>
        <div>
          <label className="small">Contraseña</label>
          <input className="input" name="password" type="password" required />
        </div>

        <button className="btn btnPrimary" type="submit">
          Crear cuenta
        </button>

        <div className="small">
          ¿Ya tenés cuenta? <Link href="/login">Ingresar</Link>
        </div>
      </form>
    </div>
  );
}
