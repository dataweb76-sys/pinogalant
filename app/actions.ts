"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Actualiza last_seen del usuario logueado (heartbeat). */
export async function presencePingAction() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  await supabase.from("user_presence").upsert({
    user_id: user.id,
    last_seen: new Date().toISOString(),
  });
}

/** Marca offline inmediato en logout (borra la fila). */
export async function presenceOfflineAction() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  await supabase.from("user_presence").delete().eq("user_id", user.id);
}
