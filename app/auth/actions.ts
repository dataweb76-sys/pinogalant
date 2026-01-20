"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/server";

function cleanStr(v: any) {
  return String(v || "").trim();
}

export async function signInAction(formData: FormData) {
  const email = cleanStr(formData.get("email")).toLowerCase();
  const password = cleanStr(formData.get("password"));

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/admin");
}

export async function signUpAction(formData: FormData) {
  const email = cleanStr(formData.get("email")).toLowerCase();
  const password = cleanStr(formData.get("password"));

  const username = cleanStr(formData.get("username"));
  const first_name = cleanStr(formData.get("first_name"));
  const last_name = cleanStr(formData.get("last_name"));
  const phone = cleanStr(formData.get("phone"));
  const postal_code = cleanStr(formData.get("postal_code"));
  const city = cleanStr(formData.get("city"));
  const address = cleanStr(formData.get("address")); // opcional

  // Validaciones mínimas (obligatorias)
  if (!email || !password) redirect(`/registro?error=${encodeURIComponent("Email y clave son obligatorios")}`);
  if (!username) redirect(`/registro?error=${encodeURIComponent("El usuario es obligatorio")}`);
  if (!first_name || !last_name) redirect(`/registro?error=${encodeURIComponent("Nombre y apellido son obligatorios")}`);
  if (!phone) redirect(`/registro?error=${encodeURIComponent("El móvil es obligatorio")}`);
  if (!postal_code) redirect(`/registro?error=${encodeURIComponent("El código postal es obligatorio")}`);
  if (!city) redirect(`/registro?error=${encodeURIComponent("La ciudad es obligatoria")}`);

  const supabase = await createSupabaseActionClient();

  // 1) crear auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        first_name,
        last_name,
      },
    },
  });

  if (error) redirect(`/registro?error=${encodeURIComponent(error.message)}`);

  // 2) si ya hay sesión inmediata (en la mayoría de configs lo hay), guardamos profile
  // si tu supabase requiere confirmación de email, data.user existe igual, pero puede no iniciar sesión.
  const userId = data.user?.id;
  if (userId) {
    const full_name = `${first_name} ${last_name}`.trim();

    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: userId,
      role: "owner",
      username,
      first_name,
      last_name,
      full_name,
      phone,
      whatsapp: phone,
      postal_code,
      city,
      address: address || null,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      redirect(`/registro?error=${encodeURIComponent(upsertErr.message)}`);
    }
  }

  redirect(`/?welcome=${encodeURIComponent(first_name)}`);
}

export async function signOutAction() {
  const supabase = await createSupabaseActionClient();

  // borrar presencia si existe
  const { data: u } = await supabase.auth.getUser();
  if (u.user) {
    await supabase.from("user_presence").delete().eq("user_id", u.user.id);
  }

  await supabase.auth.signOut();
  redirect("/login?ok=signed_out");
}
