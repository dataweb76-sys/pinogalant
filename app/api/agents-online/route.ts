import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const cutoff = new Date(Date.now() - 45_000).toISOString();

    const { data, error } = await admin
      .from("user_presence")
      .select("user_id,role,full_name,avatar_url,whatsapp,email,last_seen")
      .gte("last_seen", cutoff)
      .order("last_seen", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, rows: [] }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, rows: data ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error", rows: [] }, { status: 500 });
  }
}
