"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Mapeo tipo visible → enum de BD
const TYPE_MAP: Record<string, string> = {
  casa:        "casa",
  ph:          "depto",
  depto:       "depto",
  casaquinta:  "casa",
  chalet:      "casa",
  terreno:     "terreno",
  local:       "local",
  oficina:     "oficina",
  cochera:     "local",
  galpon:      "local",
  campo:       "campo",
  estancia:    "campo",
};

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function int(v: FormDataEntryValue | null): number | null {
  const n = num(v);
  return n != null ? Math.round(n) : null;
}

export async function submitPropertyAction(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/publicar");

  const propertyTypeFull = String(formData.get("property_type_full") || "depto");
  const type = TYPE_MAP[propertyTypeFull] ?? "depto";
  const operation = String(formData.get("operation") || "venta");

  const title      = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  const province     = String(formData.get("province") || "").trim() || null;
  const city         = String(formData.get("city") || "").trim();
  const neighborhood = String(formData.get("neighborhood") || "").trim() || null;
  const address      = String(formData.get("address") || "").trim() || null;
  const address_hidden = formData.get("address_hidden") === "1";

  const price_usd   = num(formData.get("price_usd"));
  const price_ars   = num(formData.get("price_ars"));
  const expenses_ars = num(formData.get("expenses_ars"));

  const rooms        = int(formData.get("rooms"));
  const bathrooms    = int(formData.get("bathrooms"));
  const total_m2     = num(formData.get("total_m2"));
  const area_m2      = num(formData.get("area_m2"));
  const floors       = int(formData.get("floors"));
  const floor_number = int(formData.get("floor_number"));
  const age_years    = int(formData.get("age_years"));
  const has_garage   = formData.get("has_garage") === "1";
  const parking_spaces = int(formData.get("parking_spaces"));

  const amenities = formData.getAll("amenities").map(v => String(v));

  const owner_name  = String(formData.get("owner_name") || "").trim() || null;
  const owner_phone = String(formData.get("owner_phone") || "").trim() || null;

  const agent_id_raw = String(formData.get("agent_id") || "").trim();

  if (!title) redirect("/publicar?error=El+título+es+obligatorio");
  if (!city)  redirect("/publicar?error=La+ciudad+es+obligatoria");

  const admin = createSupabaseAdminClient();

  const insertData: Record<string, unknown> = {
    title,
    description:    description || null,
    operation,
    type,
    property_type:  propertyTypeFull,
    status:         "en_revision",
    is_published:   false,

    province,
    city,
    neighborhood,
    address,
    address_hidden,

    price_usd,
    price_ars,
    show_both: !!(price_usd && price_ars),

    rooms,
    bathrooms,
    area_m2,           // m² cubiertos
    total_m2,          // m² totales
    floors,
    floor_number,
    age_years,
    has_garage,
    amenities,

    owner_name,
    owner_phone,

    agent_id:          agent_id_raw || null,
    assigned_agent_id: agent_id_raw || null,
    created_by_user_id: user.id,
  };

  // Columnas opcionales: solo incluir si existen en la tabla
  if (expenses_ars !== null) insertData.expenses_ars = expenses_ars;
  if (parking_spaces !== null) insertData.parking_spaces = parking_spaces;

  const { data: property, error } = await admin
    .from("properties")
    .insert(insertData)
    .select("id")
    .single();

  if (error) redirect(`/publicar?error=${encodeURIComponent(error.message)}`);

  redirect(`/publicar/media/${property.id}`);
}
