import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "hero.jpg": "image/jpeg",
  "buscar-sonado.mp4": "video/mp4",
};

export async function POST(req: NextRequest) {
  // Verificar admin
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

  if (!file || !filePath || !ALLOWED[filePath]) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await admin.storage
    .from("site-assets")
    .upload(filePath, buffer, {
      contentType: ALLOWED[filePath],
      upsert: true,
      cacheControl: "60",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("site-assets")
    .getPublicUrl(filePath);

  return NextResponse.json({ ok: true, url: urlData.publicUrl });
}
