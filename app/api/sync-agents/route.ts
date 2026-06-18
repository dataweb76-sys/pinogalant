import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllTokkoProperties } from "@/lib/tokko";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const [props, { data: agents }] = await Promise.all([
    getAllTokkoProperties(),
    admin.from("agents").select("id, tokko_id").not("tokko_id", "is", null),
  ]);

  const tokkoIdToAgent: Record<number, string> = {};
  (agents ?? []).forEach((a: any) => { tokkoIdToAgent[a.tokko_id] = a.id; });

  const rows = props
    .filter((p) => p.producer?.id && tokkoIdToAgent[p.producer.id])
    .map((p) => ({
      tokko_id: p.id,
      agent_id: tokkoIdToAgent[p.producer!.id],
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return NextResponse.json({ ok: true, count: 0 });

  const { error } = await admin
    .from("tokko_agent_assignments")
    .upsert(rows, { onConflict: "tokko_id" });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length, synced_at: new Date().toISOString() });
}
