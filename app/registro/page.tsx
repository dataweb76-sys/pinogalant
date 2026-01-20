import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";

export const runtime = "nodejs";

const CITIES = [
  "CABA",
  "La Plata",
  "Mar del Plata",
  "Bahía Blanca",
  "Rosario",
  "Córdoba",
  "Mendoza",
  "Salta",
  "Tucumán",
];

export default function RegistroPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string; next?: string };
}) {
  const next = searchParams?.next ? String(searchParams.next) : "/";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 90px" }}>
      <div style={{ display: "grid", gap: 10 }}>
        <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Crear cuenta</h1>
        <div className="small" style={{ opacity: 0.7 }}>
          Para publicar o consultar con agentes, necesitás una cuenta.
        </div>

        {searchParams?.error ? (
          <div className="card" style={{ padding: 12, border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c" }}>
            ❌ {searchParams.error}
          </div>
        ) : null}

        <form action={signUpAction} className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
          <input type="hidden" name="next" value={next} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="small">Nombre *</label>
              <input className="input" name="first_name" required placeholder="Juan" />
            </div>
            <div>
              <label className="small">Apellido *</label>
              <input className="input" name="last_name" required placeholder="Pérez" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="small">Usuario *</label>
              <input className="input" name="username" required placeholder="juanperez" />
              <div className="small" style={{ opacity: 0.65, marginTop: 6 }}>
                Se usa para identificar tu cuenta internamente.
              </div>
            </div>
            <div>
              <label className="small">Móvil / WhatsApp *</label>
              <input className="input" name="phone" required placeholder="+54911..." />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="small">Código Postal *</label>
              <input className="input" name="postal_code" required placeholder="1900" />
            </div>

            <div>
              <label className="small">Ciudad *</label>
              <input className="input" name="city" required list="city-list" placeholder="Escribí o elegí…" />
              <datalist id="city-list">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="small">Dirección (opcional)</label>
            <input className="input" name="address" placeholder="Calle 123, piso, depto…" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="small">Email *</label>
              <input className="input" type="email" name="email" required placeholder="tu@email.com" />
            </div>
            <div>
              <label className="small">Clave *</label>
              <input className="input" type="password" name="password" required minLength={8} placeholder="mínimo 8 caracteres" />
            </div>
          </div>

          <button className="btn btnPrimary" type="submit">
            Registrarme
          </button>

          <div className="small" style={{ opacity: 0.7 }}>
            ¿Ya tenés cuenta? <Link href="/login">Ingresar</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
