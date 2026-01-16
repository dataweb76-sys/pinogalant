"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Role = "owner" | "admin" | "super_admin";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/propiedades");

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = (me.data?.role as Role | undefined) ?? "owner";
  if (role !== "admin" && role !== "super_admin") redirect("/admin?error=not_admin");

  return { admin, meId: data.user.id, role };
}
export async function updatePropertyAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const admin = createSupabaseAdminClient();

  const id = String(formData.get("id") || "");

  if (!id) redirect("/admin/propiedades?error=missing_id");

  const update = {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    city: String(formData.get("city") || "") || null,
    neighborhood: String(formData.get("neighborhood") || "") || null,
    address: String(formData.get("address") || "") || null,

    zone_quality: toInt(formData.get("zone_quality")),

    price_ars: toNum(formData.get("price_ars")),
    price_usd: toNum(formData.get("price_usd")),
    owner_ask_ars: toNum(formData.get("owner_ask_ars")),
    owner_ask_usd: toNum(formData.get("owner_ask_usd")),
    appraisal_ars: toNum(formData.get("appraisal_ars")),
    appraisal_usd: toNum(formData.get("appraisal_usd")),

    rooms: toInt(formData.get("rooms")),
    bathrooms: toInt(formData.get("bathrooms")),
    area_m2: toNum(formData.get("area_m2")),
    floors: toInt(formData.get("floors")),
    has_garage: String(formData.get("has_garage") || "0") === "1",

    lat: toNum(formData.get("lat")),
    lng: toNum(formData.get("lng")),

    owner_name: String(formData.get("owner_name") || "") || null,
    owner_phone: String(formData.get("owner_phone") || "") || null,

    owner_lives_there: String(formData.get("owner_lives_there") || "0") === "1",
    owner_contact_name: String(formData.get("owner_contact_name") || "") || null,
    owner_contact_phone: String(formData.get("owner_contact_phone") || "") || null,
    owner_contact_email: String(formData.get("owner_contact_email") || "") || null,

    observations: String(formData.get("observations") || "") || null,

    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("properties").update(update).eq("id", id);

  if (error) {
    redirect(`/admin/propiedades/${id}?error=${encodeURIComponent(error.message)}`);
  }

  // ✅ ACA está la magia:
  redirect("/admin/propiedades?ok=updated");
}

function toNum(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toInt(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

