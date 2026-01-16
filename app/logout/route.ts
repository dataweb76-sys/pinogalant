import { NextResponse } from "next/server";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseActionClient();

  // Esto borra la sesión y además limpia cookies (vía setAll)
  await supabase.auth.signOut();

  // Volvemos al home (o /login si preferís)
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:6100"), 303);
}
