import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Sos un asistente de búsqueda inmobiliaria en Santa Rosa, La Pampa, Argentina.
El usuario describe en lenguaje natural la propiedad que busca.
Tu tarea es extraer los filtros de búsqueda y devolverlos como JSON puro, sin markdown ni texto extra.

Tipos de propiedad disponibles (type):
- "3" = Casa
- "2" = Departamento
- "1" = Terreno
- "7" = Local comercial
- "4" = Quinta
- "9" = Campo

Operación (op):
- "venta" = comprar / adquirir
- "alquiler" = arrendar / rentar

Reglas:
- price_min y price_max en dólares (USD). "100 mil" → 100000.
- q es búsqueda libre de texto (máx 30 chars, opcional).
- Omitir campos que no se mencionen.
- Responder SOLO con el JSON, nada más.

Ejemplo: {"op":"venta","type":"3","price_max":100000}`;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "query requerida" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query.trim() },
      ],
      max_tokens: 128,
      temperature: 0,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let filters: Record<string, string> = {};
    try {
      filters = JSON.parse(clean);
    } catch {
      filters = {};
    }

    return NextResponse.json(filters);
  } catch (e: any) {
    console.error("buscar-ia error:", e);
    return NextResponse.json({ error: e?.message ?? "error interno" }, { status: 500 });
  }
}
