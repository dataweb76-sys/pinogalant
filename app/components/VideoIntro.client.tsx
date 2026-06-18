"use client";
import { useEffect, useRef, useState } from "react";

export default function VideoIntro() {
  const [phase, setPhase] = useState<"show" | "fadeout" | "done">("show");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Solo mostrar una vez por sesión
    if (sessionStorage.getItem("intro_shown")) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("intro_shown", "1");
  }, []);

  function handleEnded() {
    setPhase("fadeout");
    setTimeout(() => setPhase("done"), 800);
  }

  function handleSkip() {
    handleEnded();
  }

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: phase === "fadeout" ? 0 : 1,
        transition: "opacity 0.8s ease",
        pointerEvents: phase === "fadeout" ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src="/pinogalant-intro.mp4"
        autoPlay
        muted={false}
        playsInline
        onEnded={handleEnded}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <button
        onClick={handleSkip}
        style={{
          position: "absolute", top: 20, right: 20,
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", padding: "8px 18px", borderRadius: 999,
          cursor: "pointer", fontSize: 13, fontWeight: 700, backdropFilter: "blur(4px)",
        }}
      >
        Saltar ›
      </button>
    </div>
  );
}
