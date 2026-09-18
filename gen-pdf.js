const PDFDocument = require('pdfkit');
const fs = require('fs');

const out = fs.createWriteStream('C:/inmobiliaria/public/presentacion-pinogalant.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
doc.pipe(out);

// ── COLORES ──────────────────────────────────────────────────────────────────
const C = {
  dark:   '#2D3134',
  brand:  '#B48A73',
  light:  '#F8F5F2',
  white:  '#FFFFFF',
  gray:   '#888888',
  lgray:  '#CCCCCC',
  text:   '#222222',
  green:  '#2E7D32',
  line:   '#E5E5E5',
};

const W = 595.28; // A4 width pts
const H = 841.89; // A4 height pts
const ML = 56;    // margin left
const MR = 56;    // margin right
const CW = W - ML - MR; // content width

// ── HELPERS ──────────────────────────────────────────────────────────────────

function addPage() {
  doc.addPage({ size: 'A4', margin: 0 });
  // Footer line
  doc.rect(ML, H - 36, CW, 0.5).fill(C.line);
  doc.font('Helvetica').fontSize(8).fillColor(C.gray)
     .text('Pino Galant Inmobiliaria  |  pinogalant.com.ar', ML, H - 28, { width: CW, align: 'center' });
  return 72; // y start
}

function sectionTitle(text, y) {
  // Barra lateral izquierda
  doc.rect(ML, y, 4, 22).fill(C.brand);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C.dark)
     .text(text, ML + 12, y + 3, { width: CW - 12 });
  // Línea bajo título
  doc.rect(ML, y + 26, CW, 0.5).fill(C.line);
  return y + 36;
}

function sub(text, y) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.brand)
     .text(text.toUpperCase(), ML, y, { width: CW, characterSpacing: 0.5 });
  return y + 16;
}

function body(text, y, indent) {
  const x = ML + (indent || 0);
  const w = CW - (indent || 0);
  doc.font('Helvetica').fontSize(10).fillColor(C.text)
     .text(text, x, y, { width: w, lineGap: 3 });
  return y + doc.heightOfString(text, { width: w, lineGap: 3 }) + 6;
}

function bullet(text, y, indent) {
  const x = ML + (indent || 0);
  const w = CW - (indent || 0) - 14;
  doc.rect(x, y + 4, 4, 4).fill(C.brand);
  doc.font('Helvetica').fontSize(10).fillColor(C.text)
     .text(text, x + 12, y, { width: w, lineGap: 3 });
  const h = doc.heightOfString(text, { width: w, lineGap: 3 });
  return y + h + 5;
}

function checkRow(label, detail, y) {
  doc.rect(ML, y + 2, 12, 12).fill(C.green);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white)
     .text('OK', ML + 1, y + 4, { width: 12, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.dark)
     .text(label, ML + 18, y, { width: 160 });
  doc.font('Helvetica').fontSize(10).fillColor(C.gray)
     .text(detail, ML + 185, y, { width: CW - 185, lineGap: 3 });
  const h = Math.max(14, doc.heightOfString(detail, { width: CW - 185, lineGap: 3 }));
  return y + h + 6;
}

function gap(y, n) { return y + (n || 10); }

// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 1 — CARATULA
// ══════════════════════════════════════════════════════════════════════════════
doc.addPage({ size: 'A4', margin: 0 });

// Fondo superior oscuro
doc.rect(0, 0, W, 340).fill(C.dark);

// Logo
try {
  doc.image('C:/inmobiliaria/public/logo.png', W/2 - 70, 50, { fit: [140, 100], align: 'center' });
} catch(e) {}

// Nombre
doc.font('Helvetica-Bold').fontSize(30).fillColor(C.white)
   .text('PINO GALANT', 0, 170, { width: W, align: 'center', characterSpacing: 3 });
doc.font('Helvetica').fontSize(14).fillColor(C.brand)
   .text('INMOBILIARIA', 0, 206, { width: W, align: 'center', characterSpacing: 4 });

// Línea
doc.rect(W/2 - 80, 230, 160, 1).fill(C.brand);

doc.font('Helvetica').fontSize(11).fillColor('#BBBBBB')
   .text('Sitio web + Panel de administracion', 0, 244, { width: W, align: 'center' });

