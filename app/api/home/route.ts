import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const city = searchParams.get("city");

  const admin = createSupabaseAdminClient();

  let query = admin
    .from("properties")
    .select(
      `
      id, title, city, neighborhood, price_ars, price_usd, lat, lng,
      property_media(url, sort_order)
    `
    )
    .eq("is_published", true);

  if (city) {
    query = query.eq("city", city);
  }

  const { data, error } = await query.limit(12);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const normalized = (data || []).map((p) => {
    const images = (p.property_media || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return {
      id: p.id,
      title: p.title,
      city: p.city,
      neighborhood: p.neighborhood,
      price_ars: p.price_ars,
      price_usd: p.price_usd,
      lat: p.lat,
      lng: p.lng,
      image: images[0]?.url || null,
    };
  });

  return NextResponse.json({ ok: true, properties: normalized });
}
