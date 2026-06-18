import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PresencePing from "@/app/components/PresencePing.client";
import SiteHeader from "@/app/components/SiteHeader";
import VideoIntro from "@/app/components/VideoIntro.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function roleToEs(role?: string | null) {
  switch (role) {
    case "super_admin": return "Coordinadora";
    case "admin":       return "Agente";
    case "agent":       return "Agente";
    case "owner":       return "Propietario";
    case "tenant":      return "Inquilino";
    default:            return "Usuario";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

let headerUser: { email: string; role?: string | null; roleLabel?: string | null } | null = null;

if (user?.email) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  headerUser = {
    email: user.email,
    role: profile?.role ?? null,
    roleLabel: roleToEs(profile?.role ?? null),
  };
}

  return (
    <html lang="es">
      <body>
        <VideoIntro />
        <SiteHeader user={headerUser} />
        {user && <PresencePing user={user} />}
        {children}
      </body>
    </html>
  );
}