import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { daysUntil, formatARS, monthName } from "@/app/admin/alquileres/date-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: "Borrador",            color: "#555",    bg: "#f3f4f6" },
  pending_tenant: { label: "Pendiente tu firma",  color: "#b45309", bg: "#fef3c7" },
  pending_admin:  { label: "Esperando aprobación",color: "#1d4ed8", bg: "#dbeafe" },
  active:         { label: "Activo ✓",            color: "#15803d", bg: "#dcfce7" },
  expired:        { label: "Vencido",             color: "#dc2626", bg: "#fee2e2" },
  terminated:     { label: "Rescindido",          color: "#7c3aed", bg: "#ede9fe" },
};

export default async function MiAlquilerPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler");

  const admin = createSupabaseAdminClient();

  // Obtener contratos del inquilino
  const { data: contracts } = await admin
    .from("rental_contracts")
    .select(`
      id, reference_code, status, start_date, end_date,
      monthly_rent_ars, expenses_ars, payment_due_day,
      price_increase_pct, price_increase_months,
      tenant_agreed_at,
      properties(title, city, address, type)
    `)
    .eq("tenant_id", data.user.id)
    .order("created_at", { ascending: false });

  const rows = contracts ?? [];

  // Próximo pago pendiente
  const { data: nextPayment } = await admin
    .from("rental_payments")
    .select("id, period_year, period_month, total_ars, due_date, status, contract_id")
    .in("contract_id", rows.map(r => r.id))
    .eq("status", "pending")
    .order("due_date")
    .limit(1)
    .maybeSingle();

  // Reclamos abiertos
  const { count: openClaims } = await admin
    .from("rental_claims")
    .select("id", { count: "exact", head: true })
    .in("contract_id", rows.map(r => r.id))
    .not("status", "in", '("resolved","closed")');

  const activeContract = rows.find(r => r.status === "active") ?? rows[0];
  const prop = (activeContract as any)?.properties;

  return (
    <div>
      {/* Feedback */}
      {searchParams?.ok && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ✅ {decodeURIComponent(searchParams.ok)}
        </div>
      )}
      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {rows.length === 0 ? (
        /* Sin contratos */
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #eee",
          padding: "60px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏠</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#2D3134" }}>
            No tenés ningún alquiler asociado
          </h2>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>
            Si ya hablaste con la inmobiliaria, pronto aparecerá tu contrato aquí.
          </p>
          <Link href="/propiedades" style={{
            background: "#2D3134", color: "#fff", textDecoration: "none",
            padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          }}>
            Ver propiedades disponibles
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Banner de acción urgente */}
          {activeContract?.status === "pending_tenant" && (
            <div style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "1px solid #f59e0b",
              borderRadius: 16, padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#92400e", marginBottom: 4 }}>
                  ✍️ Tu contrato está listo para firmar
                </div>
                <div style={{ fontSize: 13, color: "#92400e" }}>
                  Revisá las condiciones y firmá digitalmente para activar tu alquiler.
                </div>
              </div>
              <Link href="/mi-alquiler/contrato" style={{
                background: "#92400e", color: "#fff", textDecoration: "none",
                padding: "12px 24px", borderRadius: 10, fontWeight: 800, fontSize: 14, whiteSpace: "nowrap",
              }}>
                Ver y firmar →
              </Link>
            </div>
          )}

          {/* Propiedad activa */}
          {activeContract && (
            <div style={{
              background: "#fff", borderRadius: 20, border: "1px solid #eee",
              overflow: "hidden",
            }}>
              {/* Header propiedad */}
              <div style={{
                background: "#2D3134", padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "#B48A73",
                  display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0,
                }}>🏠</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                    Tu vivienda
                  </div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginTop: 2 }}>
                    {prop?.title ?? "Propiedad"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginTop: 2 }}>
                    {prop?.address ?? ""}{prop?.city ? ` · ${prop.city}` : ""}
                  </div>
                </div>
                <div>
                  {(() => {
                    const st = STATUS_LABELS[activeContract.status] ?? STATUS_LABELS.draft;
                    return (
                      <span style={{
                        background: st.bg, color: st.color,
                        padding: "6px 14px", borderRadius: 999,
                        fontWeight: 800, fontSize: 12,
                      }}>{st.label}</span>
                    );
                  })()}
                </div>
              </div>

              {/* Info del contrato */}
              <div className="tenant-stats-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                gap: 0, borderBottom: "1px solid #f3f3f3",
              }}>
                {[
                  { label: "Alquiler mensual", value: formatARS(activeContract.monthly_rent_ars) },
                  { label: "Expensas", value: activeContract.expenses_ars > 0 ? formatARS(activeContract.expenses_ars) : "Incluidas" },
                  { label: "Vence día", value: `${activeContract.payment_due_day} de cada mes` },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "18px 24px",
                    borderRight: i < 2 ? "1px solid #f3f3f3" : "none",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#2D3134" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Período */}
              <div style={{ padding: "16px 24px", display: "flex", gap: 32, borderBottom: "1px solid #f3f3f3" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Inicio</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2D3134", marginTop: 2 }}>{activeContract.start_date}</div>
                </div>
                <div style={{ color: "#ccc", alignSelf: "center", fontSize: 20 }}>→</div>
                <div>
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Fin del contrato</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#2D3134", marginTop: 2 }}>{activeContract.end_date}</div>
                </div>
                {activeContract.status === "active" && (
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Días restantes</div>
                    <div style={{
                      fontWeight: 900, fontSize: 22, marginTop: 2,
                      color: daysUntil(activeContract.end_date) <= 30 ? "#dc2626" : "#2D3134",
                    }}>
                      {Math.max(0, daysUntil(activeContract.end_date))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cards rápidas */}
          <div className="tenant-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

            {/* Próximo pago */}
            <Link href="/mi-alquiler/pagos" style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff", borderRadius: 16, border: "1px solid #eee",
                padding: "22px 20px", height: "100%",
                display: "flex", flexDirection: "column", gap: 10,
                transition: "box-shadow .2s",
              }}>
                <div style={{ fontSize: 28 }}>💳</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#2D3134" }}>Próximo pago</div>
                {nextPayment ? (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 900, color: daysUntil(nextPayment.due_date) < 0 ? "#dc2626" : "#2D3134" }}>
                      {formatARS(nextPayment.total_ars)}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {monthName(nextPayment.period_month)} {nextPayment.period_year} · vence {nextPayment.due_date}
                    </div>
                    {daysUntil(nextPayment.due_date) < 0 && (
                      <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, alignSelf: "flex-start" }}>
                        VENCIDO
                      </span>
                    )}
                    {daysUntil(nextPayment.due_date) >= 0 && daysUntil(nextPayment.due_date) <= 7 && (
                      <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, alignSelf: "flex-start" }}>
                        Vence en {daysUntil(nextPayment.due_date)} días
                      </span>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: "#aaa" }}>Sin pagos pendientes ✅</div>
                )}
                <div style={{ marginTop: "auto", color: "#B48A73", fontWeight: 700, fontSize: 13 }}>Ver todos →</div>
              </div>
            </Link>

            {/* Contrato */}
            <Link href="/mi-alquiler/contrato" style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff", borderRadius: 16, border: "1px solid #eee",
                padding: "22px 20px", height: "100%",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#2D3134" }}>Mi contrato</div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  Ref: <strong style={{ color: "#2D3134", fontFamily: "monospace" }}>{activeContract?.reference_code ?? "—"}</strong>
                </div>
                {activeContract?.tenant_agreed_at ? (
                  <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, alignSelf: "flex-start" }}>
                    Firmado ✓
                  </span>
                ) : activeContract?.status === "pending_tenant" ? (
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, alignSelf: "flex-start" }}>
                    Pendiente de firma
                  </span>
                ) : null}
                <div style={{ marginTop: "auto", color: "#B48A73", fontWeight: 700, fontSize: 13 }}>Ver contrato →</div>
              </div>
            </Link>

            {/* Reclamos */}
            <Link href="/mi-alquiler/reclamos" style={{ textDecoration: "none" }}>
              <div style={{
                background: "#fff", borderRadius: 16, border: "1px solid #eee",
                padding: "22px 20px", height: "100%",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 28 }}>🔧</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#2D3134" }}>Reclamos</div>
                {(openClaims ?? 0) > 0 ? (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#dc2626" }}>{openClaims}</div>
                    <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, alignSelf: "flex-start" }}>
                      Abiertos
                    </span>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: "#aaa" }}>Sin reclamos abiertos ✅</div>
                )}
                <div style={{ marginTop: "auto", color: "#B48A73", fontWeight: 700, fontSize: 13 }}>
                  {(openClaims ?? 0) > 0 ? "Ver reclamos →" : "Reportar problema →"}
                </div>
              </div>
            </Link>
          </div>

          {/* Lista de contratos si hay más de uno */}
          {rows.length > 1 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f3f3" }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#2D3134" }}>Todos tus contratos</h3>
              </div>
              {rows.map((r, i) => {
                const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.draft;
                const p = (r as any).properties;
                return (
                  <div key={r.id} style={{
                    padding: "14px 20px",
                    borderBottom: i < rows.length - 1 ? "1px solid #f3f3f3" : "none",
                    display: "flex", alignItems: "center", gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p?.title ?? "Propiedad"}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{r.reference_code} · {r.start_date} → {r.end_date}</div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
                      {st.label}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2D3134" }}>
                      {formatARS(r.monthly_rent_ars)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
