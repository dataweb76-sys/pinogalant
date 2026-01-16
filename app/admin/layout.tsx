// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAdminRole(role?: string | null) {
  return role === "admin" || role === "super_admin";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  // 1) Debe estar logueado
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) {
    redirect("/login?next=/admin");
  }

  // 2) Rol (con service_role para no depender de RLS)
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !isAdminRole(profile.role)) {
    redirect("/admin?error=not_admin");
  }

  return <>{children}</>;
}
