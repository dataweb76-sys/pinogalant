export const runtime = "nodejs";
export const preferredRegion = ["gru1"];

export async function GET() {
  const key = process.env.TOKKO_API_KEY;
  if (!key) return Response.json({ error: "TOKKO_API_KEY no definida" }, { status: 500 });

  try {
    // Intento 1: request normal
    const res1 = await fetch(
      `https://www.tokkobroker.com/api/v1/property/?key=${key}&limit=2&format=json`,
      { cache: "no-store" }
    );
    const text1 = await res1.text();

    // Intento 2: con headers de browser
    const res2 = await fetch(
      `https://www.tokkobroker.com/api/v1/property/?key=${key}&limit=2&format=json`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://pinogalant.vercel.app/",
          "Accept": "application/json",
        }
      }
    );
    const text2 = await res2.text();

    return Response.json({
      keyLength: key.length,
      keyPreview: key.slice(0, 8) + "...",
      attempt1: { status: res1.status, body: text1.slice(0, 300) },
      attempt2: { status: res2.status, body: text2.slice(0, 300) },
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
