"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { addMonths, format } from "./date-utils";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/alquileres");
  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role,full_name").eq("id", data.user.id).maybeSingle();
  if (!["admin","super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");
  return { admin, meId: data.user.id, role: me.data!.role as string, name: me.data?.full_name ?? "" };
}

function n(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const x = parseFloat(s);
  return isFinite(x) ? x : null;
}
function i(v: FormDataEntryValue | null): number | null {
  const x = n(v);
  return x != null ? Math.round(x) : null;
}
function s(v: FormDataEntryValue | null): string | null {
  const x = String(v ?? "").trim();
  return x || null;
}

/* ── Crear contrato ── */
export async function createContractAction(formData: FormData) {
  const { admin, meId } = await requireAdmin();

  const propertyId = s(formData.get("property_id"));
  const tenantId   = s(formData.get("tenant_id"));
  if (!propertyId || !tenantId) redirect("/admin/alquileres/nuevo?error=Faltan+campos+obligatorios");

  const startDate  = s(formData.get("start_date"))!;
  const durationMonths = i(formData.get("duration_months")) ?? 24;
  const startDt    = new Date(startDate);
  const endDt      = addMonths(startDt, durationMonths);
  const endDate    = format(endDt);

  const monthlyRentArs = n(formData.get("monthly_rent_ars"));
  const monthlyRentUsd = n(formData.get("monthly_rent_usd"));
  const expensesArs    = n(formData.get("expenses_ars")) ?? 0;
  const depositMonths  = i(formData.get("deposit_months")) ?? 1;
  const depositAmount  = (monthlyRentArs ?? 0) * depositMonths;
  const paymentDueDay  = i(formData.get("payment_due_day")) ?? 5;
  const gracePeriod    = i(formData.get("grace_period_days")) ?? 3;
  const priceIncPct    = n(formData.get("price_increase_pct")) ?? 0;
  const priceIncMths   = i(formData.get("price_increase_months")) ?? 4;

  // Snapshot de la propiedad
  const { data: prop } = await admin.from("properties")
    .select("title,address,city,province,type,rooms,bathrooms,area_m2")
    .eq("id", propertyId).maybeSingle();

  // Snapshot del inquilino
  const { data: tenant } = await admin.from("profiles")
    .select("full_name,email,phone,whatsapp")
    .eq("id", tenantId).maybeSingle();

  const { data: contract, error } = await admin.from("rental_contracts").insert({
    property_id: propertyId,
    tenant_id:   tenantId,
    agent_id:    meId,
    start_date:  startDate,
    end_date:    endDate,
    monthly_rent_ars: monthlyRentArs,
    monthly_rent_usd: monthlyRentUsd,
    expenses_ars:     expensesArs,
    deposit_amount_ars: depositAmount,
    payment_due_day:  paymentDueDay,
    grace_period_days: gracePeriod,
    price_increase_pct: priceIncPct,
    price_increase_months: priceIncMths,
    taxes_included:       formData.get("taxes_included")       === "1",
    water_included:       formData.get("water_included")       === "1",
    gas_included:         formData.get("gas_included")         === "1",
    electricity_included: formData.get("electricity_included") === "1",
    additional_clauses:   s(formData.get("additional_clauses")),
    internal_notes:       s(formData.get("internal_notes")),
    status: "draft",
    property_snapshot: prop ?? {},
    tenant_snapshot:   tenant ?? {},
  }).select("id").single();

  if (error) redirect(`/admin/alquileres/nuevo?error=${encodeURIComponent(error.message)}`);

  // Generar cuotas automáticamente
  await generatePayments(admin, contract.id, startDt, durationMonths, monthlyRentArs ?? 0, expensesArs, paymentDueDay, priceIncPct, priceIncMths);

  redirect(`/admin/alquileres/${contract.id}?ok=Contrato+creado`);
}

