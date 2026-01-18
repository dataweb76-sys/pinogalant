// app/components/PresencePing.client.tsx
"use client";

import { useEffect } from "react";

export default function PresencePing() {
  useEffect(() => {
    let alive = true;

    async function ping() {
      try {
        await fetch("/api/presence/ping", { method: "POST", cache: "no-store" });
      } catch {}
    }

    ping();
    const t = setInterval(() => {
      if (!alive) return;
      ping();
    }, 20_000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return null;
}
