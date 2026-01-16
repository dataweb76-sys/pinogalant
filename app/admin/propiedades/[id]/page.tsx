import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updatePropertyAction } from "./actions";
import MediaUploader from "./media-client";
import MediaManager from "./media-manager.client";

export const runtime = "nodejs";

export default async function PropertyEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { ok?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/admin/propiedades/${params.id}`);

  const admin = createSupabaseAdminClient();

  const me = await admin.from("profiles").select("id, role").eq("id", data.user.id).maybeSingle();
  const role = me.data?.role;
  if (role !== "admin" && role !== "super_admin") redirect("/admin?error=not_admin");

  const propRes = await admin.from("properties").select("*").eq("id", params.id).maybeSingle();
  if (!propRes.data) redirect("/admin/propiedades?error=not_found");

  if (role !== "super_admin" && propRes.data.agent_id !== data.user.id) {
    redirect("/admin/propiedades?error=not_allowed");
  }

  const p = propRes.data;

  const mediaRes = await admin
    .from("property_media")
    .select("id, kind, url, sort_order, created_at")
    .eq("property_id", params.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const media = (mediaRes.data ?? []).map((m) => ({
    id: m.id as string,
    kind: m.kind as "image" | "video" | "plan",
    url: m.url as string,
    sort_order: (m.sort_order ?? 0) as number,
  }));

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Editar propiedad</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link className="btn" href="/admin/propiedades">← Volver</Link>
          <Link className="btn" href="/admin">Panel</Link>
        </div>
      </div>

      {searchParams?.error ? <p className="small" style={{ color: "crimson" }}>❌ {searchParams.error}</p> : null}
      {searchParams?.ok ? <p className="small" style={{ color: "green" }}>✅ {searchParams.ok}</p> : null}

      <section className="card" style={{ padding: 16 }}>
        <form action={updatePropertyAction} style={{ display: "grid", gap: 12, maxWidth: 920 }}>
          <input type="hidden" name="id" value={p.id} />

          <div>
            <label className="small">Título</label>
            <input className="input" name="title" defaultValue={p.title ?? ""} required />
          </div>

          <div>
            <label className="small">Descripción</label>
            <textarea className="input" name="description" defaultValue={p.description ?? ""} rows={5} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Ciudad</label>
              <input className="input" name="city" defaultValue={p.city ?? ""} />
            </div>
            <div>
              <label className="small">Barrio</label>
              <input className="input" name="neighborhood" defaultValue={p.neighborhood ?? ""} />
            </div>
            <div>
              <label className="small">Dirección</label>
              <input className="input" name="address" defaultValue={p.address ?? ""} />
            </div>
            <div>
              <label className="small">Calidad zona (1-10)</label>
              <input className="input" name="zone_quality" inputMode="numeric" defaultValue={p.zone_quality ?? ""} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Precio ARS</label>
              <input className="input" name="price_ars" inputMode="decimal" defaultValue={p.price_ars ?? ""} />
            </div>
            <div>
              <label className="small">Precio USD</label>
              <input className="input" name="price_usd" inputMode="decimal" defaultValue={p.price_usd ?? ""} />
            </div>
            <div>
              <label className="small">Pide propietario (ARS)</label>
              <input className="input" name="owner_ask_ars" inputMode="decimal" defaultValue={p.owner_ask_ars ?? ""} />
            </div>
            <div>
              <label className="small">Pide propietario (USD)</label>
              <input className="input" name="owner_ask_usd" inputMode="decimal" defaultValue={p.owner_ask_usd ?? ""} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Tasación (ARS)</label>
              <input className="input" name="appraisal_ars" inputMode="decimal" defaultValue={p.appraisal_ars ?? ""} />
            </div>
            <div>
              <label className="small">Tasación (USD)</label>
              <input className="input" name="appraisal_usd" inputMode="decimal" defaultValue={p.appraisal_usd ?? ""} />
            </div>
            <div>
              <label className="small">Habitaciones</label>
              <input className="input" name="rooms" inputMode="numeric" defaultValue={p.rooms ?? ""} />
            </div>
            <div>
              <label className="small">Baños</label>
              <input className="input" name="bathrooms" inputMode="numeric" defaultValue={p.bathrooms ?? ""} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Metros (m2)</label>
              <input className="input" name="area_m2" inputMode="decimal" defaultValue={p.area_m2 ?? ""} />
            </div>
            <div>
              <label className="small">Pisos</label>
              <input className="input" name="floors" inputMode="numeric" defaultValue={p.floors ?? ""} />
            </div>
            <div>
              <label className="small">Cochera</label>
              <select className="input" name="has_garage" defaultValue={p.has_garage ? "1" : "0"}>
                <option value="0">No</option>
                <option value="1">Sí</option>
              </select>
            </div>
            <div>
              <label className="small">Lat</label>
              <input className="input" name="lat" inputMode="decimal" defaultValue={p.lat ?? ""} />
            </div>
            <div>
              <label className="small">Lng</label>
              <input className="input" name="lng" inputMode="decimal" defaultValue={p.lng ?? ""} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Propietario (titular)</label>
              <input className="input" name="owner_name" defaultValue={p.owner_name ?? ""} />
            </div>
            <div>
              <label className="small">Teléfono propietario</label>
              <input className="input" name="owner_phone" defaultValue={p.owner_phone ?? ""} />
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Contacto del propietario</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <label className="small">¿Vive en la propiedad?</label>
                <select className="input" name="owner_lives_there" defaultValue={p.owner_lives_there ? "1" : "0"}>
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div>
                <label className="small">Contacto (nombre)</label>
                <input className="input" name="owner_contact_name" defaultValue={p.owner_contact_name ?? ""} />
              </div>
              <div>
                <label className="small">Contacto (teléfono)</label>
                <input className="input" name="owner_contact_phone" defaultValue={p.owner_contact_phone ?? ""} />
              </div>
              <div>
                <label className="small">Contacto (email)</label>
                <input className="input" name="owner_contact_email" defaultValue={p.owner_contact_email ?? ""} />
              </div>
            </div>
          </div>

          <div>
            <label className="small">Observaciones internas</label>
            <textarea className="input" name="observations" defaultValue={p.observations ?? ""} rows={4} />
          </div>

          <button className="btn btnPrimary" type="submit">Guardar cambios</button>
        </form>
      </section>

      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Multimedia</h2>

        <MediaUploader propertyId={params.id} />

        <div style={{ marginTop: 16 }}>
          <MediaManager propertyId={params.id} media={media} />
        </div>
      </section>
    </div>
  );
}
