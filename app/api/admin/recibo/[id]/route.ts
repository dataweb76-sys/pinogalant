import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function formatARS(n?: number | null) {
  if (!n) return "$ 0";
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const METHOD_LABELS: Record<string, string> = {
  office: "En oficina", transfer: "Transferencia bancaria", online: "Online", mercadopago: "MercadoPago",
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Auth
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const me = await admin.from("profiles").select("role,full_name").eq("id", data.user.id).maybeSingle();
  if (!["admin","super_admin"].includes(me.data?.role ?? ""))
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  // Datos del pago
  const { data: payment } = await admin
    .from("rental_payments")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  const { data: contract } = await admin
    .from("rental_contracts")
    .select("*, rental_properties(title,address,city,owner_name,commission_pct)")
    .eq("id", payment.contract_id)
    .maybeSingle();
  if (!contract) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });

  const { data: tenant } = await admin
    .from("profiles")
    .select("full_name,email,phone,whatsapp")
    .eq("id", contract.tenant_id)
    .maybeSingle();

  const rentalProp = (contract as any).rental_properties;
  const propTitle   = rentalProp?.title ?? (contract.property_snapshot as any)?.title ?? "Inmueble";
  const propAddress = rentalProp?.address ?? (contract.property_snapshot as any)?.address ?? "";
  const propCity    = rentalProp?.city ?? (contract.property_snapshot as any)?.city ?? "";

  const periodStr = `${MONTHS[payment.period_month]} ${payment.period_year}`;
  const paidDate  = payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("es-AR") : "—";
  const methodStr = METHOD_LABELS[payment.payment_method ?? ""] ?? payment.payment_method ?? "—";

  // Generar PDF con PDFKit
  const PDFDocument = (await import("pdfkit")).default;
  const fs = await import("fs");
  const path = await import("path");

  const fontRegular = "C:/Windows/Fonts/arial.ttf";
  const fontBold    = "C:/Windows/Fonts/arialbd.ttf";

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.registerFont("Regular", fontRegular);
  doc.registerFont("Bold",    fontBold);

  const W = 595 - 100; // usable width
  const dark = "#2D3134";
  const accent = "#B48A73";
  const lightGray = "#F5F5F5";

  // ─── RECIBO ORIGINAL (parte superior) ─────────────────────
  function drawRecibo(yStart: number, copy: string) {
    let y = yStart;

    // Fondo header
    doc.rect(50, y, W, 60).fill(dark);
    doc.fillColor("#fff").font("Bold").fontSize(18).text("PINO GALANT INMOBILIARIA", 60, y + 10);
    doc.font("Regular").fontSize(10).text("Gestión de Propiedades | General Pico, La Pampa", 60, y + 32);
    doc.font("Bold").fontSize(11).text(`RECIBO DE ALQUILER — ${copy}`, 60, y + 46);

    y += 70;

    // Ref + fecha
    doc.fillColor(dark).font("Bold").fontSize(11).text(`Contrato: ${contract.reference_code}`, 50, y);
    const dateStr = new Date().toLocaleDateString("es-AR");
    doc.font("Regular").fontSize(10).text(`Emitido: ${dateStr}`, 400, y, { width: 145, align: "right" });

    y += 18;

    // Nombre inquilino + período
    doc.font("Bold").fontSize(13).text(`Período: ${periodStr}`, 50, y);
    y += 16;
    doc.font("Regular").fontSize(11).text(`Inquilino: ${tenant?.full_name ?? "—"}`, 50, y);
    y += 14;
    doc.font("Regular").fontSize(11).text(`Inmueble: ${propTitle} — ${propAddress}, ${propCity}`, 50, y);
    y += 20;

    // Línea divisoria
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ccc").lineWidth(1).stroke();
    y += 14;

    // Detalle de pago
    const items = [
      { label: "Alquiler base", amount: payment.base_amount_ars ?? 0 },
      ...(payment.expenses_ars > 0 ? [{ label: "Expensas", amount: payment.expenses_ars }] : []),
      ...(payment.surcharge_ars > 0 ? [{ label: "Recargo por mora", amount: payment.surcharge_ars }] : []),
      ...(payment.discount_ars > 0 ? [{ label: "Descuento", amount: -(payment.discount_ars) }] : []),
    ];

    doc.rect(50, y, W, 20).fill(lightGray);
    doc.fillColor(dark).font("Bold").fontSize(10).text("CONCEPTO", 58, y + 5);
    doc.font("Bold").fontSize(10).text("IMPORTE", 450, y + 5, { width: 90, align: "right" });
    y += 22;

    for (const item of items) {
      doc.font("Regular").fontSize(11).fillColor(dark).text(item.label, 58, y);
      doc.font("Regular").fontSize(11).text(formatARS(item.amount), 400, y, { width: 140, align: "right" });
      y += 16;
    }

    y += 4;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#ccc").lineWidth(0.5).stroke();
    y += 8;

    // Total
    doc.rect(380, y, 165, 24).fill(dark);
    doc.fillColor("#fff").font("Bold").fontSize(13)
       .text(`TOTAL: ${formatARS(payment.total_ars)}`, 385, y + 5, { width: 155, align: "right" });
    y += 34;

    // Pago
    doc.fillColor(dark).font("Regular").fontSize(10)
       .text(`Fecha de pago: ${paidDate}   |   Forma de pago: ${methodStr}`, 50, y);
    if (payment.payment_notes) {
      y += 13;
      doc.font("Regular").fontSize(9).fillColor("#666").text(`Obs: ${payment.payment_notes}`, 50, y);
    }
    y += 22;

    // Vto. pago
    doc.font("Regular").fontSize(10).fillColor(dark)
       .text(`Vencimiento original: ${payment.due_date}`, 50, y);
    y += 18;

    // Firma
    doc.moveTo(50, y + 30).lineTo(230, y + 30).strokeColor(dark).lineWidth(0.5).stroke();
    doc.font("Regular").fontSize(9).fillColor("#888").text("Firma inmobiliaria", 50, y + 33, { width: 180, align: "center" });

    doc.moveTo(330, y + 30).lineTo(510, y + 30).strokeColor(dark).lineWidth(0.5).stroke();
    doc.font("Regular").fontSize(9).fillColor("#888").text("Firma inquilino", 330, y + 33, { width: 180, align: "center" });

    y += 55;

    // Copy label
    doc.font("Bold").fontSize(9).fillColor(accent)
       .text(copy.toUpperCase(), 50, y, { width: W, align: "center" });

    return y;
  }

  drawRecibo(50, "ORIGINAL INMOBILIARIA");

  // Línea de corte
  doc.moveTo(50, 395).lineTo(545, 395).dash(4, { space: 4 }).strokeColor("#aaa").lineWidth(0.5).stroke();
  doc.undash();
  doc.font("Regular").fontSize(8).fillColor("#bbb").text("- - - RECORTAR - - -", 50, 398, { width: W, align: "center" });

  drawRecibo(410, "DUPLICADO INQUILINO");

  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const filename = `recibo-${contract.reference_code}-${periodStr.replace(/\s/g, "-")}.pdf`;
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
