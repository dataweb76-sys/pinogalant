"use client";
import { useEffect, useRef, useState } from "react";

type Phase = "welcome" | "playing" | "fadeout" | "done";

export default function VideoIntro() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("intro_shown")) {
      setPhase("done");
    }
  }, []);

  function handleStart() {
    sessionStorage.setItem("intro_shown", "1");
    setPhase("playing");
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 50);
  }

  function handleEnded() {
    setPhase("fadeout");
    setTimeout(() => setPhase("done"), 900);
  }

  if (phase === "done") return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: phase === "fadeout" ? 0 : 1,
      transition: "opacity 0.9s ease",
      pointerEvents: phase === "fadeout" ? "none" : "auto",
    }}>

      {/* Video (siempre montado para que cargue) */}
      <video
        ref={videoRef}
        src="/pinogalant-intro.mp4"
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          opacity: phase === "playing" ? 1 : 0,
          transition: "opacity 0.4s",
        }}
      />

      {/* Pantalla de bienvenida — cubre el video hasta que el user hace clic */}
      {phase === "welcome" && (
        <div
          onClick={handleStart}
          style={{
            position: "absolute", inset: 0, zIndex: 2,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            background: "radial-gradient(ellipse at center, #2D3134 0%, #111 100%)",
          }}
        >
          {/* Logo */}
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            background: "#B48A73", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
            marginBottom: 28, boxShadow: "0 0 60px rgba(180,138,115,0.4)",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 34, letterSpacing: -1 }}>PG</span>
          </div>

          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: 1, marginBottom: 6 }}>
            PINO GALANT
          </div>
          <div style={{ color: "#B48A73", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 48 }}>
            Servicios Inmobiliarios
          </div>

          {/* Botón play */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#B48A73", color: "#fff",
            padding: "14px 32px", borderRadius: 999,
            fontSize: 15, fontWeight: 800,
            boxShadow: "0 4px 24px rgba(180,138,115,0.5)",
            animation: "pulse 2s infinite",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Tocá para ingresar
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(180,138,115,0.5); }
              50% { transform: scale(1.04); box-shadow: 0 6px 32px rgba(180,138,115,0.7); }
            }
          `}</style>
        </div>
      )}

      {/* Botón saltar — visible durante el video */}
      {phase === "playing" && (
        <button
          onClick={handleEnded}
          style={{
            position: "absolute", top: 20, right: 20, zIndex: 3,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", padding: "8px 18px", borderRadius: 999,
            cursor: "pointer", fontSize: 13, fontWeight: 700,
            backdropFilter: "blur(4px)",
          }}
        >
          Saltar ›
        </button>
      )}
    </div>
  );
}
