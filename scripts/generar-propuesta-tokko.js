const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  info: {
    Title: 'Propuesta Web Inmobiliaria — Integración Tokkobroker',
    Author: 'Pino Galant',
  }
});

const OUT = path.join(__dirname, '..', 'public', 'propuesta-tokko.pdf');
doc.pipe(fs.createWriteStream(OUT));

// Colores marca
const BRONCE = '#B48A73';
const DARK   = '#2D3134';
const LIGHT  = '#F8F5F2';
const GRAY   = '#6B7280';
const WHITE  = '#FFFFFF';

// ─── Helpers ────────────────────────────────────────────────────────────────
function pageW() { return doc.page.width - doc.page.margins.left - doc.page.margins.right; }

function hrLine(y, color = BRONCE, thickness = 1) {
  doc.moveTo(doc.page.margins.left, y)
     .lineTo(doc.page.margins.left + pageW(), y)
     .strokeColor(color).lineWidth(thickness).stroke();
}

function sectionTitle(text, y) {
  doc.fontSize(13).fillColor(BRONCE).font('Helvetica-Bold').text(text, doc.page.margins.left, y);
  hrLine(y + 20, BRONCE, 0.8);
  return y + 32;
}

function featureBlock(icon, title, desc, x, y, w) {
  // Caja redondeada
  doc.roundedRect(x, y, w, 68, 6).fillColor('#F9F6F3').fill();
  doc.roundedRect(x, y, w, 68, 6).strokeColor('#E8DDD5').lineWidth(0.8).stroke();
  // Icono círculo
  doc.circle(x + 26, y + 34, 16).fillColor(BRONCE).fill();
  doc.fontSize(14).fillColor(WHITE).font('Helvetica-Bold').text(icon, x + 19, y + 27);
  // Texto
  doc.fontSize(9.5).fillColor(DARK).font('Helvetica-Bold').text(title, x + 50, y + 16, { width: w - 58 });
  doc.fontSize(8.5).fillColor(GRAY).font('Helvetica').text(desc, x + 50, y + 30, { width: w - 58, lineGap: 1.5 });
}

