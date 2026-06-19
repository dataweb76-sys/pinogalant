import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sos un asistente de búsqueda inmobiliaria en Santa Rosa, La Pampa, Argentina.
El usuario describe en lenguaje natural la propiedad que busca.
Tu tarea es extraer los filtros de búsqueda y devolverlos como JSON.

Tipos de propiedad disponibles (type):
- "3" = Casa
- "2" = Departamento
- "1" = Terreno
- "7" = Local comercial
- "4" = Quinta
- "9" = Campo

Operación (op):
- "venta" = comprar / adquirir / Sale
- "alquiler" = arrendar / rentar / Rent

Reglas:
- price_min y price_max son en dólares (USD). Si el usuario dice "100 mil" → 100000.
- q es una cadena de búsqueda libre para dirección o características extra (máx 30 caracteres, puede ser vacío).
- Si no se menciona algún campo, omitirlo del JSON (no poner null).
- Responder SOLO con el JSON, sin texto adicional.

Ejemplo de respuesta:
{"op":"venta","type":"3","price_max":100000}`;

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "query requerida" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: query.trim() }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let filters: Record<string, string> = {};
  try {
    filters = JSON.parse(text);
  } catch {
    // Si Claude no devolvió JSON válido, devolver objeto vacío
    filters = {};
  }

  return NextResponse.json(filters);
}
