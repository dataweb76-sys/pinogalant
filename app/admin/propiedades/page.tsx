import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPropertyAction, deletePropertyAction, togglePublishAction } from "./actions";
import RowActions from "./row-actions.client";

export const runtime = "nodejs";

type Role = "owner" | "admin" | "super_admin";

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams?: {
    ok?: string;
    error?: string;
    q?: string;
    city?: string;
    operation?: string;
    type?: string;
    published?: string; // "all" | "1" | "0"
  };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/propiedades");

  const admin = createSupabaseAdminClient();

  const me = await admin.from("profiles").select("id, role").eq("id", data.user.id).maybeSingle();
  const myRole = (me.data?.role as Role | undefined) ?? "owner";
  if (myRole !== "admin" && myRole !== "super_admin") redirect("/admin?error=not_admin");

  // ---------- Filtros ----------
  const q = (searchParams?.q ?? "").trim();
  const fCity = (searchParams?.city ?? "").trim();
  const fOperation = (searchParams?.operation ?? "").trim();
  const fType = (searchParams?.type ?? "").trim();
  const fPublished = (searchParams?.published ?? "all").trim(); // all|1|0

  // ---------- Query base ----------
  let query = admin
    .from("properties")
    .select(
      "id,title,city,neighborhood,operation,type,purpose,property_type,price_ars,price_usd,is_published,agent_id,created_at"
    )
    .order("created_at", { ascending: false });

  // admins ven solo las propias
  if (myRole !== "super_admin") query = query.eq("agent_id", data.user.id);

  // filtros
  if (q) query = query.ilike("title", `%${q}%`);
  if (fCity) query = query.ilike("city", `%${fCity}%`);
  if (fOperation) query = query.eq("operation", fOperation);
  if (fType) query = query.eq("type", fType);
  if (fPublished === "1") query = query.eq("is_published", true);
  if (fPublished === "0") query = query.eq("is_published", false);

  const propsRes = await query;
  const rows = propsRes.data ?? [];

  // ---------- Operaciones y tipos disponibles (enum values) ----------
  const opVals = await admin.rpc("enum_values", { enum_name: "property_operation" });
  const typeVals = await admin.rpc("enum_values", { enum_name: "property_type" });

  const operations: string[] = Array.isArray(opVals.data) ? (opVals.data as string[]) : [];
  const types: string[] = Array.isArray(typeVals.data) ? (typeVals.data as string[]) : [];

  // ---------- Foto principal ----------
  const ids = rows.map((r) => r.id);
  const mediaMap = new Map<string, string>();

  if (ids.length > 0) {
    const mediaRes = await admin
      .from("property_media")
      .select("property_id, kind, url, sort_order, created_at")
      .in("property_id", ids)
      .eq("kind", "image")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const media = mediaRes.data ?? [];
    for (const m of media) {
      if (!mediaMap.has(m.property_id)) mediaMap.set(m.property_id, m.url);
    }
  }

  // ---------- Lista agentes (solo super_admin) ----------
  const agentsRes =
    myRole === "super_admin"
      ? await admin.from("profiles").select("id, role, full_name, email").order("created_at", { ascending: true })
      : { data: [] as any[] };

  const agentLabel = new Map<string, string>();
  for (const a of agentsRes.data ?? []) {
    const label = a.full_name ? a.full_name : a.email ? a.email : `${String(a.id).slice(0, 8)}...`;
    agentLabel.set(a.id, `${label} (${a.role})`);
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Propiedades</h1>
        <span className="small" style={{ color: "#666" }}>
          {myRole === "super_admin" ? "Viendo: todas" : "Viendo: asignadas a mí"}
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link className="btn" href="/admin">
            ← Panel
          </Link>
          <Link className="btn" href="/logout">
            Cerrar sesión
          </Link>
        </div>
      </div>

      {searchParams?.error ? <p className="small" style={{ color: "crimson" }}>❌ {searchParams.error}</p> : null}
      {searchParams?.ok ? <p className="small" style={{ color: "green" }}>✅ {searchParams.ok}</p> : null}

      {/* Filtros */}
      <section className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "all" })}>Todas</Link>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "1" })}>Publicadas</Link>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "0" })}>No publicadas</Link>
        </div>

        <form method="GET" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <label className="small">Buscar</label>
            <input className="input" name="q" defaultValue={q} placeholder="título..." />
          </div>

          <div>
            <label className="small">Ciudad</label>
            <input className="input" name="city" defaultValue={fCity} placeholder="Mar del Plata..." />
          </div>

          <div>
            <label className="small">Operación</label>
            <select className="input" name="operation" defaultValue={fOperation}>
              <option value="">(todas)</option>
              {operations.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="small">Tipo</label>
            <select className="input" name="type" defaultValue={fType}>
              <option value="">(todos)</option>
              {types.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <input type="hidden" name="published" value={fPublished} />

          <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
            <button className="btn btnPrimary" type="submit">Filtrar</button>
            <Link className="btn" href="/admin/propiedades">Limpiar</Link>
          </div>
        </form>

        <div className="small" style={{ color: "#666" }}>
          Resultados: <b>{rows.length}</b>
        </div>
      </section>

      {/* Crear */}
      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Cargar propiedad</h2>

        <form action={createPropertyAction} style={{ display: "grid", gap: 12, maxWidth: 900 }}>
          <div>
            <label className="small">Título</label>
            <input className="input" name="title" required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Operación (texto interno)</label>
              <select className="input" name="purpose" defaultValue="sale">
                <option value="sale">sale</option>
                <option value="rent">rent</option>
                <option value="day_rent">day_rent</option>
              </select>
            </div>

            <div>
              <label className="small">Tipo (texto interno)</label>
              <select className="input" name="property_type" defaultValue="house">
                <option value="house">house</option>
                <option value="apartment">apartment</option>
                <option value="studio">studio</option>
                <option value="quinta">quinta</option>
                <option value="land">land</option>
                <option value="commercial">commercial</option>
              </select>
            </div>

            <div>
              <label className="small">Ciudad</label>
              <input className="input" name="city" />
            </div>

            <div>
              <label className="small">Barrio</label>
              <input className="input" name="neighborhood" />
            </div>
          </div>

          <div>
            <label className="small">Dirección</label>
            <input className="input" name="address" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <label className="small">Precio ARS</label>
              <input className="input" name="price_ars" inputMode="decimal" />
            </div>
            <div>
              <label className="small">Precio USD</label>
              <input className="input" name="price_usd" inputMode="decimal" />
            </div>
            <div>
              <label className="small">Propietario</label>
              <input className="input" name="owner_name" />
            </div>
            <div>
              <label className="small">Teléfono</label>
              <input className="input" name="owner_phone" />
            </div>
          </div>

          <button className="btn btnPrimary" type="submit">Crear</button>
        </form>
      </section>

      {/* Listado */}
      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Listado</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Foto</th>
                <th style={th}>Título</th>
                <th style={th}>Operación</th>
                <th style={th}>Tipo</th>
                <th style={th}>Ubicación</th>
                <th style={th}>Precio</th>
                <th style={th}>Estado</th>
                {myRole === "super_admin" ? <th style={th}>Agente</th> : null}
                <th style={th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const img = mediaMap.get(r.id) ?? null;
                const op = (r.operation as string) || r.purpose || "-";
                const ty = (r.type as string) || r.property_type || "-";
                const price = formatPrice(r.price_ars, r.price_usd);
                const back = buildBackLink(searchParams);

                return (
                  <tr key={r.id}>
                    <td style={{ ...td, width: 90 }}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="principal" style={{ width: 70, height: 52, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                      ) : (
                        <div className="small" style={{ color: "#999" }}>sin foto</div>
                      )}
                    </td>

                    <td style={td}>
                      <div style={{ fontWeight: 800 }}>
                        <Link href={`/admin/propiedades/${r.id}`} style={{ textDecoration: "none" }}>
                          {r.title}
                        </Link>
                      </div>
                      <div className="small" style={{ color: "#666" }}>
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </td>

                    <td style={td}>{op}</td>
                    <td style={td}>{ty}</td>

                    <td style={td}>
                      {r.city ?? "-"}
                      {r.neighborhood ? `, ${r.neighborhood}` : ""}
                    </td>

                    <td style={td}>{price}</td>

                    <td style={td}>{r.is_published ? "✅ Publicada" : "— No publicada"}</td>

                    {myRole === "super_admin" ? (
                      <td style={td}>
                        {r.agent_id ? agentLabel.get(r.agent_id) ?? `${String(r.agent_id).slice(0, 8)}...` : "-"}
                      </td>
                    ) : null}

                    <td style={td}>
                      <RowActions
                        id={r.id}
                        isPublished={!!r.is_published}
                        next={back}
                        canDelete={myRole === "super_admin"}
                        onTogglePublish={togglePublishAction}
                        onDelete={deletePropertyAction}
                      />
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 ? (
                <tr>
                  <td style={td} colSpan={myRole === "super_admin" ? 9 : 8}>
                    No hay propiedades con esos filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function buildBackLink(sp?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(sp ?? {}).forEach(([k, v]) => {
    if (typeof v === "string" && v.length) params.set(k, v);
  });
  const s = params.toString();
  return s ? `/admin/propiedades?${s}` : "/admin/propiedades";
}

function formatPrice(ars?: number | null, usd?: number | null) {
  const parts: string[] = [];
  if (ars != null) parts.push(`ARS ${fmt(ars)}`);
  if (usd != null) parts.push(`USD ${fmt(usd)}`);
  return parts.length ? parts.join(" · ") : "-";
}

function fmt(n: number) {
  try {
    return new Intl.NumberFormat("es-AR").format(n);
  } catch {
    return String(n);
  }
}

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "#666",
  borderBottom: "1px solid #eee",
  padding: "10px 8px",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f1f1f1",
  padding: "10px 8px",
  verticalAlign: "top",
  fontSize: 14,
};
