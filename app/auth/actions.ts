"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const adminClient = createSupabaseAdminClient();

  // 1) crear auth user via admin (sin enviar email de confirmación)
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, first_name, last_name },
  });

  if (createErr) redirect(`/registro?error=${encodeURIComponent(createErr.message)}`);

  const userId = created.user?.id;
  if (userId) {
    const full_name = `${first_name} ${last_name}`.trim();

    const { error: upsertErr } = await adminClient.from("profiles").upsert({
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

    if (upsertErr) redirect(`/registro?error=${encodeURIComponent(upsertErr.message)}`);
  }

  // 2) iniciar sesión con las credenciales recién creadas
  const supabase = await createSupabaseActionClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) redirect(`/login?error=${encodeURIComponent("Cuenta creada. Ingresá con tu email y clave.")}`);

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
