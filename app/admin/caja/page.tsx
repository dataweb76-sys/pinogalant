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

  const { data: rows, error } = await admin
    .from("cash_movements")
    .select("id,type,amount_ars,amount_usd,concept,notes,property_id,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const list = (rows as any as Movement[]) ?? [];

  const saldoARS = list.reduce((acc, m) => acc + (m.type === "income" ? 1 : -1) * n(m.amount_ars), 0);
  const saldoUSD = list.reduce((acc, m) => acc + (m.type === "income" ? 1 : -1) * n(m.amount_usd), 0);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px", fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Tesorería
          </div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 800, letterSpacing: "-0.03em", color: "#111" }}>Gestión de Caja</h1>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/admin" style={{ textDecoration: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: 600, fontSize: "14px", border: "1px solid #e5e7eb", color: "#374151", background: "white" }}>
            ← Volver al Panel
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#111", color: "white", display: "grid", placeItems: "center", fontSize: "20px" }}>➕</div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Nuevo Movimiento</h2>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#4b5563", marginBottom: "6px" }}>Tipo de flujo</label>
                <select style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none" }}>
                  <option value="income">🟢 Ingreso de dinero</option>
                  <option value="expense">🔴 Egreso / Pago</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#4b5563", marginBottom: "6px" }}>Fecha</label>
                <input type="datetime-local" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#4b5563", marginBottom: "6px" }}>Monto ARS</label>
                <input placeholder="0.00" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#4b5563", marginBottom: "6px" }}>Monto USD</label>
                <input placeholder="0.00" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#4b5563", marginBottom: "6px" }}>Concepto</label>
              <input placeholder="Ej: Cobro Alquiler Depto 2B" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }} />
            </div>

            <button disabled style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "#111", color: "white", fontWeight: 700, fontSize: "15px", border: "none", cursor: "not-allowed", marginTop: "10px", opacity: 0.7 }}>
              Guardar Movimiento
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN */}
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ background: "#111", padding: "32px", borderRadius: "16px", color: "white", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Saldo Disponible (ARS)</div>
            <div style={{ fontSize: "36px", fontWeight: 800 }}>${saldoARS.toLocaleString("es-AR")}</div>
          </div>

          <div style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Saldo Disponible (USD)</div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#111" }}>USD {saldoUSD.toLocaleString("en-US")}</div>
          </div>

          <div style={{ background: "#fef3c7", padding: "20px", borderRadius: "16px", border: "1px solid #fde68a", color: "#92400e" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>💡</span> Tip de Gestión
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: "1.5" }}>
              Próximamente podrás vincular cada movimiento a una propiedad específica desde un buscador inteligente.
            </p>
          </div>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS */}
      <section style={{ marginTop: "48px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "#111" }}>Historial de Movimientos</h2>
        
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {list.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              No hay movimientos registrados recientemente.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "16px", fontSize: "13px", color: "#4b5563", fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: "16px", fontSize: "13px", color: "#4b5563", fontWeight: 600 }}>Concepto</th>
                  <th style={{ padding: "16px", fontSize: "13px", color: "#4b5563", fontWeight: 600, textAlign: "right" }}>ARS</th>
                  <th style={{ padding: "16px", fontSize: "13px", color: "#4b5563", fontWeight: 600, textAlign: "right" }}>USD</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "16px", fontSize: "13px", color: "#6b7280" }}>
                      {new Date(m.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ 
                          width: "8px", height: "8px", borderRadius: "50%", 
                          background: m.type === "income" ? "#10b981" : "#ef4444" 
                        }}></span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "#111" }}>{m.concept}</div>
                          {m.notes && <div style={{ fontSize: "12px", color: "#9ca3af" }}>{m.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px", textAlign: "right", fontWeight: 700, color: m.type === "income" ? "#10b981" : "#111" }}>
                      {m.amount_ars ? `${m.type === "expense" ? "-" : ""}$${Number(m.amount_ars).toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td style={{ padding: "16px", textAlign: "right", fontWeight: 700, color: m.type === "income" ? "#10b981" : "#111" }}>
                      {m.amount_usd ? `${m.type === "expense" ? "-" : ""}u$d ${Number(m.amount_usd).toLocaleString("en-US")}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}