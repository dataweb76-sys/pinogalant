"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function PresencePingClient({ role }: { role: string }) {
  const supabase = createBrowserClient();

  useEffect(() => {
    let timer: any;

    async function ping() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      await supabase.from("online_users").upsert(
        {
          user_id: data.user.id,
          role,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    // ping inicial
    ping();

    // ping cada 25s
    timer = setInterval(ping, 25_000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [role, supabase]);

  return null;
}
