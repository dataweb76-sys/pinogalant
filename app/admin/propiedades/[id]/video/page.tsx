import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTokkoProperty } from "@/lib/tokko";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function saveVideoAction(formData: FormData) {
  "use server";
  const tokkoId = Number(formData.get("tokko_id"));
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const admin = createSupabaseAdminClient();
  if (videoUrl) {
    await admin.from("property_extras").upsert({ tokko_id: tokkoId, video_url: videoUrl, updated_at: new Date().toISOString() });
  } else {
    await admin.from("property_extras").delete().eq("tokko_id", tokkoId);
  }
  redirect("/admin/propiedades");
}

export default async function VideoPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const admin = createSupabaseAdminClient();
  const [prop, extrasRes] = await Promise.all([
    getTokkoProperty(params.id),
    admin.from("property_extras").select("video_url").eq("tokko_id", Number(params.id)).maybeSingle(),
  ]);

  const currentUrl = extrasRes.data?.video_url ?? "";

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
      <Link href="/admin/propiedades" style={{ fontSize: 13, color: "#B48A73", fontWeight: 700, textDecoration: "none" }}>
        ← Volver a propiedades
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "16px 0 4px" }}>Video / Tour virtual</h1>
      <p style={{ color: "#888", fontSize: 14, margin: "0 0 24px" }}>
        {prop?.address ?? `Propiedad #${params.id}`}
      </p>

      <form action={saveVideoAction} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 24 }}>
        <input type="hidden" name="tokko_id" value={params.id} />

        <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>
          URL de YouTube o Matterport
        </label>
        <input
          name="video_url"
          defaultValue={currentUrl}
          placeholder="https://www.youtube.com/watch?v=... o https://my.matterport.com/show/?m=..."
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
            fontSize: 14, boxSizing: "border-box", marginBottom: 16 }}
        />

        {currentUrl && (
          <div style={{ marginBottom: 16, background: "#f9f6f3", borderRadius: 10, padding: 12, fontSize: 13, color: "#555" }}>
            Video actual: <a href={currentUrl} target="_blank" style={{ color: "#B48A73" }}>{currentUrl}</a>
          </div>
        )}

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

        {currentUrl && (
          <button type="submit" name="video_url" value=""
            style={{ width: "100%", marginTop: 10, padding: "9px 0", borderRadius: 10,
              border: "1.5px solid #fca5a5", background: "#fff", color: "#dc2626",
              cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            Eliminar video
          </button>
        )}
      </form>

      <div style={{ marginTop: 16, fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
        Formatos soportados: YouTube (youtube.com/watch o youtu.be), Matterport (my.matterport.com) o cualquier URL de iframe.
      </div>
    </div>
  );
}
