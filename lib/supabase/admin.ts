import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
  if (!service) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");

  return createClient(url, service, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
