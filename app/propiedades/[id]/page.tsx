import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const admin = createSupabaseAdminClient();

  const { data: p } = await admin
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!p) return <h1>Propiedad no encontrada</h1>;

  const { data: media } = await admin
    .from("property_media")
    .select("url, kind, sort_order")
    .eq("property_id", p.id)
    .order("sort_order", { ascending: true });

  const images = (media || []).filter((m) => m.kind === "image");

  return (
    <div>
      {/* Galería */}
      <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
        {images[0] && (
          <img
            src={images[0].url}
            style={{ width: "100%", height: 400, objectFit: "cover" }}
          />
        )}
        <div style={{ display: "grid", gap: 8 }}>
          {images.slice(1, 3).map((img) => (
            <img
              key={img.url}
              src={img.url}
              style={{ width: "100%", height: 196, objectFit: "cover" }}
            />
          ))}
        </div>
      </section>

      <section style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        <h1>{p.title}</h1>
        <p>
          {p.neighborhood} · {p.city}
        </p>

        <h2>
          {p.price_usd
            ? `USD ${p.price_usd}`
            : p.price_ars
            ? `$ ${p.price_ars}`
            : "Consultar"}
        </h2>

        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <a
            className="btn btnPrimary"
            href={`https://wa.me/?text=Me interesa ${p.title}`}
          >
            Contactar por WhatsApp
          </a>

          {/* ESTE BOTÓN YA EXISTÍA LÓGICAMENTE, SOLO APUNTA */}
          <a href="#consulta" className="btn">
            Dejar consulta
          </a>
        </div>

        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <Stat label="Habitaciones" value={p.rooms} />
          <Stat label="Baños" value={p.bathrooms} />
          <Stat label="m²" value={p.area_m2} />
          <Stat label="Cochera" value={p.has_garage ? "Sí" : "No"} />
        </div>

        <section style={{ marginTop: 32 }}>
          <h3>Descripción</h3>
          <p>{p.description}</p>
        </section>

        {p.lat && p.lng && (
          <section style={{ marginTop: 32 }}>
            <h3>Ubicación</h3>
            <iframe
              width="100%"
              height="300"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${p.lat},${p.lng}&z=15&output=embed`}
            />
          </section>
        )}

        {/* ===================== CONSULTA (AGREGADO) ===================== */}
        <section
          id="consulta"
          style={{
            marginTop: 64,
            padding: 32,
            borderRadius: 16,
            border: "1px solid #eee",
            maxWidth: 720,
          }}
        >
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
            Consultar por esta propiedad
          </h3>

          <form
            action={async (formData) => {
              "use server";
              const supabase = await createSupabaseServerClient();

              const name = String(formData.get("name") || "");
              const email = String(formData.get("email") || "");
              const phone = String(formData.get("phone") || "");
              const message = String(formData.get("message") || "");

              if (!name || !email || !message) return;

              await supabase.from("property_inquiries").insert({
                property_id: p.id,
                name,
                email,
                phone,
                message,
                status: "nuevo",
              });
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <input name="name" placeholder="Nombre" required className="input" />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="input"
            />
            <input
              name="phone"
              placeholder="Teléfono (opcional)"
              className="input"
            />
            <textarea
              name="message"
              placeholder="Mensaje"
              rows={4}
              required
              className="input"
            />
            <button type="submit" className="btn btnPrimary">
              Enviar consulta
            </button>
          </form>
        </section>
        {/* =============================================================== */}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value ?? "-"}</div>
      <div className="small">{label}</div>
    </div>
  );
}
