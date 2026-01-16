// app/perfil/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "avatars"; // <- si tu bucket se llama distinto, cambialo acá

function cleanPhone(raw: string) {
  const d = raw.replace(/[^\d]/g, "");
  return d.length >= 8 ? raw : raw; // no lo rompo, solo normalizás si querés
}

export async function saveProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) redirect("/login?next=/perfil");

  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const address = String(formData.get("address") || "").trim();

  // avatar (file)
  const avatarFile = formData.get("avatar");
  let avatar_url: string | null = null;

  // 1) Primero leo el avatar actual por si no sube nada
  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  avatar_url = (current as any)?.avatar_url ?? null;

  // 2) Si sube archivo, lo guardo en Storage
  if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const up = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, avatarFile, { upsert: true });

    if (up.error) {
      redirect(`/perfil?error=${encodeURIComponent("No se pudo subir la foto: " + up.error.message)}`);
    }

    // URL pública (si el bucket es público)
    const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url =
      (pub as any)?.publicUrl || (pub as any)?.publicURL || (pub as any)?.public_url || null;

    if (url) avatar_url = url;
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: full_name || null,
    phone: phone ? cleanPhone(phone) : null,
    whatsapp: whatsapp ? cleanPhone(whatsapp) : null,
    address: address || null,
    avatar_url,
  });

  if (error) {
    redirect(`/perfil?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/perfil?ok=1");
}

export async function changePasswordAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) redirect("/login?next=/perfil");

  const password = String(formData.get("password") || "").trim();
  const password2 = String(formData.get("password2") || "").trim();

  if (!password || password.length < 8) {
    redirect(`/perfil?error=${encodeURIComponent("La contraseña debe tener mínimo 8 caracteres")}`);
  }
  if (password !== password2) {
    redirect(`/perfil?error=${encodeURIComponent("Las contraseñas no coinciden")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/perfil?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/perfil?ok=pass");
}
