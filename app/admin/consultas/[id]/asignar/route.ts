import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const formData = await req.formData();
  const agentId = String(formData.get("agent_id") || "");

  if (!agentId) {
    return NextResponse.redirect(
      new URL("/admin/consultas", req.url)
    );
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("property_inquiries")
    .update({
      agent_id: agentId,
      status: "in_progress",
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/admin/consultas", req.url)
  );
}
