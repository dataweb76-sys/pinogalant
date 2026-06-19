import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTokkoProperty } from "@/lib/tokko";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function saveExtrasAction(formData: FormData) {
  "use server";
  const tokkoId = Number(formData.get("tokko_id"));
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim() || null;
  const admin = createSupabaseAdminClient();

  if (videoUrl || badge) {
    await admin.from("property_extras").upsert({
      tokko_id: tokkoId,
      video_url: videoUrl || null,
      badge,
      updated_at: new Date().toISOString(),
    });
  } else {
    await admin.from("property_extras").delete().eq("tokko_id", tokkoId);
  }
  redirect("/admin/propiedades");
}

const BADGES = [
  { value: "",               label: "Sin cartel" },
  { value: "valor_ajustado", label: "💰 Valor ajustado" },
  { value: "permuta",        label: "🔄 Permuta" },
  { value: "reservado",      label: "🔒 Reservado" },
];

export default async function VideoPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const admin = createSupabaseAdminClient();
  const [prop, extrasRes] = await Promise.all([
    getTokkoProperty(params.id),
    admin.from("property_extras").select("video_url, badge").eq("tokko_id", Number(params.id)).maybeSingle(),
  ]);

  const currentUrl = extrasRes.data?.video_url ?? "";
  const currentBadge = extrasRes.data?.badge ?? "";

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/propiedades" style={{ fontSize: 13, color: "#B48A73", fontWeight: 700, textDecoration: "none" }}>
        ← Volver a propiedades
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "16px 0 4px" }}>Extras de propiedad</h1>
      <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>
        {prop?.address ?? `Propiedad #${params.id}`}
      </p>

      <form action={saveExtrasAction} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <input type="hidden" name="tokko_id" value={params.id} />

        {/* Badge */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 8 }}>
            Cartel destacado
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {BADGES.map(b => (
              <label key={b.value} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: `2px solid ${currentBadge === b.value ? "#2D3134" : "#e5e7eb"}`,
                background: currentBadge === b.value ? "#2D3134" : "#fff",
                color: currentBadge === b.value ? "#fff" : "#444",
                cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>
                <input type="radio" name="badge" value={b.value} defaultChecked={currentBadge === b.value}
                  style={{ display: "none" }} />
                {b.label}
              </label>
            ))}
          </div>
        </div>

        {/* Video URL */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
            URL de Video / Tour virtual
          </label>
          <input
            name="video_url"
            defaultValue={currentUrl}
            placeholder="https://www.youtube.com/watch?v=... o https://my.matterport.com/show/?m=..."
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
              fontSize: 14, boxSizing: "border-box" }}
          />
          {currentUrl && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              Actual: <a href={currentUrl} target="_blank" style={{ color: "#B48A73" }}>{currentUrl}</a>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/propiedades"
            style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 10,
              border: "1.5px solid #ddd", background: "#fff", textDecoration: "none",
              color: "#444", fontWeight: 700, fontSize: 14 }}>
            Cancelar
          </Link>
          <button type="submit"
            style={{ flex: 2, padding: "11px 0", borderRadius: 10, background: "#2D3134",
              color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
