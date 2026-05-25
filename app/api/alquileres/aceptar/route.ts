import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { contractId } = await req.json();
    if (!contractId) {
      return NextResponse.json({ error: "contractId requerido" }, { status: 400 });
    }

    // Verificar sesión del inquilino
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Verificar que el contrato pertenece al inquilino y está pendiente de firma
    const { data: contract } = await admin
      .from("rental_contracts")
      .select("id, tenant_id, status")
      .eq("id", contractId)
      .maybeSingle();

    if (!contract) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }
    if (contract.tenant_id !== user.id) {
      return NextResponse.json({ error: "Sin acceso a este contrato" }, { status: 403 });
    }
    if (contract.status !== "pending_tenant") {
      return NextResponse.json({ error: "El contrato no está en estado para firma" }, { status: 400 });
    }

    // Obtener IP del inquilino
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "desconocida";

    // Actualizar contrato: firma del inquilino → espera confirmación admin
    const { error } = await admin
      .from("rental_contracts")
      .update({
        status:           "pending_admin",
        tenant_agreed_at: new Date().toISOString(),
        tenant_ip:        ip,
      })
      .eq("id", contractId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error interno" }, { status: 500 });
  }
}
