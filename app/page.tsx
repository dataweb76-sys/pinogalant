import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import PropertyCard from "@/app/components/PropertyCard";
import HeroSearch from "@/app/components/HeroSearch.client";

export const runtime = "nodejs";

type MediaRow = {
  property_id: string;
  kind: string | null;
  url: string | null;
  sort_order: number | null;
};

const CATEGORIES = [
  { key: "casa",         label: "Casas",          icon: "🏠" },
  { key: "departamento", label: "Departamentos",   icon: "🏢" },
  { key: "terreno",      label: "Terrenos",        icon: "📐" },
  { key: "local",        label: "Locales",         icon: "🏪" },
  { key: "oficina",      label: "Oficinas",        icon: "💼" },
  { key: "campo",        label: "Campos",          icon: "🌾" },
];

function pickCover(media: MediaRow[]) {
  if (!media?.length) return null;
  const sorted = [...media].sort((a, b) => (a.sort_order ?? 999999) - (b.sort_order ?? 999999));
  const img = sorted.find((m) => (m.kind || "").toLowerCase() === "image" && m.url);
  if (img) return { url: img.url!, kind: "image" as const };
  const vid = sorted.find((m) => (m.kind || "").toLowerCase() === "video" && m.url);
  if (vid) return { url: vid.url!, kind: "video" as const };
  const first = sorted.find((m) => !!m.url);
  if (first?.url) return { url: first.url, kind: (first.kind || "image") as "image" | "video" };
  return null;
}

export default async function HomePage() {
  const admin = createSupabaseAdminClient();

  const [{ data: props }, { data: allProps }] = await Promise.all([
    admin
      .from("properties")
      .select("id,title,city,neighborhood,operation,type,price_ars,price_usd")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(9),
    admin
      .from("properties")
      .select("type")
      .eq("is_published", true),
  ]);

  const counts = (allProps || []).reduce((acc: Record<string, number>, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  const totalPublished = allProps?.length ?? 0;

  const mediaMap = new Map<string, { coverUrl?: string; coverKind?: "image" | "video" }>();
  if (props?.length) {
    const ids = props.map((p) => p.id);
    const { data: media } = await admin
      .from("property_media")
      .select("property_id,kind,url,sort_order")
      .in("property_id", ids);

    if (media) {
      const byProp = new Map<string, MediaRow[]>();
      media.forEach((m) => {
        const list = byProp.get(m.property_id) ?? [];
        list.push(m);
        byProp.set(m.property_id, list);
      });
      byProp.forEach((list, pid) => {
        const cover = pickCover(list);
        if (cover) mediaMap.set(pid, { coverUrl: cover.url, coverKind: cover.kind });
      });
    }
  }

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-badge">✦ Pino Galant · Servicios Inmobiliarios</div>
          <h1 className="hero-title">
            Encontrá tu próximo hogar<br />
            <span>con asesoría real.</span>
          </h1>
          <p className="hero-subtitle">
            Más de 10 años asesorando familias en la compra, venta y alquiler de propiedades en toda la región.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* ===== CATEGORÍAS ===== */}
      <section className="categories-section">
        <div className="section-header">
          <div className="section-tag">Explorá por categoría</div>
          <h2 className="section-title">¿Qué tipo de propiedad buscás?</h2>
          <p className="section-subtitle">Tenemos opciones para cada necesidad: compra, alquiler o inversión.</p>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link key={cat.key} href={`/propiedades?type=${cat.key}`} className="category-card">
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
              <span className="category-count">
                {counts[cat.key] ? `${counts[cat.key]} disponibles` : "Ver todas"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== PROPIEDADES DESTACADAS ===== */}
      {props && props.length > 0 && (
        <section className="featured-section">
          <div className="featured-inner">
            <div className="featured-header">
              <div>
                <div className="section-tag" style={{ textAlign: "left" }}>Últimas publicaciones</div>
                <h2 className="section-title" style={{ margin: 0 }}>Propiedades destacadas</h2>
              </div>
              <Link href="/propiedades" className="featured-header-link">
                Ver todas las propiedades →
              </Link>
            </div>
            <div className="properties-grid">
              {props.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={{
                    ...p,
                    coverUrl: mediaMap.get(p.id)?.coverUrl ?? null,
                    coverKind: mediaMap.get(p.id)?.coverKind ?? null,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== QUIÉNES SOMOS ===== */}
      <section className="about-section">
        <div className="about-inner">
          <div>
            <div className="section-tag">Quiénes somos</div>
            <h2 className="about-title">
              Asesoramiento inmobiliario con experiencia y compromiso
            </h2>
            <p className="about-text">
              En Pino Galant, nos dedicamos a acompañar a cada cliente en uno de los momentos más importantes de su vida: la compra, venta o alquiler de una propiedad. Trabajamos con transparencia, profesionalismo y atención personalizada para que cada decisión sea la correcta.
            </p>
            <Link href="/propiedades" className="about-cta">
              Ver propiedades disponibles →
            </Link>
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <div className="stat-number">10+</div>
              <div className="stat-label">Años de experiencia</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalPublished > 0 ? totalPublished : "—"}</div>
              <div className="stat-label">Propiedades disponibles</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Clientes satisfechos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Compromiso con vos</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA CONTACTO ===== */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="hero-badge" style={{ display: "inline-flex", margin: "0 auto" }}>
            Hablemos hoy
          </div>
          <h2 className="cta-title">¿Tenés una propiedad o estás buscando una?</h2>
          <p className="cta-subtitle">
            Contactanos por WhatsApp y te respondemos en minutos. Sin vueltas.
          </p>
          <div className="cta-buttons">
            <a
              href="https://wa.me/549112345678?text=Hola!%20Me%20contacto%20desde%20la%20web%20de%20Pino%20Galant."
              className="btn-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Escribinos por WhatsApp
            </a>
            <Link href="/propiedades" className="btn-outline-white">
              Ver propiedades
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Link href="/" className="footer-logo">
              <span className="footer-logo-badge">PG</span>
              Pino Galant
            </Link>
            <p className="footer-tagline">
              Servicios inmobiliarios profesionales. Compra, venta y alquiler de propiedades con asesoría personalizada en toda la región.
            </p>
          </div>

          <div>
            <div className="footer-heading">Propiedades</div>
            <ul className="footer-links">
              <li><Link href="/propiedades">Todas las propiedades</Link></li>
              <li><Link href="/propiedades?operation=venta">En venta</Link></li>
              <li><Link href="/propiedades?operation=alquiler">En alquiler</Link></li>
              <li><Link href="/propiedades?type=casa">Casas</Link></li>
              <li><Link href="/propiedades?type=departamento">Departamentos</Link></li>
              <li><Link href="/propiedades?type=terreno">Terrenos</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">Contacto</div>
            <ul className="footer-links">
              <li>
                <a href="https://wa.me/549112345678" target="_blank" rel="noopener noreferrer">
                  💬 WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:info@pinogalant.com">
                  ✉️ info@pinogalant.com
                </a>
              </li>
              <li><Link href="/publicar">Publicar propiedad</Link></li>
              <li><Link href="/login">Ingresar</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 Pino Galant · Todos los derechos reservados</span>
          <span>Servicios inmobiliarios profesionales</span>
        </div>
      </footer>
    </>
  );
}
