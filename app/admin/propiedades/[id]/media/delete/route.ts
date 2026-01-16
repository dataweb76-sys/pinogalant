import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Role = "owner" | "admin" | "super_admin";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, status: 401, error: "not_logged_in" };

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = (me.data?.role as Role | undefined) ?? "owner";

  if (role !== "admin" && role !== "super_admin") {
    return { ok: false as const, status: 403, error: "not_admin" };
  }

  return { ok: true as const, admin, userId: data.user.id, role };
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const property_id = String(body?.property_id || "");
  const media_id = String(body?.media_id || "");
  const url = String(body?.url || "");

  if (!property_id || !media_id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  // borrar fila
  const del = await auth.admin.from("property_media").delete().eq("id", media_id);
  if (del.error) return NextResponse.json({ ok: false, error: del.error.message }, { status: 400 });

  // borrar storage si corresponde
  try {
    const marker = "/storage/v1/object/public/property-media/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = url.slice(idx + marker.length);
      await auth.admin.storage.from("property-media").remove([path]);
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}
