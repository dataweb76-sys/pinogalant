"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PublicarMediaPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const ext = file.name.split(".").pop();
        const filePath = `${params.id}/${crypto.randomUUID()}.${ext}`;

        // 1️⃣ Subir a Storage
        const { error: uploadError } = await supabase.storage
          .from("property-media")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2️⃣ URL pública
        const { data } = supabase.storage
          .from("property-media")
          .getPublicUrl(filePath);

        // 3️⃣ Tipo de media
        const kind = file.type.startsWith("image")
          ? "image"
          : file.type.startsWith("video")
          ? "video"
          : "plan";

        // 4️⃣ Guardar referencia en DB
        const { error: dbError } = await supabase
          .from("property_media")
          .insert({
            property_id: params.id,
            kind,
            url: data.publicUrl,
            sort_order: i,
          });

        if (dbError) throw dbError;
      }

      alert("Archivos subidos correctamente");
    } catch (err: any) {
      console.error(err);
      setError("Error subiendo archivos. Intentalo nuevamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ marginBottom: 8 }}>
        Subir imágenes, videos o planos
      </h1>

      <p className="small" style={{ opacity: 0.7 }}>
        Estos archivos se mostrarán en la publicación cuando un agente la apruebe.
      </p>

      <section className="card" style={{ padding: 20, marginTop: 16 }}>
        <label style={{ fontWeight: 700 }}>
          Seleccioná los archivos
        </label>

        <input
          type="file"
          multiple
          accept="image/*,video/*,.pdf"
          onChange={handleUpload}
          className="input"
          disabled={uploading}
        />

        {uploading && (
          <div className="small" style={{ marginTop: 10 }}>
            Subiendo archivos…
          </div>
        )}

        {error && (
          <div style={{ color: "crimson", marginTop: 10 }}>
            {error}
          </div>
        )}
      </section>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Link className="btn" href="/publicar">
          ← Volver
        </Link>

        <button
          className="btn btnPrimary"
          onClick={() => router.push("/")}
        >
          Finalizar publicación
        </button>
      </div>
    </main>
  );
}
