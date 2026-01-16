"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

type PresencePayload = {
  user_id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  ts: number;
};

export default function AdminPresence() {
  const supabase = createBrowserClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "online" | "error">("idle");

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        setStatus("connecting");

        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!userRes.user) {
          if (mounted) setStatus("idle");
          return;
        }

        // Traemos el perfil propio (RLS allow select_own)
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("role, full_name, whatsapp, avatar_url")
          .eq("id", userRes.user.id)
          .single();

        if (profErr) throw profErr;

        // Solo admins/super_admin publican presencia
        const role = prof?.role ?? null;
        if (role !== "admin" && role !== "super_admin") {
          if (mounted) setStatus("idle");
          return;
        }

        const key = userRes.user.id;

        const ch = supabase.channel("inmo-online-agents", {
          config: { presence: { key } },
        });

        channelRef.current = ch;

        ch
          .on("presence", { event: "sync" }, () => {
            if (mounted) setStatus("online");
          })
          .subscribe(async (subStatus) => {
            if (subStatus !== "SUBSCRIBED") return;

            const payload: PresencePayload = {
              user_id: userRes.user.id,
              email: userRes.user.email ?? null,
              role: role,
              full_name: prof?.full_name ?? null,
              whatsapp: (prof as any)?.whatsapp ?? null,
              avatar_url: (prof as any)?.avatar_url ?? null,
              ts: Date.now(),
            };

            await ch.track(payload);
          });

        // Cuando se oculta/cierra, hacemos untrack
        const onVis = async () => {
          if (document.visibilityState === "hidden") {
            try {
              await ch.untrack();
            } catch {}
          } else {
            try {
              // Re-track al volver
              const payload: PresencePayload = {
                user_id: userRes.user.id,
                email: userRes.user.email ?? null,
                role: role,
                full_name: prof?.full_name ?? null,
                whatsapp: (prof as any)?.whatsapp ?? null,
                avatar_url: (prof as any)?.avatar_url ?? null,
                ts: Date.now(),
              };
              await ch.track(payload);
            } catch {}
          }
        };

        window.addEventListener("visibilitychange", onVis);
        return () => window.removeEventListener("visibilitychange", onVis);
      } catch (e) {
        console.error(e);
        if (mounted) setStatus("error");
      }
    }

    const cleanupPromise = start();

    return () => {
      mounted = false;
      const ch = channelRef.current;
      channelRef.current = null;

      Promise.resolve(cleanupPromise)
        .catch(() => {})
        .finally(async () => {
          try {
            if (ch) {
              await ch.untrack();
              await supabase.removeChannel(ch);
            }
          } catch {}
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No molestar al UI: solo un indicador mini para debug (podés sacarlo después)
  return (
    <span className="small" style={{ opacity: 0.7 }}>
      {status === "online" ? "🟢 Online" : status === "connecting" ? "🟡 Conectando..." : status === "error" ? "🔴 Error" : ""}
    </span>
  );
}
