import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateContractHTML } from "@/lib/contract/template";
import ContratoFirmaClient from "./firma.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MiContratoPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/mi-alquiler/contrato");

  const admin = createSupabaseAdminClient();

  // Buscar el contrato activo (o más reciente) del inquilino
  const { data: contract } = await admin
    .from("rental_contracts")
    .select("*")
    .eq("tenant_id", data.user.id)
    .not("status", "eq", "terminated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contract) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#2D3134" }}>
          No hay contrato disponible
        </h2>
        <p style={{ color: "#888" }}>Aún no tenés un contrato asignado. Contactá a la inmobiliaria.</p>
      </div>
    );
  }

  const [propRes, agentRes] = await Promise.all([
    admin.from("properties").select("*").eq("id", contract.property_id).maybeSingle(),
    contract.agent_id
      ? admin.from("profiles").select("full_name").eq("id", contract.agent_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const prop  = propRes.data;
  const agent = agentRes.data;
  const snap  = contract.property_snapshot as any ?? {};
  const tsnap = contract.tenant_snapshot   as any ?? {};

  const html = generateContractHTML({
    referenceCode: contract.reference_code ?? contract.id,
    startDate: new Date(contract.start_date),
    endDate:   new Date(contract.end_date),

    landlordName:    "Pino Galant Inmobiliaria",
    landlordDni:     "30-XXXXXXXX-X",
    landlordAddress: "Av. Ejemplo 1234, Ciudad",

    tenantName:    tsnap.full_name ?? "—",
    tenantDni:     tsnap.dni ?? "—",
    tenantAddress: tsnap.phone ?? "—",

    agentName: agent?.full_name ?? undefined,

    propertyAddress:     prop?.address      ?? snap.address    ?? "—",
    propertyCity:        prop?.city         ?? snap.city       ?? "—",
    propertyProvince:    prop?.province     ?? snap.province   ?? "—",
    propertyDescription: prop?.description  ?? snap.description ?? "",
    propertyType:        prop?.type         ?? snap.type       ?? "Inmueble",
    propertyRooms:       prop?.rooms        ?? snap.rooms,
    propertyBathrooms:   prop?.bathrooms    ?? snap.bathrooms,
    propertyM2:          prop?.area_m2      ?? snap.area_m2,

    monthlyRentArs:      contract.monthly_rent_ars  ?? 0,
    monthlyRentUsd:      contract.monthly_rent_usd  ?? undefined,
    expensesArs:         contract.expenses_ars       ?? 0,
    depositMonths:       1,
    depositAmountArs:    contract.deposit_amount_ars ?? 0,
    taxesIncluded:       contract.taxes_included      ?? false,
    waterIncluded:       contract.water_included       ?? false,
    gasIncluded:         contract.gas_included         ?? false,
    electricityIncluded: contract.electricity_included ?? false,

    paymentDueDay:    contract.payment_due_day   ?? 5,
    gracePeriodDays:  contract.grace_period_days ?? 3,
    durationMonths:   Math.round(
      (new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime())
      / (30.44 * 86400000)
    ),

    priceIncreasePct:    contract.price_increase_pct    ?? 0,
    priceIncreaseMonths: contract.price_increase_months ?? 4,

    additionalClauses: contract.additional_clauses ?? undefined,

    tenantAgreedAt: contract.tenant_agreed_at ? new Date(contract.tenant_agreed_at) : undefined,
    tenantIp:       contract.tenant_ip ?? undefined,
  });

  const canSign   = contract.status === "pending_tenant";
  const alreadySigned = !!contract.tenant_agreed_at;

  return (
    <div>
      {/* Header info */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#B48A73", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Contrato de alquiler
        </div>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#2D3134" }}>
          {prop?.title ?? "Tu propiedad"}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
          Ref: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{contract.reference_code}</span>
          {" · "}{contract.start_date} → {contract.end_date}
        </p>
      </div>

      {/* Estado / acción de firma */}
      {alreadySigned ? (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, color: "#15803d", fontSize: 14 }}>Contrato firmado</div>
            <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
              Firmaste el {new Date(contract.tenant_agreed_at).toLocaleString("es-AR")} —{" "}
              {contract.status === "pending_admin"
                ? "Esperando confirmación de la inmobiliaria."
                : contract.status === "active"
                ? "Contrato activo ✓"
                : ""}
            </div>
          </div>
        </div>
      ) : canSign ? (
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
        }}>
          <div style={{ fontWeight: 800, color: "#92400e", fontSize: 14, marginBottom: 4 }}>
            ✍️ Revisá y firmá el contrato
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#92400e" }}>
            Leé el contrato con atención. Al hacer clic en "Aceptar y firmar", quedará registrado tu acuerdo digital con fecha, hora e IP.
          </p>
          {/* Client component con el botón de firma */}
          <ContratoFirmaClient contractId={contract.id} />
        </div>
      ) : contract.status === "draft" ? (
        <div style={{
          background: "#f3f4f6", border: "1px solid #e5e7eb",
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
        }}>
          <div style={{ fontWeight: 700, color: "#555", fontSize: 13 }}>
            ⏳ El contrato está siendo preparado. Te avisaremos cuando esté listo para firmar.
          </div>
        </div>
      ) : null}

      {/* Contract HTML */}
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 8px rgba(0,0,0,.06)",
        }}
      />

      {/* Repetir botón de firma abajo */}
      {canSign && !alreadySigned && (
        <div style={{ marginTop: 20 }}>
          <ContratoFirmaClient contractId={contract.id} />
        </div>
      )}
    </div>
  );
}