/* ── Enviar contrato al inquilino ── */
export async function sendContractAction(formData: FormData) {
  const { admin } = await requireAdmin();
  const id = s(formData.get("id"))!;
  const { error } = await admin.from("rental_contracts")
    .update({ status: "pending_tenant", sent_to_tenant_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`/admin/alquileres/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/alquileres/${id}?ok=Contrato+enviado+al+inquilino`);
}

/* ── Confirmar contrato (post-firma inquilino) ── */
export async function confirmContractAction(formData: FormData) {
  const { admin, meId } = await requireAdmin();
  const id = s(formData.get("id"))!;
  const { error } = await admin.from("rental_contracts")
    .update({ status: "active", admin_confirmed_at: new Date().toISOString(), confirmed_by: meId })
    .eq("id", id).eq("status", "pending_admin");
  if (error) redirect(`/admin/alquileres/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/alquileres/${id}?ok=Contrato+activado`);
}

/* ── Marcar pago como pagado ── */
export async function markPaymentPaidAction(formData: FormData) {
  const { admin, meId } = await requireAdmin();
  const paymentId = s(formData.get("payment_id"))!;
  const contractId = s(formData.get("contract_id"))!;
  const method     = s(formData.get("method")) ?? "office";
  const notes      = s(formData.get("notes"));

  const { error } = await admin.from("rental_payments").update({
    status:         "paid",
    paid_at:        new Date().toISOString(),
    payment_method: method,
    marked_paid_by: meId,
    payment_notes:  notes,
  }).eq("id", paymentId);

  if (error) redirect(`/admin/alquileres/${contractId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/alquileres/${contractId}?ok=Pago+registrado`);
}

/* ── Actualizar monto de alquiler ── */
export async function updateRentAction(formData: FormData) {
  const { admin } = await requireAdmin();
  const contractId  = s(formData.get("contract_id"))!;
  const newRentArs  = n(formData.get("new_rent_ars"));
  const newExpenses = n(formData.get("new_expenses_ars"));
  const fromYear    = i(formData.get("from_year"))!;
  const fromMonth   = i(formData.get("from_month"))!;

  // Actualizar el contrato
  const updates: any = { updated_at: new Date().toISOString() };
  if (newRentArs)  updates.monthly_rent_ars = newRentArs;
  if (newExpenses !== null) updates.expenses_ars = newExpenses;
  await admin.from("rental_contracts").update(updates).eq("id", contractId);

  // Actualizar cuotas futuras no pagadas
  if (newRentArs) {
    const { data: pending } = await admin.from("rental_payments")
      .select("id,period_year,period_month")
      .eq("contract_id", contractId)
      .eq("status", "pending")
      .gte("period_year", fromYear);

    for (const p of pending ?? []) {
      if (p.period_year > fromYear || (p.period_year === fromYear && p.period_month >= fromMonth)) {
        await admin.from("rental_payments").update({
          base_amount_ars: newRentArs,
          expenses_ars: newExpenses ?? 0,
          price_increase_applied: true,
        }).eq("id", p.id);
      }
    }
  }

  redirect(`/admin/alquileres/${contractId}?ok=Montos+actualizados`);
}

/* ── Actualizar estado de reclamo ── */
export async function updateClaimStatusAction(formData: FormData) {
  const { admin } = await requireAdmin();
  const claimId    = s(formData.get("claim_id"))!;
  const contractId = s(formData.get("contract_id"))!;
  const status     = s(formData.get("status"))!;
  const notes      = s(formData.get("admin_notes"));
  const scheduled  = s(formData.get("scheduled_for"));

  const updates: any = { status, admin_notes: notes, updated_at: new Date().toISOString() };
  if (status === "resolved") updates.resolved_at = new Date().toISOString();
  if (scheduled) updates.scheduled_for = scheduled;

  await admin.from("rental_claims").update(updates).eq("id", claimId);
  redirect(`/admin/alquileres/${contractId}?ok=Reclamo+actualizado&tab=reclamos`);
}

/* ── Helper: generar cuotas ── */
async function generatePayments(
  admin: any,
  contractId: string,
  startDate: Date,
  durationMonths: number,
  baseRent: number,
  expenses: number,
  dueDay: number,
  increasePct: number,
  increaseEveryMonths: number
) {
  const payments = [];
  let currentRent = baseRent;

  for (let m = 0; m < durationMonths; m++) {
    // Aplicar aumento si corresponde (excepto el primer mes)
    if (m > 0 && increaseEveryMonths > 0 && m % increaseEveryMonths === 0 && increasePct > 0) {
      currentRent = Math.round(currentRent * (1 + increasePct / 100));
    }

    const periodDate = addMonths(startDate, m);
    const year  = periodDate.getFullYear();
    const month = periodDate.getMonth() + 1;
    const dueDate = new Date(year, month - 1, dueDay);

    payments.push({
      contract_id:           contractId,
      period_year:           year,
      period_month:          month,
      base_amount_ars:       currentRent,
      expenses_ars:          expenses,
      due_date:              format(dueDate),
      status:                "pending",
      price_increase_applied: m > 0 && increaseEveryMonths > 0 && m % increaseEveryMonths === 0,
      previous_amount_ars:   m > 0 && increaseEveryMonths > 0 && m % increaseEveryMonths === 0 ? baseRent : null,
    });
  }

  if (payments.length > 0) {
    await admin.from("rental_payments").insert(payments);
  }
}
