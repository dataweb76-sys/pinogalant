"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function AdminLogin() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    // The middleware will redirect if the role is not allowed.
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <div>
        <label className="small">Email</label>
        <input className="input" name="email" type="email" required />
      </div>
      <div>
        <label className="small">Contraseña</label>
        <input className="input" name="password" type="password" required />
      </div>
      <button className="btn btnPrimary" disabled={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      {msg ? <p className="small">{msg}</p> : null}
    </form>
  );
}
