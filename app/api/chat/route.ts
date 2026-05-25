import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "comisión honorarios cuánto cobran porcentaje",
    a: "Nuestra comisión estándar es del 3% sobre el valor de la operación para ventas, y 1 mes de alquiler para locaciones. En algunos casos especiales puede variar — consultá con tu agente para confirmar.",
  },
  {
    q: "horario atención abren cierran trabajan días",
    a: "Atendemos de lunes a viernes de 9:00 a 18:00hs, y sábados de 9:00 a 13:00hs. Fuera de ese horario podés escribirnos por WhatsApp y te respondemos a la brevedad.",
  },
  {
    q: "documentación requisitos alquilar arrendar inquilino",
    a: "Para alquilar necesitás: DNI, últimos 3 recibos de sueldo o declaración de ingresos, y 1 o 2 garantes (dependiendo del inmueble). En algunos casos aceptamos garantía de seguro de caución.",
  },
  {
    q: "documentación comprar escriturar hipoteca crédito",
    a: "Para comprar: DNI, CUIT/CUIL, origen de fondos (especialmente si es en efectivo), y constancia de CBU si vas a pedir crédito hipotecario. El tiempo de escrituración varía entre 30 y 90 días según el tipo de operación.",
  },
  {
    q: "tasación valor precio cuánto vale",
    a: "Ofrecemos tasaciones gratuitas para propiedades de la zona. Nuestros asesores evalúan ubicación, estado, m², antigüedad y el mercado actual. Escribinos para coordinar una visita.",
  },
  {
    q: "visita mostrar ver propiedad recorrido",
    a: "Podés agendar una visita por WhatsApp o email. Coordinamos horarios de lunes a sábados. Las visitas son sin cargo y podés traer a quien quieras.",
  },
  {
    q: "zona barrio seguridad calidad vida",
    a: "Trabajamos principalmente en Santa Rosa y alrededores en La Pampa. Podemos asesorarte sobre cada barrio: servicios, transporte, escuelas y calidad de vida según tu búsqueda.",
  },
  {
    q: "publicar propiedad vender alquilar propietario",
    a: "Si sos propietario y querés publicar tu propiedad, podés hacerlo desde la sección 'Publicar' en nuestra web o contactarnos directamente. Te asesoramos en precio, difusión y gestión.",
  },
  {
    q: "expensas incluye gastos servicios",
    a: "Cada propiedad especifica sus expensas en la publicación. Las expensas suelen incluir portería, limpieza de espacios comunes y algunos servicios del edificio. Los servicios individuales (luz, gas, agua) son aparte.",
  },
  {
    q: "garantía garante seguro caución",
    a: "Aceptamos garantes propietarios (con el inmueble en la misma provincia), garantías de seguro de caución (SGR), o en algunos casos recibo de jubilación. Consultá con tu agente para el caso específico.",
  },
];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function findFaqAnswer(message: string): string | null {
  const norm = normalize(message);
  for (const faq of FAQS) {
    const keywords = faq.q.split(" ").map(normalize);
    const matches = keywords.filter(kw => norm.includes(kw));
    if (matches.length >= 2) return faq.a;
  }
  return null;
}

async function getPropertyAgent(propertyId: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data: prop } = await admin
      .from("properties")
      .select("agent_id, assigned_agent_id, title")
      .eq("id", propertyId)
      .maybeSingle();

    const agentId = prop?.agent_id ?? prop?.assigned_agent_id;
    if (!agentId) return null;

    const { data: agent } = await admin
      .from("profiles")
      .select("full_name, whatsapp, email, avatar_url")
      .eq("id", agentId)
      .maybeSingle();

    return agent ? { ...agent, propertyTitle: prop?.title } : null;
  } catch {
    return null;
  }
}

async function askClaude(message: string, propertyContext?: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const systemPrompt = `Sos un asistente virtual de Pino Galant, una inmobiliaria en Santa Rosa, La Pampa, Argentina.
Tu rol es responder preguntas frecuentes sobre la inmobiliaria y sus propiedades.
Respondé siempre en español argentino, de forma amable y profesional.
Si la pregunta es sobre algo que no sabés con certeza (precio específico, disponibilidad, detalles técnicos de propiedades), no inventes — decí que lo derive a un agente.
Si la pregunta claramente necesita un agente humano (visita, negociación, documentación específica), respondé brevemente y terminá con: [NECESITA_AGENTE]
Máximo 120 palabras por respuesta.
${propertyContext ? `\nContexto de la propiedad que está viendo el usuario: ${propertyContext}` : ""}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text as string | undefined;
    return text ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string = String(body.message ?? "").trim();
    const propertyId: string | null = body.propertyId ?? null;

    if (!message) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    // 1) Buscar agente de la propiedad (si se envió propertyId)
    const agent = propertyId ? await getPropertyAgent(propertyId) : null;

    // 2) Intentar FAQ local primero (rápido, sin API)
    const faqAnswer = findFaqAnswer(message);
    if (faqAnswer) {
      return NextResponse.json({
        answer: faqAnswer,
        source: "faq",
        needsAgent: false,
      });
    }

    // 3) Intentar Claude AI
    const propertyContext = agent?.propertyTitle
      ? `Título: ${agent.propertyTitle}`
      : undefined;
    const aiAnswer = await askClaude(message, propertyContext);

    if (aiAnswer) {
      const needsAgent = aiAnswer.includes("[NECESITA_AGENTE]");
      const cleanAnswer = aiAnswer.replace("[NECESITA_AGENTE]", "").trim();

      return NextResponse.json({
        answer: cleanAnswer || null,
        source: "ai",
        needsAgent,
        agent: needsAgent && agent ? {
          name: agent.full_name,
          whatsapp: agent.whatsapp,
          email: agent.email,
          avatar_url: agent.avatar_url,
        } : null,
      });
    }

    // 4) Fallback: sin IA ni FAQ → derivar al agente
    return NextResponse.json({
      answer: "No tengo esa información disponible. Te recomiendo contactar a un agente que te puede asesorar mejor.",
      source: "fallback",
      needsAgent: true,
      agent: agent ? {
        name: agent.full_name,
        whatsapp: agent.whatsapp,
        email: agent.email,
        avatar_url: agent.avatar_url,
      } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error interno" }, { status: 500 });
  }
}
