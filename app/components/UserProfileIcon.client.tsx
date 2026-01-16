"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function UserProfileIcon() {
  const supabase = createBrowserClient();
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setLogged(!!data.user);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setLogged(!!session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!ready) return null;

  if (!logged) {
    return (
      <Link className="btn" href="/login">
        Ingresar
      </Link>
    );
  }

  return (
    <Link
      href="/perfil"
      className="btn"
      title="Mi perfil"
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      👤 <span className="small">Perfil</span>
    </Link>
  );
}
