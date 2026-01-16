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

  return { ok: true as const, admin };
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const property_id = String(ctx.params.id || "");
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String) : [];

  if (!property_id || ids.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  // 🔥 CLAVE: UPDATE, NO UPSERT
  for (let i = 0; i < ids.length; i++) {
    const mediaId = ids[i];

    const upd = await auth.admin
      .from("property_media")
      .update({ sort_order: i })
      .eq("id", mediaId)
      .eq("property_id", property_id);

    if (upd.error) {
      return NextResponse.json(
        { ok: false, error: upd.error.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