// Fondo blanco con recuadros de resumen
const boxY = 300;
const boxH = 100;
// 3 recuadros
const boxes = [
  { num: '40+',  label: 'Propiedades\npublicadas' },
  { num: '5',    label: 'Secciones del\npanel admin' },
  { num: '1',    label: 'App instalable\nen celular' },
];
const bw = 155;
const bx0 = (W - bw * 3 - 20) / 2;
boxes.forEach((b, i) => {
  const bx = bx0 + i * (bw + 10);
  doc.rect(bx, boxY, bw, boxH).fill(C.white);
  doc.rect(bx, boxY, bw, 3).fill(C.brand);
  doc.font('Helvetica-Bold').fontSize(34).fillColor(C.dark)
     .text(b.num, bx, boxY + 18, { width: bw, align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor(C.gray)
     .text(b.label, bx, boxY + 60, { width: bw, align: 'center', lineGap: 2 });
});

// Zona blanca inferior
doc.rect(0, 340 + boxH - 4, W, H - 340 - boxH + 4).fill(C.white);

// Descripcion
doc.font('Helvetica').fontSize(11).fillColor(C.text)
   .text('Documento de presentacion de funcionalidades del sitio web\ndesarrollado para Pino Galant Inmobiliaria de Santa Rosa, La Pampa.',
     ML, 430, { width: CW, align: 'center', lineGap: 4 });

// Tecnologias
const techs = ['Next.js 14', 'Supabase', 'Tokko Broker', 'PWA', 'Vercel', 'Resend'];
let tx = ML;
const ty = 500;
doc.font('Helvetica').fontSize(8.5).fillColor(C.gray)
   .text('Tecnologias utilizadas:', ML, ty - 16);
techs.forEach(t => {
  const tw = doc.widthOfString(t) + 16;
  doc.rect(tx, ty, tw, 20).fill(C.light);
  doc.rect(tx, ty, tw, 20).stroke(C.line);
  doc.font('Helvetica').fontSize(8.5).fillColor(C.dark).text(t, tx + 8, ty + 6);
  tx += tw + 6;
});

// URL
doc.font('Helvetica-Bold').fontSize(12).fillColor(C.brand)
   .text('pinogalant.com.ar', 0, 560, { width: W, align: 'center' });

// Fecha
const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
doc.font('Helvetica').fontSize(9).fillColor(C.lgray)
   .text('Generado el ' + fecha, 0, H - 40, { width: W, align: 'center' });


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 2 — INDICE
// ══════════════════════════════════════════════════════════════════════════════
let y = addPage();

doc.font('Helvetica-Bold').fontSize(20).fillColor(C.dark)
   .text('Indice de contenidos', ML, y);
y += 32;
doc.rect(ML, y, CW, 1).fill(C.brand);
y += 16;

const items = [
  ['01', 'Descripcion general del sitio'],
  ['02', 'Pagina de inicio - Home'],
  ['03', 'Listado de propiedades'],
  ['04', 'Ficha de cada propiedad'],
  ['05', 'Tasacion online'],
  ['06', 'Panel de administracion - Dashboard'],
  ['07', 'Admin - Gestion de propiedades'],
  ['08', 'Admin - Gestion de agentes'],
  ['09', 'Admin - Consultas recibidas'],
  ['10', 'Admin - Auditoria y estadisticas'],
  ['11', 'Notificaciones por email'],
  ['12', 'SEO y posicionamiento en Google'],
  ['13', 'App movil instalable'],
  ['14', 'Tecnologia y seguridad'],
];

items.forEach(([num, label], i) => {
  const bg = i % 2 === 0 ? C.light : C.white;
  doc.rect(ML, y, CW, 26).fill(bg);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.brand)
     .text(num, ML + 8, y + 8, { width: 24 });
  doc.font('Helvetica').fontSize(10).fillColor(C.text)
     .text(label, ML + 36, y + 8, { width: CW - 44 });
  doc.rect(ML, y + CW*0, 0, 0); // dummy
  y += 26;
});


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 3 — DESCRIPCION GENERAL
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('01 — Descripcion general del sitio', y);
y = gap(y, 8);
y = body('Pino Galant Inmobiliaria cuenta con un sitio web profesional, moderno y completamente funcional. El sitio esta integrado directamente con Tokko Broker, lo que significa que cualquier propiedad cargada en Tokko aparece automaticamente en el sitio en menos de 5 minutos, sin intervencion tecnica.', y);
y = gap(y, 10);
y = checkRow('Integracion automatica con Tokko', 'Las propiedades se sincronizan solas, sin trabajo manual.', y);
y = checkRow('Panel de administracion propio', 'Para gestionar agentes, consultas, videos y carteles.', y);
y = checkRow('Diseno responsive', 'Se ve perfecto en celular, tablet y computadora.', y);
y = checkRow('App instalable', 'Los clientes pueden instalarla en su celular como una app nativa.', y);
y = checkRow('Posicionado en Google', 'Con sitemap, metadata SEO y verificacion de Search Console.', y);
y = checkRow('Email automatico de alertas', 'Notifica a interesados cuando hay propiedades nuevas.', y);
y = checkRow('Hosting en Vercel', 'Velocidad maxima, SSL incluido, disponible 24/7.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 4 — HOME
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('02 — Pagina de inicio (Home)', y);
y = gap(y, 8);
y = body('La pagina principal esta disenada para captar la atencion del visitante y guiarlo hacia las propiedades disponibles.', y);
y = gap(y, 10);

y = sub('Hero con buscador', y);
y = bullet('Imagen de fondo con el eslogan de la inmobiliaria.', y);
y = bullet('Buscador rapido con filtros de operacion (venta/alquiler) y tipo de propiedad.', y);
y = bullet('Boton directo a ver todas las propiedades.', y);
y = gap(y, 8);

y = sub('Mapa interactivo de propiedades', y);
y = bullet('Muestra todas las propiedades en un mapa de Argentina.', y);
y = bullet('Iconos de colores por tipo: Casa, Departamento, Campo, Terreno, Local, etc.', y);
y = bullet('Filtros por tipo y operacion: el visitante elige que ver en el mapa.', y);
y = bullet('Al hacer clic en un icono: foto, precio y boton "Ver propiedad".', y);
y = bullet('Zoom con rueda del mouse y arrastre del mapa.', y);
y = gap(y, 8);

y = sub('Categorias de propiedades', y);
y = bullet('Acceso rapido por tipo: Casas, Departamentos, Terrenos, Campos, etc.', y);
y = bullet('Muestra el contador de propiedades disponibles en cada categoria.', y);
y = gap(y, 8);

y = sub('Propiedades destacadas', y);
y = bullet('Grilla con las ultimas propiedades cargadas en Tokko.', y);
y = bullet('Cada card muestra: foto, tipo, direccion, precio y boton de WhatsApp directo.', y);
y = gap(y, 8);

y = sub('Seccion "Nosotros" y llamada a la accion', y);
y = bullet('Estadisticas de la inmobiliaria (anos de experiencia, propiedades, etc.).', y);
y = bullet('Botones para contactar por WhatsApp o ver propiedades.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 5 — LISTADO
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('03 — Listado de propiedades', y);
y = gap(y, 8);
y = body('La seccion /propiedades muestra todas las propiedades de Tokko con filtros avanzados y vistas multiples.', y);
y = gap(y, 10);

y = sub('Filtros avanzados', y);
y = bullet('Por operacion: Venta o Alquiler.', y);
y = bullet('Por tipo: Casa, Departamento, Terreno, Local, Quinta, Campo, etc.', y);
y = bullet('Por precio minimo y maximo.', y);
y = bullet('Busqueda libre por direccion o zona.', y);
y = bullet('Ordenamiento: por defecto, precio ascendente o descendente.', y);
y = gap(y, 8);

y = sub('Vista en lista (grilla)', y);
y = bullet('Cards con foto, tipo, direccion, barrio, precio y boton de WhatsApp.', y);
y = bullet('12 propiedades por pagina con paginacion.', y);
y = bullet('Carteles destacados sobre la foto: Valor ajustado, Permuta, Reservado.', y);
y = gap(y, 8);

y = sub('Vista en mapa', y);
y = bullet('Boton "Ver en mapa" abre el mapa en pantalla completa.', y);
y = bullet('Mismo sistema de iconos y filtros que el mapa del home.', y);
y = bullet('Al cerrar el mapa vuelve al listado exactamente donde estaba.', y);
y = gap(y, 8);

y = sub('Alertas de propiedades nuevas', y);
y = bullet('Boton "Recibir alertas" para que el cliente deje su email.', y);
y = bullet('Al entrar una propiedad nueva que coincida, recibe un email automatico.', y);
y = bullet('El cliente elige: venta/alquiler, tipo, precio maximo y zonas de interes.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 6 — FICHA DE PROPIEDAD
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('04 — Ficha de cada propiedad', y);
y = gap(y, 8);
y = body('Cada propiedad tiene su propia pagina con toda la informacion detallada y herramientas para que el interesado consulte de forma directa.', y);
y = gap(y, 10);

y = sub('Galeria de fotos', y);
y = bullet('Slider con todas las fotos de la propiedad, navegable con flechas.', y);
y = gap(y, 6);

y = sub('Informacion completa', y);
y = bullet('Tipo, operacion, precio, direccion y barrio.', y);
y = bullet('Ambientes, dormitorios, banos, cochera, superficie cubierta y total.', y);
y = bullet('Descripcion completa de la propiedad.', y);
y = bullet('Carteles visibles: Valor ajustado, Permuta o Reservado.', y);
y = gap(y, 6);

y = sub('Video / Tour virtual', y);
y = bullet('Si el admin cargo un video de YouTube o Matterport, aparece embebido.', y);
y = bullet('Permite mostrar recorridos virtuales 360 de la propiedad.', y);
y = gap(y, 6);

y = sub('Mapa de ubicacion', y);
y = bullet('Mapa de Google Maps con la ubicacion exacta de la propiedad.', y);
y = gap(y, 6);

y = sub('Seccion "El barrio"', y);
y = bullet('Servicios cercanos en un radio de 800 metros: escuelas, supermercados,', y);
y = bullet('parques, centros de salud, transporte y bancos — con distancia en metros.', y, 12);
y = gap(y, 6);

y = sub('Panel lateral - Agente responsable', y);
y = bullet('Foto, nombre y cargo del agente asignado a esa propiedad.', y);
y = bullet('Boton verde de WhatsApp directo al agente.', y);
y = bullet('Formulario de consulta escrito (nombre, email, telefono, mensaje).', y);
y = gap(y, 6);

y = sub('Calculadora hipotecaria', y);
y = bullet('Solo aparece en propiedades en venta.', y);
y = bullet('El cliente ingresa precio, plazo (5 a 30 anos) y tasa de interes.', y);
y = bullet('Calcula cuota mensual, total pagado e intereses totales.', y);
y = gap(y, 6);

y = sub('Propiedades similares', y);
y = bullet('Al pie de la ficha muestra 3 propiedades del mismo tipo y operacion.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 7 — TASACION
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('05 — Tasacion online', y);
y = gap(y, 8);
y = body('La seccion /tasacion permite que propietarios que quieren vender o alquilar soliciten una tasacion de su propiedad de forma rapida y sencilla, sin necesidad de llamar ni ir a la oficina.', y);
y = gap(y, 10);

y = sub('Formulario guiado en 3 pasos', y);
y = bullet('Paso 1: Tipo de propiedad y zona.', y);
y = bullet('Paso 2: Caracteristicas — ambientes, superficie, antiguedad, estado general.', y);
y = bullet('Paso 3: Datos de contacto — nombre, telefono y email.', y);
y = gap(y, 8);

y = sub('Envio automatico por WhatsApp', y);
y = bullet('Al finalizar, se abre WhatsApp con un mensaje pre-armado con todos los datos.', y);
y = bullet('El agente recibe toda la informacion sin pedirla de nuevo.', y);
y = bullet('No requiere cuenta ni registro previo del visitante.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 8 — DASHBOARD ADMIN
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('06 — Panel de administracion - Dashboard', y);
y = gap(y, 8);
y = body('El panel de administracion esta en /admin y es accesible solo para usuarios autorizados. Muestra de un vistazo todo lo que pasa en el sitio.', y);
y = gap(y, 10);

y = sub('Tarjetas de resumen', y);
y = bullet('Total de propiedades publicadas (sincronizadas desde Tokko).', y);
y = bullet('Total de consultas por WhatsApp recibidas historicamente.', y);
y = bullet('Consultas recibidas en el dia de hoy.', y);
y = gap(y, 8);

y = sub('Feed de ultimas consultas', y);
y = bullet('Las 8 consultas de WhatsApp mas recientes.', y);
y = bullet('Nombre del visitante, telefono, propiedad consultada y hora.', y);
y = bullet('Clic en el telefono abre WhatsApp directo para hacer seguimiento.', y);
y = gap(y, 8);

y = sub('Accesos rapidos', y);
y = bullet('Botones directos a Propiedades, Agentes, Consultas y Auditoria.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 9 — ADMIN PROPIEDADES
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('07 — Admin - Gestion de propiedades', y);
y = gap(y, 8);
y = body('La seccion /admin/propiedades lista todas las propiedades de Tokko con informacion adicional y herramientas de gestion.', y);
y = gap(y, 10);

y = sub('Tabla de propiedades', y);
y = bullet('Foto en miniatura, direccion, tipo, operacion y precio.', y);
y = bullet('Agente asignado con su telefono de WhatsApp.', y);
y = bullet('Contador de consultas de WhatsApp recibidas por propiedad.', y);
y = bullet('Alerta visual si hubo una consulta en las ultimas 24 horas.', y);
y = gap(y, 8);

y = sub('Carteles destacados', y);
y = body('Cada propiedad puede tener un cartel visible en el sitio publico. Los carteles disponibles son:', y);
y = gap(y, 6);
// Tres recuadros de carteles
const carteles = [
  { label: 'VALOR AJUSTADO', desc: 'El precio fue reducido recientemente.' },
  { label: 'PERMUTA',        desc: 'Acepta otra propiedad como parte de pago.' },
  { label: 'RESERVADO',      desc: 'La propiedad tiene una reserva activa.' },
];
carteles.forEach(c => {
  doc.rect(ML, y, CW, 28).fill(C.light);
  doc.rect(ML, y, 3, 28).fill(C.brand);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.dark)
     .text(c.label, ML + 12, y + 5, { width: 120 });
  doc.font('Helvetica').fontSize(9).fillColor(C.gray)
     .text(c.desc, ML + 140, y + 5, { width: CW - 148 });
  y += 32;
});
y = gap(y, 6);
y = body('El admin activa o desactiva el cartel con un clic. Aparece inmediatamente en el sitio publico.', y);
y = gap(y, 8);

y = sub('Video y Tour virtual', y);
y = bullet('El admin puede agregar una URL de YouTube o Matterport a cada propiedad.', y);
y = bullet('El video aparece embebido en la ficha publica de la propiedad.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 10 — ADMIN AGENTES
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('08 — Admin - Gestion de agentes', y);
y = gap(y, 8);
y = body('La seccion /admin/agentes permite gestionar el equipo de la inmobiliaria y asignar propiedades a cada agente.', y);
y = gap(y, 10);

y = sub('Alta y edicion de agentes', y);
y = bullet('Nombre completo, cargo/posicion y telefono de WhatsApp.', y);
y = bullet('Foto de perfil — se sube desde el propio panel y se guarda en la nube.', y);
y = bullet('Los datos se sincronizan automaticamente desde Tokko si el agente ya existe alli.', y);
y = gap(y, 8);

y = sub('Asignacion de propiedades', y);
y = bullet('Cada propiedad puede tener un agente asignado.', y);
y = bullet('El agente asignado recibe las consultas de WhatsApp de esa propiedad.', y);
y = bullet('Si no hay agente asignado, los WhatsApp van al numero general de la inmobiliaria.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 11 — ADMIN CONSULTAS
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('09 — Admin - Consultas recibidas', y);
y = gap(y, 8);
y = body('La seccion /admin/consultas centraliza todas las consultas recibidas, tanto por WhatsApp como por formulario escrito.', y);
y = gap(y, 10);

y = sub('Pestana WhatsApp', y);
y = bullet('Lista de todas las consultas iniciadas desde el boton de WhatsApp del sitio.', y);
y = bullet('Muestra: nombre del visitante, telefono, propiedad consultada, agente y fecha.', y);
y = bullet('Badge "NUEVO" para consultas de las ultimas 24 horas.', y);
y = bullet('Clic en el telefono abre WhatsApp directo para hacer seguimiento.', y);
y = gap(y, 8);

y = sub('Pestana Formulario', y);
y = bullet('Lista de consultas enviadas desde el formulario escrito de cada ficha.', y);
y = bullet('Muestra: nombre, email, telefono, propiedad y mensaje completo.', y);
y = bullet('Permite responder por email directamente desde el cliente de correo.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 12 — AUDITORIA
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('10 — Admin - Auditoria y estadisticas', y);
y = gap(y, 8);
y = body('La seccion /admin/auditoria permite ver la actividad del sitio a lo largo del tiempo y medir el rendimiento de la inmobiliaria.', y);
y = gap(y, 10);

y = sub('Estadisticas generales', y);
y = bullet('Total de consultas historicas, propiedades activas y agentes registrados.', y);
y = bullet('Comparacion con el periodo anterior.', y);
y = gap(y, 8);

y = sub('Grafico de actividad', y);
y = bullet('Grafico de barras con las consultas recibidas en los ultimos 7 dias.', y);
y = bullet('Permite identificar los dias y horarios de mayor demanda.', y);
y = gap(y, 8);

y = sub('Ranking de agentes', y);
y = bullet('Tabla con los agentes que mas consultas generaron.', y);
y = bullet('Util para medir el rendimiento del equipo comercial.', y);
y = gap(y, 8);

y = sub('Log de actividad', y);
y = bullet('Historial detallado de todas las consultas: propiedad, agente, fuente y fecha.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 13 — EMAIL
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('11 — Notificaciones por email', y);
y = gap(y, 8);
y = body('El sitio cuenta con un sistema de alertas por email completamente automatico, integrado con Resend y el dominio @pinogalant.com.ar.', y);
y = gap(y, 10);

y = sub('Alertas de propiedades nuevas', y);
y = bullet('Los visitantes pueden suscribirse a alertas desde el listado de propiedades.', y);
y = bullet('Eligen: operacion, tipo de propiedad, precio maximo y zonas de interes.', y);
y = bullet('Todos los dias a las 9AM, el sistema revisa si hay propiedades nuevas en Tokko.', y);
y = bullet('Si hay coincidencias, envia un email automatico con las propiedades que le interesan.', y);
y = bullet('El email incluye: foto, direccion, precio y link directo a la propiedad.', y);
y = gap(y, 8);

y = sub('Email con dominio propio', y);
y = bullet('Los emails salen desde alertas@pinogalant.com.ar — no de Gmail ni de un tercero.', y);
y = bullet('Dominio verificado con DKIM, SPF y DMARC para evitar caer en spam.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 14 — SEO
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('12 — SEO y posicionamiento en Google', y);
y = gap(y, 8);
y = body('El sitio esta optimizado para aparecer en los primeros resultados de Google cuando alguien busca propiedades en Santa Rosa o La Pampa.', y);
y = gap(y, 10);

y = sub('Sitemap dinamico', y);
y = bullet('El archivo sitemap.xml se genera automaticamente con todas las propiedades.', y);
y = bullet('Google ya descubrio 43 paginas al momento de esta presentacion.', y);
y = bullet('El sitemap se actualiza solo cada vez que se agrega una propiedad nueva en Tokko.', y);
y = gap(y, 8);

y = sub('Metadata por pagina', y);
y = bullet('Cada propiedad tiene su propio titulo en Google: tipo + operacion + precio + direccion.', y);
y = bullet('Descripcion unica generada automaticamente desde los datos de Tokko.', y);
y = bullet('Imagen de preview para cuando se comparte en WhatsApp o redes sociales.', y);
y = gap(y, 8);

y = sub('Google Search Console verificado', y);
y = bullet('Sitio verificado y sitemap enviado a Google Search Console.', y);
y = bullet('Google ya empezo a indexar las propiedades.', y);
y = gap(y, 8);

y = sub('Palabras clave trabajadas', y);
const kws = [
  'inmobiliaria Santa Rosa La Pampa',
  'propiedades en venta Santa Rosa',
  'alquiler casas La Pampa',
  'comprar casa Santa Rosa',
  'terrenos en venta La Pampa',
  'campos en venta La Pampa',
];
kws.forEach(k => { y = bullet(k, y); });


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 15 — PWA
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('13 — App movil instalable (PWA)', y);
y = gap(y, 8);
y = body('El sitio de Pino Galant puede instalarse como una app en el celular, sin necesidad de pasar por el App Store ni Google Play. Es completamente gratuito para la inmobiliaria y para los usuarios.', y);
y = gap(y, 10);

y = sub('Como se instala', y);
y = bullet('Android (Chrome): aparece un banner automatico "Instalar app" o un boton en el sitio.', y);
y = bullet('iPhone (Safari): boton compartir y luego "Anadir a pantalla de inicio".', y);
y = bullet('Una vez instalada, aparece en la pantalla de inicio como cualquier app.', y);
y = gap(y, 8);

y = sub('Ventajas para los clientes', y);
y = bullet('Entra directo a Pino Galant sin abrir el navegador.', y);
y = bullet('Carga mas rapido porque guarda datos en cache.', y);
y = bullet('Funciona parcialmente sin internet (muestra lo que ya visito).', y);
y = bullet('Icono con el logo de Pino Galant en la pantalla del celular.', y);
y = bullet('Accesos directos a Propiedades y Tasacion desde el icono.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA 16 — TECNOLOGIA
// ══════════════════════════════════════════════════════════════════════════════
y = addPage();
y = sectionTitle('14 — Tecnologia y seguridad', y);
y = gap(y, 10);

y = checkRow('Next.js 14', 'Framework moderno para sitios rapidos, SEO-friendly y escalables.', y);
y = checkRow('Supabase', 'Base de datos en la nube con backups automaticos y acceso seguro.', y);
y = checkRow('Tokko Broker', 'Sistema de gestion inmobiliaria, integracion directa y automatica.', y);
y = checkRow('Vercel', 'Hosting de alta velocidad con CDN global y SSL incluido.', y);
y = checkRow('Resend', 'Plataforma de email transaccional con dominio propio verificado.', y);
y = checkRow('Leaflet + OpenStreetMap', 'Mapas interactivos gratuitos y sin limite de uso.', y);
y = gap(y, 12);

y = sub('Seguridad', y);
y = bullet('Panel de admin protegido con autenticacion — solo acceden usuarios autorizados.', y);
y = bullet('Roles diferenciados: super administrador, administrador y agente.', y);
y = bullet('Todas las APIs verifican permisos antes de ejecutarse.', y);
y = bullet('Comunicacion cifrada SSL en todo el sitio (candado verde en el navegador).', y);
y = bullet('Datos de consultas y leads guardados en base de datos segura en la nube.', y);
y = gap(y, 10);

y = sub('Actualizaciones automaticas', y);
y = bullet('Las propiedades de Tokko se reflejan en el sitio en menos de 5 minutos.', y);
y = bullet('Los agentes se sincronizan automaticamente todos los dias a las 8AM.', y);
y = bullet('Las alertas de email se envian todos los dias a las 9AM sin intervencion manual.', y);


// ══════════════════════════════════════════════════════════════════════════════
// PAGINA FINAL — CIERRE
// ══════════════════════════════════════════════════════════════════════════════
doc.addPage({ size: 'A4', margin: 0 });
doc.rect(0, 0, W, H).fill(C.dark);
doc.rect(0, 0, W, 6).fill(C.brand);

// Logo
try {
  doc.image('C:/inmobiliaria/public/logo.png', W/2 - 50, 120, { fit: [100, 80], align: 'center' });
} catch(e) {}

doc.font('Helvetica-Bold').fontSize(26).fillColor(C.white)
   .text('Gracias', 0, 230, { width: W, align: 'center' });

doc.font('Helvetica').fontSize(13).fillColor('#AAAAAA')
   .text('Estamos disponibles para explicar cualquier detalle\nde la plataforma y su funcionamiento.', 0, 268, { width: W, align: 'center', lineGap: 5 });

doc.rect(W/2 - 100, 330, 200, 1).fill(C.brand);

doc.font('Helvetica-Bold').fontSize(14).fillColor(C.brand)
   .text('pinogalant.com.ar', 0, 348, { width: W, align: 'center' });

doc.font('Helvetica').fontSize(10).fillColor('#777777')
   .text('Panel de administracion: pinogalant.com.ar/admin', 0, 374, { width: W, align: 'center' });

doc.font('Helvetica').fontSize(9).fillColor('#555555')
   .text('Generado el ' + new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
     0, H - 50, { width: W, align: 'center' });

doc.end();

out.on('finish', () => console.log('PDF listo: public/presentacion-pinogalant.pdf'));
