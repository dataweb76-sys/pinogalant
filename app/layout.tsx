import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PresencePing from "@/app/components/PresencePing.client";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

  return (
    <html lang="es">
      <body>
        {user && <PresencePing />}
        {children}
      </body>
    </html>
  );
}
