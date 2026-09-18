"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");
  return admin;
}

function s(v: FormDataEntryValue | null) { const x = String(v ?? "").trim(); return x || null; }
function n(v: FormDataEntryValue | null) {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isFinite(x) ? x : null;
}
function i(v: FormDataEntryValue | null) { const x = n(v); return x != null ? Math.round(x) : null; }

export async function createRentalPropertyAction(formData: FormData) {
  const admin = await requireAdmin();
  const { data, error } = await admin.from("rental_properties").insert({
    title:          s(formData.get("title"))!,
    address:        s(formData.get("address"))!,
    city:           s(formData.get("city")) ?? "General Pico",
    province:       s(formData.get("province")) ?? "La Pampa",
    type:           s(formData.get("type")) ?? "casa",
    rooms:          i(formData.get("rooms")),
    bathrooms:      i(formData.get("bathrooms")),
    area_m2:        n(formData.get("area_m2")),
    has_garage:     formData.get("has_garage") === "1",
    furnished:      formData.get("furnished") === "1",
    rent_ars:       n(formData.get("rent_ars")),
    expenses_ars:   n(formData.get("expenses_ars")) ?? 0,
    deposit_months: i(formData.get("deposit_months")) ?? 1,
    owner_name:     s(formData.get("owner_name")),
    owner_phone:    s(formData.get("owner_phone")),
    owner_email:    s(formData.get("owner_email")),
    owner_cbu:      s(formData.get("owner_cbu")),
    owner_alias:    s(formData.get("owner_alias")),
    owner_dni:      s(formData.get("owner_dni")),
    commission_pct: n(formData.get("commission_pct")) ?? 5,
    description:    s(formData.get("description")),
    notes:          s(formData.get("notes")),
    status: "available",
  }).select("id").single();

  if (error) redirect(`/admin/alquileres/propiedades/nueva?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/alquileres/propiedades?ok=Propiedad+agregada+correctamente`);
}

export async function updateRentalPropertyAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = s(formData.get("id"))!;
  const { error } = await admin.from("rental_properties").update({
    title:          s(formData.get("title")),
    address:        s(formData.get("address")),
    city:           s(formData.get("city")),
    province:       s(formData.get("province")),
    type:           s(formData.get("type")),
    rooms:          i(formData.get("rooms")),
    bathrooms:      i(formData.get("bathrooms")),
    area_m2:        n(formData.get("area_m2")),
    has_garage:     formData.get("has_garage") === "1",
    furnished:      formData.get("furnished") === "1",
    rent_ars:       n(formData.get("rent_ars")),
    expenses_ars:   n(formData.get("expenses_ars")) ?? 0,
    deposit_months: i(formData.get("deposit_months")) ?? 1,
    owner_name:     s(formData.get("owner_name")),
    owner_phone:    s(formData.get("owner_phone")),
    owner_email:    s(formData.get("owner_email")),
    owner_cbu:      s(formData.get("owner_cbu")),
    owner_alias:    s(formData.get("owner_alias")),
    owner_dni:      s(formData.get("owner_dni")),
    commission_pct: n(formData.get("commission_pct")) ?? 5,
    status:         s(formData.get("status")) ?? "available",
    description:    s(formData.get("description")),
    notes:          s(formData.get("notes")),
    updated_at:     new Date().toISOString(),
  }).eq("id", id);

  if (error) redirect(`/admin/alquileres/propiedades/${id}/editar?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/alquileres/propiedades?ok=Propiedad+actualizada`);
}
