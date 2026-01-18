// app/auth/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createSupabaseActionClient();

  // borrar presencia (si existe)
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("user_presence").delete().eq("user_id", data.user.id);
  }

  await supabase.auth.signOut();
  redirect("/login?ok=signed_out");
}
