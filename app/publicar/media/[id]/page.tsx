import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export default async function PublicarMediaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect(`/login?next=/publicar/media/${params.id}`);
  }

  const admin = createSupabaseAdminClient();

  // Verificamos que la propiedad exista y esté en revisión
  const { data: property } = await admin
    .from("properties")
    .select("id, title, status, created_by_user_id")
    .eq("id", params.id)
    .single();

  if (!property) {
    redirect("/publicar?error=propiedad_no_encontrada");
  }

  if (property.created_by_user_id !== user.id) {
    redirect("/publicar?error=not_allowed");
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px 90px" }}>
      <h1>Subir imágenes / videos</h1>

      <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
        Propiedad: <b>{property.title}</b>
      </div>

      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <form
          action={`/api/properties/${params.id}/media`}
          method="POST"
          encType="multipart/form-data"
          style={{ display: "grid", gap: 12 }}
        >
          <label style={{ fontWeight: 700 }}>
            Imágenes, videos o planos
          </label>

          <input
            type="file"
            name="media"
            multiple
            accept="image/*,video/*,.pdf"
            className="input"
          />

          <div className="small" style={{ opacity: 0.6 }}>
            Podés subir fotos, videos o planos (PDF).  
            El orden se puede ajustar luego.
          </div>

          <button className="btn btnPrimary">
            Subir archivos
          </button>
        </form>
      </section>
    </main>
  );
}
