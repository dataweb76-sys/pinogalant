import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export default async function ConsultarPropiedadPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createSupabaseAdminClient();

  // Propiedad
  const { data: property } = await admin
    .from("properties")
    .select("id,title")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!property) {
    return <h1>Propiedad no encontrada</h1>;
  }

  // Usuario autenticado
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) {
    redirect(`/login?next=/propiedades/${params.id}/consultar`);
  }

  // 🔑 PERFIL (ACA ESTÁ EL NOMBRE Y TELÉFONO)
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  async function submit(formData: FormData) {
    "use server";

    const admin = createSupabaseAdminClient();

    const message = String(formData.get("message") || "").trim();
    if (!message) return;

    const { error } = await admin.from("property_inquiries").insert({
      property_id: params.id,
      name: profile?.full_name ?? "Usuario",
      email: user.email,
      phone: profile?.phone ?? null,
      message,
      status: "pending",
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect("/gracias");
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px" }}>
      <h1>Consulta sobre la propiedad</h1>
      <p style={{ opacity: 0.7 }}>{property.title}</p>

      {/* INFO DEL USUARIO (SOLO LECTURA) */}
      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>
          {profile?.full_name || "Usuario"}
        </div>
        <div className="small" style={{ opacity: 0.7 }}>
          {user.email}
          {profile?.phone && <> · {profile.phone}</>}
        </div>
      </div>

      {/* FORMULARIO (SOLO MENSAJE) */}
      <form action={submit} className="card" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <textarea
            name="message"
            className="input"
            placeholder="Escribí tu consulta…"
            rows={5}
            required
          />

          <button className="btn btnPrimary">
            Enviar consulta
          </button>
        </div>
      </form>
    </main>
  );
}
