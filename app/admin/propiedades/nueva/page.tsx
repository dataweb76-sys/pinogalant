import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPropertyAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPERATIONS = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

const TYPES = [
  { value: "casa", label: "Casa" },
  { value: "depto", label: "Departamento" },
  { value: "terreno", label: "Terreno" },
  { value: "local", label: "Local comercial" },
  { value: "oficina", label: "Oficina" },
  { value: "campo", label: "Campo" },
];

const PURPOSES = [
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "industrial", label: "Industrial" },
];

export default async function NuevaPropiedadPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/propiedades/nueva");

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("id, role").eq("id", data.user.id).maybeSingle();
  const role = me.data?.role;
  if (role !== "admin" && role !== "super_admin") redirect("/admin?error=not_admin");

  const isSuperAdmin = role === "super_admin";

  const agents = isSuperAdmin
    ? ((await admin.from("profiles").select("id, full_name, email, role")
        .in("role", ["admin", "super_admin"])
        .order("full_name", { ascending: true })).data ?? [])
    : [];

  return (
    <div style={{ padding: "28px 24px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <a href="/admin/propiedades" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>
          ← Volver al listado
        </a>
        <h1 style={{ margin: "8px 0 4px", fontSize: 26, fontWeight: 900, color: "#2D3134" }}>
          Nueva propiedad
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
          Completá los datos básicos. Podés agregar fotos y más detalles después.
        </p>
      </div>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={createPropertyAction}>
        {/* Sección 1 – Clasificación */}
        <Section title="Clasificación" icon="🏷️">
          <Grid>
            <Field label="Operación *">
              <select className="input" name="operation" required>
                {OPERATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Tipo de propiedad *">
              <select className="input" name="type" required>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Propósito">
              <select className="input" name="purpose">
                {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </Grid>
        </Section>

        {/* Sección 2 – Información básica */}
        <Section title="Información básica" icon="📋">
          <Field label="Título *" hint="Ej: Casa 3 ambientes con jardín en Villa del Parque">
            <input className="input" name="title" required placeholder="Casa 3 ambientes con jardín..." />
          </Field>
          <Field label="Descripción">
            <textarea
              className="input"
              name="description"
              rows={5}
              placeholder="Describí la propiedad: características destacadas, estado, entorno..."
              style={{ resize: "vertical" }}
            />
          </Field>
        </Section>

        {/* Sección 3 – Ubicación */}
        <Section title="Ubicación" icon="📍">
          <Grid>
            <Field label="Ciudad *">
              <input className="input" name="city" required placeholder="Santa Rosa" />
            </Field>
            <Field label="Barrio">
              <input className="input" name="neighborhood" placeholder="Centro" />
            </Field>
            <Field label="Provincia">
              <input className="input" name="province" placeholder="La Pampa" />
            </Field>
          </Grid>
          <Grid>
            <Field label="Dirección" hint="Se puede ocultar al público">
              <input className="input" name="address" placeholder="Av. San Martín 1234" />
            </Field>
            <Field label="Mostrar dirección">
              <select className="input" name="address_hidden">
                <option value="0">Sí, mostrar dirección</option>
                <option value="1">No, ocultar dirección</option>
              </select>
            </Field>
          </Grid>
        </Section>

        {/* Sección 4 – Precios */}
        <Section title="Precios" icon="💰">
          <Grid>
            <Field label="Precio USD">
              <input className="input" name="price_usd" type="number" step="1" min="0" placeholder="0" />
            </Field>
            <Field label="Precio ARS">
              <input className="input" name="price_ars" type="number" step="1" min="0" placeholder="0" />
            </Field>
            <Field label="Expensas (ARS / mes)" hint="Solo para alquileres">
              <input className="input" name="expenses_ars" type="number" step="1" min="0" placeholder="0" />
            </Field>
          </Grid>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" name="show_both" value="1" defaultChecked />
              Mostrar precio en ambas monedas
            </label>
          </div>
        </Section>

        {/* Sección 5 – Características */}
        <Section title="Características" icon="🔧">
          <Grid cols={4}>
            <Field label="Habitaciones">
              <input className="input" name="rooms" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Baños">
              <input className="input" name="bathrooms" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="m² totales">
              <input className="input" name="total_m2" type="number" step="0.01" min="0" placeholder="0" />
            </Field>
            <Field label="m² cubiertos">
              <input className="input" name="area_m2" type="number" step="0.01" min="0" placeholder="0" />
            </Field>
            <Field label="Pisos del edificio">
              <input className="input" name="floors" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Piso (depto)">
              <input className="input" name="floor_number" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Antigüedad (años)">
              <input className="input" name="age_years" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Cochera">
              <select className="input" name="has_garage">
                <option value="0">No</option>
                <option value="1">Sí</option>
              </select>
            </Field>
          </Grid>

          <div style={{ marginTop: 14 }}>
            <label className="small" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
              Amenities
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["Pileta", "Gimnasio", "Quincho", "Laundry", "Seguridad 24hs", "Portero", "Jardín", "Terraza", "Ascensor", "Apto profesional"].map(a => (
                <label key={a} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", background: "#f8f5f2", padding: "6px 12px", borderRadius: 8, border: "1px solid #eee" }}>
                  <input type="checkbox" name="amenities" value={a.toLowerCase()} />
                  {a}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Sección 6 – Propietario */}
        <Section title="Datos del propietario" icon="👤">
          <Grid>
            <Field label="Nombre del propietario">
              <input className="input" name="owner_name" placeholder="Juan Pérez" />
            </Field>
            <Field label="Teléfono del propietario">
              <input className="input" name="owner_phone" placeholder="+54 9 ..." />
            </Field>
          </Grid>
        </Section>

        {/* Sección 7 – Agente (solo super_admin) */}
        {isSuperAdmin && (
          <Section title="Agente supervisor" icon="🧑‍💼">
            <Field label="Asignar agente" hint="Si no seleccionás ninguno, se asigna al admin que crea la propiedad">
              <select className="input" name="agent_id">
                <option value="">— Asignar a mí mismo —</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name || a.email} ({a.role === "super_admin" ? "Superadmin" : "Admin"})
                  </option>
                ))}
              </select>
            </Field>
          </Section>
        )}

        {/* Sección 8 – Publicación */}
        <Section title="Publicación" icon="📢">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" name="publish_now" value="1" />
              Publicar inmediatamente (visible al público)
            </label>
            <p className="small" style={{ margin: 0, color: "#999" }}>
              Si no la publicás ahora, quedará como borrador y podrás publicarla desde el listado.
            </p>
          </div>
        </Section>

        {/* Botones */}
        <div style={{ display: "flex", gap: 12, marginTop: 8, paddingBottom: 32 }}>
          <button
            type="submit"
            style={{
              background: "#2D3134", color: "#fff", border: "none",
              borderRadius: 12, padding: "14px 32px", fontWeight: 800,
              fontSize: 15, cursor: "pointer",
            }}
          >
            Crear propiedad →
          </button>
          <a
            href="/admin/propiedades"
            style={{
              background: "#f4f4f5", color: "#555", border: "none",
              borderRadius: 12, padding: "14px 24px", fontWeight: 700,
              fontSize: 15, textDecoration: "none", display: "flex", alignItems: "center",
            }}
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}

/* ── helpers de layout ── */

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #eee",
      padding: "20px 22px", marginBottom: 16,
    }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#2D3134", display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>{hint}</p>}
    </div>
  );
}

function Grid({ cols = 3, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14, marginBottom: 14 }}>
      {children}
    </div>
  );
}
