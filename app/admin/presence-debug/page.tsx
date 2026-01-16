import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export default async function PresenceDebugPage() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  let profile: any = null;
  let profileError: any = null;
  let upsertResult: any = null;
  let upsertError: any = null;
  let presenceRows: any = null;
  let presenceError: any = null;

  if (user) {
    const r = await admin
      .from("profiles")
      .select("id, role, full_name, whatsapp, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    profile = r.data;
    profileError = r.error;

    // Intento upsert de presencia (forzado desde el server con service_role)
    const u = await admin.from("user_presence").upsert(
      {
        user_id: user.id,
        role: profile?.role ?? null,
        full_name: profile?.full_name ?? null,
        whatsapp: profile?.whatsapp ?? null,
        avatar_url: profile?.avatar_url ?? null,
        email: user.email ?? null,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    upsertError = u.error;
    upsertResult = u.data ?? null;

    const p = await admin
      .from("user_presence")
      .select("user_id, role, full_name, whatsapp, email, last_seen, updated_at")
      .order("last_seen", { ascending: false })
      .limit(20);

    presenceRows = p.data;
    presenceError = p.error;
  }

  return (
    <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(
        {
          user: user ? { id: user.id, email: user.email } : null,
          profile,
          profileError,
          upsertError,
          upsertResult,
          presenceError,
          presenceRows,
        },
        null,
        2
      )}
    </pre>
  );
}
