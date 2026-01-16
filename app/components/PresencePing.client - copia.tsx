"use client";

import { useEffect, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function PresencePing() {
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    let alive = true;

    async function ping() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        await fetch("/api/presence/ping", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }

    async function offline() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        // best-effort
        navigator.sendBeacon?.(
          "/api/presence/offline",
          new Blob([], { type: "application/json" })
        );

        await fetch("/api/presence/offline", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }

    ping();
    const t = setInterval(() => {
      if (!alive) return;
      ping();
    }, 15000);

    window.addEventListener("beforeunload", offline);

    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("beforeunload", offline);
    };
  }, [supabase]);

  return null;
}
