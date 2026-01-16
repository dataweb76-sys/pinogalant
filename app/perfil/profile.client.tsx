"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

type Profile = {
  id: string;
  role: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  avatar_url: string;
  agent_code: string;
};

export default function ProfileClient({ initialProfile }: { initialProfile: Profile }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [p, setP] = useState<Profile>(initialProfile);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setP(initialProfile);
  }, [initialProfile]);

  async function saveProfile() {
    setMsg(null);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: p.full_name || null,
        phone: p.phone || null,
        whatsapp: p.whatsapp || null,
        address: p.address || null,
        avatar_url: p.avatar_url || null,
      })
      .eq("id", p.id);

    setSaving(false);
    if (error) setMsg(`❌ ${error.message}`);
    else setMsg("✅ Perfil actualizado.");
  }

  async function changePassword() {
    setMsg(null);

    if (!pw || pw.length < 6) {
      setMsg("❌ La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pw !== pw2) {
      setMsg("❌ Las contraseñas no coinciden.");
      return;
    }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);

    if (error) setMsg(`❌ ${error.message}`);
    else {
      setMsg("✅ Contraseña actualizada.");
      setPw("");
      setPw2("");
    }
  }

  async function uploadAvatar(file: File) {
    setMsg(null);
    setAvatarUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${p.id}/${crypto.randomUUID()}.${ext}`;

    const up = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (up.error) {
      setAvatarUploading(false);
      setMsg(`❌ ${up.error.message}`);
      return;
    }

    // si el bucket es PUBLIC, esto funciona perfecto:
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    // si tu bucket es PRIVADO, igual dejamos guardado el path y luego hacemos signed url (lo vemos después)
    const publicUrl = data?.publicUrl || path;

    setP((prev) => ({ ...prev, avatar_url: publicUrl }));
    setAvatarUploading(false);
    setMsg("✅ Foto subida. Ahora guardá el perfil.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login?ok=signed_out";
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card" style={{ padding: 16, borderRadius: 16, border: "1px solid #eee" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 84, height: 84 }}>
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.avatar_url}
                alt="avatar"
                style={{ width: 84, height: 84, borderRadius: 999, objectFit: "cover", border: "1px solid #eee" }}
              />
            ) : (
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 999,
                  background: "#111",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 28,
                }}
              >
                {(p.full_name?.[0] || p.email?.[0] || "U").toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {p.full_name || p.email}
              <span className="small" style={{ marginLeft: 10, color: "#666" }}>
                ({p.role})
              </span>
            </div>

            {p.role === "admin" && p.agent_code ? (
              <div className="small" style={{ color: "#444" }}>
                ID de agente: <b>{p.agent_code}</b>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="btn" style={{ cursor: "pointer" }}>
                {avatarUploading ? "Subiendo…" : "Cambiar foto"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f);
                  }}
                />
              </label>

              <button className="btn" onClick={logout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 16, border: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0 }}>Datos</h2>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label className="small">Nombre y apellido</label>
            <input
              className="input"
              value={p.full_name}
              onChange={(e) => setP({ ...p, full_name: e.target.value })}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="small">Email</label>
            <input className="input" value={p.email} disabled />
          </div>

          <div>
            <label className="small">Teléfono</label>
            <input
              className="input"
              value={p.phone}
              onChange={(e) => setP({ ...p, phone: e.target.value })}
              placeholder="Ej: 11 2345 6789"
            />
          </div>

          <div>
            <label className="small">WhatsApp</label>
            <input
              className="input"
              value={p.whatsapp}
              onChange={(e) => setP({ ...p, whatsapp: e.target.value })}
              placeholder="Ej: +54 9 11 2345 6789"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="small">Dirección</label>
            <input
              className="input"
              value={p.address}
              onChange={(e) => setP({ ...p, address: e.target.value })}
              placeholder="Calle, nro, ciudad"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn btnPrimary" onClick={saveProfile} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, borderRadius: 16, border: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0 }}>Seguridad</h2>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label className="small">Nueva contraseña</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>

          <div>
            <label className="small">Repetir contraseña</label>
            <input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={changePassword} disabled={pwSaving}>
            {pwSaving ? "Actualizando…" : "Cambiar contraseña"}
          </button>
        </div>
      </div>

      {msg ? <p className="small">{msg}</p> : null}
    </div>
  );
}
