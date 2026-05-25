import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createContractAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NuevoContratoPage({ searchParams }: { searchParams?: { error?: string; property_id?: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/alquileres/nuevo");

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin","super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");

  // Propiedades disponibles para alquiler
  const { data: properties } = await admin
    .from("properties")
    .select("id, title, city, address, operation")
    .eq("operation", "alquiler")
    .order("created_at", { ascending: false });

  // Usuarios con rol owner (potenciales inquilinos)
  const { data: tenants } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .order("full_name");

  const today = new Date().toISOString().split("T")[0];
  const preselectedProperty = searchParams?.property_id ?? "";

  return (
    <div style={{ padding: "28px 24px", maxWidth: 920 }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/alquileres" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>← Volver a alquileres</a>
        <h1 style={{ margin: "8px 0 4px", fontSize: 26, fontWeight: 900, color: "#2D3134" }}>Nuevo Contrato de Alquiler</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>Completá todos los datos. Se generarán las cuotas automáticamente.</p>
      </div>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={createContractAction}>
        {/* Propiedad e Inquilino */}
        <Sec title="🏠 Propiedad e Inquilino">
          <Grid>
            <Field label="Propiedad *">
              <select className="input" name="property_id" required>
                <option value="">— Seleccioná una propiedad —</option>
                {(properties ?? []).map((p: any) => (
                  <option key={p.id} value={p.id} selected={p.id === preselectedProperty}>
                    {p.title} — {p.city}
                  </option>
                ))}
              </select>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>Solo se muestran propiedades con operación "alquiler"</p>
            </Field>
            <Field label="Inquilino *">
              <select className="input" name="tenant_id" required>
                <option value="">— Seleccioná el inquilino —</option>
                {(tenants ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.email} ({t.phone || t.role})
                  </option>
                ))}
              </select>
            </Field>
          </Grid>
        </Sec>

        {/* Período */}
        <Sec title="📅 Período del contrato">
          <Grid>
            <Field label="Fecha de inicio *">
              <input className="input" type="date" name="start_date" defaultValue={today} required />
            </Field>
            <Field label="Duración (meses) *">
              <select className="input" name="duration_months" defaultValue="24">
                <option value="6">6 meses</option>
                <option value="12">12 meses (1 año)</option>
                <option value="18">18 meses</option>
                <option value="24">24 meses (2 años) ✓</option>
                <option value="36">36 meses (3 años)</option>
                <option value="48">48 meses (4 años)</option>
              </select>
            </Field>
            <Field label="Día de vencimiento de cuota">
              <select className="input" name="payment_due_day" defaultValue="5">
                {[1,5,10,15,20,25].map(d => <option key={d} value={d}>Día {d} de cada mes</option>)}
              </select>
            </Field>
          </Grid>
          <Grid>
            <Field label="Días de gracia" hint="Días extra tras el vencimiento sin recargo">
              <input className="input" type="number" name="grace_period_days" defaultValue="3" min="0" max="15" />
            </Field>
          </Grid>
        </Sec>

        {/* Precios */}
        <Sec title="💰 Condiciones económicas">
          <Grid>
            <Field label="Alquiler mensual (ARS) *">
              <input className="input" type="number" name="monthly_rent_ars" required min="0" step="100" placeholder="0" />
            </Field>
            <Field label="Alquiler mensual (USD)" hint="Opcional — referencial">
              <input className="input" type="number" name="monthly_rent_usd" min="0" step="1" placeholder="0" />
            </Field>
            <Field label="Expensas (ARS/mes)">
              <input className="input" type="number" name="expenses_ars" defaultValue="0" min="0" step="100" />
            </Field>
          </Grid>
          <Grid>
            <Field label="Meses de depósito">
              <select className="input" name="deposit_months" defaultValue="1">
                <option value="1">1 mes (estándar ley 27.551)</option>
                <option value="2">2 meses</option>
                <option value="3">3 meses</option>
              </select>
            </Field>
          </Grid>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>¿Qué incluye el precio?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { name: "taxes_included",       label: "Impuestos municipales" },
                { name: "water_included",        label: "Servicio de agua" },
                { name: "gas_included",          label: "Servicio de gas" },
                { name: "electricity_included",  label: "Servicio de electricidad" },
              ].map(f => (
                <label key={f.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" name={f.name} value="1" style={{ accentColor: "#15803d" }} /> {f.label}
                </label>
              ))}
            </div>
          </div>
        </Sec>

        {/* Ajuste de precio */}
        <Sec title="📈 Ajuste de precio">
          <Grid>
            <Field label="Porcentaje de aumento (%)" hint="Ej: 30 = 30% cada N meses">
              <input className="input" type="number" name="price_increase_pct" defaultValue="30" min="0" max="200" step="0.5" />
            </Field>
            <Field label="Ajuste cada (meses)">
              <select className="input" name="price_increase_months" defaultValue="4">
                <option value="1">Mensual</option>
                <option value="3">Trimestral</option>
                <option value="4">Cuatrimestral (ICL)</option>
                <option value="6">Semestral</option>
                <option value="12">Anual</option>
              </select>
            </Field>
          </Grid>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, fontSize: 12, color: "#92400e" }}>
            💡 Ley 27.551: el ajuste de precio se realiza como mínimo cada 4 meses según el ICL del BCRA. Podés usar un % fijo acordado entre partes o el índice oficial.
          </div>
        </Sec>

        {/* Cláusulas adicionales */}
        <Sec title="📝 Cláusulas adicionales">
          <Field label="Cláusulas específicas para este contrato" hint="Se agregarán al cuerpo del contrato estándar">
            <textarea className="input" name="additional_clauses" rows={5}
              placeholder="Ej: El locatario podrá tener una mascota pequeña (hasta 5 kg) previa notificación al locador..."
              style={{ resize: "vertical" }}
            />
          </Field>
          <Field label="Notas internas (no aparecen en el contrato)">
            <textarea className="input" name="internal_notes" rows={3} style={{ resize: "vertical" }} />
          </Field>
        </Sec>

        <button type="submit" style={{
          background: "#2D3134", color: "#fff", border: "none", borderRadius: 14,
          padding: "16px 0", width: "100%", fontWeight: 900, fontSize: 17, cursor: "pointer",
        }}>
          Crear contrato y generar cuotas →
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 8 }}>
          Se generarán todas las cuotas automáticamente. Podrás enviar el contrato al inquilino para su firma.
        </p>
      </form>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "20px 22px", marginBottom: 16 }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#2D3134", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14, marginBottom: 14 }}>{children}</div>;
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
