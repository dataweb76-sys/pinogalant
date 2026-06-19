"use client";

interface Props {
  waNumber: string;
  waMsg: string;
  propertyId?: number;
  propertyAddress?: string;
  agentName?: string;
  agentPhone?: string;
  source?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export default function WALeadButton({
  waNumber,
  waMsg,
  propertyId,
  propertyAddress,
  agentName,
  agentPhone,
  source = "property_card",
  style,
  className,
  children,
}: Props) {
  async function handleClick() {
    // Log en background, no bloqueamos la navegación
    fetch("/api/wa-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: propertyId ?? null,
        property_address: propertyAddress ?? null,
        visitor_name: null,
        visitor_phone: null,
        agent_name: agentName ?? null,
        agent_phone: agentPhone ?? null,
        source,
      }),
    }).catch(() => {});

    window.open(`https://wa.me/${waNumber}?text=${waMsg}`, "_blank");
  }

  return (
    <button onClick={handleClick} style={style} className={className}>
      {children}
    </button>
  );
}
