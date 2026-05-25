import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendContractAction, confirmContractAction,
  markPaymentPaidAction, updateRentAction, updateClaimStatusAction,
} from "../actions";
import { daysUntil, formatARS, monthName } from "../date-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_CATEGORIES: Record<string, string> = {
  water_leak: "💧 Pérdida de agua", electrical: "⚡ Eléctrico", gas: "🔥 Gas",
  structural: "🏗️ Estructural", appliance: "🔌 Electrodoméstico", security: "🔒 Seguridad",
  pest: "🐛 Plagas", cleaning: "🧹 Limpieza", heating: "🌡️ Calefacción",
  humidity: "💦 Humedad", other: "📋 Otro",
};

const CLAIM_PRIORITY: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",    color: "#888" },
  medium: { label: "Media",  color: "#b45309" },
  high:   { label: "Alta",   color: "#dc2626" },
  urgent: { label: "URGENTE",color: "#7c3aed" },
};

const CLAIM_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Abierto",      bg: "#fee2e2", color: "#dc2626" },
  in_progress: { label: "En gestión",   bg: "#dbeafe", color: "#1d4ed8" },
  waiting:     { label: "Esperando",    bg: "#fef3c7", color: "#b45309" },
  resolved:    { label: "Resuelto",     bg: "#dcfce7", color: "#15803d" },
  closed:      { label: "Cerrado",      bg: "#f3f4f6", color: "#555" },
};

