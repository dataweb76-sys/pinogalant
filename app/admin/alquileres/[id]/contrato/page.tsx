import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateContractHTML } from "@/lib/contract/template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminContratoHTMLPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/admin/alquileres/${params.id}/contrato`);

  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!["admin", "super_admin"].includes(me.data?.role ?? "")) redirect("/admin?error=not_admin");

  const { data: contract } = await admin
    .from("rental_contracts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!contract) redirect("/admin/alquileres?error=Contrato+no+encontrado");

  const [propRes, tenantRes, agentRes] = await Promise.all([
    admin.from("properties").select("*").eq("id", contract.property_id).maybeSingle(),
    admin.from("profiles").select("full_name,email,phone,whatsapp,address").eq("id", contract.tenant_id).maybeSingle(),
    contract.agent_id
      ? admin.from("profiles").select("full_name").eq("id", contract.agent_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const prop   = propRes.data;
  const tenant = tenantRes.data;
  const agent  = agentRes.data;

  // Construir datos para el template
  const snap = contract.property_snapshot as any ?? {};
  const tsnap = contract.tenant_snapshot as any ?? {};

  const html = generateContractHTML({
    referenceCode: contract.reference_code ?? params.id,
    startDate: new Date(contract.start_date),
    endDate:   new Date(contract.end_date),

    landlordName:    "Pino Galant Inmobiliaria",
    landlordDni:     "30-XXXXXXXX-X",
    landlordAddress: "Av. Ejemplo 1234, Ciudad",

    tenantName:    tenant?.full_name   ?? tsnap.full_name   ?? "—",
    tenantDni:     tsnap.dni           ?? "—",
    tenantAddress: tenant?.phone       ?? tsnap.phone       ?? "—",

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
    durationMonths:   contract.duration_months   ??
      Math.round((new Date(contract.end_date).getTime() - new Date(contract.start_date).getTime()) / (30.44 * 86400000)),

    priceIncreasePct:    contract.price_increase_pct    ?? 0,
    priceIncreaseMonths: contract.price_increase_months ?? 4,

    additionalClauses: contract.additional_clauses ?? undefined,

    tenantAgreedAt: contract.tenant_agreed_at ? new Date(contract.tenant_agreed_at) : undefined,
    tenantIp:       contract.tenant_ip ?? undefined,
  });

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <a href={`/admin/alquileres/${params.id}`}
          style={{ fontSize: 13, color: "#B48A73", textDecoration: "none", fontWeight: 700 }}>
          ← Volver al contrato
        </a>
        <span style={{ color: "#ccc" }}>|</span>
        <span style={{ fontSize: 13, color: "#888" }}>
          Vista del contrato — {contract.reference_code}
        </span>
        <button
          onClick={() => {}}
          style={{
            marginLeft: "auto",
            background: "#2D3134", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
          // Print is triggered from client; we embed a print button via dangerouslySetInnerHTML
        >
          🖨️ Imprimir
        </button>
      </div>

      {/* Render the contract HTML */}
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}
      />
    </div>
  );
}
