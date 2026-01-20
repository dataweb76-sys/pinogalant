"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WelcomePopup() {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const name = useMemo(() => {
    const raw = sp.get("welcome");
    return raw ? decodeURIComponent(raw) : "";
  }, [sp]);

  useEffect(() => {
    if (name) setOpen(true);
  }, [name]);

  if (!open || !name) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 80,
        padding: 16,
      }}
      onClick={() => {
        setOpen(false);
        router.replace("/");
      }}
    >
      <div
        className="card"
        style={{
          width: 520,
          maxWidth: "100%",
          padding: 18,
          borderRadius: 16,
          background: "white",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 900, fontSize: 20 }}>¡Gracias por registrarte, {name}!</div>
        <div className="small" style={{ opacity: 0.75, marginTop: 8, lineHeight: 1.45 }}>
          Ya podés gestionar tus consultas con nuestros agentes o agregar la venta / alquiler que desees.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button
            className="btn btnPrimary"
            onClick={() => {
              setOpen(false);
              router.replace("/");
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
