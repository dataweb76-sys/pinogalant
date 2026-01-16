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

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) redirect(`/registro?error=${encodeURIComponent(error.message)}`);

  redirect("/login?ok=created");
}

export async function signOutAction() {
  const supabase = await createSupabaseActionClient();

  // 1) borrar presencia (si existe)
  const { data: u } = await supabase.auth.getUser();
  if (u.user) {
    // si hay RLS para borrar el propio registro, esto funciona con anon/auth
    await supabase.from("user_presence").delete().eq("user_id", u.user.id);
  }

  // 2) cerrar sesión
  await supabase.auth.signOut();
  redirect("/login?ok=signed_out");
}
