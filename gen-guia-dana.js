const PDFDocument = require('pdfkit');
const fs = require('fs');

const FONT     = 'C:/Windows/Fonts/arial.ttf';
const FONT_BD  = 'C:/Windows/Fonts/arialbd.ttf';

const OUT = 'C:/inmobiliaria/public/guia-pinogalant.pdf';
const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: true });
doc.registerFont('Regular', FONT);
doc.registerFont('Bold',    FONT_BD);
doc.pipe(fs.createWriteStream(OUT));

const W = 595.28, H = 841.89, M = 50;

const DARK  = '#2D3134';
const BRAND = '#B48A73';
const LIGHT = '#F8F5F2';
const GRAY  = '#666666';
const LINE  = '#DDDDDD';
const GREEN = '#25D366';

// ── helpers ──────────────────────────────────────────────────────────────────

function page(bg) {
  doc.addPage();
  if (bg) doc.rect(0,0,W,H).fill(bg);
}

function hdr(title, sub) {
  doc.rect(0,0,W,110).fill(DARK);
  doc.rect(0,108,W,4).fill(BRAND);
  doc.fillColor('white').font('Bold').fontSize(26)
     .text(title, M, 32, {width: W-M*2});
  if (sub) doc.fillColor(BRAND).font('Regular').fontSize(11)
               .text(sub, M, 72, {width: W-M*2});
}

function sec(txt, y) {
  doc.rect(M, y, 4, 18).fill(BRAND);
  doc.fillColor(DARK).font('Bold').fontSize(13)
     .text(txt, M+12, y+1, {width: W-M*2});
  return doc.y + 6;
}

function para(txt, y, opts={}) {
  doc.fillColor(GRAY).font('Regular').fontSize(10.5)
     .text(txt, M, y, {width: W-M*2, lineGap:2, ...opts});
  return doc.y + 6;
}

function bul(items, y) {
  items.forEach(item => {
    doc.circle(M+5, y+5, 3).fill(BRAND);
    doc.fillColor('#333').font('Regular').fontSize(10.5)
       .text(item, M+16, y, {width: W-M*2-16, lineGap:2});
    y = doc.y + 4;
  });
  return y + 2;
}

function div(y) {
  doc.rect(M, y, W-M*2, 1).fill(LINE);
  return y + 14;
}

function box(x, y, w, h, title, desc, icon) {
  doc.rect(x, y, w, h).fill(LIGHT);
  doc.rect(x, y, w, 3).fill(BRAND);
  doc.fillColor(DARK).font('Bold').fontSize(10.5)
     .text((icon||'')+' '+title, x+10, y+12, {width: w-20});
  doc.fillColor(GRAY).font('Regular').fontSize(9)
     .text(desc, x+10, y+28, {width: w-20, lineGap:1.5});
}

