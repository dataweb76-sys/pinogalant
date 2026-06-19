"use client";

import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  if (installed) return (
    <div style={{ textAlign: "center", color: "#4ade80", fontWeight: 700, fontSize: 16 }}>
      ✓ ¡App instalada!
    </div>
  );

  return (
    <button
      onClick={handleInstall}
      style={{
        display: "inline-flex", alignItems: "center", gap: 12,
        background: "#B48A73", color: "#fff",
        padding: "16px 36px", borderRadius: 16, border: "none",
        fontWeight: 800, fontSize: 16, cursor: "pointer",
        letterSpacing: 0.3, boxShadow: "0 8px 24px rgba(180,138,115,0.4)",
      }}
    >
      {/* Ícono instalar */}
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Instalar app
    </button>
  );
}
