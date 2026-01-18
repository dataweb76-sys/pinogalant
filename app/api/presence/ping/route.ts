// app/api/presence/ping/route.ts
import { NextResponse } from "next/server";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseActionClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return NextResponse.json({ ok: false }, { status: 200 });

  const now = new Date().toISOString();

  await supabase.from("user_presence").upsert(
    {
      user_id: user.id,
      last_seen: now,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
