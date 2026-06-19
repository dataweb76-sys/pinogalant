import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllTokkoProperties, tokkoOperation, tokkoType, tokkoPrice } from "@/lib/tokko";

export const runtime = "nodejs";

// Disparar con: GET /api/notify-alerts?secret=TU_CRON_SECRET
// O configurar como cron en vercel.json
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY no configurada" }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();

  // Propiedades nuevas (últimas 24hs en Tokko)
  const props = await getAllTokkoProperties().catch(() => []);
  const hace24hs = new Date(Date.now() - 86400000);
  const nuevas = props.filter(p => new Date((p as any).created_at ?? 0) > hace24hs);

  if (nuevas.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, msg: "Sin propiedades nuevas" });
  }

  // Suscriptores activos con email
  const { data: alertas } = await admin
    .from("property_alerts")
    .select("*")
    .eq("is_active", true)
    .not("email", "is", null);

  if (!alertas?.length) {
    return NextResponse.json({ ok: true, sent: 0, msg: "Sin suscriptores" });
  }

  let enviados = 0;

  for (const alerta of alertas) {
    // Filtrar propiedades que coincidan con la alerta
    const matches = nuevas.filter(p => {
      const op = tokkoOperation(p);
      if (alerta.operation !== "ambas" && op !== alerta.operation) return false;
      if (alerta.type_name && tokkoType(p) !== alerta.type_name) return false;
      if (alerta.price_max) {
        const pr = tokkoPrice(p);
        if (pr && pr.currency !== "USD" && pr.amount > alerta.price_max) return false;
      }
      return true;
    });

    if (matches.length === 0) continue;

    const propsList = matches.slice(0, 5).map(p => {
      const pr = tokkoPrice(p);
      const priceStr = pr ? ` · ${pr.currency === "USD" ? "USD" : "$"} ${pr.amount.toLocaleString("es-AR")}` : "";
      return `<li style="margin-bottom:8px"><a href="https://pinogalant.com.ar/propiedades/${p.id}" style="color:#B48A73;font-weight:700">${p.address}</a>${priceStr}</li>`;
    }).join("");

    const html = `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#2D3134;padding:24px;border-radius:12px 12px 0 0;text-align:center">
    <img src="https://pinogalant.com.ar/logo.png" style="height:50px;object-fit:contain" alt="Pino Galant" />
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #eee;border-radius:0 0 12px 12px">
    <h2 style="color:#2D3134;margin:0 0 8px">Hola ${alerta.name} 👋</h2>
    <p style="color:#555;margin:0 0 20px">
      Entraron <strong>${matches.length} propiedad${matches.length !== 1 ? "es" : ""} nueva${matches.length !== 1 ? "s" : ""}</strong> que pueden interesarte:
    </p>
    <ul style="padding-left:18px;color:#444;line-height:1.8">
      ${propsList}
    </ul>
    ${matches.length > 5 ? `<p style="color:#888;font-size:13px">Y ${matches.length - 5} más...</p>` : ""}
    <a href="https://pinogalant.com.ar/propiedades"
       style="display:block;text-align:center;margin-top:20px;padding:13px;background:#B48A73;color:#fff;border-radius:10px;font-weight:800;text-decoration:none">
      Ver todas las propiedades →
    </a>
    <p style="font-size:11px;color:#bbb;text-align:center;margin-top:20px">
      Recibís esto porque te suscribiste a alertas en Pino Galant.<br>
    </p>
  </div>
</div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Pino Galant <alertas@pinogalant.com.ar>",
        to: alerta.email,
        subject: `${matches.length} propiedad${matches.length !== 1 ? "es" : ""} nueva${matches.length !== 1 ? "s" : ""} para vos — Pino Galant`,
        html,
      }),
    });
    enviados++;
  }

  return NextResponse.json({ ok: true, sent: enviados, nuevas: nuevas.length });
}
