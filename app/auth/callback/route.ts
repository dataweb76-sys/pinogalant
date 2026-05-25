import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic    = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user  = sessionData.user;
      const admin = createSupabaseAdminClient();

      // Verificar si el perfil está completo
      const { data: profile } = await admin
        .from("profiles")
        .select("profile_complete, role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.profile_complete) {
        // Crear perfil mínimo si todavía no existe (primer login con Google)
        if (!profile) {
          const googleName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
          const avatarUrl  = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
          await admin.from("profiles").upsert({
            id: user.id,
            email: user.email,
            full_name: googleName || null,
            first_name: googleName.split(" ")[0] ?? "",
            last_name:  googleName.split(" ").slice(1).join(" ") ?? "",
            avatar_url: avatarUrl,
            role: "owner",
            registration_type: "google",
            profile_complete: false,
            updated_at: new Date().toISOString(),
          });
        }
        return NextResponse.redirect(
          `${origin}/completar-perfil?next=${encodeURIComponent(next)}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Error al iniciar sesión")}`
  );
}
