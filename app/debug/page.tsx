export default function DebugPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  let ref = "";
  try {
    if (key.includes(".")) {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString("utf-8"));
      ref = payload?.ref ?? "";
    }
  } catch {}

  return (
    <div className="card">
      <h1>Debug</h1>
      <p className="small"><b>URL:</b> {url || "❌ VACÍO"}</p>
      <p className="small"><b>ANON KEY:</b> {key ? `✅ OK (len=${key.length})` : "❌ VACÍO"}</p>
      <p className="small"><b>ref (proyecto):</b> {ref || "❌ NO"}</p>
    </div>
  );
}
