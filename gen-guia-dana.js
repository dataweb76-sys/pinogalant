const PDFDocument = require('pdfkit');
const fs = require('fs');

const OUT = 'C:/inmobiliaria/public/guia-pinogalant.pdf';
const out = fs.createWriteStream(OUT);
const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
doc.pipe(out);

const W = 595.28, H = 841.89;
const MAR = 48;

const C = {
  dark:  '#2D3134',
  brand: '#B48A73',
  light: '#F8F5F2',
  white: '#FFFFFF',
  gray:  '#666666',
  lgray: '#DDDDDD',
  text:  '#222222',
  green: '#25D366',
};

function hex(h) {
  const r = parseInt(h.slice(1,3),16)/255;
  const g = parseInt(h.slice(3,5),16)/255;
  const b = parseInt(h.slice(5,7),16)/255;
  return [r,g,b];
}
function fill(color) { doc.fillColor(hex(color)); }
function stroke(color) { doc.strokeColor(hex(color)); }

// ── HELPERS ──────────────────────────────────────────────────────────────────

function newPage(bg = C.white) {
  doc.addPage();
  fill(bg); doc.rect(0,0,W,H).fill();
}

function header(title, subtitle, dark = true) {
  const bg = dark ? C.dark : C.brand;
  fill(bg); doc.rect(0,0,W,120).fill();
  // accent bar
  fill(C.brand); doc.rect(0,118,W,4).fill();
  fill(C.white);
  doc.font('Helvetica-Bold').fontSize(28).text(title, MAR, 36, { width: W - MAR*2 });
  if (subtitle) {
    fill(dark ? C.brand : C.white);
    doc.font('Helvetica').fontSize(12).text(subtitle, MAR, 76, { width: W - MAR*2 });
  }
}

function sectionTitle(text, y) {
  fill(C.brand); doc.rect(MAR, y, 4, 20).fill();
  fill(C.dark);
  doc.font('Helvetica-Bold').fontSize(14).text(text, MAR + 12, y + 2, { width: W - MAR*2 - 12 });
  return y + 30;
}

function body(text, y, opts = {}) {
  fill(C.text);
  doc.font('Helvetica').fontSize(11).text(text, MAR, y, { width: W - MAR*2, lineGap: 3, ...opts });
  return doc.y + 6;
}

function bullet(items, y) {
  items.forEach(item => {
    fill(C.brand); doc.circle(MAR + 5, y + 5, 3).fill();
    fill(C.text); doc.font('Helvetica').fontSize(11)
      .text(item, MAR + 16, y, { width: W - MAR*2 - 16, lineGap: 2 });
    y = doc.y + 4;
  });
  return y + 4;
}

function card(x, y, w, h, title, desc, icon = '') {
  fill(C.light); doc.roundedRect(x, y, w, h, 8).fill();
  fill(C.brand); doc.roundedRect(x, y, w, 4, 2).fill();
  fill(C.dark);
  doc.font('Helvetica-Bold').fontSize(11).text(`${icon} ${title}`.trim(), x + 12, y + 14, { width: w - 24 });
  fill(C.gray);
  doc.font('Helvetica').fontSize(9.5).text(desc, x + 12, y + 30, { width: w - 24, lineGap: 2 });
}

function divider(y) {
  fill(C.lgray); doc.rect(MAR, y, W - MAR*2, 1).fill();
  return y + 14;
}

function tag(text, x, y, bgColor = C.dark) {
  const tw = doc.font('Helvetica-Bold').fontSize(9).widthOfString(text) + 16;
  fill(bgColor); doc.roundedRect(x, y, tw, 18, 9).fill();
  fill(C.white); doc.font('Helvetica-Bold').fontSize(9).text(text, x + 8, y + 4, { lineBreak: false });
  return x + tw + 8;
}

