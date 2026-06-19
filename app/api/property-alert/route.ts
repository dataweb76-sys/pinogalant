import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, operation, type_name, price_max, zones } = await req.json();
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createSupabaseAdminClient();
    await admin.from("property_alerts").insert({
      name, email: email || null, phone: phone || null,
      operation, type_name: type_name || null,
      price_max: price_max ? Number(price_max) : null,
      zones: zones || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
