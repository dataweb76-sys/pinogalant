import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED = ["hero.jpg", "buscar-sonado.mp4"];

export async function POST(req: NextRequest) {
  // Verificar que sea admin
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const filePath = form.get("path") as string | null;

  if (!file || !filePath) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  if (!ALLOWED.includes(filePath)) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const dest = path.join(process.cwd(), "public", filePath);

  await writeFile(dest, buffer);

  return NextResponse.json({ ok: true, path: `/${filePath}` });
}
