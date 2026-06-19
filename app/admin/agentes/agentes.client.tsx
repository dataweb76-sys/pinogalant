"use client";
import { useState, useTransition, useRef } from "react";
import { saveAgentAction, assignAgentAction, syncAssignmentsAction } from "./actions";
import { createBrowserClient } from "@/lib/supabase/browser";

type Agent = {
  id: string; tokko_id: number | null; name: string;
  email: string | null; phone: string | null;
  photo_url: string | null; position: string | null; is_active: boolean;
};
type TokkoRow = { id: number; address: string; producerName: string; producerTokkoId: number | null };

export default function AgentesClient({
  agents, tokkoProps, assignments,
}: {
  agents: Agent[];
  tokkoProps: TokkoRow[];
  assignments: Record<number, string>;
}) {
  const [tab, setTab] = useState<"agentes" | "asignaciones">("agentes");
  const [editing, setEditing] = useState<Agent | null>(null);
  const [localAssign, setLocalAssign] = useState<Record<number, string>>(assignments);
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const BRONCE = "#B48A73";

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  function openEditing(a: Agent) {
    setEditing(a);
    setPhotoPreview(a.photo_url ?? null);
    setPhotoUrl(a.photo_url ?? "");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview local inmediato
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const supabase = createBrowserClient();
      const ext = file.name.split(".").pop();
      const path = `agents/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err: any) {
      flash("Error subiendo imagen: " + (err.message ?? err));
      setPhotoPreview(editing?.photo_url ?? null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveAgent(fd: FormData) {
    fd.set("photo_url", photoUrl);
    startTransition(async () => {
      const res = await saveAgentAction(fd);
      if (res.ok) { flash("✓ Agente guardado"); setEditing(null); location.reload(); }
      else flash("Error: " + res.error);
    });
  }

  async function handleAssign(tokkoId: number, agentId: string) {
    setLocalAssign(prev => ({ ...prev, [tokkoId]: agentId }));
    startTransition(async () => {
      const res = await assignAgentAction(tokkoId, agentId);
      if (res.ok) flash("✓ Asignado");
      else flash("Error: " + res.error);
    });
  }

  async function handleSync() {
    startTransition(async () => {
      const res = await syncAssignmentsAction();
      if (res.ok) { flash(`✓ Sincronizado: ${res.count} asignaciones`); location.reload(); }
      else flash("Error: " + res.error);
    });
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Agentes</h1>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
            Gestioná el equipo y asigná propiedades de Tokkobroker
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSync} disabled={isPending}
            style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            🔄 Sincronizar desde Tokko
          </button>
          <button onClick={() => openEditing({ id: "", tokko_id: null, name: "", email: "", phone: "", photo_url: "", position: "Agente", is_active: true })}
            style={{ padding: "9px 16px", borderRadius: 10, background: BRONCE, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            + Nuevo agente
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: msg.startsWith("✓") ? "#D1FAE5" : "#FEE2E2", marginBottom: 16, fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #eee" }}>
        {(["agentes", "asignaciones"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 22px", border: "none", background: "none", cursor: "pointer",
            fontWeight: 800, fontSize: 14, textTransform: "capitalize",
            borderBottom: tab === t ? `2px solid ${BRONCE}` : "2px solid transparent",
            color: tab === t ? BRONCE : "#888", marginBottom: -2,
          }}>
            {t === "agentes" ? `Agentes (${agents.length})` : `Asignaciones (${tokkoProps.length})`}
          </button>
        ))}
      </div>

      {/* TAB AGENTES */}
      {tab === "agentes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {agents.map(a => (
            <div key={a.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                {a.photo_url ? (
                  <img src={a.photo_url} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F3EDE7", display: "grid", placeItems: "center", fontSize: 22 }}>👤</div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: BRONCE }}>{a.position}</div>
                  {!a.is_active && <span style={{ fontSize: 11, color: "#999" }}>· Inactivo</span>}
                </div>
              </div>
              {a.phone && <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>📱 {a.phone}</div>}
              {a.email && <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>✉️ {a.email}</div>}
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>
                {tokkoProps.filter(p => localAssign[p.id] === a.id).length} propiedades asignadas
              </div>
              <button onClick={() => openEditing(a)} style={{
                width: "100%", padding: "8px 0", borderRadius: 8,
                border: `1.5px solid ${BRONCE}`, color: BRONCE,
                background: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB ASIGNACIONES */}
      {tab === "asignaciones" && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9F6F3" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>Propiedad</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>Agente Tokko</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#666", textTransform: "uppercase" }}>Asignar agente</th>
              </tr>
            </thead>
            <tbody>
              {tokkoProps.map((p, i) => (
                <tr key={p.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>{p.address}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "#888" }}>{p.producerName || "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <select
                      value={localAssign[p.id] ?? ""}
                      onChange={e => handleAssign(p.id, e.target.value)}
                      disabled={isPending}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", maxWidth: 220 }}
                    >
                      <option value="">— sin asignar —</option>
                      {agents.filter(a => a.is_active).map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDITAR/NUEVO AGENTE */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900 }}>
              {editing.id ? "Editar agente" : "Nuevo agente"}
            </h2>
            <form action={handleSaveAgent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="hidden" name="id" value={editing.id} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Nombre *</label>
                <input className="input" name="name" defaultValue={editing.name} required style={{ marginTop: 4, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Cargo</label>
                <input className="input" name="position" defaultValue={editing.position ?? ""} style={{ marginTop: 4, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>WhatsApp / Teléfono</label>
                <input className="input" name="phone" defaultValue={editing.phone ?? ""} style={{ marginTop: 4, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Email</label>
                <input className="input" name="email" type="email" defaultValue={editing.email ?? ""} style={{ marginTop: 4, width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* Foto de perfil */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Foto de perfil</label>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Preview */}
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F3EDE7",
                    overflow: "hidden", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 26,
                    border: "2px solid #eee" }}>
                    {photoPreview
                      ? <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : "👤"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <button type="button" onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #ddd",
                        background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13,
                        width: "100%" }}>
                      {uploading ? "Subiendo…" : photoPreview ? "Cambiar foto" : "Subir foto"}
                    </button>
                    {photoUrl && (
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, wordBreak: "break-all" }}>
                        ✓ Imagen subida
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" name="is_active" id="is_active" defaultChecked={editing.is_active} />
                <label htmlFor="is_active" style={{ fontSize: 13, fontWeight: 700 }}>Activo</label>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setEditing(null)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "1.5px solid #ddd",
                  background: "#fff", cursor: "pointer", fontWeight: 700,
                }}>Cancelar</button>
                <button type="submit" disabled={isPending} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, background: BRONCE,
                  color: "#fff", border: "none", cursor: "pointer", fontWeight: 700,
                }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
