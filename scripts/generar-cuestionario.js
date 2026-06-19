const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 48, right: 48 },
  bufferPages: true,
  info: { Title: 'Cuestionario + Presupuesto — Pino Galant', Author: 'LocalWeb.ar' }
});

const OUT = path.join(__dirname, '..', 'public', 'cuestionario-pinogalant.pdf');
doc.pipe(fs.createWriteStream(OUT));

// ─── Paleta ────────────────────────────────────────────────────────────────
const C = {
  bronce:  '#B48A73',
  dark:    '#2D3134',
  gray:    '#6B7280',
  lgray:   '#9CA3AF',
  bg:      '#F9F6F3',
  border:  '#E0D0C4',
  white:   '#FFFFFF',
  green:   '#16A34A',
  blue:    '#1D4ED8',
};

const L  = 48;
const PW = doc.page.width - L * 2;
let   cy = 40;

// ─── Layout helpers ────────────────────────────────────────────────────────
function newPageIfNeeded(need) {
  if (cy + need > doc.page.height - 48) { doc.addPage(); cy = 40; }
}
function gap(n = 6) { cy += n; }

// Línea separadora
function hr(color = C.border, w = 0.5) {
  doc.moveTo(L, cy).lineTo(L + PW, cy).strokeColor(color).lineWidth(w).stroke();
}

// Caja de sección (header oscuro)
function secHeader(num, title, sub) {
  newPageIfNeeded(28);
  doc.rect(L, cy, PW, 22).fillColor(C.dark).fill();
  doc.rect(L, cy, 4, 22).fillColor(C.bronce).fill();
  doc.fontSize(10).fillColor(C.white).font('Helvetica-Bold')
     .text(`${num}  ${title}`, L + 12, cy + 6, { continued: !!sub });
  if (sub) doc.fontSize(8).fillColor('#9CA3AF').font('Helvetica').text(`   ${sub}`);
  cy += 28;
}

// Sub-sección (fondo claro)
function subSec(title) {
  newPageIfNeeded(18);
  doc.rect(L, cy, PW, 16).fillColor('#EDE8E3').fill();
  doc.fontSize(8).fillColor(C.bronce).font('Helvetica-Bold')
     .text(title.toUpperCase(), L + 8, cy + 4, { characterSpacing: 0.4 });
  cy += 20;
}

// Nota informativa
function nota(text) {
  newPageIfNeeded(18);
  doc.rect(L, cy, 3, 14).fillColor(C.bronce).fill();
  doc.fontSize(7.5).fillColor(C.gray).font('Helvetica-Oblique')
     .text(text, L + 10, cy + 3, { width: PW - 12 });
  cy += 18;
}

// Línea para escribir
function linea(label, pct = 1) {
  newPageIfNeeded(22);
  doc.fontSize(8).fillColor(C.gray).font('Helvetica').text(label, L, cy);
  cy += 11;
  doc.moveTo(L, cy).lineTo(L + PW * pct, cy).strokeColor(C.border).lineWidth(0.6).stroke();
  cy += 11;
}

// Líneas vacías para escribir (sin label)
function lineas(n) {
  for (let i = 0; i < n; i++) {
    newPageIfNeeded(13);
    doc.moveTo(L, cy).lineTo(L + PW, cy).strokeColor(C.border).lineWidth(0.6).stroke();
    cy += 13;
  }
}

// Checkbox + label
function CB(x, y, label, w = 140) {
  doc.roundedRect(x, y, 11, 11, 2).strokeColor(C.bronce).lineWidth(0.8).stroke();
  doc.fontSize(8).fillColor(C.dark).font('Helvetica').text(label, x + 14, y + 1.5, { width: w - 14 });
}

// Fila Sí/No
function yesno(label) {
  newPageIfNeeded(16);
  doc.fontSize(8.5).fillColor(C.dark).font('Helvetica').text(label, L, cy + 1.5, { width: PW - 80 });
  CB(L + PW - 72, cy, 'Sí', 36);
  CB(L + PW - 36, cy, 'No', 36);
  cy += 16;
}

// Grid de checkboxes compacto
function cbGrid(items, cols = 3) {
  const cw = PW / cols;
  let col = 0, startCy = cy;
  items.forEach(item => {
    newPageIfNeeded(15);
    if (col === 0 && item !== items[0]) startCy = cy;
    const x = L + col * cw;
    CB(x, cy, item, cw - 4);
    col++;
    if (col >= cols) { col = 0; cy += 15; }
  });
  if (col > 0) cy += 15;
  gap(2);
}

