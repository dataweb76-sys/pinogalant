"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function MediaUploader({ propertyId }: { propertyId: string }) {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload(kind: "image" | "video" | "plan", file: File) {
    setMsg(null);
    setLoading(true);

    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const key = `${propertyId}/${crypto.randomUUID()}_${safeName}`;
      const bucket = "property-media";

      const up = await supabase.storage.from(bucket).upload(key, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

      if (up.error) throw new Error(`Storage: ${up.error.message}`);

      const pub = supabase.storage.from(bucket).getPublicUrl(key);
      const url = pub.data.publicUrl;
      if (!url) throw new Error("No se pudo obtener la URL pública.");

      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("url", url);
      fd.append("sort_order", "0");

      const res = await fetch(`/admin/propiedades/${propertyId}/media`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        await supabase.storage.from(bucket).remove([key]);
        throw new Error(json?.error || "No se pudo guardar en property_media.");
      }

      setMsg("✅ Archivo subido y guardado.");
      router.refresh();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="small" style={{ color: "#666" }}>
        Bucket: <code>property-media</code> · Prop ID: <code>{propertyId}</code>
      </div>

      <UploadRow label="📸 Fotos" accept="image/*" disabled={loading} onPick={(f) => upload("image", f)} />
      <UploadRow label="🎥 Video" accept="video/*" disabled={loading} onPick={(f) => upload("video", f)} />
      <UploadRow
        label="📄 Planos (PDF / imagen)"
        accept="application/pdf,image/*"
        disabled={loading}
        onPick={(f) => upload("plan", f)}
      />

      {msg ? <p className="small">{msg}</p> : null}
    </div>
  );
}

function UploadRow({
  label,
  accept,
  disabled,
  onPick,
}: {
  label: string;
  accept: string;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <label className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 700 }}>{label}</div>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
      <div className="small" style={{ color: "#666" }}>{disabled ? "Subiendo..." : "Elegí un archivo"}</div>
    </label>
  );
}
