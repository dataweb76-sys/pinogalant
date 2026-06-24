"use client";
import { useRouter } from "next/navigation";

type Props = {
  tipos: { id: string; label: string }[];
  provincias: string[];
  opFilter: string;
  typeFilter: string;
  provFilter: string;
};

export default function PropiedadesSidebar({ tipos, provincias, opFilter, typeFilter, provFilter }: Props) {
  const router = useRouter();

  function update(key: string, value: string) {
    const sp = new URLSearchParams(window.location.search);
    if (value) sp.set(key, value); else sp.delete(key);
    sp.delete("page");
    router.push(`/propiedades?${sp.toString()}`);
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    background: "#2D3134",
    color: "#fff",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
    borderRadius: 6,
  };

  const optStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 10px",
    fontSize: 13,
    cursor: "pointer",
    color: "#444",
    borderRadius: 6,
    transition: "background 0.15s",
  };

  return (
    <>
      <style>{`
        .pg-sidebar { width: 220px; flex-shrink: 0; }
        .pg-sidebar label:hover { background: #f5f0eb; }
        @media (max-width: 768px) {
          .pg-sidebar { display: none; }
        }
      `}</style>
      <aside className="pg-sidebar">
        {/* TIPO DE PROPIEDAD */}
        <div style={{ marginBottom: 24 }}>
          <span style={labelStyle}>TIPO DE PROPIEDAD</span>
          {[{ id: "", label: "Todos" }, ...tipos].map((t) => (
            <label key={t.id} style={optStyle}>
              <input
                type="radio"
                name="type"
                checked={typeFilter === t.id}
                onChange={() => update("type", t.id)}
                style={{ accentColor: "#B48A73", width: 15, height: 15 }}
              />
              {t.label}
            </label>
          ))}
        </div>

        {/* OPERACIÓN */}
        <div style={{ marginBottom: 24 }}>
          <span style={labelStyle}>OPERACIÓN</span>
          {[{ id: "", label: "Todas" }, { id: "venta", label: "Venta" }, { id: "alquiler", label: "Alquiler" }].map((o) => (
            <label key={o.id} style={optStyle}>
              <input
                type="radio"
                name="op"
                checked={opFilter === o.id}
                onChange={() => update("op", o.id)}
                style={{ accentColor: "#B48A73", width: 15, height: 15 }}
              />
              {o.label}
            </label>
          ))}
        </div>

        {/* PROVINCIA */}
        {provincias.length > 0 && (
          <div>
            <span style={labelStyle}>PROVINCIA</span>
            {[{ id: "", label: "Todas" }, ...provincias.map((p) => ({ id: p, label: p }))].map((p) => (
              <label key={p.id} style={optStyle}>
                <input
                  type="radio"
                  name="prov"
                  checked={provFilter === p.id}
                  onChange={() => update("prov", p.id)}
                  style={{ accentColor: "#B48A73", width: 15, height: 15 }}
                />
                {p.label}
              </label>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
