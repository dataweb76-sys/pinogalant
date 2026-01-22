import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================== STATUS / PRIORIDAD ===================== */

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Nuevo", color: "#2563eb" },
  in_progress: { label: "Warm", color: "#ca8a04" },
  hot: { label: "Hot", color: "#dc2626" },
  closed: { label: "Cerrado", color: "#16a34a" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    color: "#6b7280",
  };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: s.color,
        color: "white",
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {s.label}
    </span>
  );
}

/* ===================== HELPERS ===================== */

function buildReplyMessage({
  name,
  property,
  agent,
}: {
  name: string;
  property?: {
    title?: string | null;
    city?: string | null;
    neighborhood?: string | null;
  } | null;
  agent?: string | null;
}) {
  return encodeURIComponent(
    `Hola ${name}, soy ${agent ?? "el equipo de Pino Galant"}.

Te escribo por tu consulta sobre la propiedad:
${property?.title ?? "Propiedad"} – ${property?.neighborhood ?? ""} ${property?.city ?? ""}

Quedo atento/a para ayudarte.`
  );
}

/* ===================== PAGE ===================== */

export default async function AdminConsultasPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
  };
}) {
  /* ---------- AUTH ---------- */
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) redirect("/login?next=/admin/consultas");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin", "agent"].includes(profile.role)) {
    redirect("/");
  }

  const isAdmin = profile.role === "admin" || profile.role === "super_admin";

  /* ---------- DATA ---------- */
  const admin = createSupabaseAdminClient();

  const status = searchParams?.status || "all";

  let query = admin
    .from("property_inquiries")
    .select(
      `
      id,
      property_id,
      agent_id,
      name,
      email,
      phone,
      message,
      status,
      internal_notes,
      created_at,
      properties (
        id,
        title,
        city,
        neighborhood,
        agent_id
      )
    `
    )
    .order("created_at", { ascending: false });

  // 👉 filtro por estado SOLO si corresponde
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // 👉 vista "Mis consultas" para agentes
  if (!isAdmin) {
    query = query.eq("agent_id", user.id);
  }

  const { data: inquiries } = await query;

  /* ===================== ACTIONS ===================== */

  async function markInProgress(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();
    await admin
      .from("property_inquiries")
      .update({ status: "in_progress" })
      .eq("id", String(formData.get("id")));
  }

  async function closeInquiry(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();
    await admin
      .from("property_inquiries")
      .update({
        status: "closed",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", String(formData.get("id")));
  }

  async function saveNotes(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();
    await admin
      .from("property_inquiries")
      .update({
        internal_notes: String(formData.get("internal_notes") || ""),
      })
      .eq("id", String(formData.get("id")));
  }

  async function setPriority(formData: FormData) {
    "use server";
    const admin = createSupabaseAdminClient();
    await admin
      .from("property_inquiries")
      .update({
        status: String(formData.get("status")),
      })
      .eq("id", String(formData.get("id")));
  }

  /* ===================== UI ===================== */

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ marginBottom: 20 }}>
        {isAdmin ? "Consultas" : "Mis consultas"}
      </h1>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {["all", "pending", "in_progress", "hot", "closed"].map((s) => (
          <Link
            key={s}
            href={`/admin/consultas?status=${s}`}
            className="btn"
            style={{
              fontWeight: s === status ? 900 : 600,
            }}
          >
            {s === "all" ? "Todas" : STATUS_MAP[s]?.label ?? s}
          </Link>
        ))}
      </div>

      {/* LISTADO */}
      <div style={{ display: "grid", gap: 16 }}>
        {inquiries?.map((i: any) => {
          const replyMessage = buildReplyMessage({
            name: i.name || "Usuario",
            property: i.properties,
            agent: profile.full_name ?? null,
          });

          const whatsappHref = i.phone
            ? `https://wa.me/${i.phone.replace(/\D/g, "")}?text=${replyMessage}`
            : null;

          const mailHref = `mailto:${i.email}?subject=${encodeURIComponent(
            "Consulta por propiedad"
          )}&body=${replyMessage}`;

          return (
            <div
              key={i.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 16,
                background: "white",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>
                    {i.name || "Usuario"}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {i.email}
                    {i.phone && <> · {i.phone}</>}
                  </div>
                </div>

                <StatusBadge status={i.status} />
              </div>

              {/* PROPIEDAD */}
              <div style={{ fontSize: 14, marginBottom: 10 }}>
                <strong>{i.properties?.title}</strong>
                <br />
                {i.properties?.neighborhood} · {i.properties?.city}
                <br />
                <Link
                  href={`/propiedades/${i.properties?.id}`}
                  className="small"
                >
                  Ver propiedad →
                </Link>
              </div>

              {/* MENSAJE */}
              <div
                style={{
                  fontSize: 14,
                  background: "#f9fafb",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                {i.message}
              </div>

              {/* NOTAS INTERNAS */}
              {isAdmin && (
                <form action={saveNotes} style={{ marginBottom: 12 }}>
                  <input type="hidden" name="id" value={i.id} />
                  <textarea
                    name="internal_notes"
                    defaultValue={i.internal_notes ?? ""}
                    placeholder="Notas internas (solo staff)"
                    className="input"
                    rows={2}
                  />
                  <button className="btn" style={{ marginTop: 6 }}>
                    Guardar nota
                  </button>
                </form>
              )}

              {/* ACCIONES */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {i.status === "pending" && (
                  <form action={markInProgress}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="btn">En seguimiento</button>
                  </form>
                )}

                {i.status !== "closed" && (
                  <form action={closeInquiry}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="btn btnPrimary">Cerrar</button>
                  </form>
                )}

                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    className="btn btnPrimary"
                  >
                    WhatsApp
                  </a>
                )}

                <a
                  href={mailHref}
                  target="_blank"
                  className="btn"
                >
                  Mail
                </a>

                {isAdmin && (
                  <form action={setPriority}>
                    <input type="hidden" name="id" value={i.id} />
                    <select
                      name="status"
                      defaultValue={i.status}
                      className="input"
                    >
                      <option value="pending">Nuevo</option>
                      <option value="in_progress">Warm</option>
                      <option value="hot">Hot</option>
                      <option value="closed">Cerrado</option>
                    </select>
                    <button className="btn">Actualizar</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
