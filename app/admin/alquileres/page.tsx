import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { daysUntil, formatARS, monthName } from "./date-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: "Borrador",           color: "#555",    bg: "#f3f4f6" },
  pending_tenant: { label: "Pendiente firma",    color: "#b45309", bg: "#fef3c7" },
  pending_admin:  { label: "Esperando confirm.", color: "#1d4ed8", bg: "#dbeafe" },
  active:         { label: "Activo",             color: "#15803d", bg: "#dcfce7" },
  expired:        { label: "Vencido",            color: "#dc2626", bg: "#fee2e2" },
  terminated:     { label: "Rescindido",         color: "#7c3aed", bg: "#ede9fe" },
};

export default async function AdminAlquileresPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string; status?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/alquileres");

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin","super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");

  const fStatus = searchParams?.status ?? "";

  let query = admin
    .from("rental_contracts")
    .select(`
      id, reference_code, status, start_date, end_date,
      monthly_rent_ars, expenses_ars, payment_due_day,
      tenant_id, property_id,
      properties(title, city, address),
      profiles!rental_contracts_tenant_id_fkey(full_name, email, phone)
    `)
    .order("created_at", { ascending: false });

  if (fStatus) query = query.eq("status", fStatus);

  const { data: contracts } = await query;
  const rows = contracts ?? [];

  // Alertas: contratos que vencen en ≤ 30 días
  const today = new Date();
  const expiringSoon = rows.filter(r => {
    if (r.status !== "active") return false;
    const d = daysUntil(r.end_date);
    return d >= 0 && d <= 30;
  });

  // Pagos pendientes vencidos o próximos (5 días)
  const { data: alertPayments } = await admin
    .from("rental_payments")
    .select("id, contract_id, period_year, period_month, total_ars, due_date, status")
    .eq("status", "pending")
    .lte("due_date", new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0])
    .order("due_date");

  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  // Stats
  const activeCount   = rows.filter(r => r.status === "active").length;
  const pendingCount  = rows.filter(r => r.status === "pending_admin").length;
  const totalRevenue  = rows.filter(r => r.status === "active").reduce((s, r) => s + (r.monthly_rent_ars ?? 0) + (r.expenses_ars ?? 0), 0);

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Panel Admin</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#2D3134" }}>Gestión de Alquileres</h1>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link href="/admin" style={{ background: "#f4f4f5", color: "#555", textDecoration: "none", padding: "8px 16px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>← Panel</Link>
          <Link href="/admin/alquileres/nuevo" style={{ background: "#2D3134", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>+ Nuevo contrato</Link>
        </div>
      </div>

      {/* Alertas */}
      {(expiringSoon.length > 0 || (alertPayments?.length ?? 0) > 0) && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#c2410c", marginBottom: 8 }}>⚠️ Alertas</div>
          {expiringSoon.map(r => (
            <div key={r.id} style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>
              🔔 Contrato <strong>{r.reference_code}</strong> vence en{" "}
              <strong>{daysUntil(r.end_date)} días</strong> ({r.end_date}) —{" "}
              <Link href={`/admin/alquileres/${r.id}`} style={{ color: "#B48A73", fontWeight: 700 }}>Ver</Link>
            </div>
          ))}
          {(alertPayments ?? []).slice(0, 5).map(p => {
            const d = daysUntil(p.due_date);
            return (
              <div key={p.id} style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>
                {d < 0 ? "🔴 Pago VENCIDO" : "🟡 Pago próximo"}: {monthName(p.period_month)} {p.period_year} — {formatARS(p.total_ars)} — vence {p.due_date}{" "}
                <Link href={`/admin/alquileres/${p.contract_id}`} style={{ color: "#B48A73", fontWeight: 700 }}>Ver</Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "📄", value: activeCount,      label: "Contratos activos",      color: "#dcfce7" },
          { icon: "✍️", value: pendingCount,      label: "Esperando confirmación", color: "#dbeafe" },
          { icon: "💰", value: formatARS(totalRevenue), label: "Recaudación mensual est.", color: "#fef3c7" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "18px 20px" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color, display: "grid", placeItems: "center", fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#2D3134", letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {searchParams?.ok && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>✅ {decodeURIComponent(searchParams.ok)}</div>}
      {searchParams?.error && <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>❌ {decodeURIComponent(searchParams.error)}</div>}

      {/* Filtros por estado */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "", label: "Todos" },
          { key: "active",         label: "Activos" },
          { key: "pending_tenant", label: "Pendientes firma" },
          { key: "pending_admin",  label: "Confirmar" },
          { key: "expired",        label: "Vencidos" },
          { key: "draft",          label: "Borradores" },
        ].map(f => (
          <Link
            key={f.key}
            href={f.key ? `/admin/alquileres?status=${f.key}` : "/admin/alquileres"}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: fStatus === f.key ? "#2D3134" : "#f4f4f5",
              color: fStatus === f.key ? "#fff" : "#555",
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 15 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            No hay contratos con ese filtro.{" "}
            <Link href="/admin/alquileres/nuevo" style={{ color: "#B48A73", fontWeight: 700 }}>Crear uno</Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  {["Referencia","Propiedad","Inquilino","Período","Monto/mes","Vence en","Estado",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.draft;
                  const days = daysUntil(r.end_date);
                  const daysColor = days <= 30 && r.status === "active" ? "#dc2626" : days <= 60 && r.status === "active" ? "#b45309" : "#555";
                  const prop = (r as any).properties;
                  const tenant = (r as any).profiles;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>
                        <div style={{ fontWeight: 800, fontFamily: "monospace", color: "#2D3134" }}>{r.reference_code}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>
                        <div style={{ fontWeight: 700 }}>{prop?.title ?? "—"}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{prop?.city ?? ""}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>
                        <div style={{ fontWeight: 700 }}>{tenant?.full_name ?? "—"}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{tenant?.phone ?? tenant?.email ?? ""}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#555" }}>
                        {r.start_date} →<br/>{r.end_date}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#2D3134" }}>
                        {formatARS(r.monthly_rent_ars)}
                        {r.expenses_ars > 0 && <div style={{ fontSize: 11, fontWeight: 400, color: "#888" }}>+ {formatARS(r.expenses_ars)} exp.</div>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: daysColor }}>
                        {r.status === "active" ? (days < 0 ? "VENCIDO" : `${days} días`) : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: st.bg, color: st.color, fontWeight: 700, fontSize: 11, padding: "4px 10px", borderRadius: 999 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Link href={`/admin/alquileres/${r.id}`} style={{ background: "#2D3134", color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Ver →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
