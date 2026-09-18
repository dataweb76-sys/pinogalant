import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function formatARS(n?: number | null) {
  if (!n && n !== 0) return "$ 0,00";
  return "$ " + (n ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// GET /api/admin/liquidacion/[contractId]?year=2024&month=9
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role,full_name").eq("id", data.user.id).maybeSingle();
  if (!["admin","super_admin"].includes(me.data?.role ?? ""))
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const { data: contract } = await admin
    .from("rental_contracts")
    .select("*, rental_properties(*)")
    .eq("id", params.id)
    .maybeSingle();
  if (!contract) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });

  const { data: tenant } = await admin.from("profiles")
    .select("full_name,phone,email").eq("id", contract.tenant_id).maybeSingle();

  // Pagos del período
  const { data: payments } = await admin.from("rental_payments")
    .select("*")
    .eq("contract_id", params.id)
    .eq("period_year", year)
    .eq("period_month", month);

  const payment = payments?.[0];
  const rentalProp = (contract as any).rental_properties;
  const propTitle   = rentalProp?.title ?? (contract.property_snapshot as any)?.title ?? "Inmueble";
  const propAddress = rentalProp?.address ?? (contract.property_snapshot as any)?.address ?? "";
  const propCity    = rentalProp?.city ?? (contract.property_snapshot as any)?.city ?? "";
  const ownerName   = rentalProp?.owner_name ?? "Propietario";
  const ownerCBU    = rentalProp?.owner_cbu ?? "";
  const ownerAlias  = rentalProp?.owner_alias ?? "";
  const commissionPct = rentalProp?.commission_pct ?? 5;

  const alquilerCobrado = payment?.total_ars ?? contract.monthly_rent_ars ?? 0;
  const comisionAmt     = Math.round(alquilerCobrado * commissionPct / 100);
  const liquidacionNeta = alquilerCobrado - comisionAmt;
  const iva             = Math.round(comisionAmt * 0.21);
  const comisionTotal   = comisionAmt + iva;
  const netoPropietario = alquilerCobrado - comisionTotal;

  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.registerFont("Regular", "C:/Windows/Fonts/arial.ttf");
  doc.registerFont("Bold",    "C:/Windows/Fonts/arialbd.ttf");

  const W    = 595 - 100;
  const dark = "#2D3134";
  const accent = "#B48A73";

  // Header
  doc.rect(50, 50, W, 65).fill(dark);
  doc.fillColor("#fff").font("Bold").fontSize(18).text("PINO GALANT INMOBILIARIA", 60, 60);
  doc.font("Regular").fontSize(10).text("Gestión de Propiedades | General Pico, La Pampa", 60, 82);
  doc.font("Bold").fontSize(13).text("LIQUIDACION DE ALQUILER", 60, 97);

  let y = 130;

  // Info general
  doc.fillColor(dark).font("Bold").fontSize(11)
     .text(`Período: ${MONTHS[month]} ${year}`, 50, y);
  doc.font("Regular").fontSize(10)
     .text(`Contrato: ${contract.reference_code}   |   Emitida: ${new Date().toLocaleDateString("es-AR")}`, 300, y, { width: 245, align: "right" });
  y += 20;

  doc.font("Regular").fontSize(11).text(`Propietario: ${ownerName}`, 50, y);
  y += 14;
  doc.font("Regular").fontSize(11).text(`Inmueble: ${propTitle} — ${propAddress}, ${propCity}`, 50, y);
  y += 14;
  doc.font("Regular").fontSize(11).text(`Inquilino: ${tenant?.full_name ?? "—"}`, 50, y);
  y += 22;

  doc.moveTo(50, y).lineTo(545, y).strokeColor("#ccc").lineWidth(1).stroke();
  y += 14;

  // Tabla liquidación
  doc.rect(50, y, W, 20).fill("#F5F5F5");
  doc.fillColor(dark).font("Bold").fontSize(10).text("CONCEPTO", 58, y + 5);
  doc.font("Bold").fontSize(10).text("IMPORTE", 430, y + 5, { width: 110, align: "right" });
  y += 22;

  const rows = [
    { label: `Alquiler cobrado — ${MONTHS[month]} ${year}`, amount: alquilerCobrado, bold: false },
    { label: `Expensas cobradas`, amount: payment?.expenses_ars ?? 0, bold: false },
  ];
  if (payment?.surcharge_ars > 0) {
    rows.push({ label: "Recargo por mora cobrado", amount: payment.surcharge_ars, bold: false });
  }

  for (const r of rows) {
    doc.font(r.bold ? "Bold" : "Regular").fontSize(11).fillColor(dark).text(r.label, 58, y);
    doc.font(r.bold ? "Bold" : "Regular").fontSize(11).text(formatARS(r.amount), 380, y, { width: 160, align: "right" });
    y += 16;
  }

  y += 6;
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#ddd").lineWidth(0.5).stroke();
  y += 10;

  // Deducciones
  doc.font("Bold").fontSize(10).fillColor("#666").text("DEDUCCIONES", 58, y);
  y += 16;

  const deducciones = [
    { label: `Honorarios inmobiliaria (${commissionPct}%)`, amount: -comisionAmt },
    { label: "IVA sobre honorarios (21%)", amount: -iva },
  ];

  for (const d of deducciones) {
    doc.font("Regular").fontSize(11).fillColor(dark).text(d.label, 58, y);
    doc.font("Regular").fontSize(11).fillColor("#dc2626").text(formatARS(d.amount), 380, y, { width: 160, align: "right" });
    y += 16;
  }

  y += 6;
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#ccc").lineWidth(1).stroke();
  y += 12;

  // Total neto
  doc.rect(50, y, W, 30).fill(dark);
  doc.fillColor("#fff").font("Bold").fontSize(14)
     .text("NETO A LIQUIDAR AL PROPIETARIO:", 58, y + 8);
  doc.font("Bold").fontSize(14)
     .text(formatARS(netoPropietario), 380, y + 8, { width: 160, align: "right" });
  y += 42;

  // Estado del pago
  if (payment) {
    const paidStr = payment.status === "paid"
      ? `PAGADO el ${new Date(payment.paid_at).toLocaleDateString("es-AR")}`
      : "PENDIENTE DE COBRO";
    const paidColor = payment.status === "paid" ? "#15803d" : "#dc2626";
    doc.fillColor(paidColor).font("Bold").fontSize(11).text(`Estado: ${paidStr}`, 50, y);
    y += 16;
  }

  y += 14;

  // Datos de transferencia
  if (ownerCBU || ownerAlias) {
    doc.rect(50, y, W, 50).fill("#f0fdf4").strokeColor("#bbf7d0").lineWidth(1).stroke();
    doc.fillColor("#15803d").font("Bold").fontSize(11).text("Datos para transferencia al propietario:", 58, y + 8);
    if (ownerCBU) doc.font("Regular").fontSize(10).text(`CBU: ${ownerCBU}`, 58, y + 22);
    if (ownerAlias) doc.font("Regular").fontSize(10).text(`Alias: ${ownerAlias}`, 58 + (ownerCBU ? 240 : 0), y + 22);
    y += 60;
  }

  y += 20;

  // Firma
  doc.moveTo(50, y).lineTo(220, y).strokeColor(dark).lineWidth(0.5).stroke();
  doc.font("Regular").fontSize(9).fillColor("#888").text("Firma Pino Galant", 50, y + 4, { width: 170, align: "center" });

  doc.moveTo(325, y).lineTo(495, y).strokeColor(dark).lineWidth(0.5).stroke();
  doc.font("Regular").fontSize(9).fillColor("#888").text("Recibí conforme", 325, y + 4, { width: 170, align: "center" });

  y += 40;
  doc.font("Regular").fontSize(8).fillColor("#bbb")
     .text("Documento generado por el sistema de gestión Pino Galant — pinogalant.com.ar", 50, y, { width: W, align: "center" });

  doc.end();
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const filename = `liquidacion-${contract.reference_code}-${MONTHS[month]}-${year}.pdf`;
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
