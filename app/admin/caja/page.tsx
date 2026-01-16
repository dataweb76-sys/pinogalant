// app/admin/caja/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Movement = {
  id: string;
  type: "income" | "expense";
  amount_ars: number | null;
  amount_usd: number | null;
  concept: string;
  notes: string | null;
  property_id: string | null;
  created_at: string;
};

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default async function CashPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) redirect("/login?next=/admin/caja");

  const admin = createSupabaseAdminClient();

  // Movimientos (últimos 30)
  const { data: rows, error } = await admin
    .from("cash_movements")
    .select("id,type,amount_ars,amount_usd,concept,notes,property_id,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const list = (rows as any as Movement[]) ?? [];

  // Resumen simple
  const saldoARS = list.reduce((acc, m) => acc + (m.type === "income" ? 1 : -1) * n(m.amount_ars), 0);
  const saldoUSD = list.reduce((acc, m) => acc + (m.type === "income" ? 1 : -1) * n(m.amount_usd), 0);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div className="small" style={{ opacity: 0.7 }}>
            Gestión interna
          </div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>Gestión de Caja</h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Registrá ingresos/egresos y controlá el saldo.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" href="/admin">
            Volver
          </Link>
          <Link className="btn" href="/logout">
            Cerrar sesión
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12, marginTop: 18 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Alta rápida</div>

          {/* Form simple (después lo conectamos con Server Action) */}
          <div className="small" style={{ opacity: 0.7, marginTop: 8 }}>
            (Ahora dejamos la UI lista. En el próximo paso lo conectamos para guardar.)
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                  Tipo
                </div>
                <select className="input" defaultValue="income">
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                </select>
              </div>
              <div>
                <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                  Fecha/hora
                </div>
                <input className="input" placeholder="dd/mm/aaaa --:--" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                  Monto ARS
                </div>
                <input className="input" placeholder="Ej: 150000" />
              </div>
              <div>
                <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                  Monto USD
                </div>
                <input className="input" placeholder="Ej: 200" />
              </div>
            </div>

            <div>
              <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                Concepto (obligatorio)
              </div>
              <input className="input" placeholder="Ej: Alquiler enero / Honorarios / Reparación..." />
            </div>

            <div>
              <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                Notas / observaciones
              </div>
              <textarea className="input" placeholder="Opcional" style={{ minHeight: 90 }} />
            </div>

            <div>
              <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                Propiedad ID (opcional)
              </div>
              <input className="input" placeholder="UUID de la propiedad (si aplica)" />
            </div>

            <button className="btn btnPrimary" disabled>
              Guardar movimiento
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900 }}>Resumen</div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div className="card" style={{ padding: 12 }}>
              <div className="small" style={{ opacity: 0.7 }}>
                Saldo (ARS)
              </div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>${saldoARS.toLocaleString("es-AR")}</div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div className="small" style={{ opacity: 0.7 }}>
                Saldo (USD)
              </div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>USD {saldoUSD.toLocaleString("en-US")}</div>
            </div>

            <div className="small" style={{ opacity: 0.65 }}>
              Tip: en el próximo paso lo vinculamos con propiedades desde un selector (sin UUID).
            </div>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ margin: "16px 0 10px" }}>Movimientos recientes</h2>

        {error ? (
          <div className="small" style={{ color: "crimson" }}>
            ❌ Error cargando movimientos: {error.message}
          </div>
        ) : list.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800 }}>Todavía no hay movimientos</div>
            <div className="small" style={{ opacity: 0.7 }}>
              Cuando guardemos el alta rápida, van a aparecer acá.
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid" }}>
              {list.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 160px 160px",
                    gap: 10,
                    padding: "12px 14px",
                    borderTop: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <div className="small" style={{ opacity: 0.7 }}>
                    {new Date(m.created_at).toLocaleString("es-AR")}
                  </div>
                  <div style={{ fontWeight: 800 }}>
                    {m.type === "income" ? "Ingreso" : "Egreso"} — {m.concept}
                    {m.notes ? <div className="small" style={{ opacity: 0.7 }}>{m.notes}</div> : null}
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 900 }}>
                    {m.amount_ars != null ? `$${Number(m.amount_ars).toLocaleString("es-AR")}` : "—"}
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 900 }}>
                    {m.amount_usd != null ? `USD ${Number(m.amount_usd).toLocaleString("en-US")}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
