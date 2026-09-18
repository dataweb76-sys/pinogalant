import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateRentalPropertyAction } from "../../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditarRentalPropertyPage({
  params, searchParams,
}: { params: { id: string }; searchParams?: { error?: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(me.data?.role ?? "")) redirect("/admin");

  const { data: prop } = await admin.from("rental_properties").select("*").eq("id", params.id).maybeSingle();
  if (!prop) redirect("/admin/alquileres/propiedades?error=No+encontrado");

  return (
    <div style={{ padding: "28px 24px", maxWidth: 900 }}>
      <a href="/admin/alquileres/propiedades" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>← Propiedades</a>
      <h1 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 900, color: "#2D3134" }}>Editar Propiedad</h1>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#888" }}>{prop.title} — {prop.address}</p>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 20 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={updateRentalPropertyAction} style={{ display: "grid", gap: 16 }}>
        <input type="hidden" name="id" value={params.id} />

        <Sec title="🏠 Datos del inmueble">
          <Grid>
            <Field label="Descripción / Título *">
              <input className="input" name="title" required defaultValue={prop.title} />
            </Field>
            <Field label="Tipo">
              <select className="input" name="type" defaultValue={prop.type}>
                {[["casa","Casa"],["departamento","Departamento"],["local","Local comercial"],
                  ["oficina","Oficina"],["quinta","Quinta"],["campo","Campo/Chacra"],
                  ["cochera","Cochera"],["galpon","Galpón"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
          </Grid>
          <Grid>
            <Field label="Dirección *">
              <input className="input" name="address" required defaultValue={prop.address} />
            </Field>
            <Field label="Ciudad">
              <input className="input" name="city" defaultValue={prop.city} />
            </Field>
            <Field label="Provincia">
              <input className="input" name="province" defaultValue={prop.province} />
            </Field>
          </Grid>
          <Grid>
            <Field label="Ambientes">
              <input className="input" type="number" name="rooms" defaultValue={prop.rooms ?? ""} />
            </Field>
            <Field label="Baños">
              <input className="input" type="number" name="bathrooms" defaultValue={prop.bathrooms ?? ""} />
            </Field>
            <Field label="Superficie m²">
              <input className="input" type="number" name="area_m2" defaultValue={prop.area_m2 ?? ""} step="0.5" />
            </Field>
          </Grid>
          <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
            {[["has_garage","Tiene garage"],["furnished","Amoblada"]].map(([n,l]) => (
              <label key={n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" name={n} value="1" defaultChecked={!!(prop as any)[n]} style={{ accentColor: "#2D3134", width: 16, height: 16 }} />
                {l}
              </label>
            ))}
          </div>
          <Grid>
            <Field label="Estado">
              <select className="input" name="status" defaultValue={prop.status}>
                <option value="available">Disponible</option>
                <option value="rented">Alquilada</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="unavailable">No disponible</option>
              </select>
            </Field>
          </Grid>
          <Field label="Descripción">
            <textarea className="input" name="description" rows={3} defaultValue={prop.description ?? ""} style={{ resize: "vertical" }} />
          </Field>
        </Sec>

        <Sec title="💰 Precios">
          <Grid>
            <Field label="Alquiler mensual (ARS)">
              <input className="input" type="number" name="rent_ars" defaultValue={prop.rent_ars ?? ""} step="100" />
            </Field>
            <Field label="Expensas (ARS/mes)">
              <input className="input" type="number" name="expenses_ars" defaultValue={prop.expenses_ars ?? 0} step="100" />
            </Field>
            <Field label="Meses de depósito">
              <select className="input" name="deposit_months" defaultValue={prop.deposit_months ?? 1}>
                <option value="1">1 mes</option>
                <option value="2">2 meses</option>
                <option value="3">3 meses</option>
              </select>
            </Field>
          </Grid>
          <Grid>
            <Field label="Comisión inmobiliaria (%)">
              <input className="input" type="number" name="commission_pct" defaultValue={prop.commission_pct ?? 5} step="0.5" />
            </Field>
          </Grid>
        </Sec>

        <Sec title="👤 Datos del propietario">
          <Grid>
            <Field label="Nombre completo">
              <input className="input" name="owner_name" defaultValue={prop.owner_name ?? ""} />
            </Field>
            <Field label="DNI">
              <input className="input" name="owner_dni" defaultValue={prop.owner_dni ?? ""} />
            </Field>
          </Grid>
          <Grid>
            <Field label="Teléfono">
              <input className="input" name="owner_phone" defaultValue={prop.owner_phone ?? ""} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" name="owner_email" defaultValue={prop.owner_email ?? ""} />
            </Field>
          </Grid>
          <Grid>
            <Field label="CBU">
              <input className="input" name="owner_cbu" defaultValue={prop.owner_cbu ?? ""} maxLength={22} />
            </Field>
            <Field label="Alias CBU">
              <input className="input" name="owner_alias" defaultValue={prop.owner_alias ?? ""} />
            </Field>
          </Grid>
        </Sec>

        <Sec title="📝 Notas internas">
          <Field label="Notas">
            <textarea className="input" name="notes" rows={2} defaultValue={prop.notes ?? ""} style={{ resize: "vertical" }} />
          </Field>
        </Sec>

        <button type="submit" style={{
          background: "#2D3134", color: "#fff", border: "none", borderRadius: 14,
          padding: "15px 0", width: "100%", fontWeight: 900, fontSize: 16, cursor: "pointer",
        }}>
          Guardar cambios →
        </button>
      </form>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "20px 22px" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#2D3134", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>{children}</div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>{hint}</p>}
    </div>
  );
}
