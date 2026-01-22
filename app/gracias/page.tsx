import Link from "next/link";

export default function GraciasPage() {
  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
      <h1>¡Consulta enviada!</h1>
      <p className="small" style={{ opacity: 0.7 }}>
        Un asesor va a contactarte a la brevedad.
      </p>

      <Link className="btn btnPrimary" href="/propiedades">
        Volver a propiedades
      </Link>
    </main>
  );
}
