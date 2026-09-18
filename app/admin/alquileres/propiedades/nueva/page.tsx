import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRentalPropertyAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NuevaRentalPropertyPage({
  searchParams,
}: { searchParams?: { error?: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(me.data?.role ?? "")) redirect("/admin");

  return (
    <div style={{ padding: "28px 24px", maxWidth: 900 }}>
      <a href="/admin/alquileres/propiedades" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>← Propiedades</a>
      <h1 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 900, color: "#2D3134" }}>Nueva Propiedad para Alquilar</h1>
      <p style={{ margin: "0 0 24px", fontSize: 14, color: "#888" }}>Datos del inmueble y del propietario.</p>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 20 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={createRentalPropertyAction} style={{ display: "grid", gap: 16 }}>

        <Sec title="🏠 Datos del inmueble">
          <Grid>
            <Field label="Descripción / Título *">
              <input className="input" name="title" required placeholder="Ej: Casa 3 amb. con garage, Pellegrini 450" />
            </Field>
            <Field label="Tipo">
              <select className="input" name="type" defaultValue="casa">
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
              <input className="input" name="address" required placeholder="Calle y número" />
            </Field>
            <Field label="Ciudad">
              <input className="input" name="city" defaultValue="General Pico" />
            </Field>
            <Field label="Provincia">
              <input className="input" name="province" defaultValue="La Pampa" />
            </Field>
          </Grid>
          <Grid>
            <Field label="Ambientes">
              <input className="input" type="number" name="rooms" min="0" max="20" placeholder="3" />
            </Field>
            <Field label="Baños">
              <input className="input" type="number" name="bathrooms" min="0" max="10" placeholder="1" />
            </Field>
            <Field label="Superficie m²">
              <input className="input" type="number" name="area_m2" min="0" step="0.5" placeholder="80" />
            </Field>
          </Grid>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { name: "has_garage", label: "Tiene garage/cochera" },
              { name: "furnished",  label: "Amoblada" },
            ].map(f => (
              <label key={f.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" name={f.name} value="1" style={{ accentColor: "#2D3134", width: 16, height: 16 }} />
                {f.label}
              </label>
            ))}
          </div>
          <Field label="Descripción (para anuncio)">
            <textarea className="input" name="description" rows={3} placeholder="Descripción del inmueble para publicar..." style={{ resize: "vertical" }} />
          </Field>
        </Sec>

        <Sec title="💰 Precios">
          <Grid>
            <Field label="Alquiler mensual (ARS) *">
              <input className="input" type="number" name="rent_ars" required min="0" step="100" placeholder="0" />
            </Field>
            <Field label="Expensas (ARS/mes)">
              <input className="input" type="number" name="expenses_ars" defaultValue="0" min="0" step="100" />
            </Field>
            <Field label="Meses de depósito">
              <select className="input" name="deposit_months" defaultValue="1">
                <option value="1">1 mes (Ley 27.551)</option>
                <option value="2">2 meses</option>
                <option value="3">3 meses</option>
              </select>
            </Field>
          </Grid>
          <Grid>
            <Field label="Comisión inmobiliaria (%)">
              <input className="input" type="number" name="commission_pct" defaultValue="5" min="0" max="20" step="0.5" />
            </Field>
          </Grid>
        </Sec>

        <Sec title="👤 Datos del propietario">
          <Grid>
            <Field label="Nombre completo *">
              <input className="input" name="owner_name" required placeholder="Juan Pérez" />
            </Field>
            <Field label="DNI">
              <input className="input" name="owner_dni" placeholder="20.123.456" />
            </Field>
          </Grid>
          <Grid>
            <Field label="Teléfono">
              <input className="input" name="owner_phone" placeholder="02302-XXXXXX" />
            </Field>
            <Field label="Email">
              <input className="input" type="email" name="owner_email" placeholder="propietario@email.com" />
            </Field>
          </Grid>
          <Grid>
            <Field label="CBU (para liquidaciones)" hint="Para transferir el alquiler al propietario">
              <input className="input" name="owner_cbu" placeholder="0000000000000000000000" maxLength={22} />
            </Field>
            <Field label="Alias CBU">
              <input className="input" name="owner_alias" placeholder="PROPIETARIO.ALIAS" />
            </Field>
          </Grid>
        </Sec>

        <Sec title="📝 Notas internas">
          <Field label="Notas (solo visibles en admin)">
            <textarea className="input" name="notes" rows={2} placeholder="Información interna sobre la propiedad..." style={{ resize: "vertical" }} />
          </Field>
        </Sec>

        <button type="submit" style={{
          background: "#2D3134", color: "#fff", border: "none", borderRadius: 14,
          padding: "15px 0", width: "100%", fontWeight: 900, fontSize: 16, cursor: "pointer",
        }}>
          Guardar propiedad →
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
