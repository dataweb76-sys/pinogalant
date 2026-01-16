"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MediaRow = {
  id: string;
  kind: "image" | "video" | "plan";
  url: string;
  sort_order: number | null;
};

export default function MediaManager({
  propertyId,
  media,
}: {
  propertyId: string;
  media: MediaRow[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initialImages = useMemo(
    () => media.filter((m) => m.kind === "image").slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [media]
  );
  const others = useMemo(() => media.filter((m) => m.kind !== "image"), [media]);

  const [images, setImages] = useState<MediaRow[]>(initialImages);
  const [dragId, setDragId] = useState<string | null>(null);

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const copy = images.slice();
    const fromIdx = copy.findIndex((x) => x.id === fromId);
    const toIdx = copy.findIndex((x) => x.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [item] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, item);
    setImages(copy);
  }

  async function saveOrder() {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`/admin/propiedades/${propertyId}/media/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, ids: images.map((x) => x.id) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo guardar el orden.");
      setMsg("✅ Orden guardado.");
      router.refresh();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function makePrimary(mediaId: string) {
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`/admin/propiedades/${propertyId}/media/primary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, media_id: mediaId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo setear principal.");
      setMsg("✅ Principal actualizada.");
      router.refresh();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function removeMedia(m: MediaRow) {
    if (!confirm("¿Eliminar este archivo?")) return;

    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`/admin/propiedades/${propertyId}/media/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, media_id: m.id, url: m.url }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo eliminar.");
      setMsg("✅ Eliminado.");
      router.refresh();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btnPrimary" type="button" onClick={saveOrder} disabled={saving || images.length <= 1}>
          {saving ? "Guardando..." : "Guardar orden de fotos"}
        </button>
        <span className="small" style={{ color: "#666" }}>
          Tip: la primera foto queda como principal.
        </span>
      </div>

      {msg ? <p className="small">{msg}</p> : null}

      {/* IMÁGENES con drag */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {images.map((m, idx) => (
          <div
            key={m.id}
            className="card"
            style={{ padding: 12, display: "grid", gap: 8, cursor: "grab" }}
            draggable
            onDragStart={() => setDragId(m.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) move(dragId, m.id);
              setDragId(null);
            }}
          >
            <div className="small" style={{ color: "#666", display: "flex", justifyContent: "space-between" }}>
              <span>📸 Foto #{idx + 1}</span>
              {idx === 0 ? <b>Principal</b> : null}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="foto" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => makePrimary(m.id)} disabled={saving}>
                Hacer principal
              </button>
              <button className="btn" type="button" onClick={() => removeMedia(m)} disabled={saving}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* OTROS ARCHIVOS */}
      {others.length > 0 ? (
        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Videos / Planos</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {others.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span className="small" style={{ color: "#666" }}>{m.kind}</span>
                <a href={m.url} target="_blank" rel="noreferrer">Abrir</a>
                <button className="btn" type="button" onClick={() => removeMedia(m)} disabled={saving}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
