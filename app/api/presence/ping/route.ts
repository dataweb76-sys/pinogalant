import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const admin = createSupabaseAdminClient();

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      return NextResponse.json({ ok: false, error: "missing_token" }, { status: 401 });
    }

    const { data: u, error: uerr } = await admin.auth.getUser(token);
    if (uerr || !u?.user) {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
    }

    const user = u.user;

    const { data: prof } = await admin
      .from("profiles")
      .select("role, full_name, whatsapp, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      role: (prof as any)?.role ?? null,
      full_name: (prof as any)?.full_name ?? null,
      avatar_url: (prof as any)?.avatar_url ?? null,
      whatsapp: (prof as any)?.whatsapp ?? null,
      email: user.email ?? null,
      last_seen: new Date().toISOString(),
    };

    const { error } = await admin.from("user_presence").upsert(payload, { onConflict: "user_id" });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
