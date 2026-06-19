import "./globals.css";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SiteHeader from "@/app/components/SiteHeader";
import VideoIntro from "@/app/components/VideoIntro.client";

export const metadata: Metadata = {
  metadataBase: new URL("https://pinogalant.com.ar"),
  title: {
    default: "Pino Galant Inmobiliaria | Propiedades en Santa Rosa, La Pampa",
    template: "%s | Pino Galant Inmobiliaria",
  },
  description:
    "Inmobiliaria en Santa Rosa, La Pampa. Venta y alquiler de casas, departamentos, terrenos y campos. Más de 10 años asesorando familias en toda la región pampeana.",
  keywords: [
    "inmobiliaria Santa Rosa La Pampa",
    "propiedades en venta Santa Rosa",
    "alquiler casas La Pampa",
    "comprar casa Santa Rosa",
    "terrenos en venta La Pampa",
    "campos en venta La Pampa",
    "departamentos Santa Rosa",
    "Pino Galant inmobiliaria",
    "inmuebles La Pampa",
    "real estate Santa Rosa",
  ],
  authors: [{ name: "Pino Galant Inmobiliaria" }],
  creator: "Pino Galant Inmobiliaria",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://pinogalant.com.ar",
    siteName: "Pino Galant Inmobiliaria",
    title: "Pino Galant | Inmobiliaria en Santa Rosa, La Pampa",
    description:
      "Encontrá tu próxima propiedad en Santa Rosa y La Pampa. Casas, departamentos, terrenos y campos en venta y alquiler.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Pino Galant Inmobiliaria" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pino Galant | Inmobiliaria en Santa Rosa, La Pampa",
    description: "Venta y alquiler de propiedades en Santa Rosa y La Pampa.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: "https://pinogalant.com.ar" },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function roleToEs(role?: string | null) {
  switch (role) {
    case "super_admin": return "Coordinadora";
    case "admin":       return "Agente";
    case "agent":       return "Agente";
    case "owner":       return "Propietario";
    case "tenant":      return "Inquilino";
    default:            return "Usuario";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

let headerUser: { email: string; role?: string | null; roleLabel?: string | null } | null = null;

if (user?.email) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  headerUser = {
    email: user.email,
    role: profile?.role ?? null,
    roleLabel: roleToEs(profile?.role ?? null),
  };
}

  return (
    <html lang="es">
      <body>
        <VideoIntro />
        <SiteHeader user={headerUser} />
        {children}
      </body>
    </html>
  );
}