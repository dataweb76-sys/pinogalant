"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireTenant() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler");
  return { userId: data.user.id, supabase };
}

function s(v: FormDataEntryValue | null): string | null {
  const x = String(v ?? "").trim();
  return x || null;
}

/* ── Presentar reclamo ── */
export async function createClaimAction(formData: FormData) {
  const { userId } = await requireTenant();

  const contractId = s(formData.get("contract_id"))!;
  const category   = s(formData.get("category")) ?? "other";
  const priority   = s(formData.get("priority")) ?? "medium";
  const title      = s(formData.get("title"))!;
  const description = s(formData.get("description"));
  const location   = s(formData.get("location"));

  if (!contractId || !title) {
    redirect("/mi-alquiler/reclamos/nuevo?error=Faltan+datos+requeridos");
  }

  const admin = createSupabaseAdminClient();

  // Verificar que el contrato pertenece al inquilino
  const { data: contract } = await admin
    .from("rental_contracts")
    .select("id, tenant_id")
    .eq("id", contractId)
    .eq("tenant_id", userId)
    .maybeSingle();

  if (!contract) {
    redirect("/mi-alquiler/reclamos/nuevo?error=Contrato+no+válido");
  }

  // Build description combining description + location (since description is NOT NULL in schema)
  const fullDescription = [description, location ? `Ubicación: ${location}` : null]
    .filter(Boolean).join("\n\n") || "(Sin descripción adicional)";

  const { error } = await admin.from("rental_claims").insert({
    contract_id: contractId,
    tenant_id:   userId,
    category,
    priority,
    title,
    description: fullDescription,
    status: "open",
  });

  if (error) {
    redirect(`/mi-alquiler/reclamos/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/mi-alquiler/reclamos?ok=Reclamo+enviado+correctamente");
}
