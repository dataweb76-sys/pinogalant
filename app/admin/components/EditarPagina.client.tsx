"use client";

import { useState, useRef } from "react";

type Settings = {
  imagesFit: "cover" | "contain";
};

export default function EditarPagina() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"hero" | "video" | "imagenes">("hero");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const heroInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, path: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("path", path);
    const res = await fetch("/api/admin/upload-asset", { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function handleHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(""); setSuccess("");
    try {
      await uploadFile(file, "hero.jpg");
      setSuccess("✓ Imagen del hero actualizada. Los cambios se ven en el sitio en 1-2 minutos.");
    } catch (err: any) {
      setError("Error al subir: " + err.message);
    } finally { setUploading(false); }
  }

  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(""); setSuccess("");
    try {
      await uploadFile(file, "buscar-sonado.mp4");
      setSuccess("✓ Video del popup actualizado. Los cambios se ven en el sitio en 1-2 minutos.");
    } catch (err: any) {
      setError("Error al subir: " + err.message);
    } finally { setUploading(false); }
  }

  function close() { setOpen(false); setSuccess(""); setError(""); }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 13,
    background: active ? "#2D3134" : "#F3EDE7",
    color: active ? "#fff" : "#2D3134",
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#2D3134", color: "#fff",
          border: "none", borderRadius: 10, padding: "10px 18px",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}
      >
        ✏️ Editar página
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ background: "#2D3134", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#B48A73", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Panel admin</div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 900, marginTop: 2 }}>Editar página de inicio</div>
              </div>
              <button onClick={close} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ padding: "16px 24px 0", display: "flex", gap: 8 }}>
              <button style={tabStyle(tab === "hero")} onClick={() => { setTab("hero"); setSuccess(""); setError(""); }}>Imagen hero</button>
              <button style={tabStyle(tab === "video")} onClick={() => { setTab("video"); setSuccess(""); setError(""); }}>Video popup</button>
              <button style={tabStyle(tab === "imagenes")} onClick={() => { setTab("imagenes"); setSuccess(""); setError(""); }}>Imágenes</button>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>

              {/* TAB HERO */}
              {tab === "hero" && (
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                    Reemplaza la imagen de fondo de la sección principal (hero) del sitio.<br />
                    <strong>Formatos:</strong> JPG, PNG, WebP. <strong>Recomendado:</strong> 1920×1080px.
                  </p>
                  <div style={{ background: "#F7F4F1", borderRadius: 12, padding: "20px", textAlign: "center", border: "2px dashed #D5C4B8", marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Archivo actual: <strong>hero.jpg</strong></div>
                    <input ref={heroInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleHero} />
                    <button
                      onClick={() => heroInputRef.current?.click()}
                      disabled={uploading}
                      style={{ background: "#B48A73", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
                    >
                      {uploading ? "Subiendo..." : "Elegir nueva imagen"}
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
                    La imagen se reemplaza en el servidor. El sitio se actualiza en 1-2 minutos.
                  </p>
                </div>
              )}

              {/* TAB VIDEO */}
              {tab === "video" && (
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                    Reemplaza el video que se muestra en el popup "Búsqueda de tus sueños".<br />
                    <strong>Formato:</strong> MP4. <strong>Recomendado:</strong> menos de 30MB para carga rápida.
                  </p>
                  <div style={{ background: "#F7F4F1", borderRadius: 12, padding: "20px", textAlign: "center", border: "2px dashed #D5C4B8", marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Archivo actual: <strong>buscar-sonado.mp4</strong></div>
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/*" style={{ display: "none" }} onChange={handleVideo} />
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploading}
                      style={{ background: "#B48A73", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
                    >
                      {uploading ? "Subiendo..." : "Elegir nuevo video"}
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
                    El video se reemplaza en el servidor. El sitio se actualiza en 1-2 minutos.
                  </p>
                </div>
              )}

              {/* TAB IMAGENES */}
              {tab === "imagenes" && (
                <div>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                    Controlá cómo se muestran las fotos de las propiedades en las tarjetas.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, background: "#F7F4F1", borderRadius: 12, cursor: "pointer", border: "2px solid #B48A73" }}>
                      <div style={{ marginTop: 2 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 999, border: "2px solid #B48A73", background: "#B48A73", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#2D3134" }}>Rellenar panel completo (cover)</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>La imagen ocupa todo el espacio de la tarjeta. Puede recortar los bordes si la imagen es muy angosta o ancha.</div>
                        <div style={{ marginTop: 10, background: "#2D3134", borderRadius: 8, height: 60, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #B48A73 0%, #2D3134 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>🖼 Sin espacios negros</div>
                        </div>
                      </div>
                    </label>
                    <div style={{ padding: 12, background: "#fff", border: "1px solid #eee", borderRadius: 10, fontSize: 12, color: "#666" }}>
                      <strong style={{ color: "#2D3134" }}>Modo actual:</strong> Las imágenes rellenan todo el panel de la tarjeta (object-fit: cover). Si querés cambiar esto, contactá al desarrollador.
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {success && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, color: "#166534", fontSize: 13, fontWeight: 600 }}>
                  {success}
                </div>
              )}
              {error && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, color: "#991b1b", fontSize: 13 }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
