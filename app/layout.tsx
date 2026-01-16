import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PresencePing from "@/app/components/PresencePing.client";
import SiteHeader from "@/app/components/SiteHeader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function roleToEs(role?: string | null) {
  switch (role) {
    case "super_admin":
      return "Superadmin";
    case "admin":
      return "Administración";
    case "owner":
      return "Propietario";
    default:
      return "Usuario";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

  let headerUser: { email: string; roleLabel?: string | null } | null = null;

  if (user?.email) {
    // OJO: esto usa el mismo server client con cookies (no service_role)
    // Si RLS te bloquea profiles, igual no rompe: roleLabel queda null.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

    headerUser = {
      email: user.email,
      roleLabel: roleToEs((profile as any)?.role ?? null),
    };
  }

  return (
    <html lang="es">
      <body>
        <SiteHeader user={headerUser} />
        {user ? <PresencePing /> : null}
        {children}
      </body>
    </html>
  );
}
