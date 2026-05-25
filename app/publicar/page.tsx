import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { submitPropertyAction } from "./actions";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const revalidate = 0;

/* ────────────────────────────────────────
   Tipos de propiedad con su ícono
──────────────────────────────────────── */
const PROPERTY_TYPES = [
  { value: "casa",       label: "Casa",                  icon: "🏠" },
  { value: "depto",      label: "Departamento",           icon: "🏢" },
  { value: "ph",         label: "PH (Planta Alta)",       icon: "🏘️" },
  { value: "casaquinta", label: "Casa Quinta / Chalet",   icon: "🌳" },
  { value: "terreno",    label: "Terreno / Lote",         icon: "📐" },
  { value: "local",      label: "Local Comercial",        icon: "🏪" },
  { value: "oficina",    label: "Oficina",                icon: "🏛️" },
  { value: "cochera",    label: "Cochera / Garage",       icon: "🚗" },
  { value: "galpon",     label: "Galpón / Depósito",      icon: "🏭" },
  { value: "campo",      label: "Campo / Chacra",         icon: "🌾" },
  { value: "estancia",   label: "Estancia / Establecim.", icon: "🐄" },
];

const OPERATIONS = [
  { value: "venta",    label: "Venta",    desc: "Transferencia definitiva" },
  { value: "alquiler", label: "Alquiler", desc: "Arrendamiento mensual"    },
];

const ORIENTACIONES = ["Norte", "Sur", "Este", "Oeste", "Noreste", "Noroeste", "Sureste", "Suroeste"];

const ESTADOS_CONSERVACION = [
  { value: "a_estrenar",     label: "A estrenar" },
  { value: "muy_bueno",      label: "Muy bueno" },
  { value: "bueno",          label: "Bueno" },
  { value: "a_refaccionar",  label: "A refaccionar" },
];

const AMENITIES = [
  { value: "pileta",           label: "Pileta / Piscina", icon: "🏊" },
  { value: "gimnasio",         label: "Gimnasio",          icon: "💪" },
  { value: "quincho",          label: "Quincho / Asador",  icon: "🔥" },
  { value: "laundry",          label: "Laundry",            icon: "👕" },
  { value: "seguridad_24hs",   label: "Seguridad 24hs",    icon: "🔒" },
  { value: "portero",          label: "Portero / Conserje", icon: "👨‍💼" },
  { value: "jardin",           label: "Jardín",             icon: "🌿" },
  { value: "terraza",          label: "Terraza",            icon: "🏗️" },
  { value: "ascensor",         label: "Ascensor",           icon: "⬆️" },
  { value: "apto_profesional", label: "Apto Profesional",   icon: "💼" },
  { value: "sum",              label: "SUM",                 icon: "🎉" },
  { value: "solarium",         label: "Solarium",            icon: "☀️" },
  { value: "baulera",          label: "Baulera",             icon: "📦" },
  { value: "lavadero",         label: "Lavadero",            icon: "🚿" },
  { value: "calefaccion",      label: "Calefacción central", icon: "🌡️" },
  { value: "airecentral",      label: "Aire acondicionado",  icon: "❄️" },
  { value: "alarma",           label: "Alarma",              icon: "🚨" },
  { value: "vidriera",         label: "Vidriera (comercial)", icon: "🪟" },
];

/* ────────────────────────────────────────
   Helpers de estilo
──────────────────────────────────────── */
const S = {
  section: {
    background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8",
    padding: "22px 24px", marginBottom: 18,
  } as React.CSSProperties,
  sectionTitle: {
    margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: "#2D3134",
    display: "flex", alignItems: "center", gap: 8, paddingBottom: 12,
    borderBottom: "1px solid #f0f0f0",
  } as React.CSSProperties,
  label: {
    display: "block", fontSize: 11, fontWeight: 700, color: "#777",
    marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: 0.5,
  },
  hint: { margin: "4px 0 0", fontSize: 11, color: "#bbb" } as React.CSSProperties,
};

function Lbl({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={S.label}>{children}</label>
      {hint && <p style={S.hint}>{hint}</p>}
    </div>
  );
}

