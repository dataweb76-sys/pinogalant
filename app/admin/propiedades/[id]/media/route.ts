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

  if (role !== "admin" && role !== "super_admin") return { ok: false as const, status: 403, error: "not_admin" };

  return { ok: true as const, admin };
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  // ✅ tomamos el property_id del URL /[id]/media
  const property_id = String(ctx.params.id || "").trim();

  const formData = await req.formData();
  const kind = String(formData.get("kind") || "");
  const url = String(formData.get("url") || "");
  const sort_order = Number(formData.get("sort_order") || 0);

  if (!property_id || !url || !["image", "video", "plan"].includes(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const ins = await auth.admin.from("property_media").insert({
    property_id,
    kind,
    url,
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
  });

  if (ins.error) {
    return NextResponse.json({ ok: false, error: ins.error.message, code: ins.error.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
