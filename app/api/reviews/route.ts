import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Soporta tanto JSON como form-data (el form usa method="POST")
  let agent_id: string, reviewer_id: string, rating: number, comment: string;

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = await req.json();
    agent_id   = body.agent_id;
    reviewer_id = body.reviewer_id;
    rating     = parseInt(body.rating ?? "5");
    comment    = body.comment ?? "";
  } else {
    const form  = await req.formData();
    agent_id    = String(form.get("agent_id") ?? "");
    reviewer_id = String(form.get("reviewer_id") ?? "");
    rating      = parseInt(String(form.get("rating") ?? "5"));
    comment     = String(form.get("comment") ?? "");
  }

  // Verificar sesión
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== reviewer_id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const admin = createSupabaseAdminClient();

  // Evitar duplicados
  const { data: existing } = await admin
    .from("agent_reviews")
    .select("id")
    .eq("agent_id", agent_id)
    .eq("reviewer_id", reviewer_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(
      new URL("/mi-propiedad?error=Ya+dejaste+una+reseña+para+este+agente", req.url)
    );
  }

  await admin.from("agent_reviews").insert({
    agent_id,
    reviewer_id,
    rating: Math.min(5, Math.max(1, rating)),
    comment: comment.trim() || null,
  });

  return NextResponse.redirect(new URL("/mi-propiedad?ok=Reseña+enviada+exitosamente", req.url));
}
