import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function decodeJwtPayload(jwt?: string) {
  if (!jwt) return null;
  try {
    const b64 = jwt.split(".")[1];
    const json = Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return { error: "cannot_decode" };
  }
}

export default async function DebugAuthPage() {
  const supabase = await createSupabaseServerClient();
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user ?? null;

  const serviceRoleJwt = decodeJwtPayload(process.env.SUPABASE_SERVICE_ROLE_KEY);

  let profile: any = null;
  let profileError: any = null;

  try {
    if (user) {
      const admin = createSupabaseAdminClient();
      const r = await admin.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
      profile = r.data;
      profileError = r.error;
    }
  } catch (e: any) {
    profileError = { message: e?.message ?? String(e) };
  }

  return (
    <pre style={{ padding: 24, whiteSpace: "pre-wrap" }}>
      {JSON.stringify(
        {
          env: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
          serviceRoleJwt: serviceRoleJwt
            ? { role: serviceRoleJwt.role, ref: serviceRoleJwt.ref }
            : null,
          user: user ? { id: user.id, email: user.email } : null,
          profile,
          profileError,
        },
        null,
        2
      )}
    </pre>
  );
}