function step(num, title, desc, y) {
  fill(C.brand); doc.circle(MAR + 12, y + 10, 12).fill();
  fill(C.white); doc.font('Helvetica-Bold').fontSize(11).text(String(num), MAR + 7, y + 4, { lineBreak: false });
  fill(C.dark); doc.font('Helvetica-Bold').fontSize(12).text(title, MAR + 32, y, { width: W - MAR*2 - 32 });
  fill(C.gray); doc.font('Helvetica').fontSize(10).text(desc, MAR + 32, doc.y + 2, { width: W - MAR*2 - 32, lineGap: 2 });
  return doc.y + 10;
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 1 — PORTADA
// ══════════════════════════════════════════════════════════════════════════════
newPage(C.dark);

// fondo degradado simulado con rectángulos
fill('#232729'); doc.rect(0, 0, W, H/2).fill();
fill(C.dark);    doc.rect(0, H/2, W, H/2).fill();

// barra brand superior
fill(C.brand); doc.rect(0, 0, W, 6).fill();

// logo placeholder (círculo con PG)
fill(C.brand); doc.circle(W/2, 220, 64).fill();
fill(C.white); doc.font('Helvetica-Bold').fontSize(36).text('PG', W/2 - 22, 198);

// título
fill(C.white);
doc.font('Helvetica-Bold').fontSize(36)
  .text('PINO GALANT', 0, 318, { align: 'center', width: W });
fill(C.brand);
doc.font('Helvetica').fontSize(14)
  .text('pinogalant.com.ar', 0, 360, { align: 'center', width: W });

// línea
fill(C.brand); doc.rect(W/2 - 60, 390, 120, 2).fill();

// subtítulo
fill(C.white);
doc.font('Helvetica-Bold').fontSize(18)
  .text('Guía de la Plataforma Digital', 0, 408, { align: 'center', width: W });
fill(C.lgray);
doc.font('Helvetica').fontSize(12)
  .text('Para agentes inmobiliarios y administración', 0, 434, { align: 'center', width: W });

// 3 chips
const chips = ['Sitio Web', 'Panel Admin', 'WhatsApp'];
let cx = W/2 - 140;
chips.forEach(ch => {
  const tw = doc.font('Helvetica-Bold').fontSize(10).widthOfString(ch) + 24;
  fill('#3a3e42'); doc.roundedRect(cx, 490, tw, 26, 13).fill();
  fill(C.brand); doc.font('Helvetica-Bold').fontSize(10).text(ch, cx + 12, 497, { lineBreak: false });
  cx += tw + 10;
});

// pie
fill(C.brand); doc.rect(0, H - 50, W, 50).fill();
fill(C.white);
doc.font('Helvetica').fontSize(10)
  .text('Preparado para Dana Responsable | 2025', 0, H - 30, { align: 'center', width: W });

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 2 — RESUMEN DEL SITIO
// ══════════════════════════════════════════════════════════════════════════════
newPage();
header('El Sitio Web', 'Todo lo que ofrece pinogalant.com.ar a los clientes');

let y = 140;
y = body('El sitio web de Pino Galant es una plataforma inmobiliaria completa, disponible las 24 horas desde cualquier celular o computadora. Los clientes pueden explorar propiedades, solicitar tasaciones y contactar asesores directamente por WhatsApp.', y);
y += 10;

y = sectionTitle('Páginas principales', y);

const pages = [
  ['🏠', 'Inicio', 'Buscador inteligente, mapa de propiedades, categorías y propiedades destacadas.'],
  ['🏘️', 'Propiedades', 'Listado completo con filtros por tipo, operación y provincia. 3 columnas en desktop.'],
  ['💰', 'Venta', 'Acceso directo a propiedades en venta filtradas automáticamente.'],
  ['🔑', 'Alquiler', 'Acceso directo a propiedades en alquiler filtradas automáticamente.'],
  ['📊', 'Tasación', 'Formulario de 3 pasos que envía datos al WhatsApp del asesor.'],
  ['📢', 'Publicar', 'Formulario para que clientes soliciten publicar su propiedad.'],
];

const cw = (W - MAR*2 - 12) / 2;
pages.forEach((p, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  card(MAR + col*(cw+12), y + row*80, cw, 70, p[1], p[2], p[0]);
});
y += Math.ceil(pages.length/2) * 80 + 10;

y = sectionTitle('Funcionalidades destacadas', y);
y = bullet([
  'Buscador por tipo de propiedad, operación, provincia y localidad',
  'Mapa interactivo con pins de cada propiedad georeferenciada',
  'Botón WhatsApp en cada propiedad para contacto directo con el asesor',
  'Formulario de tasación en 3 pasos: datos → características → contacto',
  'Instalable como app en el celular (PWA) — funciona como app nativa',
  'Optimizado para Google (SEO) y carga rápida en mobile',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — CÓMO USAR EL SITIO (PARA AGENTES)
// ══════════════════════════════════════════════════════════════════════════════
newPage();
header('Guía para Agentes', 'Cómo aprovechar el sitio con los clientes');

y = 140;
y = sectionTitle('Instalar la app en el celular', y);
y = body('El sitio se puede instalar como aplicación en cualquier celular Android o iPhone. Una vez instalado, funciona igual que una app descargada de la tienda.', y);
y = step(1, 'Abrí pinogalant.com.ar en el navegador del celular', 'Chrome en Android, Safari en iPhone', y);
y = step(2, 'Buscá el botón "📲 Instalar app"', 'Aparece en la sección "Quiénes Somos" de la página de inicio', y);
y = step(3, 'Tocá Instalar y aceptá', 'El ícono de Pino Galant aparecerá en tu pantalla de inicio', y);
y += 6;

y = divider(y);
y = sectionTitle('Compartir una propiedad con un cliente', y);
y = step(1, 'Buscá la propiedad en pinogalant.com.ar/propiedades', 'Podés filtrar por tipo, operación o provincia desde el panel lateral', y);
y = step(2, 'Hacé clic en "Ver detalle"', 'Se abre la ficha completa de la propiedad', y);
y = step(3, 'Usá el botón "Compartir"', 'Copiá el enlace o compartilo directo por WhatsApp al cliente', y);
y += 6;

y = divider(y);
y = sectionTitle('Recibir consultas por WhatsApp', y);
y = body('Cuando un cliente toca el botón WhatsApp en una propiedad, le llega un mensaje al asesor asignado a esa propiedad con la dirección exacta ya escrita. El mensaje llega listo para responder.', y);
y += 8;

fill(C.green); doc.roundedRect(MAR, y, W - MAR*2, 54, 8).fill();
fill(C.white);
doc.font('Helvetica-Bold').fontSize(11).text('Mensaje automático que recibís:', MAR + 16, y + 10);
doc.font('Helvetica').fontSize(10).text('Hola! Me interesa la propiedad en Av. San Martín 450. ¿Me podés dar más información?', MAR + 16, y + 26, { width: W - MAR*2 - 32 });
y += 66;

y = divider(y);
y = sectionTitle('Uso de filtros en Propiedades', y);
y = bullet([
  'Sidebar izquierdo (desktop): filtrá por TIPO DE PROPIEDAD, OPERACIÓN y PROVINCIA',
  'En celular: chips horizontales en la parte superior para filtro rápido',
  'Buscador de dirección: escribí una calle o barrio y presioná Buscar',
  'Ordenamiento: Por defecto, Precio ↑ o Precio ↓',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — PANEL ADMIN (PARA DANA)
// ══════════════════════════════════════════════════════════════════════════════
newPage();
header('Panel Admin — Guía para Dana', 'Acceso y gestión completa de la plataforma', false);

y = 140;
y = sectionTitle('Cómo ingresar al Admin', y);
y = step(1, 'Ingresá a pinogalant.com.ar/login', 'Usá tu email y contraseña de administradora', y);
y = step(2, 'En el menú superior aparece "Admin" en color dorado', 'Solo visible para usuarios con rol administrador', y);
y = step(3, 'Tocá "Admin" para ir al panel de administración', 'Desde ahí manejás todo el sitio', y);
y += 6;

y = divider(y);
y = sectionTitle('Secciones del Panel Admin', y);

const adminCards = [
  ['👥', 'Clientes / Prospectos', 'Lista de clientes que consultaron. Podés asignarlos a agentes, marcarlos como visitados, o cerrar la gestión.'],
  ['🏠', 'Propiedades', 'Las propiedades se sincronizan automáticamente desde Tokko Broker. Podés asignar agentes y agregar badges especiales.'],
  ['📋', 'Badges de propiedades', 'Marcá propiedades con etiquetas: "Valor ajustado", "Permuta" o "Reservado" para destacarlas.'],
  ['👤', 'Agentes', 'Gestioná el equipo: nombre, teléfono WhatsApp y asignación de propiedades.'],
  ['📊', 'Leads / Consultas', 'Registro de todas las consultas recibidas por WhatsApp desde el sitio.'],
  ['🖼️', 'Imagen Hero', 'Cambiá la foto principal de la página de inicio desde el admin.'],
];

const acw = (W - MAR*2 - 12) / 2;
adminCards.forEach((ac, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  card(MAR + col*(acw+12), y + row*88, acw, 78, ac[1], ac[2], ac[0]);
});
y += Math.ceil(adminCards.length/2) * 88 + 10;

y = divider(y);
y = sectionTitle('Sincronización con Tokko Broker', y);
y = body('Las propiedades se actualizan automáticamente desde Tokko Broker cada 5 minutos. No necesitás cargar propiedades manualmente en el sitio. Todo lo que publiques en Tokko aparece automáticamente en pinogalant.com.ar.', y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — GESTIÓN DE PROSPECTOS
// ══════════════════════════════════════════════════════════════════════════════
newPage();
header('Gestión de Prospectos', 'Seguimiento de clientes en el panel admin');

y = 140;
y = body('El panel de prospectos permite registrar y hacer seguimiento de los clientes interesados. Cada prospecto tiene un flujo de estados que guía al agente desde el primer contacto hasta el cierre.', y);
y += 10;

y = sectionTitle('Estados de un prospecto', y);

const estados = [
  ['🔵', 'Nuevo', 'Prospecto recién ingresado, sin asignar todavía.', C.dark],
  ['🟡', 'Asignado', 'Ya tiene un agente responsable asignado.', '#B8860B'],
  ['🟠', 'Visitado', 'El agente visitó la propiedad con el cliente.', C.brand],
  ['🟢', 'Cerrado', 'Operación concretada o prospecto descartado.', '#2E7D32'],
];

estados.forEach(([icon, estado, desc, color]) => {
  fill(color); doc.roundedRect(MAR, y, 6, 44, 3).fill();
  fill(C.light); doc.roundedRect(MAR + 12, y, W - MAR*2 - 12, 44, 6).fill();
  fill(C.dark); doc.font('Helvetica-Bold').fontSize(12).text(`${icon}  ${estado}`, MAR + 24, y + 8);
  fill(C.gray); doc.font('Helvetica').fontSize(10).text(desc, MAR + 24, y + 26, { width: W - MAR*2 - 36 });
  y += 54;
});

y = divider(y);
y = sectionTitle('Cómo asignar un agente a un prospecto', y);
y = step(1, 'Entrá al panel Admin → Prospectos', 'Ves la lista de todos los clientes con su estado actual', y);
y = step(2, 'Tocá el prospecto que querés asignar', 'Se abre el detalle con la información del cliente', y);
y = step(3, 'Seleccioná el agente del menú desplegable', 'El estado pasa automáticamente a "Asignado"', y);
y = step(4, 'El agente recibe la asignación', 'Puede marcar la visita como realizada desde su perfil', y);
y += 6;

y = divider(y);
y = sectionTitle('Flujo de trabajo recomendado', y);
y = bullet([
  'Revisá el panel de prospectos cada mañana para detectar nuevas consultas',
  'Asigná cada prospecto al agente más adecuado según la zona de la propiedad',
  'El agente marca "Visitado" después de mostrar la propiedad',
  'Si la operación se concretó o el cliente no avanzó, marcá como "Cerrado"',
  'Usá el filtro por estado para ver qué operaciones están en cada etapa',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — TASACIÓN Y WHATSAPP
// ══════════════════════════════════════════════════════════════════════════════
newPage();
header('Tasación y Contacto WhatsApp', 'Cómo funcionan los formularios de contacto');

y = 140;
y = sectionTitle('Formulario de Tasación', y);
y = body('El formulario de tasación está en pinogalant.com.ar/tasacion. Es un proceso de 3 pasos que al final envía toda la información al WhatsApp del asesor con los datos del cliente y la propiedad.', y);
y += 8;

const pasos = [
  ['1', 'Datos de la propiedad', 'Tipo de propiedad → Provincia → Ciudad/Localidad → Zona'],
  ['2', 'Características', 'Superficie en m² · Ambientes · Estado de la propiedad · Extras'],
  ['3', 'Tus datos', 'Nombre del cliente y WhatsApp para poder contactarlo'],
];

pasos.forEach(p => {
  fill(C.light); doc.roundedRect(MAR, y, W - MAR*2, 52, 8).fill();
  fill(C.brand); doc.circle(MAR + 26, y + 26, 16).fill();
  fill(C.white); doc.font('Helvetica-Bold').fontSize(16).text(p[0], MAR + 20, y + 18, { lineBreak: false });
  fill(C.dark); doc.font('Helvetica-Bold').fontSize(12).text(p[1], MAR + 52, y + 10);
  fill(C.gray); doc.font('Helvetica').fontSize(10).text(p[2], MAR + 52, y + 28, { width: W - MAR*2 - 64 });
  y += 62;
});

y += 4;
y = divider(y);
y = sectionTitle('Provincias disponibles en Tasación', y);
y = body('El formulario incluye las 24 provincias argentinas (incluida CABA), con ciudades y localidades de cada una. Para propiedades rurales (Quinta/Campo) las zonas cambian automáticamente a distancias del centro.', y);
y += 8;

fill(C.light); doc.roundedRect(MAR, y, W - MAR*2, 60, 8).fill();
fill(C.brand); doc.font('Helvetica-Bold').fontSize(10).text('Zonas urbanas:', MAR + 16, y + 10);
fill(C.text); doc.font('Helvetica').fontSize(10).text('Centro · Macrocentro · Norte · Sur · Este · Oeste · Periurbano', MAR + 16, y + 24);
fill(C.brand); doc.font('Helvetica-Bold').fontSize(10).text('Zonas rurales (Quinta/Campo):', MAR + 16, y + 38);
fill(C.text); doc.font('Helvetica').fontSize(10).text('Hasta 5km · 5 a 10km · 10 a 20km · Más de 20km del centro', MAR + 16, y + 52);
y += 72;

y = divider(y);
y = sectionTitle('Botones WhatsApp en propiedades', y);
y = body('Cada propiedad tiene un botón WhatsApp en la barra naranja inferior de la card. Al tocarlo, el cliente recibe un mensaje pre-escrito con la dirección de la propiedad. El mensaje llega al número del agente asignado a esa propiedad en el panel Admin.', y);
y += 8;
y = bullet([
  'Si la propiedad tiene agente asignado en Admin: va al WhatsApp del agente',
  'Si no tiene agente asignado: va al WhatsApp general de Pino Galant',
  'El sistema registra automáticamente cada consulta en el panel de Leads',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA 7 — DATOS DE ACCESO Y CONTACTOS
// ══════════════════════════════════════════════════════════════════════════════
newPage();
header('Accesos y Contactos Útiles', 'Referencias rápidas para el equipo');

y = 140;
y = sectionTitle('URLs importantes', y);

const urls = [
  ['🌐', 'Sitio web',       'pinogalant.com.ar'],
  ['🔐', 'Login',           'pinogalant.com.ar/login'],
  ['⚙️', 'Panel Admin',     'pinogalant.com.ar/admin'],
  ['🏘️', 'Propiedades',    'pinogalant.com.ar/propiedades'],
  ['📊', 'Tasación',        'pinogalant.com.ar/tasacion'],
  ['📢', 'Publicar',        'pinogalant.com.ar/publicar'],
];

urls.forEach(u => {
  fill(C.light); doc.roundedRect(MAR, y, W - MAR*2, 34, 6).fill();
  fill(C.dark); doc.font('Helvetica-Bold').fontSize(11).text(`${u[0]}  ${u[1]}`, MAR + 14, y + 6, { continued: true });
  fill(C.brand); doc.font('Helvetica').fontSize(11).text(`    ${u[2]}`, { lineBreak: false });
  y += 40;
});

y += 6;
y = divider(y);
y = sectionTitle('Preguntas frecuentes', y);

const faqs = [
  ['¿Cada cuánto se actualizan las propiedades?',
   'Cada 5 minutos desde Tokko Broker automáticamente.'],
  ['¿Qué pasa si una propiedad no aparece en el sitio?',
   'Verificá que esté publicada y activa en Tokko Broker. El sitio la muestra automáticamente.'],
  ['¿Cómo cambio la foto del inicio?',
   'Desde el Panel Admin → Hero Image. Subí la nueva foto y guardá.'],
  ['¿Cómo agrego un nuevo agente?',
   'Admin → Agentes → Nuevo agente. Completá nombre y WhatsApp.'],
  ['¿Por qué no me aparece el botón de instalar app?',
   'El navegador lo muestra solo si el sitio se abre en Chrome (Android) o Safari (iPhone). En computadora puede no aparecer.'],
];

faqs.forEach(faq => {
  fill(C.brand); doc.font('Helvetica-Bold').fontSize(10).text(`❓ ${faq[0]}`, MAR, y, { width: W - MAR*2 });
  y = doc.y + 2;
  fill(C.text); doc.font('Helvetica').fontSize(10).text(faq[1], MAR + 12, y, { width: W - MAR*2 - 12 });
  y = doc.y + 10;
});

// ── PIE DE TODAS LAS PÁGINAS ──────────────────────────────────────────────────
const pages2 = doc.bufferedPageRange();
for (let i = pages2.start; i < pages2.start + pages2.count; i++) {
  doc.switchToPage(i);
  fill(C.dark); doc.rect(0, H - 36, W, 36).fill();
  fill(C.brand);
  doc.font('Helvetica-Bold').fontSize(8).text('PINO GALANT', MAR, H - 22, { lineBreak: false });
  fill(C.lgray);
  doc.font('Helvetica').fontSize(8).text('  ·  pinogalant.com.ar', { continued: true, lineBreak: false });
  fill(C.lgray);
  doc.font('Helvetica').fontSize(8).text(`  ·  Página ${i + 1} de ${pages2.count}`, { align: 'right', width: W - MAR*2 });
}

doc.flushPages();
doc.end();

out.on('finish', () => console.log('✅ PDF generado en:', OUT));
out.on('error', e => console.error('❌ Error:', e));