function badge(text, x, y) {
  const tw = doc.fontSize(8).font('Helvetica-Bold').widthOfString(text) + 14;
  doc.roundedRect(x, y, tw, 16, 4).fillColor(BRONCE).fill();
  doc.fillColor(WHITE).text(text, x + 7, y + 3.5);
  return x + tw + 6;
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════════════════════════════════════
// Fondo header oscuro
doc.rect(0, 0, doc.page.width, 220).fillColor(DARK).fill();
// Acento bronce lateral
doc.rect(0, 0, 8, 220).fillColor(BRONCE).fill();

doc.fontSize(10).fillColor(BRONCE).font('Helvetica').text('PROPUESTA DIGITAL', 55, 52, { characterSpacing: 2 });
doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold').text('Tu Inmobiliaria Online', 55, 72);
doc.fontSize(14).fillColor(BRONCE).font('Helvetica').text('Integración con Tokkobroker', 55, 108);
doc.moveTo(55, 132).lineTo(300, 132).strokeColor(BRONCE).lineWidth(1.5).stroke();
doc.fontSize(10).fillColor('#C0B0A0').font('Helvetica')
   .text('Todo lo que tu sitio web puede hacer usando la API de Tokkobroker', 55, 142, { width: 460 });

// Badges
let bx = 55;
bx = badge('Tokkobroker API', bx, 180);
bx = badge('Next.js', bx, 180);
badge('WhatsApp', bx, 180);

doc.fontSize(9).fillColor('#8A9099').font('Helvetica').text('Pino Galant  ·  ' + new Date().toLocaleDateString('es-AR', {year:'numeric',month:'long',day:'numeric'}), 55, 205);

// ─── Introducción ───────────────────────────────────────────────────────────
let cy = 245;
doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text('¿Por qué conectar el sitio web a Tokkobroker?', 55, cy);
cy += 18;
doc.fontSize(9.5).fillColor(GRAY).font('Helvetica')
   .text(
     'Tokkobroker es el CRM que ya usás para gestionar tu cartera de propiedades. ' +
     'Conectar tu sitio web a su API significa que cualquier propiedad que cargues o actualices ' +
     'en Tokkobroker aparece automáticamente en tu web — sin doble carga, sin errores de sincronización. ' +
     'El resultado es un sitio siempre actualizado, profesional y que convierte visitas en consultas reales.',
     55, cy, { width: pageW(), lineGap: 3 }
   );

cy += 66;
hrLine(cy, '#E8DDD5', 0.5);
cy += 16;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 1 — BUSCADOR
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('1. Buscador de Propiedades en Tiempo Real', cy);
cy += 4;

doc.fontSize(9.5).fillColor(GRAY).font('Helvetica')
   .text('Los visitantes pueden filtrar propiedades directamente desde tu web, con los datos que viven en Tokkobroker:', 55, cy, { width: pageW() });
cy += 20;

const col1 = 55, col2 = 55 + pageW()/2 + 8, colW = pageW()/2 - 8;
const items1 = ['Operación: Venta o Alquiler', 'Tipo: Casa, Depto, Terreno, Local, Campo', 'Localidad / Barrio', 'Precio mínimo y máximo'];
const items2 = ['Superficie cubierta / total', 'Ambientes y dormitorios', 'Características: cochera, pileta, etc.', 'Ordenar por precio o fecha'];

items1.forEach((t, i) => {
  doc.circle(col1 + 6, cy + i * 18 + 5, 3).fillColor(BRONCE).fill();
  doc.fontSize(9).fillColor(DARK).font('Helvetica').text(t, col1 + 15, cy + i * 18, { width: colW - 15 });
});
items2.forEach((t, i) => {
  doc.circle(col2 + 6, cy + i * 18 + 5, 3).fillColor(BRONCE).fill();
  doc.fontSize(9).fillColor(DARK).font('Helvetica').text(t, col2 + 15, cy + i * 18, { width: colW - 15 });
});

cy += 80;
// Nota destacada
doc.roundedRect(55, cy, pageW(), 30, 5).fillColor('#FDF8F5').fill();
doc.roundedRect(55, cy, pageW(), 30, 5).strokeColor(BRONCE).lineWidth(0.6).stroke();
doc.rect(55, cy, 4, 30).fillColor(BRONCE).fill();
doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold').text('Sincronización automática:', 68, cy + 5);
doc.font('Helvetica').fillColor(GRAY)
   .text('Cuando actualizás una propiedad en Tokkobroker, el cambio se refleja en el sitio web en segundos, sin intervención manual.', 68, cy + 17, { width: pageW() - 20 });
cy += 44;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 2 — FICHA DE PROPIEDAD
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('2. Ficha Completa de Cada Propiedad', cy);
cy += 4;

const features = [
  ['★', 'Galería de Fotos', 'Carrusel con todas las fotos cargadas en Tokkobroker, optimizadas para web y móvil.'],
  ['$', 'Precio Actualizado', 'Precio en pesos o dólares tal como está en Tokkobroker. Cualquier cambio se refleja automáticamente.'],
  ['i', 'Datos Completos', 'Superficie, ambientes, dormitorios, baños, antigüedad, piso, orientación y todas las amenities.'],
  ['@', 'Agente Asignado', 'Cada propiedad muestra la foto, nombre y contacto del broker que la atiende.'],
];

const fW = (pageW() - 12) / 2;
features.forEach((f, i) => {
  const fx = i % 2 === 0 ? col1 : col2;
  const fy = cy + Math.floor(i / 2) * 80;
  featureBlock(f[0], f[1], f[2], fx, fy, fW);
});
cy += 172;

// ─── WhatsApp highlight ───────────────────────────────────────────────────
doc.roundedRect(55, cy, pageW(), 46, 6).fillColor('#25D366').fill();
doc.circle(84, cy + 23, 16).fillColor('white').fillOpacity(0.15).fill();
doc.fillOpacity(1);
doc.fontSize(18).fillColor(WHITE).font('Helvetica-Bold').text('✓', 76, cy + 14);
doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold').text('Botón WhatsApp directo al agente de la propiedad', 108, cy + 8);
doc.fontSize(9).fillColor('#D0F5E0').font('Helvetica')
   .text('El mensaje se pre-carga con la dirección y datos de la propiedad para que el cliente no tenga que escribir nada.', 108, cy + 25, { width: pageW() - 60 });
cy += 62;

// ═══════════════════════════════════════════════════════════════════════════
// NUEVA PÁGINA
// ═══════════════════════════════════════════════════════════════════════════
doc.addPage();
cy = 50;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 3 — INSTAGRAM / REDES
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('3. Integración con Instagram y Redes Sociales', cy);
cy += 4;

// Flujo visual
const steps = [
  { n: '1', t: 'Post en\nInstagram', d: 'Publicás la propiedad\ncon el link al sitio' },
  { n: '2', t: 'Cliente\nhace clic', d: 'Ve la ficha completa\ncon fotos y precio' },
  { n: '3', t: 'Identifica\nal agente', d: 'Foto, nombre y\nbotón de contacto' },
  { n: '4', t: 'Contacto\ndirecto', d: 'WhatsApp al broker\ncon mensaje listo' },
];

const stepW = pageW() / 4 - 6;
steps.forEach((s, i) => {
  const sx = 55 + i * (stepW + 8);
  doc.roundedRect(sx, cy, stepW, 90, 6).fillColor('#F9F6F3').fill();
  doc.roundedRect(sx, cy, stepW, 90, 6).strokeColor('#E8DDD5').lineWidth(0.6).stroke();
  // Número
  doc.circle(sx + stepW/2, cy + 22, 14).fillColor(BRONCE).fill();
  doc.fontSize(13).fillColor(WHITE).font('Helvetica-Bold').text(s.n, sx + stepW/2 - 5, cy + 15);
  doc.fontSize(8.5).fillColor(DARK).font('Helvetica-Bold').text(s.t, sx + 6, cy + 44, { width: stepW - 12, align: 'center' });
  doc.fontSize(7.5).fillColor(GRAY).font('Helvetica').text(s.d, sx + 6, cy + 62, { width: stepW - 12, align: 'center', lineGap: 1 });
  // Flecha
  if (i < 3) {
    doc.fontSize(14).fillColor(BRONCE).text('→', sx + stepW + 1, cy + 34);
  }
});
cy += 106;

// Open Graph
doc.roundedRect(55, cy, pageW(), 50, 5).fillColor('#EFF6FF').fill();
doc.roundedRect(55, cy, pageW(), 50, 5).strokeColor('#93C5FD').lineWidth(0.6).stroke();
doc.fontSize(10).fillColor('#1E40AF').font('Helvetica-Bold').text('Preview automático en WhatsApp, Facebook e Instagram', 75, cy + 8);
doc.fontSize(8.5).fillColor('#3B82F6').font('Helvetica')
   .text('Cuando alguien comparte el link de una propiedad, aparece automáticamente con la foto principal, el precio y la descripción. ' +
         'Sin links feos — se ve como una tarjeta visual profesional que invita a hacer clic.', 75, cy + 24, { width: pageW() - 30 });
cy += 66;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 4 — PANEL ADMIN
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('4. Panel Administrativo Propio', cy);
cy += 4;

doc.fontSize(9.5).fillColor(GRAY).font('Helvetica')
   .text('Tu sitio tiene un panel de administración privado al que solo accede el equipo. Desde ahí podés:', 55, cy, { width: pageW() });
cy += 20;

const adminFeatures = [
  ['👤', 'Gestión de Agentes', 'Crear perfiles de brokers con foto, teléfono y WhatsApp. Asignar cada agente a sus propiedades de Tokkobroker.'],
  ['📋', 'Asignación de Propiedades', 'Elegir qué agente atiende cada propiedad importada de Tokkobroker. Si Tokkobroker ya lo trae asignado, se usa ese dato automáticamente.'],
  ['💬', 'Gestión de Consultas', 'Ver todas las consultas recibidas desde el sitio. Seguimiento con estados: nuevo, en curso, cerrado.'],
  ['📊', 'Panel de Estadísticas', 'Ver cuántas consultas llegaron, qué propiedades tuvieron más visitas y el rendimiento de cada agente.'],
];

const afW = (pageW() - 10) / 2;
adminFeatures.forEach((f, i) => {
  const fx = i % 2 === 0 ? col1 : col2;
  const fy = cy + Math.floor(i / 2) * 80;
  featureBlock(f[0], f[1], f[2], fx, fy, afW);
});
cy += 172;

hrLine(cy, '#E8DDD5', 0.5);
cy += 14;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 5 — CHAT / CONSULTAS
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('5. Chat y Formulario de Consultas', cy);
cy += 4;

const chatFeats = [
  'Chat widget en todas las páginas del sitio con respuestas automáticas a preguntas frecuentes (horarios, zonas, tipos de operación).',
  'Formulario de consulta en cada ficha de propiedad — el mensaje le llega al agente asignado por email y WhatsApp.',
  'Si el chat no puede responder, redirige al cliente directamente al WhatsApp de un agente disponible.',
  'Posibilidad de integrar inteligencia artificial (IA) para responder consultas complejas las 24 horas.',
];

chatFeats.forEach((t, i) => {
  doc.circle(col1 + 6, cy + i * 20 + 5, 4).fillColor(BRONCE).fill();
  doc.fontSize(9).fillColor(DARK).font('Helvetica').text(t, col1 + 18, cy + i * 20, { width: pageW() - 18, lineGap: 1 });
});
cy += 92;

// ═══════════════════════════════════════════════════════════════════════════
// NUEVA PÁGINA — RESUMEN + CTA
// ═══════════════════════════════════════════════════════════════════════════
doc.addPage();
cy = 50;

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 6 — MÓVIL Y SEO
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('6. Diseño Móvil y Posicionamiento en Google', cy);
cy += 4;

const mobileFeats = [
  ['📱', 'Diseño Responsivo 100%', 'El sitio se ve perfecto en celular, tablet y computadora. La mayoría de las búsquedas inmobiliarias se hacen desde el teléfono.'],
  ['🔍', 'SEO por Propiedad', 'Cada ficha tiene su propia URL indexable en Google. Las personas pueden encontrar tus propiedades buscando la dirección o zona.'],
  ['⚡', 'Carga Ultra Rápida', 'Tecnología Next.js con optimización de imágenes automática. Google premia los sitios rápidos con mejor posición.'],
  ['🗺️', 'Mapa Integrado', 'Cada propiedad muestra su ubicación en el mapa usando las coordenadas de Tokkobroker.'],
];

const mfW = (pageW() - 10) / 2;
mobileFeats.forEach((f, i) => {
  const fx = i % 2 === 0 ? col1 : col2;
  const fy = cy + Math.floor(i / 2) * 80;
  featureBlock(f[0], f[1], f[2], fx, fy, mfW);
});
cy += 172;

hrLine(cy, '#E8DDD5', 0.5);
cy += 16;

// ═══════════════════════════════════════════════════════════════════════════
// RESUMEN EJECUTIVO
// ═══════════════════════════════════════════════════════════════════════════
cy = sectionTitle('Resumen — ¿Qué gana la inmobiliaria?', cy);
cy += 8;

const gains = [
  { emoji: '⏱', title: 'Cero doble carga', desc: 'Cargás en Tokkobroker una vez, el sitio se actualiza solo.' },
  { emoji: '📞', title: 'Más consultas directas', desc: 'WhatsApp directo al agente desde cualquier propiedad.' },
  { emoji: '🏆', title: 'Imagen profesional', desc: 'Sitio propio con marca, colores y dominio de la inmobiliaria.' },
  { emoji: '📲', title: 'Potencia las redes', desc: 'Links de Instagram muestran previews profesionales de cada propiedad.' },
  { emoji: '🤖', title: 'Disponible 24/7', desc: 'El chat responde consultas fuera del horario de atención.' },
  { emoji: '📈', title: 'Visible en Google', desc: 'Cada propiedad se posiciona por dirección, zona y tipo en buscadores.' },
];

const gW = (pageW() - 12) / 3;
gains.forEach((g, i) => {
  const gx = 55 + (i % 3) * (gW + 6);
  const gy = cy + Math.floor(i / 3) * 60;
  doc.roundedRect(gx, gy, gW, 52, 5).fillColor('#F9F6F3').fill();
  doc.roundedRect(gx, gy, gW, 52, 5).strokeColor('#E8DDD5').lineWidth(0.6).stroke();
  doc.fontSize(16).fillColor(BRONCE).font('Helvetica').text(g.emoji, gx + 8, gy + 8);
  doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold').text(g.title, gx + 30, gy + 10, { width: gW - 36 });
  doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(g.desc, gx + 8, gy + 30, { width: gW - 16, lineGap: 1 });
});
cy += 132;

// ─── CTA Final ───────────────────────────────────────────────────────────
doc.rect(0, cy, doc.page.width, 110).fillColor(DARK).fill();
doc.rect(0, cy, 8, 110).fillColor(BRONCE).fill();

doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold').text('¿Cómo arrancamos?', 55, cy + 18);
doc.fontSize(9.5).fillColor('#C0B0A0').font('Helvetica')
   .text('Solo necesitamos la API Key de tu cuenta Tokkobroker (la encontrás en Configuración → Integraciones → API). ' +
         'Con eso conectamos tu cartera de propiedades al sitio web y el resto lo construimos juntos.',
         55, cy + 40, { width: pageW(), lineGap: 3 });

// Steps inline
const csteps = ['1  Conseguir la API Key de Tokkobroker', '2  Conectar y probar la cartera', '3  Diseñar el buscador y fichas', '4  Lanzar el sitio'];
doc.fontSize(8.5).fillColor(BRONCE).font('Helvetica-Bold');
csteps.forEach((s, i) => {
  doc.text(s, 55 + i * (pageW()/4), cy + 80, { width: pageW()/4 - 4 });
});

// Footer
doc.fontSize(8).fillColor('#6B7280').font('Helvetica')
   .text('Pino Galant  ·  Propuesta confidencial  ·  ' + new Date().getFullYear(), 55, doc.page.height - 35, { width: pageW(), align: 'center' });

doc.end();
console.log('PDF generado en:', OUT);
