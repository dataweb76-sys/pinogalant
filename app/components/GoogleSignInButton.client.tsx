"use client";

import { createBrowserClient } from "@supabase/ssr";

export default function GoogleSignInButton({
  next = "/completar-perfil",
  label = "Continuar con Google",
}: {
  next?: string;
  label?: string;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        padding: "11px 16px",
        border: "1.5px solid #e0e0e0",
        borderRadius: 12,
        background: "#fff",
        fontSize: 14,
        fontWeight: 700,
        color: "#2D3134",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color .15s, box-shadow .15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#B48A73")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e0e0e0")}
    >
      {/* Google Logo SVG */}
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path d="M47.532 24.552c0-1.636-.132-3.2-.396-4.704H24.48v9.02h13.004c-.572 2.98-2.24 5.504-4.748 7.196v5.996h7.672c4.492-4.14 7.124-10.236 7.124-17.508z" fill="#4285F4"/>
        <path d="M24.48 48c6.48 0 11.924-2.148 15.9-5.836l-7.672-5.996c-2.148 1.44-4.9 2.292-8.228 2.292-6.324 0-11.676-4.272-13.592-10.02H3.04v6.196C6.996 43.14 15.16 48 24.48 48z" fill="#34A853"/>
        <path d="M10.888 28.44A14.52 14.52 0 0 1 10 24c0-1.532.264-3.02.748-4.44v-6.196H3.04A23.98 23.98 0 0 0 .48 24c0 3.86.928 7.512 2.56 10.636l7.848-6.196z" fill="#FBBC05"/>
        <path d="M24.48 9.54c3.564 0 6.748 1.224 9.26 3.628l6.912-6.912C36.4 2.388 30.96 0 24.48 0 15.16 0 6.996 4.86 3.04 13.364l7.848 6.196C12.804 13.812 18.156 9.54 24.48 9.54z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  );
}
