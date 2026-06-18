"use client";
import { useState } from "react";
import WhatsAppModal from "./WhatsAppModal.client";

export default function WhatsAppCTA() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-whatsapp"
        style={{ cursor: "pointer", border: "none" }}
      >
        💬 Escribinos por WhatsApp
      </button>
      {open && <WhatsAppModal onClose={() => setOpen(false)} />}
    </>
  );
}
