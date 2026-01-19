import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    // Solo staff: admin + super_admin
    const { data, error } = await admin
      .from("user_presence")
      .select("user_id,role,full_name,avatar_url,whatsapp,email,last_seen")
      .in("role", ["admin", "super_admin"])
      .order("last_seen", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ rows: [], error: error.message }, { status: 200 });
    }

    // filtro extra por las dudas
    const rows = (data as any[] | null)?.filter((r) => r?.role === "admin" || r?.role === "super_admin") ?? [];

    return NextResponse.json({ rows }, { status: 200 });
  } catch {
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
