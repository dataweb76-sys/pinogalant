"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeString(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function saveProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) redirect(`/login?error=${encodeURIComponent(userErr.message)}`);
  const user = userRes.user;
  if (!user) redirect("/login?next=/perfil");

  const full_name = safeString(formData.get("full_name"));
  const phone = safeString(formData.get("phone"));
  const whatsapp = safeString(formData.get("whatsapp"));
  const address = safeString(formData.get("address"));

  // ✅ No tocamos "email" porque tu tabla profiles NO lo tiene
  const { error: upsertErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name,
      phone,
      whatsapp,
      address,
    },
    { onConflict: "id" }
  );

  if (upsertErr) {
    redirect(`/perfil?error=${encodeURIComponent(upsertErr.message)}`);
  }

  // Avatar opcional
  const file = formData.get("avatar") as File | null;
  if (file && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    const upload = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

    if (upload.error) {
      redirect(`/perfil?error=${encodeURIComponent(upload.error.message)}`);
    }

    const pub = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = pub.data.publicUrl;

    // Guardamos avatar_url / avatar_path SOLO si existen
    // Si alguna no existe, no tiramos abajo todo: intentamos solo avatar_url.
    const r1 = await supabase.from("profiles").update({ avatar_url }).eq("id", user.id);
    if (r1.error) {
      // intentamos avatar_path por si tu schema es distinto
      const r2 = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      if (r2.error) {
        redirect(`/perfil?error=${encodeURIComponent(r1.error.message)}`);
      }
    } else {
      // si avatar_url funcionó, intentamos guardar también avatar_path si existe
      await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
    }
  }

  revalidatePath("/perfil");
  revalidatePath("/admin");
  revalidatePath("/");

  redirect("/perfil?ok=1");
}
