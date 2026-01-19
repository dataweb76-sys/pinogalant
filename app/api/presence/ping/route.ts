// app/api/presence/ping/route.ts
import { NextResponse } from "next/server";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isStaff(role?: string | null) {
  return role === "admin" || role === "super_admin";
}

export async function POST() {
  try {
    // cliente con cookies (para saber quién es)
    const supabase = await createSupabaseActionClient();
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;

    if (!user) {
      return NextResponse.json({ ok: true, skipped: "no_user" }, { status: 200 });
    }

    // service role para leer perfil sin RLS
    const admin = createSupabaseAdminClient();
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, role, full_name, avatar_url, whatsapp")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile) {
      return NextResponse.json({ ok: true, skipped: "no_profile" }, { status: 200 });
    }

    // ⛔ IMPORTANTE: si NO es staff, NO insertamos presencia
    if (!isStaff(profile.role)) {
      // opcional: si alguna vez quedó un registro, lo borramos
      await admin.from("user_presence").delete().eq("user_id", user.id);
      return NextResponse.json({ ok: true, skipped: "not_staff" }, { status: 200 });
    }

    // upsert presencia
    const payload = {
      user_id: user.id,
      role: profile.role,
      full_name: profile.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      whatsapp: profile.whatsapp ?? null,
      email: user.email ?? null,
      last_seen: new Date().toISOString(),
    };

    const { error: upErr } = await admin
      .from("user_presence")
      .upsert(payload, { onConflict: "user_id" });

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
