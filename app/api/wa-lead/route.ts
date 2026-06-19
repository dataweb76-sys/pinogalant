import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { property_id, property_address, visitor_name, visitor_phone, agent_name, agent_phone, source } = body;

    const admin = createSupabaseAdminClient();
    await admin.from("whatsapp_leads").insert({
      property_id:      property_id ?? null,
      property_address: property_address ?? null,
      visitor_name:     visitor_name ?? null,
      visitor_phone:    visitor_phone ?? null,
      agent_name:       agent_name ?? null,
      agent_phone:      agent_phone ?? null,
      source:           source ?? "property_card",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
