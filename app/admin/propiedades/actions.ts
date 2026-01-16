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

  if (role !== "admin" && role !== "super_admin") {
    redirect("/login?error=not_admin&next=/admin/propiedades");
  }

  return { admin, meId: data.user.id, role };
}

// Lee valores válidos de enums reales de Postgres
async function pickEnumValue(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  enumTypeNames: string[],
  prefer?: string
) {
  for (const enumType of enumTypeNames) {
    const { data, error } = await admin.rpc("enum_values", { enum_name: enumType });
    if (error || !Array.isArray(data) || data.length === 0) continue;

    const values = data as string[];
    if (prefer && values.includes(prefer)) return prefer;
    return values[0];
  }

  throw new Error(`No pude leer valores del enum. Probé: ${enumTypeNames.join(", ")}`);
}

export async function createPropertyAction(formData: FormData) {
  const { admin, meId, role } = await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const neighborhood = String(formData.get("neighborhood") || "").trim();
  const address = String(formData.get("address") || "").trim();

  const purpose = String(formData.get("purpose") || "sale");
  const property_type = String(formData.get("property_type") || "house");

  const owner_name = String(formData.get("owner_name") || "").trim();
  const owner_phone = String(formData.get("owner_phone") || "").trim();

  const price_ars = toNum(formData.get("price_ars"));
  const price_usd = toNum(formData.get("price_usd"));

  const agent_id_raw = String(formData.get("agent_id") || "").trim();
  const agent_id = role === "super_admin" && agent_id_raw ? agent_id_raw : meId;

  if (!title) redirect("/admin/propiedades?error=missing_title");

  // enums reales de tu base
  const operation = await pickEnumValue(admin, ["property_operation", "operation"]);
  const type = await pickEnumValue(admin, ["property_type", "type"]);
  const status = await pickEnumValue(admin, ["property_status", "status"]);

  const ins = await admin
    .from("properties")
    .insert({
      // obligatorias del schema viejo
      title,
      operation,
      type,
      status,
      amenities: [],
      address_hidden: true,
      show_both: true,
      has_garage: false,

      // nuestras
      city: city || null,
      neighborhood: neighborhood || null,
      address: address || null,

      purpose,
      property_type,

      owner_name: owner_name || null,
      owner_phone: owner_phone || null,

      price_ars,
      price_usd,

      agent_id,
      assigned_agent_id: agent_id,
      created_by_user_id: meId,

      is_published: false,
    })
    .select("id")
    .single();

  if (ins.error) redirect(`/admin/propiedades?error=${encodeURIComponent(ins.error.message)}`);

  redirect(`/admin/propiedades/${ins.data.id}?ok=created`);
}

export async function togglePublishAction(formData: FormData) {
  const { admin, meId, role } = await requireAdmin();

  const id = String(formData.get("id") || "");
  const next = String(formData.get("next") || "");
  const publish = String(formData.get("publish") || "") === "1";

  if (!id) redirect("/admin/propiedades?error=missing_id");

  const where = role === "super_admin" ? { id } : { id, agent_id: meId };

  const upd = await admin
    .from("properties")
    .update({ is_published: publish })
    .match(where)
    .select("id")
    .maybeSingle();

  if (upd.error) redirect(`/admin/propiedades?error=${encodeURIComponent(upd.error.message)}`);
  if (!upd.data) redirect(`/admin/propiedades?error=not_allowed`);

  redirect(next || "/admin/propiedades?ok=updated");
}

export async function deletePropertyAction(formData: FormData) {
  const { admin, role } = await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/propiedades?error=missing_id");

  if (role !== "super_admin") redirect("/admin/propiedades?error=only_super_admin");

  // Borra property_media (por FK cascade suele bastar, pero lo hacemos explícito por las dudas)
  await admin.from("property_media").delete().eq("property_id", id);

  const del = await admin.from("properties").delete().eq("id", id);
  if (del.error) redirect(`/admin/propiedades?error=${encodeURIComponent(del.error.message)}`);

  redirect("/admin/propiedades?ok=deleted");
}

function toNum(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
