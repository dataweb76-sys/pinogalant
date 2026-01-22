import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================
   ESTADOS
========================= */
const map: Record<string, { label: string; color: string }> = {
  pending: { label: "Nuevo", color: "#2563eb" },
  in_progress: { label: "En seguimiento", color: "#ca8a04" },
  closed: { label: "Cerrado", color: "#16a34a" },
};

function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { label: status, color: "#6b7280" };
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: s.color,
        color: "white",
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {s.label}
    </span>
  );
}

export default async function MisConsultasPage() {
  /* =========================
     AUTH
  ========================= */
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/agent/consultas");
  }

  const userId = data.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (!["admin", "agent"].includes(profile?.role)) {
    redirect("/");
  }

  /* =========================
     DATA
  ========================= */
  const admin = createSupabaseAdminClient();

  const { data: inquiries } = await admin
    .from("property_inquiries")
    .select(`
      id,
      name,
      email,
      phone,
      message,
      status,
      created_at,
      properties (
        id,
        title,
        city,
        neighborhood
      )
    `)
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });

  /* =========================
     ACTIONS
  ========================= */
  async function markInProgress(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const admin = createSupabaseAdminClient();

    await admin
      .from("property_inquiries")
      .update({ status: "in_progress" })
      .eq("id", id)
      .eq("agent_id", userId);
  }

  async function closeInquiry(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const admin = createSupabaseAdminClient();

    await admin
      .from("property_inquiries")
      .update({
        status: "closed",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("agent_id", userId);
  }

  /* =========================
     UI
  ========================= */
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <h1>Mis consultas</h1>

      {!inquiries || inquiries.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          No tenés consultas asignadas.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {inquiries.map((i) => {
            const propTitle = i.properties?.title ?? "Propiedad";

            const waHref = i.phone
              ? `https://wa.me/${i.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hola ${i.name || ""}, te escribo por tu consulta sobre "${propTitle}".`
                )}`
              : null;

            const mailHref = `mailto:${i.email}?subject=${encodeURIComponent(
              `Consulta por ${propTitle}`
            )}`;

            return (
              <div
                key={i.id}
                className="card"
                style={{
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.8fr 1fr",
                  gap: 20,
                }}
              >
                {/* USUARIO */}
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {i.name || "Usuario"}
                  </div>
                  <div className="small" style={{ opacity: 0.7 }}>
                    {i.email}
                    {i.phone && <> · {i.phone}</>}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <StatusBadge status={i.status} />
                  </div>
                </div>

                {/* MENSAJE */}
                <div>
                  <div className="small" style={{ opacity: 0.6, marginBottom: 4 }}>
                    Mensaje
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{i.message}</div>

                  <div className="small" style={{ marginTop: 10, opacity: 0.7 }}>
                    {new Date(i.created_at).toLocaleString()}
                  </div>
                </div>

                {/* PROPIEDAD + ACCIONES */}
                <div>
                  <div style={{ fontWeight: 800 }}>{propTitle}</div>
                  <div className="small" style={{ opacity: 0.7 }}>
                    {i.properties?.neighborhood} · {i.properties?.city}
                  </div>

                  <Link
                    href={`/propiedades/${i.properties?.id}`}
                    className="small"
                  >
                    Ver propiedad →
                  </Link>

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <a className="btn" href={mailHref}>
                      Mail
                    </a>

                    {waHref && (
                      <a
                        className="btn btnPrimary"
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {i.status === "pending" && (
                      <form action={markInProgress}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="btn">Seguimiento</button>
                      </form>
                    )}

                    {i.status !== "closed" && (
                      <form action={closeInquiry}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="btn btnPrimary">Cerrar</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
