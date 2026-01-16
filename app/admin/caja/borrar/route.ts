// app/admin/caja/borrar/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("id") || "");
  const fecha = String(form.get("fecha") || "");

  const supa = await createSupabaseServerClient();
  const { data: userRes } = await supa.auth.getUser();
  const user = userRes.user;

  if (!user) return NextResponse.redirect(new URL("/login?next=/admin/caja", req.url));

  if (!id) {
    return NextResponse.redirect(new URL(`/admin/caja?fecha=${encodeURIComponent(fecha)}&error=Falta%20id`, req.url));
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("caja_movimientos").delete().eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/caja?fecha=${encodeURIComponent(fecha)}&error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  return NextResponse.redirect(new URL(`/admin/caja?fecha=${encodeURIComponent(fecha)}&ok=1`, req.url));
}
