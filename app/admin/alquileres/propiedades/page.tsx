import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: "Disponible",   color: "#15803d", bg: "#dcfce7" },
  rented:      { label: "Alquilada",    color: "#1d4ed8", bg: "#dbeafe" },
  maintenance: { label: "Mantenimiento",color: "#b45309", bg: "#fef3c7" },
  unavailable: { label: "No disponible",color: "#dc2626", bg: "#fee2e2" },
};

const TYPE_LABELS: Record<string, string> = {
  casa: "Casa", departamento: "Departamento", local: "Local",
  oficina: "Oficina", quinta: "Quinta", campo: "Campo",
  cochera: "Cochera", galpon: "Galpón", chacra: "Chacra",
};

function formatARS(n?: number | null) {
  if (!n) return "—";
  return "$" + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export default async function RentalPropertiesPage({
  searchParams,
}: { searchParams?: { ok?: string; error?: string; status?: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/alquileres/propiedades");

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");

  const fStatus = searchParams?.status ?? "";
  let q = admin.from("rental_properties").select("*").order("created_at", { ascending: false });
  if (fStatus) q = q.eq("status", fStatus);
  const { data: props } = await q;

  const available = (props ?? []).filter(p => p.status === "available").length;
  const rented    = (props ?? []).filter(p => p.status === "rented").length;

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div>
          <a href="/admin/alquileres" style={{ fontSize: 12, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>← Alquileres</a>
          <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 900, color: "#2D3134" }}>Propiedades para Alquilar</h1>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/admin/alquileres/propiedades/nueva"
            style={{ background: "#2D3134", color: "#fff", textDecoration: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
            + Nueva propiedad
          </Link>
        </div>
      </div>

      {searchParams?.ok && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>✅ {decodeURIComponent(searchParams.ok)}</div>}
      {searchParams?.error && <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>❌ {decodeURIComponent(searchParams.error)}</div>}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "🏠", value: (props ?? []).length, label: "Total propiedades", bg: "#f3f4f6" },
          { icon: "✅", value: available, label: "Disponibles", bg: "#dcfce7" },
          { icon: "🔑", value: rented,    label: "Alquiladas",  bg: "#dbeafe" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", padding: "16px 20px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "grid", placeItems: "center", fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#2D3134" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "", label: "Todas" },
          { key: "available",   label: "Disponibles" },
          { key: "rented",      label: "Alquiladas" },
          { key: "maintenance", label: "Mantenimiento" },
        ].map(f => (
          <Link key={f.key}
            href={f.key ? `/admin/alquileres/propiedades?status=${f.key}` : "/admin/alquileres/propiedades"}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: fStatus === f.key ? "#2D3134" : "#f4f4f5",
              color: fStatus === f.key ? "#fff" : "#555",
            }}>
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
        {(props ?? []).length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#aaa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>No hay propiedades cargadas</div>
            <Link href="/admin/alquileres/propiedades/nueva"
              style={{ color: "#B48A73", fontWeight: 700, textDecoration: "none" }}>
              + Agregar la primera propiedad
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  {["Propiedad","Tipo","Precio/mes","Propietario","Estado","Acciones"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(props ?? []).map((p: any) => {
                  const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.available;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#2D3134" }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{p.address}, {p.city}</div>
                        {p.rooms && <div style={{ fontSize: 11, color: "#aaa" }}>{p.rooms} amb. · {p.area_m2 ? `${p.area_m2}m²` : ""}</div>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>
                        {TYPE_LABELS[p.type] ?? p.type}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#2D3134" }}>{formatARS(p.rent_ars)}</div>
                        {p.expenses_ars > 0 && <div style={{ fontSize: 11, color: "#888" }}>+ {formatARS(p.expenses_ars)} exp.</div>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>
                        <div style={{ fontWeight: 700 }}>{p.owner_name ?? "—"}</div>
                        {p.owner_phone && <div style={{ fontSize: 12, color: "#888" }}>{p.owner_phone}</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: st.bg, color: st.color, fontWeight: 700, fontSize: 11, padding: "4px 10px", borderRadius: 999 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "12px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Link href={`/admin/alquileres/propiedades/${p.id}/editar`}
                          style={{ background: "#f4f4f5", color: "#555", textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                          Editar
                        </Link>
                        {p.status === "available" && (
                          <Link href={`/admin/alquileres/nuevo?rental_property_id=${p.id}`}
                            style={{ background: "#2D3134", color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                            + Contrato
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
