// app/admin/caja/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toIsoFromDatetimeLocal(v: string | null): string | null {
  if (!v) return null;
  // v viene tipo: "2026-01-13T21:30"
  // lo convertimos a ISO con zona local del server; OK para MVP
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function createCashMovement(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) {
    redirect("/login?next=/admin/caja");
  }

  const type = String(formData.get("type") || "").trim(); // "income" | "expense"
  const concept = String(formData.get("concept") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const amountArsRaw = String(formData.get("amount_ars") || "").trim();
  const amountUsdRaw = String(formData.get("amount_usd") || "").trim();
  const propertyId = String(formData.get("property_id") || "").trim();
  const occurredAtRaw = String(formData.get("occurred_at") || "").trim();

  if (!type || (type !== "income" && type !== "expense")) {
    redirect("/admin/caja?error=type_invalido");
  }
  if (!concept) {
    redirect("/admin/caja?error=concepto_requerido");
  }

  const amount_ars = amountArsRaw ? Number(amountArsRaw.replace(",", ".")) : null;
  const amount_usd = amountUsdRaw ? Number(amountUsdRaw.replace(",", ".")) : null;

  const occurred_at_iso = toIsoFromDatetimeLocal(occurredAtRaw);

  const payload: any = {
    type,
    concept,
    notes: notes || null,
    amount_ars: Number.isFinite(amount_ars as any) ? amount_ars : null,
    amount_usd: Number.isFinite(amount_usd as any) ? amount_usd : null,
    property_id: propertyId || null,
    occurred_at: occurred_at_iso || new Date().toISOString(),
    created_by: user.id,
  };

  const { error } = await supabase.from("cash_movements").insert(payload);
  if (error) {
    redirect("/admin/caja?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin/caja");
  redirect("/admin/caja?ok=1");
}

export async function deleteCashMovement(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) redirect("/login?next=/admin/caja");

  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/admin/caja?error=id_vacio");

  const { error } = await supabase.from("cash_movements").delete().eq("id", id);
  if (error) redirect("/admin/caja?error=" + encodeURIComponent(error.message));

  revalidatePath("/admin/caja");
  redirect("/admin/caja?ok=deleted");
}
