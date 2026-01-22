import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createPropertyAction,
  deletePropertyAction,
  togglePublishAction,
} from "./actions";
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
    published?: string; // all | 1 | 0 | revision
  };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin/propiedades");

  const admin = createSupabaseAdminClient();

  const me = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", data.user.id)
    .maybeSingle();

  const myRole = (me.data?.role as Role | undefined) ?? "owner";
  if (myRole !== "admin" && myRole !== "super_admin") {
    redirect("/admin?error=not_admin");
  }

  // ---------- Filtros ----------
  const q = (searchParams?.q ?? "").trim();
  const fCity = (searchParams?.city ?? "").trim();
  const fOperation = (searchParams?.operation ?? "").trim();
  const fType = (searchParams?.type ?? "").trim();
  const fPublished = (searchParams?.published ?? "all").trim(); // 👈 CLAVE

  // ---------- Query base ----------
  let query = admin
    .from("properties")
    .select(
      "id,title,city,neighborhood,operation,type,purpose,property_type,price_ars,price_usd,is_published,status,agent_id,created_at"
    )
    .order("created_at", { ascending: false });

  /**
   * 🔑 FILTRO POR AGENTE
   * - Admin normal:
   *   - Ve SUS propiedades
   *   - EXCEPTO cuando está en “revisión”
   * - Super admin: ve todo
   */
  if (myRole !== "super_admin" && fPublished !== "revision") {
    query = query.eq("agent_id", data.user.id);
  }

  // ---------- Filtros ----------
  if (q) query = query.ilike("title", `%${q}%`);
  if (fCity) query = query.ilike("city", `%${fCity}%`);
  if (fOperation) query = query.eq("operation", fOperation);
  if (fType) query = query.eq("type", fType);

  /**
   * 🔥 FILTRO DE PUBLICACIÓN (NO SE PISAN)
   */
  if (fPublished === "1") {
    query = query.eq("is_published", true);
  }

  if (fPublished === "0") {
    query = query.eq("is_published", false);
  }

  if (fPublished === "revision") {
    query = query.eq("status", "en_revision");
  }
  // published === "all" → NO se filtra nada

  const propsRes = await query;
  const rows = propsRes.data ?? [];

  // ---------- Operaciones y tipos ----------
  const opVals = await admin.rpc("enum_values", {
    enum_name: "property_operation",
  });
  const typeVals = await admin.rpc("enum_values", {
    enum_name: "property_type",
  });

  const operations: string[] = Array.isArray(opVals.data)
    ? (opVals.data as string[])
    : [];
  const types: string[] = Array.isArray(typeVals.data)
    ? (typeVals.data as string[])
    : [];

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
      if (!mediaMap.has(m.property_id)) {
        mediaMap.set(m.property_id, m.url);
      }
    }
  }

  // ---------- Agentes ----------
  const agentsRes =
    myRole === "super_admin"
      ? await admin
          .from("profiles")
          .select("id, role, full_name, email")
          .order("created_at", { ascending: true })
      : { data: [] as any[] };

  const agentLabel = new Map<string, string>();
  for (const a of agentsRes.data ?? []) {
    const label = a.full_name
      ? a.full_name
      : a.email
      ? a.email
      : `${String(a.id).slice(0, 8)}...`;
    agentLabel.set(a.id, `${label} (${a.role})`);
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Propiedades</h1>
        <span className="small" style={{ color: "#666" }}>
          {myRole === "super_admin"
            ? "Viendo: todas"
            : "Viendo: asignadas a mí"}
        </span>

        <div
  style={{
    marginLeft: "auto",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  }}
>
          <Link className="btn" href="/admin">
            ← Panel
          </Link>
          <Link className="btn" href="/logout">
            Cerrar sesión
          </Link>
        </div>
      </div>

      {/* Filtros rápidos */}
      <section className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "all" })}>
            Todas
          </Link>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "1" })}>
            Publicadas
          </Link>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "0" })}>
            No publicadas
          </Link>
          <Link className="btn" href={buildBackLink({ ...searchParams, published: "revision" })}>
            En revisión
          </Link>
        </div>
      </section>

      {/* LISTADO (NO TOCADO) */}
      <section className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Listado</h2>

        <div style={{ overflowX: "auto" }}>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 900,
    }}
  >
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
                const price = formatPrice(r.price_ars, r.price_usd);
                const back = buildBackLink(searchParams);

                return (
                  <tr key={r.id}>
                    <td style={td}>
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          style={{ width: 70, height: 52, objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <span className="small">sin foto</span>
                      )}
                    </td>

                    <td style={td}>
                      <Link href={`/admin/propiedades/${r.id}`}>
                        <b>{r.title}</b>
                      </Link>
                    </td>

                    <td style={td}>{r.operation ?? "-"}</td>
                    <td style={td}>{r.type ?? "-"}</td>
                    <td style={td}>
                      {r.city}
                      {r.neighborhood ? `, ${r.neighborhood}` : ""}
                    </td>
                    <td style={td}>{price}</td>
                    <td style={td}>
                      {r.status === "en_revision"
                        ? "🕓 En revisión"
                        : r.is_published
                        ? "✅ Publicada"
                        : "— No publicada"}
                    </td>

                    {myRole === "super_admin" ? (
                      <td style={td}>
                        {r.agent_id
                          ? agentLabel.get(r.agent_id)
                          : "-"}
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

              {rows.length === 0 && (
                <tr>
                  <td style={td} colSpan={9}>
                    No hay propiedades con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* utils */

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
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f1f1f1",
  padding: "10px 8px",
  fontSize: 14,
};
