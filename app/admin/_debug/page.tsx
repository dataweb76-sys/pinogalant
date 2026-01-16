import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export default async function AdminDebug() {
  const supabase = await createSupabaseServerClient();
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  let profile: any = null;
  let profileError: any = null;

  if (user) {
    const admin = createSupabaseAdminClient();
    const r = await admin.from("profiles").select("id, role").eq("id", user.id).single();
    profile = r.data;
    profileError = r.error;
  }

  return (
    <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(
        { user: user ? { id: user.id, email: user.email } : null, profile, profileError },
        null,
        2
      )}
    </pre>
  );
}
