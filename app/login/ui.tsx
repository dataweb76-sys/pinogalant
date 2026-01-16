"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthBox({ mode }: { mode: "login" | "signup" }) {
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

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMsg(`❌ ${result.error.message}`);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      // Si tenés confirmación por email activa, no inicia sesión hasta confirmar.
      // Igual el usuario debería aparecer en Supabase Auth > Users.
      setMsg("✅ Cuenta creada. Ahora ingresá en Login (o confirmá email si te lo pide).");
      (e.target as HTMLFormElement).reset();
      setLoading(false);
      return;
    }

    setMsg("✅ Sesión iniciada.");
    router.push("/admin");
    router.refresh();
    setLoading(false);
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
        {loading ? "Procesando..." : mode === "signup" ? "Crear cuenta" : "Ingresar"}
      </button>

      <div className="small">
        {mode === "signup" ? (
          <>¿Ya tenés cuenta? <Link href="/login">Ingresar</Link></>
        ) : (
          <>¿No tenés cuenta? <Link href="/registro">Crear cuenta</Link></>
        )}
      </div>

      {msg ? <p className="small">{msg}</p> : null}
    </form>
  );
}
