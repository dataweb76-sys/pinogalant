"use client";
import { useState } from "react";

type Photo = { image: string; thumb: string; is_front_cover: boolean };

export default function GallerySlider({ photos, address }: { photos: Photo[]; address: string }) {
  const [current, setCurrent] = useState(0);

  if (!photos.length) return (
    <div style={{ height: 460, background: "#f3f4f6", borderRadius: 16, display: "grid", placeItems: "center", color: "#bbb", marginBottom: 8 }}>
      <span style={{ fontSize: 48 }}>🏠</span>
    </div>
  );

  const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrent(i => (i + 1) % photos.length);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Imagen principal */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#f3f4f6", marginBottom: 10 }}>
        <img
          src={photos[current].image}
          alt={address}
          style={{ width: "100%", height: 460, objectFit: "contain", display: "block" }}
        />
        {/* Contador */}
        <div style={{
          position: "absolute", bottom: 14, right: 14,
          background: "rgba(0,0,0,0.5)", color: "#fff",
          fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 999,
        }}>
          {current + 1} / {photos.length}
        </div>
        {/* Flechas */}
        {photos.length > 1 && (
          <>
            <button onClick={prev} style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)", border: "none", color: "#fff",
              width: 42, height: 42, borderRadius: "50%", fontSize: 20, cursor: "pointer",
              display: "grid", placeItems: "center",
            }}>‹</button>
            <button onClick={next} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.45)", border: "none", color: "#fff",
              width: 42, height: 42, borderRadius: "50%", fontSize: 20, cursor: "pointer",
              display: "grid", placeItems: "center",
            }}>›</button>
          </>
        )}
      </div>

      {/* Miniaturas scrolleables */}
      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
          {photos.map((ph, i) => (
            <button
              key={ph.image}
              onClick={() => setCurrent(i)}
              style={{
                flexShrink: 0, padding: 0, border: "none", cursor: "pointer", borderRadius: 10, overflow: "hidden",
                outline: i === current ? "3px solid #B48A73" : "3px solid transparent",
                outlineOffset: 1,
              }}
            >
              <img
                src={ph.thumb}
                alt=""
                style={{ width: 90, height: 66, objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
