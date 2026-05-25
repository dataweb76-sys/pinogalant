import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completarPerfilAction } from "@/app/auth/actions";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CompletarPerfilPage({
  searchParams,
}: {
  searchParams?: { tipo?: string; next?: string; error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const tipo = searchParams?.tipo === "inquilino" ? "inquilino" : "propietario";
  const next = searchParams?.next ?? (tipo === "inquilino" ? "/mi-alquiler" : "/mi-propiedad");

  // Pre-fill from Google metadata
  const meta = data.user.user_metadata ?? {};
  const defaultFirstName = meta.first_name ?? meta.given_name ?? (meta.full_name ?? meta.name ?? "").split(" ")[0] ?? "";
  const defaultLastName  = meta.last_name  ?? meta.family_name ?? (meta.full_name ?? meta.name ?? "").split(" ").slice(1).join(" ") ?? "";

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 90px" }}>

      {/* Título */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Completar perfil
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#2D3134" }}>
          ¡Bienvenido/a! Completá tus datos
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#888" }}>
          Registraste tu cuenta con Google. Necesitamos algunos datos más para activar tu perfil.
        </p>
      </div>

      {/* Selector de tipo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <Link href={`?tipo=inquilino&next=${encodeURIComponent(next)}`} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14,
          border: tipo === "inquilino" ? "2px solid #B48A73" : "1.5px solid #e5e5e5",
          background: tipo === "inquilino" ? "#fdf8f5" : "#fff", textDecoration: "none",
        }}>
          <span style={{ fontSize: 26 }}>🏠</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#2D3134" }}>Soy Inquilino</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Quiero alquilar una propiedad</div>
          </div>
        </Link>
        <Link href={`?tipo=propietario&next=${encodeURIComponent(next)}`} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14,
          border: tipo === "propietario" ? "2px solid #B48A73" : "1.5px solid #e5e5e5",
          background: tipo === "propietario" ? "#fdf8f5" : "#fff", textDecoration: "none",
        }}>
          <span style={{ fontSize: 26 }}>🏢</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#2D3134" }}>Soy Propietario</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Tengo una propiedad para alquilar o vender</div>
          </div>
        </Link>
      </div>

      {searchParams?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
          ❌ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={completarPerfilAction} style={{
        background: "#fff", border: "1px solid #eee", borderRadius: 16,
        padding: "24px 20px", display: "grid", gap: 24,
      }}>
        <input type="hidden" name="role_type" value={tipo} />
        <input type="hidden" name="next" value={next} />

        {/* Datos personales */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Datos personales
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Nombre *</label>
              <input className="input" name="first_name" required defaultValue={defaultFirstName} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Apellido *</label>
              <input className="input" name="last_name" required defaultValue={defaultLastName} />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>DNI *</label>
              <input className="input" name="dni" required placeholder="35.123.456" />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Teléfono / WhatsApp *</label>
              <input className="input" name="phone" required placeholder="+54 9 2954..." type="tel" />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Ciudad *</label>
              <input className="input" name="city" required placeholder="Santa Rosa" />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Código Postal *</label>
              <input className="input" name="postal_code" required placeholder="6300" />
            </div>
          </div>
        </section>

        {/* Campos extra para inquilino */}
        {tipo === "inquilino" && (
          <>
            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                Situación laboral
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Tipo de ingreso *</label>
                  <select className="input" name="income_type" required defaultValue="">
                    <option value="" disabled>Seleccioná...</option>
                    <option value="empleado">Empleado en relación de dependencia</option>
                    <option value="autonomo">Autónomo / Freelance</option>
                    <option value="monotributo">Monotributista</option>
                    <option value="jubilado">Jubilado / Pensionado</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Empleador / Empresa</label>
                  <input className="input" name="employer" placeholder="Nombre de la empresa" />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Ingreso mensual aprox. (ARS)</label>
                  <input className="input" name="monthly_income_ars" type="number" min="0" placeholder="Ej: 500000" />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Ocupación / Profesión</label>
                  <input className="input" name="occupation" placeholder="Ej: Docente, Comerciante..." />
                </div>
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                Sobre la vivienda
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>¿Cuántas personas vivirán? *</label>
                  <select className="input" name="family_count" required defaultValue="1">
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={String(n)}>{n} persona{n > 1 ? "s" : ""}</option>
                    ))}
                    <option value="7">7 o más</option>
                  </select>
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>¿Tenés mascotas? *</label>
                  <select className="input" name="has_pets" required defaultValue="false">
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Si tenés mascotas, describí</label>
                  <input className="input" name="pets_description" placeholder="Ej: 1 gato castrado, 1 perro mediano" />
                </div>
              </div>
            </section>

            <section>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                Garantía
              </div>
              <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#555" }}>
                💡 Podés completar los datos de tu garante ahora o después desde tu perfil.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Nombre del garante</label>
                  <input className="input" name="guarantor_name" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Teléfono del garante</label>
                  <input className="input" name="guarantor_phone" placeholder="+54 9 ..." type="tel" />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>DNI del garante</label>
                  <input className="input" name="guarantor_dni" placeholder="35.000.000" />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Relación con el garante</label>
                  <select className="input" name="guarantor_rel" defaultValue="">
                    <option value="">Seleccioná...</option>
                    <option value="familiar">Familiar</option>
                    <option value="conyugue">Cónyuge / Pareja</option>
                    <option value="amigo">Amigo/a</option>
                    <option value="empleador">Empleador</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </section>
          </>
        )}

        <button
          type="submit"
          style={{
            background: "#2D3134", color: "#fff",
            border: "none", borderRadius: 12,
            padding: "14px 20px", fontSize: 15, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ✓ Guardar y continuar
        </button>
      </form>
    </main>
  );
}
