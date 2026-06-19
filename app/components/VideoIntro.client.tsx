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

      {/* Video â€” centrado, no estirado */}
      <video
        ref={videoRef}
        src="/pinogalant-intro.mp4"
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "contain",
          opacity: phase === "playing" ? 1 : 0,
          transition: "opacity 0.4s",
        }}
      />

      {/* Pantalla de bienvenida */}
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
          {/* Logo real */}
          <img src="/logo.png" alt="Pino Galant" style={{ width: 180, height: 180, marginBottom: 32 }} />

          {/* BotÃ³n play */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#B48A73", color: "#fff",
            padding: "14px 32px", borderRadius: 999,
            fontSize: 15, fontWeight: 800,
            boxShadow: "0 4px 24px rgba(180,138,115,0.5)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            TocÃ¡ para ingresar
          </div>
        </div>
      )}

      {/* BotÃ³n saltar */}
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
          Saltar â€º
        </button>
      )}
    </div>
  );
}