function Grid({ cols = 3, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Field({ label, hint, children, col }: { label: string; hint?: string; children: React.ReactNode; col?: string }) {
  return (
    <div style={col ? { gridColumn: col } : {}}>
      <label style={S.label}>{label}</label>
      {children}
      {hint && <p style={S.hint}>{hint}</p>}
    </div>
  );
}

/* ────────────────────────────────────────
   PAGE
──────────────────────────────────────── */
export default async function PublicarPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/publicar");

  const user = data.user;
  const admin = createSupabaseAdminClient();

  // Datos del perfil del usuario
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  // Lista de agentes registrados para el dropdown
  const { data: agents } = await admin
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .in("role", ["admin", "super_admin"])
    .order("full_name", { ascending: true });

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px 80px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <a href="/" style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>
          ← Volver al inicio
        </a>
        <h1 style={{ margin: "8px 0 4px", fontSize: 28, fontWeight: 900, color: "#2D3134", letterSpacing: -0.5 }}>
          Publicar propiedad
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
          Completá el formulario con el máximo detalle. Tu publicación queda en revisión hasta que un agente la apruebe.
        </p>
      </div>

      {/* Alertas */}
      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}
      {searchParams?.ok && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          ✅ {decodeURIComponent(searchParams.ok)}
        </div>
      )}

      <form action={submitPropertyAction} style={{ display: "grid", gap: 0 }}>

        {/* ── 1. OPERACIÓN ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}>
            <span>🔄</span> Tipo de operación
          </h2>
          <div style={{ display: "flex", gap: 12 }}>
            {OPERATIONS.map(op => (
              <label key={op.value} style={{ flex: 1, cursor: "pointer" }}>
                <input type="radio" name="operation" value={op.value} defaultChecked={op.value === "venta"} style={{ display: "none" }} className="op-radio" />
                <div style={{
                  border: "2px solid #e5e7eb", borderRadius: 14, padding: "14px 18px",
                  textAlign: "center", transition: "all .15s",
                }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#2D3134" }}>{op.label}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>{op.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <style>{`
            .op-radio:checked + div { border-color: #B48A73; background: rgba(180,138,115,.06); }
            .op-radio:checked + div div:first-child { color: #B48A73; }
          `}</style>
        </div>

        {/* ── 2. TIPO DE PROPIEDAD ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>🏠</span> Tipo de propiedad</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {PROPERTY_TYPES.map((pt, i) => (
              <label key={pt.value} style={{ cursor: "pointer" }}>
                <input type="radio" name="property_type_full" value={pt.value} defaultChecked={i === 0} style={{ display: "none" }} className="pt-radio" />
                <div style={{
                  border: "2px solid #e5e7eb", borderRadius: 12, padding: "12px 10px",
                  textAlign: "center", fontSize: 13, fontWeight: 700, transition: "all .15s",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{pt.icon}</div>
                  {pt.label}
                </div>
              </label>
            ))}
          </div>
          <style>{`
            .pt-radio:checked + div { border-color: #2D3134; background: rgba(45,49,52,.05); }
          `}</style>
        </div>

        {/* ── 3. INFO BÁSICA ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>📋</span> Información básica</h2>
          <Field label="Título de la publicación *" hint='Ej: "Casa 3 ambientes con jardín en Villa del Parque"'>
            <input className="input" name="title" required placeholder='Ej: Hermosa casa con pileta en barrio privado' style={{ marginTop: 6 }} />
          </Field>
          <Field label="Descripción completa" hint="Contá todo lo que querés que el comprador/inquilino sepa: estado, entorno, qué incluye, beneficios, etc.">
            <textarea
              className="input"
              name="description"
              rows={6}
              placeholder="Describí la propiedad con el máximo detalle posible..."
              style={{ resize: "vertical", marginTop: 6 }}
            />
          </Field>
        </div>

        {/* ── 4. UBICACIÓN ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>📍</span> Ubicación</h2>
          <Grid cols={3}>
            <Field label="Provincia *">
              <select className="input" name="province" style={{ marginTop: 6 }}>
                <option value="">Seleccioná provincia</option>
                {[
                  "Buenos Aires","Buenos Aires (GBA)","CABA","Catamarca","Chaco","Chubut",
                  "Córdoba","Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa",
                  "La Rioja","Mendoza","Misiones","Neuquén","Río Negro","Salta",
                  "San Juan","San Luis","Santa Cruz","Santa Fe","Santiago del Estero",
                  "Tierra del Fuego","Tucumán",
                ].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Ciudad *">
              <input className="input" name="city" required placeholder="Santa Rosa" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Barrio / Zona">
              <input className="input" name="neighborhood" placeholder="Centro, Belgrano..." style={{ marginTop: 6 }} />
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="Dirección" hint="Se puede ocultar al público si preferís">
              <input className="input" name="address" placeholder="Av. San Martín 1234 · Piso 3 · Depto B" style={{ marginTop: 6 }} />
            </Field>
            <Field label="¿Mostrar dirección?">
              <select className="input" name="address_hidden" style={{ marginTop: 6 }}>
                <option value="0">Sí, mostrar dirección</option>
                <option value="1">No, ocultar dirección</option>
              </select>
            </Field>
          </Grid>
        </div>

        {/* ── 5. CARACTERÍSTICAS ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>🔧</span> Características</h2>
          <Grid cols={4}>
            <Field label="Habitaciones">
              <input className="input" name="rooms" type="number" min="0" max="99" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Baños">
              <input className="input" name="bathrooms" type="number" min="0" max="99" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Cocheras">
              <input className="input" name="parking_spaces" type="number" min="0" max="20" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Cochera cubierta">
              <select className="input" name="has_garage" style={{ marginTop: 6 }}>
                <option value="0">No</option>
                <option value="1">Sí</option>
              </select>
            </Field>
          </Grid>
          <Grid cols={4}>
            <Field label="m² totales">
              <input className="input" name="total_m2" type="number" step="0.01" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="m² cubiertos">
              <input className="input" name="area_m2" type="number" step="0.01" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Pisos del edificio">
              <input className="input" name="floors" type="number" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Piso del inmueble">
              <input className="input" name="floor_number" type="number" min="0" placeholder="PB, 1, 2..." style={{ marginTop: 6 }} />
            </Field>
          </Grid>
          <Grid cols={3}>
            <Field label="Antigüedad (años)" hint="0 = a estrenar">
              <input className="input" name="age_years" type="number" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Estado de conservación">
              <select className="input" name="estado_conservacion" style={{ marginTop: 6 }}>
                <option value="">Seleccioná estado</option>
                {ESTADOS_CONSERVACION.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="Orientación">
              <select className="input" name="orientacion" style={{ marginTop: 6 }}>
                <option value="">Seleccioná orientación</option>
                {ORIENTACIONES.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
              </select>
            </Field>
          </Grid>

          {/* Amenities */}
          <div style={{ marginTop: 6 }}>
            <label style={{ ...S.label, marginBottom: 12 }}>Amenities y servicios</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
              {AMENITIES.map(a => (
                <label key={a.value} style={{
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  background: "#fafafa", border: "1px solid #eee", borderRadius: 8,
                  padding: "8px 12px", fontSize: 13, fontWeight: 600,
                }}>
                  <input type="checkbox" name="amenities" value={a.value} style={{ accentColor: "#B48A73" }} />
                  <span>{a.icon}</span> {a.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── 6. PRECIO ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>💰</span> Precio</h2>
          <Grid cols={3}>
            <Field label="Precio en USD" hint="Dólares estadounidenses">
              <input className="input" name="price_usd" type="number" step="1" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Precio en ARS" hint="Pesos argentinos">
              <input className="input" name="price_ars" type="number" step="1" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
            <Field label="Expensas (ARS / mes)" hint="Solo para alquileres o propiedades con expensas">
              <input className="input" name="expenses_ars" type="number" step="1" min="0" placeholder="0" style={{ marginTop: 6 }} />
            </Field>
          </Grid>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
            💡 Podés ingresar el precio en una o ambas monedas. El agente te asesorará sobre el precio de mercado si lo necesitás.
          </div>
        </div>

        {/* ── 7. DATOS DEL PROPIETARIO ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>👤</span> Tus datos de contacto</h2>
          <Grid cols={2}>
            <Field label="Nombre completo">
              <input className="input" name="owner_name" placeholder="Tu nombre y apellido"
                defaultValue={profile?.full_name ?? ""} style={{ marginTop: 6 }} />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input className="input" name="owner_phone" placeholder="+54 9 XXX XXX XXXX"
                defaultValue={profile?.whatsapp ?? profile?.phone ?? ""} style={{ marginTop: 6 }} />
            </Field>
          </Grid>
        </div>

        {/* ── 8. AGENTE ── */}
        <div style={S.section}>
          <h2 style={S.sectionTitle}><span>🧑‍💼</span> Agente a cargo</h2>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: "#888" }}>
            Si ya hablaste con uno de nuestros agentes, seleccionalo. Si no, te asignamos uno automáticamente.
          </p>

          {(agents ?? []).length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 14 }}>No hay agentes disponibles aún.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 12, cursor: "pointer" }}>
                <input type="radio" name="agent_id" value="" defaultChecked style={{ accentColor: "#B48A73" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Asignar automáticamente</div>
                  <div style={{ fontSize: 12, color: "#999" }}>El equipo de Pino Galant te contactará</div>
                </div>
              </label>
              {(agents ?? []).map((a: any) => {
                const name = a.full_name || a.email || "Agente";
                const role = a.role === "super_admin" ? "Superadmin" : "Agente / Admin";
                const ini  = name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
                return (
                  <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 12, cursor: "pointer" }}>
                    <input type="radio" name="agent_id" value={a.id} style={{ accentColor: "#B48A73" }} />
                    {a.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }} />
                    ) : (
                      <span style={{ width: 44, height: 44, borderRadius: 999, background: "#B48A73", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                        {ini}
                      </span>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>{role}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 9. FOTOS ── */}
        <div style={{ background: "#fafafa", border: "2px dashed #e0e0e0", borderRadius: 16, padding: "22px 24px", marginBottom: 18, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#2D3134", marginBottom: 4 }}>Fotos, videos y planos</div>
          <div style={{ fontSize: 14, color: "#888" }}>
            Las vas a poder subir en el <strong>siguiente paso</strong>, una vez que guardemos los datos.
            <br />Aceptamos imágenes, videos y archivos PDF (planos).
          </div>
        </div>

        {/* ── BOTÓN ENVIAR ── */}
        <button
          type="submit"
          style={{
            background: "#2D3134", color: "#fff", border: "none",
            borderRadius: 14, padding: "16px 0", width: "100%",
            fontWeight: 900, fontSize: 17, cursor: "pointer",
            letterSpacing: -0.3, boxShadow: "0 4px 20px rgba(45,49,52,.25)",
          }}
        >
          Continuar → Subir fotos
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#aaa", marginTop: 12 }}>
          Tu publicación quedará en revisión hasta que un agente la apruebe antes de publicarla.
        </p>
      </form>
    </main>
  );
}
