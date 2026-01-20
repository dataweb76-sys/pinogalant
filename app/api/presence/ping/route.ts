// app/api/presence/ping/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // quien soy (cookie session)
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // actualizo perfil (service role, no depende de RLS)
    const admin = createSupabaseAdminClient();
    await admin
      .from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
