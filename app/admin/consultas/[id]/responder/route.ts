import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const formData = await req.formData();
  const note = String(formData.get("note") || "").trim();
  const close = formData.get("close") === "on";

  if (!note) {
    return NextResponse.redirect(
      new URL("/admin/consultas", req.url)
    );
  }

  const admin = createSupabaseAdminClient();

  const update: any = {
    internal_notes: note,
    status: close ? "closed" : "in_progress",
  };

  if (close) {
    update.resolved_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("property_inquiries")
    .update(update)
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