export default async function ContratoDetailPage({
  params, searchParams,
}: {
  params: { id: string };
  searchParams?: { ok?: string; error?: string; tab?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/admin/alquileres/${params.id}`);

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role,full_name").eq("id", data.user.id).maybeSingle();
  if (!["admin","super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");

  const { data: contract } = await admin
    .from("rental_contracts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!contract) redirect("/admin/alquileres?error=Contrato+no+encontrado");

  const [propRes, tenantRes, paymentsRes, claimsRes] = await Promise.all([
    admin.from("properties").select("*").eq("id", contract.property_id).maybeSingle(),
    admin.from("profiles").select("full_name,email,phone,whatsapp,avatar_url").eq("id", contract.tenant_id).maybeSingle(),
    admin.from("rental_payments").select("*").eq("contract_id", params.id).order("period_year").order("period_month"),
    admin.from("rental_claims").select("*").eq("contract_id", params.id).order("created_at", { ascending: false }),
  ]);

  const prop    = propRes.data;
  const tenant  = tenantRes.data;
  const payments = paymentsRes.data ?? [];
  const claims   = claimsRes.data ?? [];

  const activeTab = searchParams?.tab ?? "resumen";
  const daysLeft  = daysUntil(contract.end_date);

  const totalPaid    = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.total_ars ?? 0), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + (p.total_ars ?? 0), 0);
  const overdueCount = payments.filter(p => p.status === "pending" && daysUntil(p.due_date) < 0).length;

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    draft:          { label: "Borrador",           color: "#555",    bg: "#f3f4f6" },
    pending_tenant: { label: "Pendiente firma inquilino", color: "#b45309", bg: "#fef3c7" },
    pending_admin:  { label: "⚡ Esperando tu confirmación", color: "#1d4ed8", bg: "#dbeafe" },
    active:         { label: "✅ Activo",           color: "#15803d", bg: "#dcfce7" },
    expired:        { label: "Vencido",             color: "#dc2626", bg: "#fee2e2" },
    terminated:     { label: "Rescindido",          color: "#7c3aed", bg: "#ede9fe" },
  };

  const st = STATUS_MAP[contract.status] ?? STATUS_MAP.draft;
  const ini = (tenant?.full_name ?? "?").trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1060 }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <a href="/admin/alquileres" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>← Alquileres</a>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#2D3134" }}>{contract.reference_code}</h1>
            <span style={{ background: st.bg, color: st.color, fontWeight: 700, fontSize: 12, padding: "4px 12px", borderRadius: 999 }}>{st.label}</span>
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{prop?.title} · {prop?.city}</div>
        </div>

        {/* Acciones por estado */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {contract.status === "draft" && (
            <form action={sendContractAction}>
              <input type="hidden" name="id" value={params.id} />
              <button type="submit" style={{ background: "#B48A73", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                📨 Enviar al inquilino
              </button>
            </form>
          )}
          {contract.status === "pending_admin" && (
            <form action={confirmContractAction}>
              <input type="hidden" name="id" value={params.id} />
              <button type="submit" style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                ✅ Confirmar y activar
              </button>
            </form>
          )}
          <Link href={`/admin/alquileres/${params.id}/contrato`}
            style={{ background: "#f4f4f5", color: "#555", textDecoration: "none", padding: "9px 16px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
            📄 Ver contrato
          </Link>
        </div>
      </div>

      {/* Alertas */}
      {searchParams?.ok && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>✅ {decodeURIComponent(searchParams.ok)}</div>}
      {searchParams?.error && <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>❌ {decodeURIComponent(searchParams.error)}</div>}
      {contract.status === "pending_admin" && (
        <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>
          ⚡ El inquilino firmó el contrato el {contract.tenant_agreed_at ? new Date(contract.tenant_agreed_at).toLocaleString("es-AR") : "—"}. Revisá y confirmá para activarlo.
        </div>
      )}
      {contract.status === "active" && daysLeft <= 30 && daysLeft >= 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#c2410c" }}>
          ⚠️ El contrato vence en <strong>{daysLeft} días</strong> ({contract.end_date}). Contactá al inquilino para renovación.
        </div>
      )}
      {overdueCount > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#dc2626" }}>
          🔴 {overdueCount} pago(s) vencido(s) sin registrar.
        </div>
      )}

      {/* Stats rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "💰", v: formatARS(contract.monthly_rent_ars),                       l: "Alquiler mensual" },
          { icon: "📦", v: formatARS((contract.monthly_rent_ars??0)+(contract.expenses_ars??0)), l: "Total mensual" },
          { icon: "✅", v: formatARS(totalPaid),                                         l: "Total cobrado" },
          { icon: "📅", v: contract.status === "active" ? `${daysLeft}d` : "—",          l: "Días hasta venc." },
        ].map(s => (
          <div key={s.l} style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "14px 16px" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#2D3134", letterSpacing: -0.5 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #eee", paddingBottom: 0 }}>
        {[
          { id: "resumen",  label: "Resumen"  },
          { id: "pagos",    label: `Pagos (${payments.length})` },
          { id: "reclamos", label: `Reclamos (${claims.filter(c => c.status === "open").length} abiertos)` },
          { id: "ajuste",   label: "Ajuste precio" },
        ].map(t => (
          <Link key={t.id} href={`/admin/alquileres/${params.id}?tab=${t.id}`}
            style={{
              padding: "10px 18px", textDecoration: "none", fontWeight: 700, fontSize: 14,
              color: activeTab === t.id ? "#2D3134" : "#888",
              borderBottom: activeTab === t.id ? "2px solid #2D3134" : "2px solid transparent",
              marginBottom: -2,
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* TAB: RESUMEN */}
      {activeTab === "resumen" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Inquilino */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#2D3134" }}>👤 Inquilino</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <span style={{ width: 48, height: 48, borderRadius: 999, background: "#B48A73", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>{ini}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{tenant?.full_name ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{tenant?.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, display: "grid", gap: 6 }}>
              <div><strong>Tel:</strong> {tenant?.phone ?? "—"}</div>
              <div><strong>WhatsApp:</strong> {tenant?.whatsapp
                ? <a href={`https://wa.me/${(tenant.whatsapp).replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 700 }}>💬 {tenant.whatsapp}</a>
                : "—"}</div>
            </div>
          </div>

          {/* Inmueble */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#2D3134" }}>🏠 Inmueble</h3>
            <div style={{ fontSize: 13, display: "grid", gap: 6 }}>
              <div><strong>Propiedad:</strong> {prop?.title}</div>
              <div><strong>Dirección:</strong> {prop?.address ?? "—"}, {prop?.city}</div>
              <div><strong>Inicio:</strong> {contract.start_date}</div>
              <div><strong>Vencimiento:</strong> {contract.end_date}</div>
              <div><strong>Depósito:</strong> {formatARS(contract.deposit_amount_ars)} {contract.deposit_paid ? "✅ Pagado" : "⏳ Pendiente"}</div>
            </div>
          </div>

          {/* Condiciones */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#2D3134" }}>💰 Condiciones económicas</h3>
            <div style={{ fontSize: 13, display: "grid", gap: 6 }}>
              <div><strong>Alquiler:</strong> {formatARS(contract.monthly_rent_ars)}</div>
              <div><strong>Expensas:</strong> {formatARS(contract.expenses_ars)}</div>
              <div><strong>Vto. cuota:</strong> día {contract.payment_due_day} ({contract.grace_period_days}d gracia)</div>
              <div><strong>Ajuste:</strong> {contract.price_increase_pct}% cada {contract.price_increase_months} meses</div>
            </div>
          </div>

          {/* Incluidos */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#2D3134" }}>✅ Incluidos en el precio</h3>
            <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
              {[
                { k: "taxes_included",       l: "Impuestos municipales" },
                { k: "water_included",       l: "Agua" },
                { k: "gas_included",         l: "Gas" },
                { k: "electricity_included", l: "Electricidad" },
              ].map(f => (
                <div key={f.k} style={{ color: (contract as any)[f.k] ? "#15803d" : "#aaa" }}>
                  {(contract as any)[f.k] ? "✅" : "❌"} {f.l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PAGOS */}
      {activeTab === "pagos" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  {["Período","Alquiler","Expensas","Total","Vencimiento","Estado","Acciones"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const dDue   = daysUntil(p.due_date);
                  const isOver = p.status === "pending" && dDue < 0;
                  const isSoon = p.status === "pending" && dDue >= 0 && dDue <= 5;
                  const rowBg  = isOver ? "#fff5f5" : isSoon ? "#fffbeb" : "transparent";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3", background: rowBg }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>
                        {monthName(p.period_month)} {p.period_year}
                        {p.price_increase_applied && <div style={{ fontSize: 10, color: "#B48A73", fontWeight: 700 }}>↑ Con ajuste</div>}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13 }}>{formatARS(p.base_amount_ars)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13 }}>{formatARS(p.expenses_ars)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{formatARS(p.total_ars)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: isOver ? "#dc2626" : isSoon ? "#b45309" : "#555" }}>
                        {p.due_date}
                        {isOver && <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626" }}>VENCIDO</div>}
                        {isSoon && <div style={{ fontSize: 10, fontWeight: 700, color: "#b45309" }}>⚠️ {dDue}d</div>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                          background: p.status === "paid" ? "#dcfce7" : p.status === "overdue" ? "#fee2e2" : isOver ? "#fee2e2" : "#fef3c7",
                          color: p.status === "paid" ? "#15803d" : "#92400e",
                        }}>
                          {p.status === "paid" ? `✅ ${p.payment_method ?? "pagado"}` : isOver ? "🔴 Vencido" : "⏳ Pendiente"}
                        </span>
                        {p.status === "paid" && p.paid_at && (
                          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{new Date(p.paid_at).toLocaleDateString("es-AR")}</div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {p.status === "pending" && (
                          <form action={markPaymentPaidAction} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <input type="hidden" name="payment_id" value={p.id} />
                            <input type="hidden" name="contract_id" value={params.id} />
                            <select name="method" style={{ fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "1px solid #ddd" }}>
                              <option value="office">En oficina</option>
                              <option value="transfer">Transferencia</option>
                              <option value="online">Online</option>
                            </select>
                            <button type="submit" style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              ✅ Pagado
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: RECLAMOS */}
      {activeTab === "reclamos" && (
        <div style={{ display: "grid", gap: 12 }}>
          {claims.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 40, textAlign: "center", color: "#aaa" }}>
              Sin reclamos registrados. ✅
            </div>
          ) : claims.map(c => {
            const cs = CLAIM_STATUS[c.status] ?? CLAIM_STATUS.open;
            const cp = CLAIM_PRIORITY[c.priority] ?? CLAIM_PRIORITY.medium;
            return (
              <div key={c.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 18 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>{c.claim_number}</span>
                      <span style={{ background: cs.bg, color: cs.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{cs.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cp.color }}>{cp.label}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{CLAIM_CATEGORIES[c.category] ?? c.category}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>{c.description}</div>
                    {c.admin_notes && (
                      <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", marginTop: 8, fontSize: 12, color: "#15803d" }}>
                        📝 Nota admin: {c.admin_notes}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
                      {new Date(c.created_at).toLocaleDateString("es-AR")}
                      {c.scheduled_for && <span> · Programado: {c.scheduled_for}</span>}
                    </div>
                  </div>
                  {/* Acciones reclamo */}
                  {!["resolved","closed"].includes(c.status) && (
                    <form action={updateClaimStatusAction} style={{ display: "grid", gap: 6, minWidth: 200 }}>
                      <input type="hidden" name="claim_id" value={c.id} />
                      <input type="hidden" name="contract_id" value={params.id} />
                      <select name="status" style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #ddd" }} defaultValue={c.status}>
                        <option value="open">Abierto</option>
                        <option value="in_progress">En gestión</option>
                        <option value="waiting">Esperando</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                      <input type="date" name="scheduled_for" style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #ddd" }} placeholder="Fecha programada" />
                      <textarea name="admin_notes" placeholder="Nota interna..." rows={2}
                        style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #ddd", resize: "none" }}
                        defaultValue={c.admin_notes ?? ""} />
                      <button type="submit" style={{ background: "#2D3134", color: "#fff", border: "none", borderRadius: 8, padding: "6px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Actualizar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: AJUSTE DE PRECIO */}
      {activeTab === "ajuste" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: 24, maxWidth: 540 }}>
          <h3 style={{ margin: "0 0 16px", fontWeight: 800, color: "#2D3134" }}>Actualizar monto de alquiler</h3>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            Los cambios se aplicarán a todas las cuotas futuras no pagadas a partir del período indicado.
          </p>
          <form action={updateRentAction} style={{ display: "grid", gap: 14 }}>
            <input type="hidden" name="contract_id" value={params.id} />
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase" }}>Nuevo alquiler (ARS)</label>
              <input className="input" type="number" name="new_rent_ars" defaultValue={contract.monthly_rent_ars ?? ""} step="100" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase" }}>Nuevas expensas (ARS)</label>
              <input className="input" type="number" name="new_expenses_ars" defaultValue={contract.expenses_ars ?? 0} step="100" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase" }}>Aplicar desde año</label>
                <input className="input" type="number" name="from_year" defaultValue={new Date().getFullYear()} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase" }}>Aplicar desde mes</label>
                <select className="input" name="from_month" defaultValue={new Date().getMonth() + 2}>
                  {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{m} — {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" style={{ background: "#B48A73", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              Aplicar actualización de precio
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
