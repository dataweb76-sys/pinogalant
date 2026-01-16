// app/admin/caja/nuevo/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();

  const tipo = String(form.get("tipo") || "income"); // income|expense
  const concept = String(form.get("concepto") || "");
  const notes = String(form.get("detalle") || "");
  const property_id = String(form.get("property_id") || "") || null;

  const amount_ars = form.get("monto_ars") ? Number(String(form.get("monto_ars"))) : null;
  const amount_usd = form.get("monto_usd") ? Number(String(form.get("monto_usd"))) : null;

  const supa = await createSupabaseServerClient();
  const { data: userRes } = await supa.auth.getUser();
  const user = userRes.user;

  if (!user) return NextResponse.redirect(new URL("/login?next=/admin/caja", req.url));

  if (!concept) {
    return NextResponse.redirect(new URL(`/admin/caja?error=${encodeURIComponent("Falta concepto")}`, req.url));
  }

  if (!(tipo === "income" || tipo === "expense")) {
    return NextResponse.redirect(new URL(`/admin/caja?error=${encodeURIComponent("Tipo inválido")}`, req.url));
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("cash_movements").insert({
    type: tipo,
    concept,
    notes: notes || null,
    property_id,
    amount_ars,
    amount_usd,
    created_by: user.id,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/admin/caja?error=${encodeURIComponent(error.message)}`, req.url));
  }

  return NextResponse.redirect(new URL(`/admin/caja?ok=1`, req.url));
}
