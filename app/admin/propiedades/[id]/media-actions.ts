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

  if (role !== "admin" && role !== "super_admin") redirect("/login?error=not_admin&next=/admin/propiedades");

  return { admin, userId: data.user.id, role };
}

export async function addMediaRowAction(formData: FormData) {
  const { admin } = await requireAdmin();

  const property_id = String(formData.get("property_id") || "");
  const kind = String(formData.get("kind") || "");
  const url = String(formData.get("url") || "");
  const sort_order = Number(formData.get("sort_order") || 0);

  if (!property_id || !url || !["image", "video", "plan"].includes(kind)) {
    redirect(`/admin/propiedades/${property_id}?error=invalid_media`);
  }

  const ins = await admin.from("property_media").insert({
    property_id,
    kind,
    url,
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
  });

  if (ins.error) redirect(`/admin/propiedades/${property_id}?error=${encodeURIComponent(ins.error.message)}`);

  redirect(`/admin/propiedades/${property_id}?ok=media_added`);
}

export async function deleteMediaAction(formData: FormData) {
  const { admin } = await requireAdmin();

  const property_id = String(formData.get("property_id") || "");
  const media_id = String(formData.get("media_id") || "");
  const url = String(formData.get("url") || "");

  if (!property_id || !media_id) redirect(`/admin/propiedades/${property_id}?error=missing_media`);

  const del = await admin.from("property_media").delete().eq("id", media_id);
  if (del.error) redirect(`/admin/propiedades/${property_id}?error=${encodeURIComponent(del.error.message)}`);

  try {
    const marker = "/storage/v1/object/public/property-media/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = url.slice(idx + marker.length);
      await admin.storage.from("property-media").remove([path]);
    }
  } catch {
    // ignore
  }

  redirect(`/admin/propiedades/${property_id}?ok=media_deleted`);
}

// ✅ Setear imagen principal: deja esta en sort_order=0 y empuja las otras
export async function setPrimaryMediaAction(formData: FormData) {
  const { admin } = await requireAdmin();

  const property_id = String(formData.get("property_id") || "");
  const media_id = String(formData.get("media_id") || "");

  if (!property_id || !media_id) redirect(`/admin/propiedades/${property_id}?error=missing_media`);

  // 1) Traer todas las imágenes de esa propiedad ordenadas
  const list = await admin
    .from("property_media")
    .select("id, sort_order, created_at")
    .eq("property_id", property_id)
    .eq("kind", "image")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (list.error) redirect(`/admin/propiedades/${property_id}?error=${encodeURIComponent(list.error.message)}`);

  const images = list.data ?? [];
  if (images.length === 0) redirect(`/admin/propiedades/${property_id}?error=no_images`);

  // si el id no es imagen, igual no hacemos lío
  if (!images.some((x) => x.id === media_id)) redirect(`/admin/propiedades/${property_id}?error=not_image`);

  // 2) Reasignar sort_order: principal 0, resto 1..n
  const reordered = [media_id, ...images.map((x) => x.id).filter((id) => id !== media_id)];

  const updates = reordered.map((id, idx) => ({
    id,
    sort_order: idx,
  }));

  const up = await admin.from("property_media").upsert(updates, { onConflict: "id" });
  if (up.error) redirect(`/admin/propiedades/${property_id}?error=${encodeURIComponent(up.error.message)}`);

  redirect(`/admin/propiedades/${property_id}?ok=primary_set`);
}
