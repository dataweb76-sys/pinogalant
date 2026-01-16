import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city");
  const operation = searchParams.get("operation");
  const type = searchParams.get("type");
  const min = Number(searchParams.get("min"));
  const max = Number(searchParams.get("max"));

  const admin = createSupabaseAdminClient();

  let q = admin
    .from("properties")
    .select(
      `
      id, title, city, neighborhood, price_ars, price_usd,
      property_media(url, sort_order)
    `
    )
    .eq("is_published", true);

  if (city) q = q.ilike("city", `%${city}%`);
  if (operation) q = q.eq("operation", operation);
  if (type) q = q.eq("property_type", type);

  if (min) q = q.gte("price_usd", min);
  if (max) q = q.lte("price_usd", max);

  const { data, error } = await q.limit(50);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const normalized = (data || []).map((p) => {
    const images = (p.property_media || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...p, image: images[0]?.url || null };
  });

  return NextResponse.json({ ok: true, properties: normalized });
}
