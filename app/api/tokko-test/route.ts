export const runtime = "nodejs";
export const preferredRegion = ["gru1"];

export async function GET() {
  const key = process.env.TOKKO_API_KEY;
  if (!key) return Response.json({ error: "TOKKO_API_KEY no definida" }, { status: 500 });

  try {
    const res = await fetch(
      `https://www.tokkobroker.com/api/v1/property/?key=${key}&limit=2&format=json`,
      { cache: "no-store" }
    );
    const text = await res.text();
    return Response.json({ status: res.status, ok: res.ok, preview: text.slice(0, 500) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
