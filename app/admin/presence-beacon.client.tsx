"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function PresenceBeacon() {
  const supabase = createBrowserClient();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let alive = true;

    async function start() {
      // Obtenemos usuario autenticado (real)
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data?.user) return;

      const userId = data.user.id;

      // Presence channel: todos los agentes/admin/super_admin se “ven”
      channel = supabase.channel("agents-online", {
        config: { presence: { key: userId } },
      });

      channel.on("presence", { event: "sync" }, () => {
        // no hacemos nada acá; el público escucha este channel
      });

      await channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        // Track: lo mínimo imprescindible
        // (no mandamos teléfono/email acá)
        await channel!.track({
          user_id: userId,
          at: new Date().toISOString(),
          where: "admin",
        });
      });
    }

    start();

    return () => {
      alive = false;
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {}
    };
  }, [supabase]);

  return null;
}
