// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anon };
}

/**
 * Server Components: SOLO lectura de cookies.
 * NO intentes cookieStore.set acá (Next lo prohíbe).
 */
export async function createSupabaseServerClient() {
  const { url, anon } = getEnv();
  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // En Server Components NO se puede setear cookies
      setAll() {},
    },
  });
}

/**
 * Server Actions / Route Handlers: permitido setear cookies.
 */
export async function createSupabaseActionClient() {
  const { url, anon } = getEnv();
  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
