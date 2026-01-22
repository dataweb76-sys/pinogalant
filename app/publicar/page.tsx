import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicarPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/publicar");
  }

  // ===============================
  // SERVER ACTION: CREAR PROPIEDAD
  // ===============================
  async function submit(formData: FormData) {
    "use server";

    const supabase = await createSupabaseActionClient();

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      redirect("/login?next=/publicar");
    }

    const title = String(formData.get("title") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const price = String(formData.get("price") || "").trim();
    const currency = String(formData.get("currency") || "ars");

    if (!title || !city || !price) {
      return;
    }

    const price_ars = currency === "ars" ? price : null;
    const price_usd = currency === "usd" ? price : null;

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        title,
        city,
        address,
        description,
        price_ars,
        price_usd,
        status: "en_revision",
        is_published: false,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // 👉 en el próximo paso vamos a subir media acá
    redirect(`/publicar/media/${property.id}`);
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px 90px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, letterSpacing: -0.6 }}>
            Publicar propiedad
          </h1>
          <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
            Tu publicación queda en revisión hasta que un agente la apruebe.
          </div>
        </div>

        <Link className="btn" href="/">
          Volver
        </Link>
      </div>

      {/* INFO USUARIO */}
      <section className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>Datos del usuario</div>
        <div className="small" style={{ opacity: 0.7, marginTop: 6 }}>
          Estás publicando como:
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          <b>{user.email}</b>
        </div>
      </section>

      {/* FORMULARIO */}
      <form
        action={submit}
        className="card"
        style={{ padding: 20, marginTop: 16 }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <input
            className="input"
            name="title"
            placeholder="Título de la propiedad"
            required
          />

          <input
            className="input"
            name="city"
            placeholder="Ciudad"
            required
          />

          <input
            className="input"
            name="address"
            placeholder="Dirección"
          />

          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              name="price"
              placeholder="Precio"
              required
              style={{ flex: 1 }}
            />

            <select
              className="input"
              name="currency"
              defaultValue="ars"
              style={{ width: 140 }}
            >
              <option value="ars">ARS</option>
              <option value="usd">USD</option>
            </select>
          </div>

          <textarea
            className="input"
            name="description"
            rows={5}
            placeholder="Descripción de la propiedad…"
          />

          {/* MEDIA (solo selección, sin upload aún) */}
          <label style={{ fontWeight: 700 }}>
            Imágenes, videos o planos
          </label>

          <input
            type="file"
            name="media"
            multiple
            accept="image/*,video/*,.pdf"
            className="input"
            disabled
          />

          <div className="small" style={{ opacity: 0.6 }}>
            La carga de archivos se realiza en el siguiente paso.
          </div>

          <button className="btn btnPrimary">
            Enviar publicación
          </button>
        </div>
      </form>
    </main>
  );
}
