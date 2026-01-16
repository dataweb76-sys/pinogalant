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

  if (!property_id || !media_id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const list = await auth.admin
    .from("property_media")
    .select("id")
    .eq("property_id", property_id)
    .eq("kind", "image")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (list.error) return NextResponse.json({ ok: false, error: list.error.message }, { status: 400 });

  const ids = (list.data ?? []).map((x) => x.id);
  if (!ids.includes(media_id)) return NextResponse.json({ ok: false, error: "not_image" }, { status: 400 });

  const reordered = [media_id, ...ids.filter((id) => id !== media_id)];
  const updates = reordered.map((id, idx) => ({ id, sort_order: idx }));

  const up = await auth.admin.from("property_media").upsert(updates, { onConflict: "id" });
  if (up.error) return NextResponse.json({ ok: false, error: up.error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
