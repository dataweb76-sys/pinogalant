import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";

export const runtime = "nodejs";

export default function LogoutPage() {
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Cerrar sesión</h1>

        <form action={signOutAction} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btnPrimary" type="submit">
            Salir
          </button>
          <Link className="btn" href="/">
            Cancelar
          </Link>
        </form>
      </div>
    </main>
  );
}
