import Link from "next/link";
import HeroSearch from "@/app/components/HeroSearch.client";
import PropertiesMap from "@/app/components/PropertiesMap.client";
import WhatsAppCTA from "@/app/components/WhatsAppCTA.client";
import {
  getAllTokkoProperties,
  tokkoPrice,
  tokkoOperation,
  tokkoCover,
  tokkoType,
  tokkoLocation,
} from "@/lib/tokko";

export const runtime = "nodejs";
export const revalidate = 300;
export const preferredRegion = ["gru1"];

const CATEGORIES = [
  { typeId: "3",  label: "Casas",        icon: "🏠" },
  { typeId: "2",  label: "Departamentos", icon: "🏢" },
  { typeId: "1",  label: "Terrenos",      icon: "📐" },
  { typeId: "7",  label: "Locales",       icon: "🏪" },
  { typeId: "4",  label: "Quintas",       icon: "🌾" },
  { typeId: "9",  label: "Campos",        icon: "🌿" },
];

export default async function HomePage() {
  let allProps = [] as Awaited<ReturnType<typeof getAllTokkoProperties>>;
  try { allProps = await getAllTokkoProperties(); } catch {}

  const featured = allProps.slice(0, 6);
  const totalPublished = allProps.length;

  const counts = allProps.reduce((acc: Record<string, number>, p) => {
    const id = String(p.type?.id ?? "");
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const mapPins = allProps
    .filter((p) => p.geo_lat && p.geo_long && p.geo_lat !== "0" && p.geo_long !== "0")
    .map((p) => {
      const price = tokkoPrice(p);
      const op = tokkoOperation(p);
      return {
        id: p.id,
        address: p.address,
        lat: parseFloat(p.geo_lat),
        lng: parseFloat(p.geo_long),
        price: price
          ? price.currency === "USD"
            ? `USD ${price.amount.toLocaleString("es-AR")}`
            : `$ ${price.amount.toLocaleString("es-AR")}`
          : "Consultar precio",
        op,
        url: `/propiedades/${p.id}`,
        type: tokkoType(p),
        photo: p.photos?.[0]?.image ?? undefined,
      };
    });

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

      {/* ===== MAPA ===== */}
      {mapPins.length > 0 && (
        <section style={{ background: "#fff", padding: "48px 0" }}>
          <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 20px" }}>
            <div style={{ marginBottom: 24 }}>
              <div className="section-tag">Ubicaciones</div>
              <h2 className="section-title">Propiedades en el mapa</h2>
              <p className="section-subtitle">Encontrá propiedades cerca de donde querés vivir.</p>
            </div>
            <PropertiesMap pins={mapPins} />
          </div>
        </section>
      )}

      {/* ===== CATEGORÍAS ===== */}
      <section className="categories-section">
        <div className="section-header">
          <div className="section-tag">Explorá por categoría</div>
          <h2 className="section-title">¿Qué tipo de propiedad buscás?</h2>
          <p className="section-subtitle">Tenemos opciones para cada necesidad: compra, alquiler o inversión.</p>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link key={cat.typeId} href={`/propiedades?type=${cat.typeId}`} className="category-card">
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
              <span className="category-count">
                {counts[cat.typeId] ? `${counts[cat.typeId]} disponibles` : "Ver todas"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== PROPIEDADES DESTACADAS ===== */}
      {featured.length > 0 && (
        <section className="featured-section">
          <div className="featured-inner">
            <div className="featured-header">
              <div>
                <div className="section-tag" style={{ textAlign: "left" }}>Desde Tokkobroker · en tiempo real</div>
                <h2 className="section-title" style={{ margin: 0 }}>Propiedades destacadas</h2>
              </div>
              <Link href="/propiedades" className="featured-header-link">
                Ver todas las propiedades →
              </Link>
            </div>
            <div className="properties-grid">
              {featured.map((p) => {
                const price = tokkoPrice(p);
                const op    = tokkoOperation(p);
                const cover = tokkoCover(p);
                const type  = tokkoType(p);
                const loc   = tokkoLocation(p);
                return (
                  <article key={p.id} className="prop-card">
                    <Link href={`/propiedades/${p.id}`} style={{ display: "block", position: "relative" }}>
                      <div style={{ aspectRatio: "4/3", background: "#f3f4f6", overflow: "hidden", position: "relative" }}>
                        {cover ? (
                          <img src={cover} alt={p.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#bbb" }}>
                            <span style={{ fontSize: 36 }}>🏠</span>
                          </div>
                        )}
                        <span style={{
                          position: "absolute", top: 12, left: 12,
                          background: op === "venta" ? "#2D3134" : "#B48A73",
                          color: "#fff", fontSize: 11, fontWeight: 800,
                          padding: "4px 12px", borderRadius: 999, textTransform: "uppercase",
                        }}>
                          {op === "venta" ? "Venta" : "Alquiler"}
                        </span>
                      </div>
                    </Link>
                    <div style={{ padding: "16px 18px 8px" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#B48A73", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{type}</div>
                      <Link href={`/propiedades/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.3, marginBottom: 4 }}>{p.address}</div>
                      </Link>
                      <div style={{ fontSize: 13, color: "#999", marginBottom: 10 }}>
                        📍 {[loc.neighborhood, loc.city].filter(Boolean).join(", ") || "Santa Rosa, La Pampa"}
                      </div>
                      {price && (
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#2D3134" }}>
                          {price.currency === "USD" ? `USD ${price.amount.toLocaleString("es-AR")}` : `$ ${price.amount.toLocaleString("es-AR")}`}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "8px 18px 18px", display: "flex", gap: 8 }}>
                      <Link href={`/propiedades/${p.id}`} style={{
                        flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10,
                        border: "1.5px solid #2D3134", color: "#2D3134",
                        textDecoration: "none", fontWeight: 700, fontSize: 13,
                      }}>Ver detalle</Link>
                      <a href={`https://wa.me/${process.env.NEXT_PUBLIC_OFFLINE_WHATSAPP}?text=${encodeURIComponent(`Hola! Me interesa la propiedad en ${p.address}.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10,
                          background: "#25D366", color: "#fff",
                          textDecoration: "none", fontWeight: 700, fontSize: 13,
                        }}>WhatsApp</a>
                    </div>
                  </article>
                );
              })}
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
            <WhatsAppCTA />
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
              <img src="/logo.png" alt="Pino Galant" style={{ width: 36, height: 36, objectFit: "contain" }} />
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