function stp(n, title, desc, y) {
  doc.circle(M+13, y+12, 13).fill(BRAND);
  doc.fillColor('white').font('Bold').fontSize(12)
     .text(String(n), M+8, y+6, {lineBreak:false});
  doc.fillColor(DARK).font('Bold').fontSize(11.5)
     .text(title, M+34, y, {width: W-M*2-34});
  doc.fillColor(GRAY).font('Regular').fontSize(10)
     .text(desc, M+34, doc.y+1, {width: W-M*2-34, lineGap:2});
  return doc.y + 10;
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 1 — PORTADA
// ══════════════════════════════════════════════════════════════════════════════
page(DARK);
doc.rect(0,0,W,6).fill(BRAND);
doc.rect(0,H-6,W,6).fill(BRAND);

// círculo logo
doc.circle(W/2, 230, 70).fill(BRAND);
doc.fillColor('white').font('Bold').fontSize(40)
   .text('PG', W/2-24, 208);

doc.fillColor('white').font('Bold').fontSize(32)
   .text('PINO GALANT', 0, 328, {align:'center', width:W});

doc.fillColor(BRAND).font('Regular').fontSize(13)
   .text('pinogalant.com.ar', 0, 368, {align:'center', width:W});

doc.rect(W/2-50, 396, 100, 2).fill(BRAND);

doc.fillColor('white').font('Bold').fontSize(17)
   .text('Guía de la Plataforma Digital', 0, 412, {align:'center', width:W});
doc.fillColor('#AAAAAA').font('Regular').fontSize(11)
   .text('Para agentes y administración · 2025', 0, 438, {align:'center', width:W});

// chips
const chips = ['Sitio Web', 'Panel Admin', 'WhatsApp', 'Tasación'];
let cx = 110;
chips.forEach(ch => {
  const tw = doc.font('Bold').fontSize(10).widthOfString(ch)+22;
  doc.roundedRect(cx, 490, tw, 24, 12).fill('#3a3e42');
  doc.fillColor(BRAND).font('Bold').fontSize(10)
     .text(ch, cx+11, 497, {lineBreak:false});
  cx += tw+10;
});

doc.fillColor('#888888').font('Regular').fontSize(9)
   .text('Preparado para Dana — Responsable Comercial', 0, H-40, {align:'center', width:W});

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 2 — EL SITIO WEB
// ══════════════════════════════════════════════════════════════════════════════
page('white');
hdr('El Sitio Web', 'pinogalant.com.ar — disponible 24hs desde celular o computadora');

let y = 128;
y = para('El sitio web de Pino Galant es una plataforma inmobiliaria completa. Los clientes pueden explorar propiedades, pedir tasaciones y contactar asesores directamente por WhatsApp.', y);
y += 8;

y = sec('Páginas principales', y);

const pw = (W-M*2-10)/2;
const pags = [
  ['Inicio','Buscador, mapa de propiedades, categorías y propiedades destacadas.','🏠'],
  ['Propiedades','Listado completo con filtros por tipo, operación y provincia.','🏘️'],
  ['Venta','Acceso directo a propiedades en venta.','💰'],
  ['Alquiler','Acceso directo a propiedades en alquiler.','🔑'],
  ['Tasación','Formulario de 3 pasos que envía datos al WhatsApp del asesor.','📊'],
  ['Publicar','Para que clientes soliciten publicar su propiedad.','📢'],
];
pags.forEach((p,i) => {
  const col = i%2, row = Math.floor(i/2);
  box(M+col*(pw+10), y+row*80, pw, 70, p[0], p[1], p[2]);
});
y += 3*80 + 12;

y = sec('Funcionalidades clave', y);
y = bul([
  'Buscador por tipo, operación, provincia y localidad',
  'Mapa interactivo con pins de cada propiedad georeferenciada',
  'Botón WhatsApp en cada propiedad para contacto directo con el asesor asignado',
  'Formulario de tasación en 3 pasos con envío automático por WhatsApp',
  'Instalable como app en el celular (PWA) — funciona como app descargada',
  'Optimizado para Google (SEO) y carga rápida en mobile',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 3 — GUÍA PARA AGENTES
// ══════════════════════════════════════════════════════════════════════════════
page('white');
hdr('Guía para Agentes', 'Cómo usar el sitio en el día a día');

y = 128;
y = sec('1. Instalar la app en el celular', y);
y = stp(1,'Abrí pinogalant.com.ar en Chrome (Android) o Safari (iPhone)','El sitio funciona en cualquier navegador', y);
y = stp(2,'Buscá el botón "📲 Instalar app"','Aparece en la sección Quiénes Somos de la página de inicio', y);
y = stp(3,'Tocá Instalar y aceptá','El ícono de Pino Galant queda en tu pantalla de inicio como una app', y);
y += 4;

y = div(y);
y = sec('2. Compartir una propiedad con un cliente', y);
y = stp(1,'Entrá a pinogalant.com.ar/propiedades','Filtrá por tipo, operación o provincia desde el panel lateral', y);
y = stp(2,'Tocá "Ver detalle" en la propiedad','Se abre la ficha completa con fotos, precio y descripción', y);
y = stp(3,'Usá el botón Compartir','Copiá el enlace o compartilo directo por WhatsApp al cliente', y);
y += 4;

y = div(y);
y = sec('3. Recibir consultas por WhatsApp', y);
y = para('Cuando un cliente toca el botón WhatsApp en una propiedad, el mensaje llega al número del agente asignado a esa propiedad. El mensaje ya viene con la dirección escrita.', y);

doc.rect(M, y, W-M*2, 50).fill('#E8F5E9');
doc.rect(M, y, 4, 50).fill(GREEN);
doc.fillColor('#1B5E20').font('Bold').fontSize(10)
   .text('Mensaje que recibís:', M+14, y+8);
doc.fillColor('#2E7D32').font('Regular').fontSize(10)
   .text('Hola! Me interesa la propiedad en Av. San Martín 450. ¿Me podés dar más información?', M+14, y+24, {width: W-M*2-20});
y += 62;

y = div(y);
y = sec('4. Filtros en la página de Propiedades', y);
y = bul([
  'Sidebar izquierdo (en desktop): TIPO DE PROPIEDAD, OPERACIÓN y PROVINCIA',
  'Chips superiores (en celular): filtro rápido tocando una opción',
  'Buscador de dirección: escribí una calle o barrio y presioná Buscar',
  'Ordenamiento: Por defecto, Precio ascendente o Precio descendente',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 4 — PANEL ADMIN
// ══════════════════════════════════════════════════════════════════════════════
page('white');
hdr('Panel Admin — Guía para Dana', 'Gestión completa desde pinogalant.com.ar/admin');

y = 128;
y = sec('Cómo ingresar', y);
y = stp(1,'Ingresá a pinogalant.com.ar/login','Usá tu email y contraseña de administradora', y);
y = stp(2,'En el menú aparece "Admin" en color dorado','Solo visible para usuarios con rol administrador', y);
y = stp(3,'Tocá Admin para ir al panel','Desde ahí manejás todo el sitio', y);
y += 4;

y = div(y);
y = sec('Secciones del Panel Admin', y);

const acw = (W-M*2-10)/2;
const adm = [
  ['Prospectos / Clientes','Clientes que consultaron. Asigná agentes, marcá visitas, cerrá gestiones.','👥'],
  ['Propiedades','Se sincronizan automáticamente desde Tokko. Asigná agentes y badges.','🏠'],
  ['Badges','Marcá propiedades: Valor ajustado, Permuta o Reservado.','🏷️'],
  ['Agentes','Gestioná el equipo: nombre, WhatsApp y asignación de propiedades.','👤'],
  ['Leads','Registro de todas las consultas recibidas por WhatsApp desde el sitio.','📋'],
  ['Hero Image','Cambiá la foto principal de la página de inicio.','🖼️'],
];
adm.forEach((a,i) => {
  const col = i%2, row = Math.floor(i/2);
  box(M+col*(acw+10), y+row*86, acw, 76, a[0], a[1], a[2]);
});
y += 3*86 + 12;

y = sec('Sincronización con Tokko Broker', y);
doc.rect(M, y, W-M*2, 48).fill(LIGHT);
doc.rect(M, y, 4, 48).fill(BRAND);
doc.fillColor(DARK).font('Bold').fontSize(11)
   .text('Actualización automática cada 5 minutos', M+14, y+8);
doc.fillColor(GRAY).font('Regular').fontSize(10)
   .text('Todo lo que publicás o modificás en Tokko Broker aparece automáticamente en el sitio. No necesitás cargar propiedades manualmente.', M+14, y+26, {width: W-M*2-24, lineGap:2});
y += 56;

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 5 — GESTIÓN DE PROSPECTOS
// ══════════════════════════════════════════════════════════════════════════════
page('white');
hdr('Gestión de Prospectos', 'Seguimiento de clientes de principio a fin');

y = 128;
y = para('El panel de prospectos permite registrar y hacer seguimiento de los clientes. Cada prospecto sigue un flujo de estados desde el primer contacto hasta el cierre de la operación.', y);
y += 8;

y = sec('Estados de un prospecto', y);

const sts = [
  [DARK,  '🔵 Nuevo',    'Prospecto recién ingresado, sin asignar todavía.'],
  ['#9C6B00','🟡 Asignado', 'Ya tiene un agente responsable asignado.'],
  [BRAND, '🟠 Visitado',  'El agente visitó la propiedad con el cliente.'],
  ['#2E7D32','🟢 Cerrado', 'Operación concretada o prospecto descartado.'],
];
sts.forEach(([color, estado, desc]) => {
  doc.rect(M, y, W-M*2, 46).fill(LIGHT);
  doc.rect(M, y, 5, 46).fill(color);
  doc.fillColor(DARK).font('Bold').fontSize(11.5)
     .text(estado, M+18, y+8);
  doc.fillColor(GRAY).font('Regular').fontSize(10)
     .text(desc, M+18, y+28, {width: W-M*2-28});
  y += 52;
});

y += 4;
y = div(y);
y = sec('Cómo asignar un agente', y);
y = stp(1,'Admin → Prospectos','Ves la lista completa con estado de cada cliente', y);
y = stp(2,'Tocá el prospecto','Se abre el detalle con datos del cliente e interés', y);
y = stp(3,'Seleccioná el agente del menú','El estado cambia automáticamente a Asignado', y);
y = stp(4,'El agente avanza con el cliente','Marca Visitado y luego Cerrado al finalizar', y);
y += 4;

y = div(y);
y = sec('Flujo diario recomendado para Dana', y);
y = bul([
  'Revisá prospectos cada mañana para detectar nuevas consultas',
  'Asigná cada prospecto al agente adecuado según zona de la propiedad',
  'El agente marca Visitado luego de mostrar la propiedad',
  'Marcá Cerrado cuando la operación se concretó o el cliente no avanzó',
  'Usá el filtro por estado para ver en qué etapa está cada operación',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 6 — TASACIÓN Y WHATSAPP
// ══════════════════════════════════════════════════════════════════════════════
page('white');
hdr('Tasación y Contacto WhatsApp', 'Cómo funcionan los formularios');

y = 128;
y = sec('Formulario de Tasación — 3 pasos', y);

const pasos = [
  ['1', 'Datos de la propiedad', 'Tipo → Provincia → Ciudad/Localidad → Zona o distancia del centro'],
  ['2', 'Características', 'Superficie m² · Ambientes · Estado · Extras (cochera, pileta, etc.)'],
  ['3', 'Tus datos', 'Nombre y WhatsApp del cliente para poder contactarlo'],
];
pasos.forEach(p => {
  doc.rect(M, y, W-M*2, 52).fill(LIGHT);
  doc.circle(M+22, y+26, 16).fill(BRAND);
  doc.fillColor('white').font('Bold').fontSize(15)
     .text(p[0], M+16, y+18, {lineBreak:false});
  doc.fillColor(DARK).font('Bold').fontSize(11.5)
     .text(p[1], M+48, y+10);
  doc.fillColor(GRAY).font('Regular').fontSize(10)
     .text(p[2], M+48, y+28, {width: W-M*2-56});
  y += 60;
});

y += 4;
y = div(y);
y = sec('Provincias y zonas disponibles', y);
y = para('El formulario tiene las 24 provincias argentinas (incluida CABA) con ciudades de cada una. Las zonas cambian según el tipo de propiedad:', y);

doc.rect(M, y, W-M*2, 58).fill(LIGHT);
doc.rect(M, y, 4, 58).fill(DARK);
doc.fillColor(DARK).font('Bold').fontSize(10)
   .text('Urbanas (casa, depto, local, etc.):', M+14, y+8);
doc.fillColor(GRAY).font('Regular').fontSize(10)
   .text('Centro · Macrocentro · Norte · Sur · Este · Oeste · Periurbano', M+14, y+22);
doc.fillColor(DARK).font('Bold').fontSize(10)
   .text('Rurales (Quinta / Campo):', M+14, y+38);
doc.fillColor(GRAY).font('Regular').fontSize(10)
   .text('Hasta 5km · 5 a 10km · 10 a 20km · Más de 20km del centro', M+14, y+52);
y += 68;

y = div(y);
y = sec('Routing de consultas WhatsApp', y);
y = bul([
  'Si la propiedad tiene agente asignado en Admin → va al WhatsApp del agente',
  'Si no tiene agente asignado → va al WhatsApp general de Pino Galant',
  'Cada consulta queda registrada automáticamente en el panel de Leads',
  'El mensaje ya viene con la dirección de la propiedad escrita',
], y);

// ══════════════════════════════════════════════════════════════════════════════
// PÁG 7 — ACCESOS Y FAQ
// ══════════════════════════════════════════════════════════════════════════════
page('white');
hdr('Referencias Rápidas', 'URLs, accesos y preguntas frecuentes');

y = 128;
y = sec('URLs del sitio', y);

const urls = [
  ['🌐','Sitio web',      'pinogalant.com.ar'],
  ['🔐','Login Admin',    'pinogalant.com.ar/login'],
  ['⚙️','Panel Admin',    'pinogalant.com.ar/admin'],
  ['🏘️','Propiedades',   'pinogalant.com.ar/propiedades'],
  ['📊','Tasación',       'pinogalant.com.ar/tasacion'],
  ['📢','Publicar',       'pinogalant.com.ar/publicar'],
  ['📄','Esta guía',      'pinogalant.com.ar/guia-pinogalant.pdf'],
];
urls.forEach(u => {
  doc.rect(M, y, W-M*2, 32).fill(LIGHT);
  doc.fillColor(DARK).font('Bold').fontSize(10.5)
     .text(u[0]+'  '+u[1], M+12, y+10, {continued:true, lineBreak:false});
  doc.fillColor(BRAND).font('Regular').fontSize(10.5)
     .text('    '+u[2]);
  y += 36;
});

y += 6;
y = div(y);
y = sec('Preguntas frecuentes', y);

const faqs = [
  ['¿Cada cuánto se actualizan las propiedades?',
   'Cada 5 minutos automáticamente desde Tokko Broker.'],
  ['¿Qué hago si una propiedad no aparece?',
   'Verificá que esté publicada y activa en Tokko Broker. El sitio la muestra en el próximo ciclo.'],
  ['¿Cómo cambio la foto del inicio?',
   'Admin → Hero Image → subí la nueva foto y guardá.'],
  ['¿Cómo agrego un agente nuevo?',
   'Admin → Agentes → Nuevo agente. Completá nombre y WhatsApp.'],
  ['¿Por qué no aparece el botón Instalar app?',
   'Necesita Chrome en Android o Safari en iPhone. En computadora puede no aparecer.'],
  ['¿Quién recibe las consultas de WhatsApp?',
   'El agente asignado a esa propiedad. Si no hay asignado, llega al número general.'],
];

faqs.forEach(faq => {
  doc.fillColor(BRAND).font('Bold').fontSize(10)
     .text('❓  '+faq[0], M, y, {width: W-M*2});
  y = doc.y + 2;
  doc.fillColor(GRAY).font('Regular').fontSize(10)
     .text(faq[1], M+12, y, {width: W-M*2-12});
  y = doc.y + 10;
});

// ── pie de página en todas las páginas ───────────────────────────────────────
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.rect(0, H-32, W, 32).fill(DARK);
  doc.fillColor(BRAND).font('Bold').fontSize(8)
     .text('PINO GALANT', M, H-20, {continued:true, lineBreak:false});
  doc.fillColor('#888888').font('Regular').fontSize(8)
     .text('  ·  pinogalant.com.ar', {continued:true, lineBreak:false});
  doc.fillColor('#888888').fontSize(8)
     .text('  ·  Pág. '+(i+1)+' de '+range.count, {align:'right', width: W-M*2});
}

doc.flushPages();
doc.end();
console.log('✅ PDF listo:', OUT);
