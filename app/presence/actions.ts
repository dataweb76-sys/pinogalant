"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Heartbeat: actualiza last_seen del usuario logueado */
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

/** Offline inmediato: borra la fila del usuario (para logout) */
export async function presenceOfflineAction() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  await supabase.from("user_presence").delete().eq("user_id", user.id);
}
