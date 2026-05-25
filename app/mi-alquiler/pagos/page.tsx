import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { daysUntil, formatARS, monthName } from "@/app/admin/alquileres/date-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  online:   "Pago online",
  transfer: "Transferencia",
  office:   "En oficina",
  other:    "Otro",
};

export default async function MisPagosPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler/pagos");

  const admin = createSupabaseAdminClient();

  // Obtener contratos del inquilino
  const { data: contracts } = await admin
    .from("rental_contracts")
    .select("id, reference_code, status, monthly_rent_ars, properties(title)")
    .eq("tenant_id", data.user.id)
    .not("status", "eq", "terminated");

  const contractIds = (contracts ?? []).map(c => c.id);

  // Obtener todos los pagos
  const { data: payments } = await admin
    .from("rental_payments")
    .select("*")
    .in("contract_id", contractIds)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  const rows = payments ?? [];

  const totalPaid    = rows.filter(p => p.status === "paid").reduce((s, p) => s + (p.total_ars ?? 0), 0);
  const totalPending = rows.filter(p => p.status === "pending").reduce((s, p) => s + (p.total_ars ?? 0), 0);
  const overdue      = rows.filter(p => p.status === "pending" && daysUntil(p.due_date) < 0);

  // Contrato activo para mostrar nombre propiedad
  const contractMap = Object.fromEntries((contracts ?? []).map(c => [c.id, c]));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Mi alquiler
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "#2D3134" }}>Mis pagos</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
          Historial completo de cuotas de tu contrato de alquiler.
        </p>
      </div>

      {searchParams?.ok && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ✅ {decodeURIComponent(searchParams.ok)}
        </div>
      )}

      {/* Alertas pagos vencidos */}
      {overdue.length > 0 && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, color: "#b91c1c", marginBottom: 8, fontSize: 14 }}>
            🔴 Tenés {overdue.length} cuota{overdue.length > 1 ? "s" : ""} vencida{overdue.length > 1 ? "s" : ""}
          </div>
          {overdue.map(p => (
            <div key={p.id} style={{ fontSize: 13, color: "#b91c1c", marginBottom: 4 }}>
              • {monthName(p.period_month)} {p.period_year} — {formatARS(p.total_ars)} — venció {p.due_date}
            </div>
          ))}
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#b91c1c" }}>
            Por favor regularizá tu situación. Podés abonar en nuestras oficinas o comunicarte por WhatsApp.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="tenant-stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total pagado", value: formatARS(totalPaid), color: "#dcfce7", icon: "✅" },
          { label: "Total pendiente", value: formatARS(totalPending), color: "#fef3c7", icon: "⏳" },
          { label: "Cuotas en total", value: rows.length, color: "#f3f4f6", icon: "📋" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "18px 20px",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: s.color,
              display: "grid", placeItems: "center", fontSize: 18, marginBottom: 10,
            }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#2D3134" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla de pagos */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
            No hay cuotas generadas aún.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  {["Período", "Monto", "Vencimiento", "Estado", "Método de pago", "Pagado"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "12px 16px",
                      fontSize: 11, fontWeight: 700, color: "#888",
                      textTransform: "uppercase", letterSpacing: 0.5,
                      borderBottom: "1px solid #eee",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const isOverdue = p.status === "pending" && daysUntil(p.due_date) < 0;
                  const isSoon    = p.status === "pending" && daysUntil(p.due_date) >= 0 && daysUntil(p.due_date) <= 7;
                  const statusBg    = p.status === "paid"    ? "#dcfce7"
                                    : isOverdue              ? "#fee2e2"
                                    : isSoon                 ? "#fef3c7"
                                    :                          "#f3f4f6";
                  const statusColor = p.status === "paid"    ? "#15803d"
                                    : isOverdue              ? "#dc2626"
                                    : isSoon                 ? "#b45309"
                                    :                          "#555";
                  const statusLabel = p.status === "paid"    ? "Pagado"
                                    : isOverdue              ? "Vencido"
                                    : isSoon                 ? "Próximo"
                                    :                          "Pendiente";

                  const contract = contractMap[p.contract_id];
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#2D3134" }}>
                          {monthName(p.period_month)} {p.period_year}
                        </div>
                        {p.price_increase_applied && (
                          <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>
                            📈 Ajuste aplicado
                          </div>
                        )}
                        {(contracts?.length ?? 0) > 1 && (
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                            {(contract as any)?.properties?.title}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 900, fontSize: 16, color: "#2D3134" }}>
                          {formatARS(p.total_ars)}
                        </div>
                        {p.expenses_ars > 0 && (
                          <div style={{ fontSize: 11, color: "#888" }}>
                            incl. {formatARS(p.expenses_ars)} exp.
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: isOverdue ? "#dc2626" : "#555", fontWeight: isOverdue ? 700 : 400 }}>
                        {p.due_date}
                        {isOverdue && <div style={{ fontSize: 11 }}>VENCIDO hace {Math.abs(daysUntil(p.due_date))} días</div>}
                        {isSoon && <div style={{ fontSize: 11, color: "#b45309" }}>Vence en {daysUntil(p.due_date)} días</div>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          background: statusBg, color: statusColor,
                          padding: "4px 10px", borderRadius: 999,
                          fontWeight: 800, fontSize: 11,
                        }}>{statusLabel}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#555" }}>
                        {p.payment_method ? METHOD_LABELS[p.payment_method] ?? p.payment_method : "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#888" }}>
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString("es-AR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info pago en oficinas */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #eee",
        padding: "20px 24px", marginTop: 16,
      }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#2D3134" }}>
          💡 ¿Cómo pagar?
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🏢 En nuestras oficinas</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Presentate con tu número de referencia de contrato y abonás en efectivo o con tarjeta.
              El admin registrará el pago automáticamente.
            </div>
          </div>
          <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>💬 Por WhatsApp</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Escribinos por WhatsApp indicando tu referencia de contrato y el período a abonar.
              Te informaremos los datos de transferencia.
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP ?? "5491100000000"}?text=${encodeURIComponent("Hola, quiero pagar mi alquiler.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 10, background: "#25d366", color: "#fff",
                textDecoration: "none", padding: "8px 14px", borderRadius: 8,
                fontWeight: 700, fontSize: 12,
              }}
            >
              📲 Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
