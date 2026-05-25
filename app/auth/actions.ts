"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

export async function signInAction(formData: FormData) {
  const email    = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  const supabase = await createSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // Redirigir según rol
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role = profile?.role;
    if (role === "super_admin" || role === "admin" || role === "agent") redirect("/admin");
    if (role === "tenant") redirect("/mi-alquiler");
    if (role === "owner")  redirect("/mi-propiedad");
  }
  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const roleType    = clean(formData.get("role_type")); // inquilino | propietario
  const email       = clean(formData.get("email")).toLowerCase();
  const password    = clean(formData.get("password"));
  const first_name  = clean(formData.get("first_name"));
  const last_name   = clean(formData.get("last_name"));
  const phone       = clean(formData.get("phone"));
  const city        = clean(formData.get("city"));
  const postal_code = clean(formData.get("postal_code"));
  const address     = clean(formData.get("address"));
  const dni         = clean(formData.get("dni"));

  const err = (msg: string) =>
    redirect(`/registro?tipo=${roleType}&error=${encodeURIComponent(msg)}`);

  if (!email || !password)      err("Email y contraseña son obligatorios");
  if (!first_name || !last_name) err("Nombre y apellido son obligatorios");
  if (!phone)       err("El teléfono es obligatorio");
  if (!city)        err("La ciudad es obligatoria");
  if (!postal_code) err("El código postal es obligatorio");
  if (!dni)         err("El DNI es obligatorio");

  const dbRole = roleType === "inquilino" ? "tenant" : "owner";
  const adminClient = createSupabaseAdminClient();

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });
  if (createErr) err(createErr.message);

  const userId = created.user?.id;
  if (userId) {
    const full_name = `${first_name} ${last_name}`.trim();

    const profileData: Record<string, unknown> = {
      id: userId,
      role: dbRole,
      first_name, last_name, full_name,
      email, phone, whatsapp: phone,
      city, postal_code,
      address: address || null,
      dni: dni || null,
      registration_type: "email",
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    if (dbRole === "tenant") {
      const income_raw = clean(formData.get("monthly_income_ars"));
      Object.assign(profileData, {
        income_type:       clean(formData.get("income_type")) || null,
        employer:          clean(formData.get("employer")) || null,
        occupation:        clean(formData.get("occupation")) || null,
        monthly_income_ars: income_raw ? parseFloat(income_raw) : null,
        family_count:      parseInt(clean(formData.get("family_count"))) || 1,
        has_pets:          clean(formData.get("has_pets")) === "true",
        pets_description:  clean(formData.get("pets_description")) || null,
        guarantor_name:    clean(formData.get("guarantor_name")) || null,
        guarantor_phone:   clean(formData.get("guarantor_phone")) || null,
        guarantor_dni:     clean(formData.get("guarantor_dni")) || null,
        guarantor_rel:     clean(formData.get("guarantor_rel")) || null,
        prev_rental_ref:   clean(formData.get("prev_rental_ref")) || null,
      });
    }

    const { error: upsertErr } = await adminClient.from("profiles").upsert(profileData);
    if (upsertErr) err(upsertErr.message);
  }

  const supabase = await createSupabaseActionClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) redirect(`/login?ok=${encodeURIComponent("Cuenta creada. Ingresá con tu email y contraseña.")}`);

  if (dbRole === "tenant") redirect("/mi-alquiler?welcome=1");
  redirect("/mi-propiedad?welcome=1");
}

export async function signOutAction() {
  const supabase = await createSupabaseActionClient();
  const { data: u } = await supabase.auth.getUser();
  if (u.user) {
    try { await supabase.from("user_presence").delete().eq("user_id", u.user.id); } catch (_) {}
  }
  await supabase.auth.signOut();
  redirect("/login?ok=signed_out");
}

// Completar perfil después de Google OAuth
export async function completarPerfilAction(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const roleType    = clean(formData.get("role_type"));
  const first_name  = clean(formData.get("first_name"));
  const last_name   = clean(formData.get("last_name"));
  const phone       = clean(formData.get("phone"));
  const city        = clean(formData.get("city"));
  const postal_code = clean(formData.get("postal_code"));
  const dni         = clean(formData.get("dni"));
  const next        = clean(formData.get("next")) || "/";
  const dbRole      = roleType === "inquilino" ? "tenant" : "owner";
  const full_name   = `${first_name} ${last_name}`.trim();

  const admin = createSupabaseAdminClient();
  const profileData: Record<string, unknown> = {
    id: user.id,
    role: dbRole,
    first_name, last_name, full_name,
    email: user.email,
    phone, whatsapp: phone,
    city, postal_code,
    dni: dni || null,
    profile_complete: true,
    updated_at: new Date().toISOString(),
  };

  if (dbRole === "tenant") {
    const income_raw = clean(formData.get("monthly_income_ars"));
    Object.assign(profileData, {
      income_type:       clean(formData.get("income_type")) || null,
      employer:          clean(formData.get("employer")) || null,
      occupation:        clean(formData.get("occupation")) || null,
      monthly_income_ars: income_raw ? parseFloat(income_raw) : null,
      family_count:      parseInt(clean(formData.get("family_count"))) || 1,
      has_pets:          clean(formData.get("has_pets")) === "true",
      pets_description:  clean(formData.get("pets_description")) || null,
      guarantor_name:    clean(formData.get("guarantor_name")) || null,
      guarantor_phone:   clean(formData.get("guarantor_phone")) || null,
      guarantor_dni:     clean(formData.get("guarantor_dni")) || null,
      guarantor_rel:     clean(formData.get("guarantor_rel")) || null,
    });
  }

  const { error } = await admin.from("profiles").upsert(profileData);
  if (error) redirect(`/completar-perfil?tipo=${roleType}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);

  redirect(next !== "/" ? next : dbRole === "tenant" ? "/mi-alquiler" : "/mi-propiedad");
}