// Prioridad Alta/Media/Baja
function prioridad(label) {
  newPageIfNeeded(15);
  doc.fontSize(8.5).fillColor(C.dark).font('Helvetica').text(label, L, cy + 1.5, { width: PW - 120 });
  ['Alta', 'Media', 'Baja'].forEach((p, i) => {
    CB(L + PW - 118 + i * 40, cy, p, 38);
  });
  cy += 15;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════════════════════════════════════════
// Banda superior
doc.rect(0, 0, doc.page.width, 160).fillColor(C.dark).fill();
doc.rect(0, 0, 6, 160).fillColor(C.bronce).fill();

// Badge LocalWeb
doc.roundedRect(L, 32, 110, 24, 4).fillColor(C.bronce).fill();
doc.fontSize(12).fillColor(C.white).font('Helvetica-Bold').text('LocalWeb.ar', L + 8, 39);

doc.fontSize(8).fillColor('#8A9099').font('Helvetica')
   .text('CUESTIONARIO DE RELEVAMIENTO', L, 68, { characterSpacing: 1.5 });
doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Sitio Web Inmobiliaria', L, 82);
doc.fontSize(11).fillColor(C.bronce).font('Helvetica').text('Pino Galant', L, 112);
doc.moveTo(L, 130).lineTo(L + 130, 130).strokeColor(C.bronce).lineWidth(1).stroke();
doc.fontSize(8).fillColor('#8A9099').font('Helvetica')
   .text('Marcar con ✔ las opciones deseadas · Completar junto al cliente', L, 138);

cy = 175;

// Cuadro datos de reunión
doc.roundedRect(L, cy, PW, 56, 4).fillColor(C.bg).fill();
doc.roundedRect(L, cy, PW, 56, 4).strokeColor(C.border).lineWidth(0.6).stroke();
doc.fontSize(7.5).fillColor(C.bronce).font('Helvetica-Bold')
   .text('DATOS DE LA REUNIÓN', L + 10, cy + 8, { characterSpacing: 1 });

const fw = (PW - 30) / 3;
['Fecha', 'Participantes', 'Próximo contacto'].forEach((lbl, i) => {
  const fx = L + 10 + i * (fw + 5);
  doc.fontSize(7.5).fillColor(C.gray).font('Helvetica').text(lbl, fx, cy + 24);
  doc.moveTo(fx, cy + 46).lineTo(fx + fw - 4, cy + 46).strokeColor(C.border).lineWidth(0.5).stroke();
});
cy += 66;

nota('Este cuestionario cubre todas las secciones posibles. Pueden elegir incluir todo o solo lo necesario en esta etapa.');
gap(4);
hr(); gap(10);

// ═══════════════════════════════════════════════════════════════════════════════
// 0. DATOS GENERALES
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('0.', 'Datos Generales');
linea('Nombre comercial', 0.6); linea('Dirección / zona de operación', 0.8);
// Dos columnas
const hcol = (PW - 8) / 2;
newPageIfNeeded(22);
doc.fontSize(8).fillColor(C.gray).font('Helvetica').text('Teléfono', L, cy);
doc.text('WhatsApp (con código de área)', L + hcol + 8, cy);
cy += 11;
doc.moveTo(L, cy).lineTo(L + hcol, cy).strokeColor(C.border).lineWidth(0.6).stroke();
doc.moveTo(L + hcol + 8, cy).lineTo(L + PW, cy).strokeColor(C.border).lineWidth(0.6).stroke();
cy += 11;
linea('Email de contacto', 0.7); linea('Dominio web deseado  (ej: pinogalant.com.ar)', 0.75);
yesno('¿Ya tienen dominio registrado?');
yesno('¿Tienen cuenta Tokkobroker activa con propiedades cargadas?');
linea('API Key de Tokkobroker (si ya la tienen)');
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('1.', 'Página Principal (Home)', '— lo que ve el cliente al entrar');

subSec('1.1 — Encabezado (Header)');
cbGrid(['Logo de la inmobiliaria','Menú de navegación','Teléfono/WhatsApp visible','Botón "Publicar propiedad"'], 4);

subSec('1.2 — Hero (imagen/video principal)');
yesno('¿Foto o video de fondo grande?');
linea('Mensaje principal que quieren transmitir');
yesno('¿Buscador de propiedades dentro del hero?');

subSec('1.3 — Filtros del Buscador');
nota('Traen propiedades en tiempo real desde Tokkobroker.');
cbGrid(['Comprar / Alquilar','Tipo de propiedad','Localidad / Barrio','Precio mín y máx','Superficie (m²)','Ambientes','Dormitorios','Cochera','Pileta','Apto crédito','Mascotas','Amueblado'], 4);

subSec('1.4 — Secciones del Home');
cbGrid(['Propiedades destacadas','Propiedades en venta','Propiedades en alquiler','Últimas incorporaciones','Buscar por tipo (casa, depto...)','Buscar por zona/barrio','Quiénes somos','Equipo de agentes','Servicios','Testimonios de clientes','Preguntas frecuentes','Formulario de contacto','Mapa de cobertura','Blog / Novedades','Matrícula CUCICBA','Redes sociales'], 4);

subSec('1.5 — Footer');
cbGrid(['Dirección','Teléfono y WhatsApp','Email','Horario de atención','Menú rápido','Redes sociales','Mapa (Google Maps)','Matrícula / CUCICBA'], 4);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROPIEDADES
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('2.', 'Propiedades — Listado y Ficha');

subSec('2.1 — Vista del listado');
cbGrid(['Grilla (tarjetas)','Lista (filas)','Mapa con puntos','Ordenar por precio/fecha','Cantidad de resultados','Scroll infinito'], 3);

subSec('2.2 — Datos en la ficha de cada propiedad');
nota('Vienen automáticamente de Tokkobroker si están cargados allí.');
cbGrid(['Galería de fotos','Video (YouTube/Vimeo)','Tour virtual 360°','Precio ($ o USD)','Expensas','Superficie cubierta','Superficie total','Ambientes / dorm. / baños','Piso y orientación','Antigüedad','Descripción completa','Amenities (cochera, pileta...)','Mapa / ubicación','Foto del agente','WhatsApp del agente','Consulta por WhatsApp','Formulario de consulta','Compartir en redes','Imprimir ficha PDF','Propiedades similares'], 4);

subSec('2.3 — Operaciones que manejan');
cbGrid(['Venta','Alquiler','Alquiler temporal','Alquiler comercial','Cochera','Permuta / Canje'], 6);

subSec('2.4 — Tipos de propiedad');
cbGrid(['Casa','Departamento','PH','Duplex','Terreno','Lote en countries','Local comercial','Oficina','Galpón','Campo / Chacra','Fondo de comercio','Cochera'], 6);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ALQUILERES
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('3.', 'Gestión de Alquileres', '— contratos e inquilinos');
nota('Sección opcional. Permite registrar y hacer seguimiento de contratos desde el panel admin.');
yesno('¿Registrar contratos (inicio, fin, monto)?');
yesno('¿Registro de inquilinos y garantes?');
yesno('¿Alertas de vencimiento de contrato?');
yesno('¿Avisos de aumentos según índice (ICL, IPC)?');
yesno('¿Seguimiento de pagos mensuales?');
yesno('¿Recibos / comprobantes de pago?');
yesno('¿Portal para que el propietario vea el estado de su alquiler?');
yesno('¿Portal para que el inquilino vea sus pagos?');
yesno('¿Carga de documentos del contrato (PDF)?');
subSec('Índice de actualización');
cbGrid(['ICL (Índice Contratos Locación)','IPC (Inflación INDEC)','Acuerdo entre partes','Otro'], 4);
linea('Especificar si es otro', 0.5);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. EQUIPO Y AGENTES
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('4.', 'Equipo y Agentes');
yesno('¿Página pública con el equipo de agentes?');
yesno('¿Foto, nombre y especialidad de cada agente?');
yesno('¿WhatsApp individual por agente?');
yesno('¿Cada agente tiene sección con sus propiedades?');

subSec('Roles en el panel admin');
cbGrid(['Super Admin (control total)','Administrador','Agente (solo sus propiedades)','Propietario (publica las suyas)','Inquilino (ve su contrato)'], 3);

subSec('Cantidad de agentes que usarán el panel');
cbGrid(['1 – 3','4 – 8','9 – 15','Más de 15'], 4);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PANEL ADMIN
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('5.', 'Panel Administrativo', '— solo para el equipo');
cbGrid(['Ver propiedades de Tokkobroker','Asignar agente por propiedad','Ver y responder consultas','Pipeline de consultas','Estadísticas de visitas','Gestión de usuarios/agentes','Registro contratos de alquiler','Seguimiento de pagos','Caja / ingresos y egresos','Log de actividad','Notificaciones internas','Exportar a Excel'], 3);

subSec('Dispositivos principales de uso');
cbGrid(['PC de escritorio','Notebook','Celular','Tablet'], 4);

subSec('Notificaciones que quieren recibir');
cbGrid(['Email cuando llega consulta','WhatsApp cuando llega consulta','Email al vencer un contrato','Email por pago pendiente','Notificación en el panel'], 3);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 6. COMUNICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('6.', 'Comunicación con el Cliente');
cbGrid(['WhatsApp flotante (siempre visible)','Formulario de contacto general','Formulario por propiedad','Chat con FAQ automáticas','Chat con IA (responde 24 hs)','Llamada directa (tel:)'], 3);
linea('Número de WhatsApp principal', 0.5);
yesno('¿Un solo WhatsApp para toda la inmobiliaria?');
yesno('¿WhatsApp distinto por agente según la propiedad?');
yesno('¿Mensaje pre-cargado con datos de la propiedad?');
yesno('¿Links de Instagram/redes con preview automático de la propiedad?');
linea('Instagram'); linea('Facebook');
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 7. DISEÑO Y MARCA
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('7.', 'Diseño y Marca');
yesno('¿Tienen logo en formato digital (PNG/SVG)?');
yesno('¿Tienen colores definidos de la marca?');
linea('Color principal', 0.35);
yesno('¿Tienen tipografía definida?');
linea('Sitio de referencia que les guste (URL o nombre)');
subSec('Estilo general');
cbGrid(['Moderno / minimalista','Elegante / premium','Cálido / familiar','Profesional / corporativo','Oscuro (dark mode)'], 5);
subSec('Idiomas');
cbGrid(['Solo español','Español + Inglés','Español + Inglés + Portugués'], 3);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 8. SEO Y MARKETING
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('8.', 'SEO y Marketing Digital');
yesno('¿Quieren aparecer en Google con búsquedas de zona + tipo?');
yesno('¿Tienen cuenta de Google Business (Google Maps)?');
yesno('¿Quieren blog para posicionamiento en buscadores?');
yesno('¿Quieren Google Analytics (estadísticas de visitas)?');
yesno('¿Quieren Meta Pixel (para campañas de Instagram/Facebook)?');
yesno('¿Realizan o planean hacer publicidad paga (Google Ads / Meta Ads)?');
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 9. PRIORIDADES
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('9.', 'Prioridades y Etapas');
nota('Alta = debe estar en la primera versión  ·  Media = puede esperar  ·  Baja = a futuro');
[
  'Buscador conectado a Tokkobroker',
  'Fichas de propiedades con fotos y datos',
  'WhatsApp directo al agente',
  'Panel admin con gestión de consultas',
  'Gestión de contratos de alquiler',
  'Portal del propietario',
  'Portal del inquilino',
  'Chat con respuestas automáticas',
  'Blog / novedades',
  'Formulario para propietarios que quieren publicar',
].forEach(prioridad);

subSec('Plazo esperado de lanzamiento');
cbGrid(['Cuanto antes (urgente)','En 2 semanas','En 1 mes','Sin apuro definido'], 4);
gap(4); hr(); gap(8);

// ═══════════════════════════════════════════════════════════════════════════════
// 10. NOTAS
// ═══════════════════════════════════════════════════════════════════════════════
secHeader('10.', 'Notas y Observaciones');
linea('Funcionalidades o ideas no cubiertas en este cuestionario:');
lineas(3);
gap(4);
linea('Páginas especiales que quieren (ej: Tasaciones, Inversiones, Noticias):');
lineas(2);
gap(4);
linea('Observaciones generales de la reunión:');
lineas(3);
gap(4);

// Firmas
newPageIfNeeded(50);
doc.roundedRect(L, cy, PW, 44, 4).fillColor(C.bg).fill();
doc.roundedRect(L, cy, PW, 44, 4).strokeColor(C.border).lineWidth(0.5).stroke();
const sw = (PW - 20) / 2;
['LocalWeb.ar', 'Pino Galant'].forEach((lbl, i) => {
  const fx = L + 10 + i * (sw + 10);
  doc.moveTo(fx, cy + 32).lineTo(fx + sw, cy + 32).strokeColor(C.border).lineWidth(0.6).stroke();
  doc.fontSize(8).fillColor(C.gray).font('Helvetica').text('Firma — ' + lbl, fx, cy + 34);
});
cy += 54;
gap(10);
hr(); gap(10);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE PRESUPUESTO (siempre en página nueva)
// ═══════════════════════════════════════════════════════════════════════════════
doc.addPage();
cy = 40;

// Banda superior presupuesto
doc.rect(0, 0, doc.page.width, 90).fillColor(C.dark).fill();
doc.rect(0, 0, 6, 90).fillColor(C.bronce).fill();

doc.fontSize(8).fillColor('#8A9099').font('Helvetica')
   .text('PROPUESTA ECONÓMICA', L, 28, { characterSpacing: 1.5 });
doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('Presupuesto', L, 44);
doc.fontSize(9).fillColor(C.bronce).font('Helvetica')
   .text('LocalWeb.ar  para  Pino Galant', L, 72);
cy = 106;

// ── Desarrollo ──────────────────────────────────────────────────────────────
doc.roundedRect(L, cy, PW, 200, 6).fillColor(C.bg).fill();
doc.roundedRect(L, cy, PW, 200, 6).strokeColor(C.border).lineWidth(0.7).stroke();
doc.rect(L, cy, 5, 200).fillColor(C.bronce).fill();

doc.fontSize(11).fillColor(C.dark).font('Helvetica-Bold').text('Desarrollo del Sitio Web', L + 16, cy + 16);
doc.fontSize(8.5).fillColor(C.gray).font('Helvetica')
   .text('Pago único — incluye diseño, programación y puesta en producción', L + 16, cy + 32);

// Items incluidos
const devItems = [
  'Diseño personalizado con identidad visual de Pino Galant',
  'Integración completa con API de Tokkobroker (propiedades en tiempo real)',
  'Buscador con filtros avanzados (operación, tipo, zona, precio, superficie)',
  'Ficha de propiedad con galería, mapa, datos del agente y WhatsApp directo',
  'Panel administrativo con gestión de consultas y asignación de agentes',
  'Chat con respuestas automáticas a preguntas frecuentes',
  'Preview automático al compartir links en Instagram / WhatsApp / Facebook',
  'Diseño 100% responsivo (celular, tablet y computadora)',
  'SEO básico: URLs indexables, Open Graph, velocidad optimizada',
  'Deploy en Vercel + configuración de dominio',
];
devItems.forEach((item, i) => {
  const y = cy + 52 + i * 13;
  doc.circle(L + 20, y + 4, 2.5).fillColor(C.bronce).fill();
  doc.fontSize(8).fillColor(C.dark).font('Helvetica').text(item, L + 28, y, { width: PW - 130 });
});

// Precio desarrollo
doc.roundedRect(L + PW - 160, cy + 44, 148, 52, 5).fillColor(C.dark).fill();
doc.fontSize(9).fillColor(C.bronce).font('Helvetica-Bold').text('INVERSIÓN INICIAL', L + PW - 152, cy + 52, { width: 134, align: 'center' });
doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('$700.000', L + PW - 152, cy + 68, { width: 134, align: 'center' });
doc.fontSize(7.5).fillColor('#8A9099').font('Helvetica').text('pesos argentinos', L + PW - 152, cy + 94, { width: 134, align: 'center' });

cy += 212;
gap(14);

// ── Mantenimiento ──────────────────────────────────────────────────────────
doc.roundedRect(L, cy, PW, 162, 6).fillColor(C.bg).fill();
doc.roundedRect(L, cy, PW, 162, 6).strokeColor(C.border).lineWidth(0.7).stroke();
doc.rect(L, cy, 5, 162).fillColor('#2563EB').fill();

doc.fontSize(11).fillColor(C.dark).font('Helvetica-Bold').text('Mantenimiento Mensual', L + 16, cy + 16);
doc.fontSize(8.5).fillColor(C.gray).font('Helvetica')
   .text('Abono mensual — incluye todo lo necesario para que el sitio funcione', L + 16, cy + 32);

const mantItems = [
  ['Vercel', 'Hosting del sitio web (velocidad, SSL, uptime 99.9%)'],
  ['GitHub', 'Repositorio de código con historial y backups'],
  ['Soporte técnico', 'Resolución de consultas y ajustes menores'],
  ['Actualizaciones de seguridad', 'Parches y dependencias al día'],
  ['Monitoreo', 'Control del funcionamiento del sitio las 24 hs'],
];
mantItems.forEach(([titulo, desc], i) => {
  const y = cy + 52 + i * 18;
  doc.circle(L + 20, y + 5, 2.5).fillColor('#2563EB').fill();
  doc.fontSize(8.5).fillColor(C.dark).font('Helvetica-Bold').text(titulo, L + 28, y, { continued: true });
  doc.fontSize(8).fillColor(C.gray).font('Helvetica').text('  — ' + desc, { width: PW - 140 });
});

// Precio mantenimiento
doc.roundedRect(L + PW - 160, cy + 44, 148, 52, 5).fillColor('#1E3A5F').fill();
doc.fontSize(9).fillColor('#93C5FD').font('Helvetica-Bold').text('ABONO MENSUAL', L + PW - 152, cy + 52, { width: 134, align: 'center' });
doc.fontSize(22).fillColor(C.white).font('Helvetica-Bold').text('$100.000', L + PW - 152, cy + 68, { width: 134, align: 'center' });
doc.fontSize(7.5).fillColor('#8A9099').font('Helvetica').text('pesos argentinos / mes', L + PW - 152, cy + 94, { width: 134, align: 'center' });

cy += 176;
gap(14);

// ── Resumen total ──────────────────────────────────────────────────────────
doc.roundedRect(L, cy, PW, 52, 6).fillColor(C.dark).fill();
doc.roundedRect(L, cy, PW, 52, 6).strokeColor(C.dark).lineWidth(0).stroke();

doc.fontSize(9).fillColor('#A0A8B0').font('Helvetica').text('RESUMEN', L + 16, cy + 10);
doc.fontSize(9).fillColor(C.white).font('Helvetica').text('Desarrollo (pago único)', L + 16, cy + 26);
doc.fontSize(9).fillColor(C.bronce).font('Helvetica-Bold').text('$700.000', L + PW/2, cy + 26);
doc.fontSize(9).fillColor(C.white).font('Helvetica').text('Mantenimiento desde el 2° mes', L + 16, cy + 40);
doc.fontSize(9).fillColor('#93C5FD').font('Helvetica-Bold').text('$100.000 / mes', L + PW/2, cy + 40);

cy += 66;
gap(14);

// ── Condiciones ────────────────────────────────────────────────────────────
doc.roundedRect(L, cy, PW, 72, 5).fillColor(C.bg).fill();
doc.roundedRect(L, cy, PW, 72, 5).strokeColor(C.border).lineWidth(0.6).stroke();
doc.fontSize(9).fillColor(C.bronce).font('Helvetica-Bold').text('Condiciones', L + 12, cy + 10);
const conds = [
  'El presupuesto tiene validez de 30 días desde la fecha de entrega.',
  'El primer mes de mantenimiento está incluido en el desarrollo.',
  'Forma de pago del desarrollo: 50% al inicio, 50% al lanzamiento.',
  'El mantenimiento se abona a partir del 2° mes de manera mensual.',
  'Modificaciones mayores fuera del alcance se presupuestan por separado.',
];
conds.forEach((c, i) => {
  doc.circle(L + 18, cy + 25 + i * 10, 2).fillColor(C.bronce).fill();
  doc.fontSize(7.5).fillColor(C.dark).font('Helvetica').text(c, L + 25, cy + 21 + i * 10, { width: PW - 32 });
});
cy += 84;

// Firma presupuesto
doc.roundedRect(L, cy, PW, 44, 4).fillColor(C.bg).fill();
doc.roundedRect(L, cy, PW, 44, 4).strokeColor(C.border).lineWidth(0.5).stroke();
['LocalWeb.ar', 'Pino Galant'].forEach((lbl, i) => {
  const fx = L + 10 + i * (sw + 10);
  doc.moveTo(fx, cy + 32).lineTo(fx + sw, cy + 32).strokeColor(C.border).lineWidth(0.6).stroke();
  doc.fontSize(8).fillColor(C.gray).font('Helvetica').text('Firma — ' + lbl, fx, cy + 34);
});

// ─── Footer en todas las páginas ────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(range.start + i);
  const isLast = i === range.count - 1;
  const label = isLast
    ? `LocalWeb.ar  ·  Presupuesto Pino Galant  ·  Página ${i + 1} de ${range.count}`
    : `LocalWeb.ar  ·  Cuestionario Pino Galant  ·  Página ${i + 1} de ${range.count}`;
  doc.fontSize(7).fillColor(C.lgray).font('Helvetica')
     .text(label, L, doc.page.height - 28, { width: PW, align: 'center' });
}

doc.end();
console.log('PDF generado en:', OUT);
