import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

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
- "venta" = comprar / adquirir
- "alquiler" = arrendar / rentar

Reglas:
- price_min y price_max son en dólares (USD). Si el usuario dice "100 mil" → 100000.
- q es una cadena de búsqueda libre para dirección o características extra (máx 30 caracteres, puede ser vacío).
- Si no se menciona algún campo, omitirlo del JSON (no poner null).
- Responder SOLO con el JSON, sin texto adicional, sin markdown, sin bloques de código.

Ejemplo de respuesta:
{"op":"venta","type":"3","price_max":100000}`;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "query requerida" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nBúsqueda: ${query.trim()}`);
    const text = result.response.text().trim();

    // Limpiar posibles bloques markdown que Gemini agrega a veces
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
