"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/usuarios");

  const admin = createSupabaseAdminClient();
  const prof = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!prof.data || prof.data.role !== "super_admin") {
    redirect("/admin?error=not_super_admin");
  }

  return { userId: data.user.id, admin };
}

export async function updateUserRoleAction(formData: FormData) {
  const { admin } = await requireSuperAdmin();

  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "");

  if (!userId) redirect("/admin/usuarios?error=missing_user_id");
  if (!["owner", "admin", "super_admin"].includes(role)) {
    redirect("/admin/usuarios?error=invalid_role");
  }

  const { error } = await admin
    .from("profiles")
    .upsert(
      { id: userId, role },
      { onConflict: "id" }
    );

  if (error) redirect(`/admin/usuarios?error=${encodeURIComponent(error.message)}`);

  redirect("/admin/usuarios?ok=role_updated");
}

export async function createAgentAction(formData: FormData) {
  const { admin } = await requireSuperAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!email) redirect("/admin/usuarios?error=missing_email");
  if (!password || password.length < 8) redirect("/admin/usuarios?error=password_min_8");

  // Crea usuario en Auth
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // así puede loguear sin confirmar (ideal para admin interno)
  });

  if (created.error) redirect(`/admin/usuarios?error=${encodeURIComponent(created.error.message)}`);
  const newUserId = created.data.user?.id;
  if (!newUserId) redirect("/admin/usuarios?error=user_not_created");

  // Crea/actualiza profile
  const { error: profErr } = await admin.from("profiles").upsert(
    {
      id: newUserId,
      role: "admin",
      full_name: null,
    },
    { onConflict: "id" }
  );

  if (profErr) redirect(`/admin/usuarios?error=${encodeURIComponent(profErr.message)}`);

  redirect("/admin/usuarios?ok=agent_created");
}
