import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const admin = createSupabaseAdminClient();

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      return NextResponse.json({ ok: true, skipped: "missing_token" });
    }

    const { data: u } = await admin.auth.getUser(token);
    const user = u?.user;
    if (!user) return NextResponse.json({ ok: true, skipped: "no_user" });

    const { error } = await admin.from("user_presence").delete().eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
