import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MiPropiedadPage({
  searchParams,
}: {
  searchParams?: { welcome?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-propiedad");

  const admin = createSupabaseAdminClient();

  // Perfil del propietario
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  // Propiedades asignadas a este propietario
  const { data: properties } = await admin
    .from("properties")
    .select(`
      id, title, operation, status, is_published,
      price, price_currency, address, neighborhood, city,
      agent_id,
      property_media(url, sort_order)
    `)
    .eq("owner_profile_id", data.user.id)
    .order("created_at", { ascending: false });

  // Contratos activos donde es el propietario (vía property.owner_profile_id)
  const propertyIds = (properties ?? []).map(p => p.id);
  const { data: contracts } = propertyIds.length
    ? await admin
        .from("rental_contracts")
        .select("id, reference_code, status, monthly_rent_ars, start_date, end_date, tenant_id, property_id")
        .in("property_id", propertyIds)
        .neq("status", "terminated")
    : { data: [] };

  // Agentes de las propiedades
  const agentIds = [...new Set((properties ?? []).map(p => p.agent_id).filter(Boolean))];
  const { data: agents } = agentIds.length
    ? await admin.from("profiles").select("id, full_name, phone, whatsapp, avatar_url, email").in("id", agentIds)
    : { data: [] };

  const agentMap = Object.fromEntries((agents ?? []).map(a => [a.id, a]));

  // Reseñas que dejó este propietario
  const { data: myReviews } = await admin
    .from("agent_reviews")
    .select("id, rating, comment, created_at, agent_id")
    .eq("reviewer_id", data.user.id)
    .order("created_at", { ascending: false });

  const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    available:  { label: "Disponible",  color: "#15803d", bg: "#dcfce7" },
    reserved:   { label: "Reservada",   color: "#b45309", bg: "#fef3c7" },
    rented:     { label: "Alquilada",   color: "#1d4ed8", bg: "#dbeafe" },
    sold:       { label: "Vendida",     color: "#7c3aed", bg: "#ede9fe" },
    inactive:   { label: "Inactiva",    color: "#6b7280", bg: "#f3f4f6" },
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px 80px" }}>

      {/* Bienvenida */}
      {searchParams?.welcome && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
          🎉 ¡Bienvenido/a, {profile?.first_name ?? "Propietario"}! Tu cuenta fue creada exitosamente.
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Mi cuenta
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "#2D3134" }}>
          Mis propiedades
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
          Seguí el estado de tus propiedades y comunicáte con el agente asignado.
        </p>
      </div>

      {/* Perfil card */}
      <div style={{
        background: "#fff", border: "1px solid #eee", borderRadius: 16,
        padding: "16px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{
          width: 48, height: 48, borderRadius: 999,
          background: "#B48A73", color: "#fff",
          display: "grid", placeItems: "center",
          fontWeight: 900, fontSize: 16, flexShrink: 0,
        }}>
          {(profile?.first_name?.[0] ?? "P").toUpperCase()}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#2D3134" }}>
            {profile?.full_name ?? data.user.email}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>{profile?.email ?? data.user.email}</div>
        </div>
        <Link href="/perfil" style={{
          fontSize: 13, fontWeight: 700, color: "#B48A73",
          textDecoration: "none", padding: "8px 14px",
          border: "1px solid #B48A73", borderRadius: 10,
        }}>
          Editar perfil
        </Link>
      </div>

      {/* Sin propiedades */}
      {(!properties || properties.length === 0) ? (
        <div style={{
          background: "#fff", border: "1px solid #eee", borderRadius: 16,
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#2D3134", marginBottom: 8 }}>
            Aún no tenés propiedades asignadas
          </div>
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 20px" }}>
            Un agente de Pino Galant te asignará tu propiedad cuando esté lista.<br />
            Si tenés una propiedad para alquilar o vender, publicala ahora.
          </p>
          <Link href="/publicar" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#B48A73", color: "#fff", padding: "12px 22px",
            borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14,
          }}>
            + Publicar mi propiedad
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {properties.map(prop => {
            const media = (prop.property_media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
            const imgUrl = media[0]?.url ?? null;
            const st = STATUS_LABELS[prop.status] ?? STATUS_LABELS.available;
            const agent = agentMap[prop.agent_id];
            const contract = (contracts ?? []).find(c => c.property_id === prop.id);

            return (
              <div key={prop.id} style={{
                background: "#fff", border: "1px solid #eee", borderRadius: 16,
                overflow: "hidden", display: "flex", gap: 0,
              }}>
                {/* Imagen */}
                <div style={{
                  width: 180, flexShrink: 0, background: "#f3f3f3",
                  backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {!imgUrl && <span style={{ fontSize: 36 }}>🏠</span>}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16, color: "#2D3134" }}>{prop.title}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                        {[prop.address, prop.neighborhood, prop.city].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <span style={{
                      background: st.bg, color: st.color,
                      padding: "4px 12px", borderRadius: 999,
                      fontWeight: 800, fontSize: 11, whiteSpace: "nowrap",
                    }}>{st.label}</span>
                  </div>

                  {/* Precio / contrato */}
                  {contract && (
                    <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#555" }}>
                      📄 Contrato activo · Ref: <strong>{contract.reference_code}</strong> · Alquiler: <strong>${(contract.monthly_rent_ars ?? 0).toLocaleString("es-AR")}/mes</strong>
                    </div>
                  )}

                  {/* Agente asignado */}
                  {agent ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 999,
                        background: "#2D3134", color: "#fff",
                        display: "grid", placeItems: "center",
                        fontWeight: 900, fontSize: 11, flexShrink: 0,
                      }}>
                        {(agent.full_name?.[0] ?? "A").toUpperCase()}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, color: "#888" }}>Agente asignado</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#2D3134" }}>{agent.full_name}</div>
                      </div>
                      {agent.whatsapp && (
                        <a
                          href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hola ${agent.full_name?.split(" ")[0] ?? ""}, te contacto por mi propiedad "${prop.title}" en Pino Galant.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            marginLeft: "auto",
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "#25D366", color: "#fff",
                            padding: "7px 14px", borderRadius: 10,
                            textDecoration: "none", fontWeight: 700, fontSize: 12,
                          }}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#aaa" }}>Sin agente asignado aún.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dejar reseña */}
      {agentIds.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: "#2D3134", margin: "0 0 14px" }}>
            ⭐ Dejá una reseña de tu agente
          </h2>
          <ReviewForm agentIds={agentIds} agents={agents ?? []} reviewerId={data.user.id} existingReviews={myReviews ?? []} />
        </div>
      )}

      {/* Consultar */}
      <div style={{
        marginTop: 28, background: "#fff", border: "1px solid #eee",
        borderRadius: 16, padding: "20px 24px",
      }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#2D3134" }}>
          💬 ¿Necesitás hacer una consulta?
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#555" }}>
          Podés comunicarte directamente con tu agente por WhatsApp o enviarnos un mensaje por la web.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href={`https://wa.me/542954320639?text=${encodeURIComponent("Hola! Soy propietario y quiero hacer una consulta.")}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#25D366", color: "#fff",
              padding: "10px 18px", borderRadius: 10,
              textDecoration: "none", fontWeight: 700, fontSize: 13,
            }}
          >
            💬 WhatsApp Pino Galant
          </a>
          <Link href="/propiedades" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#f4f4f5", color: "#2D3134",
            padding: "10px 18px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}>
            Ver propiedades disponibles
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente inline para el formulario de reseña (server + client action no mix, lo manejamos simple)
function ReviewForm({ agentIds, agents, reviewerId, existingReviews }: {
  agentIds: string[];
  agents: any[];
  reviewerId: string;
  existingReviews: any[];
}) {
  const reviewedAgentIds = new Set(existingReviews.map((r: any) => r.agent_id));
  const pendingAgents = agents.filter(a => !reviewedAgentIds.has(a.id));

  if (pendingAgents.length === 0) {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", fontSize: 14, color: "#15803d" }}>
        ✅ Ya dejaste una reseña para todos tus agentes. ¡Gracias!
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pendingAgents.map(agent => (
        <div key={agent.id} style={{
          background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "16px 18px",
        }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#2D3134", marginBottom: 10 }}>
            Agente: {agent.full_name}
          </div>
          <form action="/api/reviews" method="POST" style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="agent_id" value={agent.id} />
            <input type="hidden" name="reviewer_id" value={reviewerId} />
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Puntuación *</label>
              <select className="input" name="rating" required defaultValue="5" style={{ maxWidth: 200 }}>
                <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                <option value="4">⭐⭐⭐⭐ Muy bueno</option>
                <option value="3">⭐⭐⭐ Bueno</option>
                <option value="2">⭐⭐ Regular</option>
                <option value="1">⭐ Malo</option>
              </select>
            </div>
            <div>
              <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Comentario (opcional)</label>
              <textarea
                className="input"
                name="comment"
                placeholder="Contá tu experiencia con este agente..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: "#B48A73", color: "#fff",
                border: "none", borderRadius: 10,
                padding: "10px 18px", fontSize: 13, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start",
              }}
            >
              Enviar reseña
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
