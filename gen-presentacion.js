/**
 * Genera presentacion-pinogalant-nueva.pdf con pdfkit
 * Sin emojis - solo fuentes built-in de PDF
 */
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "public", "presentacion-pinogalant-nueva.pdf");

const W = 595.28;
const H = 841.89;

// Colores
const DARK  = "#2D3134";
const GOLD  = "#B48A73";
const WHITE = "#FFFFFF";
const LIGHT = "#F7F4F1";
const GRAY  = "#888888";
const LGRAY = "#EEEBE8";
const GREEN = "#4CAF50";
const MID   = "#444444";

function fillRect(doc, x, y, w, h, color, radius = 0) {
  if (radius > 0) doc.roundedRect(x, y, w, h, radius);
  else doc.rect(x, y, w, h);
  doc.fill(color);
}

function strokeRect(doc, x, y, w, h, color, lw = 0.5, radius = 0) {
  if (radius > 0) doc.roundedRect(x, y, w, h, radius);
  else doc.rect(x, y, w, h);
  doc.lineWidth(lw).stroke(color);
}

function fillCircle(doc, cx, cy, r, color) {
  doc.circle(cx, cy, r).fill(color);
}

function txt(doc, str, x, y, { size = 10, color = DARK, bold = false, align = "left", width = null } = {}) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color);
  const opts = { lineBreak: false };
  if (align !== "left") opts.align = align;
  if (width) { opts.width = width; delete opts.lineBreak; }
  doc.text(String(str), x, y, opts);
}

function pageHeader(doc, num, title, sub) {
  fillRect(doc, 0, 0, W, 76, DARK);
  fillRect(doc, 0, 76, W, 3, GOLD);
  txt(doc, num, 30, 14, { size: 9, color: GOLD, bold: true });
  txt(doc, title, 30, 30, { size: 19, color: WHITE, bold: true });
  txt(doc, sub, 30, 56, { size: 9, color: "#AAAAAA" });
}

function pageFooter(doc, label) {
  fillRect(doc, 0, H - 34, W, 1, GOLD);
  txt(doc, `pinogalant.com.ar  |  ${label}`, 0, H - 28, { size: 7.5, color: GRAY, align: "center", width: W });
  txt(doc, "Creado por www.localweb.ar", 0, H - 16, { size: 7, color: "#AAAAAA", align: "center", width: W });
}

function badgeRect(doc, x, y, w, h, label, bgColor, fgColor = WHITE, size = 8) {
  fillRect(doc, x, y, w, h, bgColor, 3);
  doc.font("Helvetica-Bold").fontSize(size).fillColor(fgColor);
  doc.text(label, x, y + h / 2 - size / 2, { width: w, align: "center" });
}

function bullet(doc, icon, x, y, label, iconColor = GOLD, labelColor = MID, size = 9.5) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(iconColor).text(icon, x, y, { lineBreak: false });
  doc.font("Helvetica").fontSize(size).fillColor(labelColor).text(label, x + 16, y, { lineBreak: false });
}

// ── PAGE 1: PORTADA ──────────────────────────────────────────────────────────
function pageCover(doc) {
  fillRect(doc, 0, 0, W, H, DARK);
  fillCircle(doc, W - 80, 80, 130, "#353A3F");
  fillCircle(doc, 60, H - 80, 90, "#323740");
  fillRect(doc, 0, 0, W, 5, GOLD);

  // Logo circle
  fillCircle(doc, W / 2, 160, 52, GOLD);
  doc.font("Helvetica-Bold").fontSize(28).fillColor(WHITE);
  doc.text("PG", W / 2 - 19, 146);

  txt(doc, "PINO GALANT", 0, 234, { size: 36, color: WHITE, bold: true, align: "center", width: W });
  txt(doc, "Negocios Inmobiliarios", 0, 278, { size: 13, color: GOLD, align: "center", width: W });
  fillRect(doc, W / 2 - 55, 300, 110, 1.5, GOLD);
  txt(doc, "Nuevas Funcionalidades 2026", 0, 312, { size: 22, color: WHITE, bold: true, align: "center", width: W });
  txt(doc, "Presentacion de todas las mejoras implementadas en el sitio web", 0, 342, { size: 10.5, color: "#AAAAAA", align: "center", width: W });

  // Caja de stats
  fillRect(doc, W / 2 - 170, 370, 340, 115, "#383D42", 10);
  fillRect(doc, W / 2 - 170, 370, 340, 3, GOLD, 2);

  const stats = [
    { num: "9", label: "Funcionalidades nuevas" },
    { num: "IA", label: "Busqueda inteligente" },
    { num: "PWA", label: "App instalable" },
  ];
  stats.forEach((s, i) => {
    const cx = W / 2 - 170 + 113 * i + 56;
    doc.font("Helvetica-Bold").fontSize(26).fillColor(GOLD).text(s.num, cx - 22, 398, { width: 44, align: "center" });
    doc.font("Helvetica").fontSize(8).fillColor("#CCCCCC").text(s.label, cx - 44, 432, { width: 88, align: "center" });
    if (i < 2) fillRect(doc, W / 2 - 170 + 113 * (i + 1) - 0.5, 385, 1, 75, "#555555");
  });

  // Descripcion
  const intro = [
    "Este documento detalla todas las mejoras implementadas en el sitio web",
    "de Pino Galant, disenadas para brindar una experiencia superior a los",
    "visitantes y optimizar la captacion de clientes potenciales.",
  ];
  intro.forEach((line, i) => {
    doc.font("Helvetica").fontSize(10).fillColor("#BBBBBB").text(line, 0, 508 + i * 16, { align: "center", width: W });
  });

  // Barra de funciones resumen
  const feats = ["Busqueda IA", "Mapa interactivo", "Oficinas", "Compartir", "Barrio", "Calculadora", "Similares", "App movil", "Admin"];
  const fw = (W - 60) / feats.length;
  feats.forEach((f, i) => {
    const fx = 30 + fw * i;
    fillRect(doc, fx, 574, fw - 2, 30, i % 2 === 0 ? "#383D42" : "#2D3134", 3);
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(GOLD).text(f, fx, 582, { width: fw - 2, align: "center" });
  });

  fillRect(doc, 0, H - 4, W, 4, GOLD);
  txt(doc, "pinogalant.com.ar  |  Junio 2026", 0, H - 28, { size: 8, color: "#777777", align: "center", width: W });
  txt(doc, "Creado por www.localweb.ar", 0, H - 16, { size: 7.5, color: GOLD, align: "center", width: W });
}

// ── PAGE 2: BUSQUEDA IA ──────────────────────────────────────────────────────
function pageIA(doc) {
  fillRect(doc, 0, 0, W, H, LIGHT);
  pageHeader(doc, "01", "Busqueda de tus Suenos", "Inteligencia Artificial para encontrar la propiedad ideal");
  badgeRect(doc, W - 110, 20, 78, 22, "IA ACTIVA", GREEN);

  txt(doc, "Como funciona?", 30, 92, { size: 13, bold: true });

  // Caja explicacion
  fillRect(doc, 25, 108, W - 50, 98, WHITE, 8);
  fillRect(doc, 25, 108, 4, 98, GOLD);
  txt(doc, "El cliente escribe como habla, con sus propias palabras:", 42, 118, { size: 10.5, bold: true });

  const ex = [
    '"Quiero una casa en Santa Rosa con jardin para mis hijos, hasta 80 mil dolares"',
    '"Busco departamento para alquilar, 2 ambientes, cerca del centro de la ciudad"',
    '"Necesito un campo o chacra de al menos 100 hectareas en La Pampa"',
  ];
  ex.forEach((e, i) => {
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor("#555555").text(e, 42, 140 + i * 18, { lineBreak: false });
  });

  // Proceso
  txt(doc, "Proceso automatico en menos de 2 segundos:", 30, 220, { size: 11, bold: true });
  const steps = [
    { num: "1", t1: "Cliente escribe", t2: "en lenguaje natural" },
    { num: "2", t1: "IA analiza", t2: "Groq + Llama 3.1" },
    { num: "3", t1: "Detecta filtros", t2: "tipo, precio, zona" },
    { num: "4", t1: "Muestra resultados", t2: "propiedades exactas" },
  ];
  const sw = (W - 60) / 4;
  steps.forEach((s, i) => {
    const sx = 30 + sw * i + sw / 2;
    fillCircle(doc, sx, 262, 24, GOLD);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(WHITE).text(s.num, sx - 7, 253);
    txt(doc, s.t1, sx - 46, 292, { size: 9, bold: true, align: "center", width: 92 });
    txt(doc, s.t2, sx - 46, 304, { size: 8, color: GRAY, align: "center", width: 92 });
    if (i < 3) fillRect(doc, sx + 26, 260, sw - 52, 4, GOLD);
  });

  // Mock popup con video
  txt(doc, "Experiencia del usuario - Popup 'Busqueda de tus suenos':", 30, 328, { size: 11, bold: true });
  fillRect(doc, 30, 344, W - 60, 130, "#1A1C1E", 10);
  // Boton
  fillRect(doc, W / 2 - 80, 352, 160, 26, GOLD, 6);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE).text("* A tu medida", W / 2 - 55, 359);
  // Area video
  fillRect(doc, 40, 386, W - 80, 78, "#2D3134", 6);
  fillCircle(doc, W / 2, 425, 20, GOLD);
  doc.font("Helvetica-Bold").fontSize(16).fillColor(WHITE).text(">", W / 2 - 5, 417);
  txt(doc, "Video de presentacion (con sonido)", 0, 450, { size: 8.5, color: "#AAAAAA", align: "center", width: W });
  // Campo texto
  fillRect(doc, 40, 464, W - 100, 4, LGRAY);
  doc.font("Helvetica-Oblique").fontSize(9.5).fillColor("#999999").text('"Describime la propiedad que buscas..."', 44, 470);
  fillRect(doc, W - 58, 464, 48, 20, GOLD, 5);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text("Buscar", W - 54, 470);

  // Beneficios
  txt(doc, "Ventajas clave:", 30, 490, { size: 11, bold: true });
  const benefits = [
    "Sin formularios complicados: el cliente habla como lo haria con un asesor presencial",
    "Respuestas en menos de 2 segundos gracias a tecnologia IA de ultima generacion",
    "Detecta automaticamente el tipo de propiedad, rango de precio y zona geografica",
    "Tecnologia Groq + Llama 3.1: gratuita, sin costo adicional para la inmobiliaria",
  ];
  benefits.forEach((b, i) => {
    bullet(doc, "+", 30, 508 + i * 18, b, GOLD, MID);
  });

  // Caja conclusion
  fillRect(doc, 25, 586, W - 50, 44, DARK, 8);
  fillRect(doc, 25, 586, W - 50, 3, GOLD);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE)
     .text("Resultado: el cliente encuentra lo que busca mas rapido, y consulta mas", 0, 597, { align: "center", width: W });
  doc.font("Helvetica").fontSize(8.5).fillColor("#CCCCCC")
     .text("La busqueda por IA reduce la friccion y convierte visitantes en consultas reales", 0, 613, { align: "center", width: W });

  pageFooter(doc, "Busqueda Inteligente con IA");
}

// ── PAGE 3: BUSCADOR DINAMICO + MAPA ──────────────────────────────────────
function pageSearchMap(doc) {
  fillRect(doc, 0, 0, W, H, LIGHT);
  pageHeader(doc, "02 / 03", "Buscador Dinamico + Mapa Interactivo", "Filtros en tiempo real desde las propiedades disponibles  |  Mapa con iconos y fotos");

  // Buscador
  txt(doc, "Buscador Inteligente en la pagina de inicio", 30, 92, { size: 13, bold: true });
  fillRect(doc, 25, 108, W - 50, 86, "#1A1C1E", 8);

  const selW = (W - 70) / 2 - 4;
  const selects = [
    [30, 116, "Tipo de propiedad  (Casa / Depto / Campo / Terreno...)"],
    [30 + selW + 8, 116, "Operacion  (Venta / Alquiler)"],
    [30, 146, "Provincia  (generada automaticamente)"],
    [30 + selW + 8, 146, "Localidad  (segun provincia seleccionada)"],
  ];
  selects.forEach(([x, y, label]) => {
    fillRect(doc, x, y, selW, 22, WHITE, 4);
    doc.font("Helvetica").fontSize(8).fillColor("#888888").text(label, x + 8, y + 7, { lineBreak: false });
  });
  fillRect(doc, W - 88, 146, 54, 22, GOLD, 4);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(WHITE).text("Buscar", W - 76, 153);

  const dbullets = [
    "Los tipos de propiedad se cargan desde las propiedades reales cargadas en Tokko Broker",
    "Las provincias y localidades se calculan en tiempo real: siempre actualizadas y sin repetidos",
    "Al elegir una provincia, el selector de localidad muestra solo las disponibles en esa zona",
    "Si se agrega una propiedad nueva en otra ciudad, aparece sola en el filtro sin tocar codigo",
  ];
  dbullets.forEach((b, i) => {
    bullet(doc, "->", 30, 208 + i * 16, b, GOLD, MID, 8.5);
  });

  // Mapa
  fillRect(doc, 25, 278, W - 50, 2, LGRAY);
  txt(doc, "Mapa Interactivo con todas las Propiedades", 30, 290, { size: 13, bold: true });
  fillRect(doc, 25, 308, W - 50, 155, "#E8F4E8", 8);

  // Grilla calles
  doc.strokeColor("#C8DCC8").lineWidth(0.5);
  for (let i = 0; i < 7; i++) { const y = 308 + 22 * i; doc.moveTo(25, y).lineTo(W - 25, y).stroke(); }
  for (let i = 0; i < 11; i++) { const x = 25 + (W - 50) / 10 * i; doc.moveTo(x, 308).lineTo(x, 463).stroke(); }

  // Pins
  const pins = [
    { x: W/2 - 70, y: 355, price: "$65.000", type: "Casa" },
    { x: W/2 + 50, y: 332, price: "$42.000", type: "Depto" },
    { x: W/2 - 15, y: 400, price: "$280.000", type: "Campo" },
    { x: W/2 + 95, y: 375, price: "$850/mes", type: "Alquiler" },
  ];
  pins.forEach(p => {
    fillCircle(doc, p.x, p.y, 12, GOLD);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text("$", p.x - 4, p.y - 6, { lineBreak: false });
    fillRect(doc, p.x - 26, p.y - 34, 52, 16, WHITE, 3);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(DARK).text(p.price, p.x - 24, p.y - 31, { width: 48, align: "center" });
    doc.font("Helvetica").fontSize(6).fillColor(GRAY).text(p.type, p.x - 24, p.y - 22, { width: 48, align: "center" });
  });

  // Card popup
  fillRect(doc, W - 178, 310, 148, 148, WHITE, 6);
  strokeRect(doc, W - 178, 310, 148, 148, LGRAY, 0.5, 6);
  fillRect(doc, W - 174, 350, 140, 98, LGRAY, 4);
  doc.font("Helvetica").fontSize(6.5).fillColor(GRAY).text("[ FOTO DE LA PROPIEDAD ]", W - 170, 390, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK).text("Casa  -  Santa Rosa, La Pampa", W - 174, 316);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(GOLD).text("USD 65.000", W - 174, 330);
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text("3 amb  |  2 banos  |  120 m2", W - 174, 342);
  fillRect(doc, W - 174, 453, 88, 18, GOLD, 3);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(WHITE).text("Ver propiedad", W - 174, 458, { width: 88, align: "center" });

  const mapf = [
    "Icono dorado personalizado por tipo: casa, campo, departamento, terreno...",
    "Clic en el marcador muestra foto de la propiedad, precio y datos principales",
    "Zoom y navegacion tactil, funciona perfecto en celular y en escritorio",
    "Se actualiza automaticamente al cargar nuevas propiedades en Tokko",
  ];
  mapf.forEach((f, i) => {
    bullet(doc, "+", 30, 474 + i * 16, f, GOLD, MID, 8.5);
  });

  pageFooter(doc, "Buscador Dinamico y Mapa Interactivo");
}

// ── PAGE 4: OFICINAS + COMPARTIR ──────────────────────────────────────────
function pageOficinasShare(doc) {
  fillRect(doc, 0, 0, W, H, LIGHT);
  pageHeader(doc, "04 / 05", "Oficinas Comerciales  +  Compartir Propiedad", "Ubicacion con mapa y GPS  |  Viralizar propiedades en redes sociales");

  txt(doc, "Modal Oficinas Comerciales", 30, 92, { size: 13, bold: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MID)
     .text("Un boton en la seccion 'Quienes somos' abre un popup con mapa y opciones de navegacion:", 30, 110, { lineBreak: false });

  // Modal simulado
  fillRect(doc, 25, 126, W - 50, 200, WHITE, 10);
  fillRect(doc, 25, 126, W - 50, 8, GOLD, 4);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(WHITE).text("[ MAPA ]  Nuestras Oficinas Comerciales  [ X ]", 35, 129, { lineBreak: false });

  // Mapa simulado
  fillRect(doc, 35, 140, W / 2 - 48, 108, "#E0EEE0", 4);
  fillRect(doc, 35, 140, W / 2 - 48, 2, "#A0C0A0");
  const mx = 35 + (W / 2 - 48) / 2;
  doc.strokeColor("#A0C0A0").lineWidth(0.5);
  for (let i = 1; i < 5; i++) { const y = 140 + 22 * i; doc.moveTo(35, y).lineTo(35 + (W/2-48), y).stroke(); }
  for (let i = 1; i < 5; i++) { const x = 35 + (W/2-48)/4*i; doc.moveTo(x, 140).lineTo(x, 248).stroke(); }
  fillCircle(doc, mx, 205, 11, GOLD);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE).text("P", mx - 4, 201, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor(GRAY).text("OpenStreetMap  (gratuito, sin API key)", mx - 50, 252, { lineBreak: false });

  // Datos
  const ox = W / 2 + 8;
  fillRect(doc, ox - 6, 140, W / 2 - 42, 108, "#FAFAFA", 4);
  txt(doc, "Direccion:", ox, 150, { size: 9, bold: true });
  txt(doc, 'General Pico 364  1 "A"', ox, 163, { size: 9.5, color: MID });
  txt(doc, "Santa Rosa, La Pampa", ox, 178, { size: 9.5, color: MID });

  txt(doc, "Botones disponibles:", ox, 202, { size: 8.5, bold: true, color: GRAY });
  fillRect(doc, ox, 214, 72, 22, "#25D366", 4);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE).text("-> Como llegar", ox + 4, 221);
  fillRect(doc, ox + 78, 214, 72, 22, GOLD, 4);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE).text("[car] Iniciar viaje", ox + 82, 221);
  fillRect(doc, ox, 242, W / 2 - 52, 22, DARK, 4);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(WHITE).text("Ver en Google Maps (se abre en el celular)", ox + 8, 249);

  // Nota
  fillRect(doc, 30, 254, W - 60, 24, GOLD, 4);
  doc.font("Helvetica").fontSize(8.5).fillColor(WHITE)
     .text("Sin costo de API  |  Mapa gratuito OpenStreetMap  |  Botones abren Google Maps en el celular", 0, 262, { align: "center", width: W });

  fillRect(doc, 25, 290, W - 50, 1.5, LGRAY);

  // COMPARTIR
  txt(doc, "Boton Compartir en cada Propiedad", 30, 302, { size: 13, bold: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MID)
     .text("Cada tarjeta de propiedad tiene un boton para compartir y viralizar en redes sociales:", 30, 320, { lineBreak: false });

  // Card propiedad
  fillRect(doc, 25, 336, W / 2 - 30, 145, WHITE, 8);
  fillRect(doc, 33, 400, W / 2 - 46, 72, LGRAY, 4);
  txt(doc, "Casa en Santa Rosa, La Pampa", 36, 407, { size: 9, bold: true });
  txt(doc, "USD 65.000", 36, 421, { size: 11, bold: true, color: GOLD });
  txt(doc, "3 amb  |  2 banos  |  120 m2", 36, 435, { size: 8.5, color: GRAY });
  fillRect(doc, 33, 340, 62, 22, "#25D366", 4);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE).text("Consultar", 36, 347);
  fillRect(doc, 100, 340, 58, 22, LGRAY, 4);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK).text("[^] Compartir", 103, 347);

  // Popup compartir
  const px = W / 2 - 8;
  fillRect(doc, px, 336, 145, 148, WHITE, 8);
  strokeRect(doc, px, 336, 145, 148, LGRAY, 0.5, 8);
  txt(doc, "Compartir propiedad", px, 348, { size: 9.5, bold: true, align: "center", width: 145 });
  fillRect(doc, px + 10, 362, 125, 1, LGRAY);

  const shareOpts = [
    { color: "#25D366", label: "WhatsApp" },
    { color: "#1877F2", label: "Facebook" },
    { color: "#1A1A1A", label: "X / Twitter" },
    { color: "#E1306C", label: "Instagram  (copia link)" },
    { color: GRAY,      label: "Copiar link" },
  ];
  shareOpts.forEach((o, i) => {
    fillCircle(doc, px + 22, 376 + i * 22, 8, o.color);
    doc.font("Helvetica").fontSize(9).fillColor(DARK).text(o.label, px + 36, 371 + i * 22, { lineBreak: false });
  });

  // Beneficio compartir
  fillRect(doc, 25, 498, W - 50, 55, DARK, 8);
  fillRect(doc, 25, 498, W - 50, 3, GOLD);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE)
     .text("Por que esto multiplica las consultas?", 0, 508, { align: "center", width: W });
  doc.font("Helvetica").fontSize(9).fillColor("#CCCCCC")
     .text("Cada cliente que comparte una propiedad trae nuevos posibles compradores organicamente.", 40, 526, { width: W - 80, align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor("#CCCCCC")
     .text("Marketing gratuito: la inmobiliaria gana visibilidad sin costo adicional.", 40, 540, { width: W - 80, align: "center" });

  pageFooter(doc, "Oficinas Comerciales y Boton Compartir");
}

// ── PAGE 5: BARRIO + CALCULADORA + SIMILARES ───────────────────────────────
function pageBarrioCalc(doc) {
  fillRect(doc, 0, 0, W, H, LIGHT);
  pageHeader(doc, "06 / 07 / 08", "Barrio  +  Calculadora  +  Propiedades Similares", "Todo disponible en la pagina de cada propiedad");

  // Barrio
  txt(doc, "Informacion del Barrio y Alrededores", 30, 92, { size: 13, bold: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MID)
     .text("Cada propiedad muestra automaticamente que servicios hay cerca:", 30, 110, { lineBreak: false });

  const items = [
    ["Escuelas", "Colegios, jardines e institutos"],
    ["Hospitales", "Centros de salud y clinicas"],
    ["Comercios", "Supermercados y negocios"],
    ["Transporte", "Paradas de colectivo y taxis"],
    ["Plazas", "Parques y espacios verdes"],
    ["Gimnasios", "Centros deportivos"],
  ];
  items.forEach(([title, sub], i) => {
    const ix = 25 + (i % 3) * ((W - 50) / 3 + 2);
    const iy = 124 + Math.floor(i / 3) * 54;
    fillRect(doc, ix, iy, (W - 56) / 3, 48, WHITE, 6);
    fillRect(doc, ix, iy, (W - 56) / 3, 3, GOLD);
    txt(doc, title, ix, iy + 10, { size: 9.5, bold: true, align: "center", width: (W - 56) / 3 });
    txt(doc, sub, ix, iy + 26, { size: 7.5, color: GRAY, align: "center", width: (W - 56) / 3 });
  });

  fillRect(doc, 25, 240, W - 50, 1.5, LGRAY);

  // Calculadora
  txt(doc, "Calculadora Hipotecaria", 30, 252, { size: 13, bold: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MID)
     .text("El cliente puede simular su credito directamente en la pagina de la propiedad:", 30, 270, { lineBreak: false });

  fillRect(doc, 25, 286, W / 2 - 32, 128, WHITE, 8);
  fillRect(doc, 25, 286, W / 2 - 32, 3, GOLD);
  txt(doc, "Simulador de Credito Hipotecario", 30, 294, { size: 9.5, bold: true });

  const campos = [
    ["Precio de la propiedad", "USD 65.000"],
    ["Porcentaje de entrada (%)", "30%"],
    ["Plazo en meses", "120 meses"],
    ["Tasa de interes anual (%)", "8.5% anual"],
  ];
  campos.forEach(([label, val], i) => {
    const cy = 312 + i * 22;
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text(label, 36, cy, { lineBreak: false });
    fillRect(doc, 36, cy + 9, W / 2 - 60, 14, LGRAY, 3);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(val, 42, cy + 12, { lineBreak: false });
  });
  fillRect(doc, 36, 404, W / 2 - 60, 24, DARK, 4);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(GOLD)
     .text("Cuota estimada:  USD 521 / mes", 36, 412, { width: W / 2 - 60, align: "center" });

  // Similares
  txt(doc, "Propiedades Similares", W / 2 + 12, 252, { size: 13, bold: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MID)
     .text("Sugerencias automaticas al ver una propiedad:", W / 2 + 12, 270, { lineBreak: false });

  const cards = [
    { title: "Casa en Santa Rosa", price: "USD 58.000", data: "3 amb  |  110 m2", op: "Venta" },
    { title: "Depto - General Pico", price: "USD 35.000", data: "2 amb  |  60 m2", op: "Venta" },
  ];
  cards.forEach((card, j) => {
    const cx = W / 2 + 12 + j * ((W / 2 - 24) / 2 + 4);
    const cw = (W / 2 - 32) / 2;
    fillRect(doc, cx, 286, cw, 128, WHITE, 6);
    fillRect(doc, cx, 286, cw, 3, GOLD);
    badgeRect(doc, cx + cw - 42, 292, 38, 14, card.op, GOLD, WHITE, 7);
    fillRect(doc, cx + 5, 320, cw - 10, 78, LGRAY, 3);
    txt(doc, card.title, cx + 6, 328, { size: 8, bold: true });
    txt(doc, card.price, cx + 6, 342, { size: 10, bold: true, color: GOLD });
    txt(doc, card.data, cx + 6, 358, { size: 7.5, color: GRAY });
    fillRect(doc, cx + 5, 290, cw - 10, 22, DARK, 3);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(WHITE).text("Ver propiedad", cx + 5, 297, { width: cw - 10, align: "center" });
  });

  fillRect(doc, 25, 430, W - 50, 1.5, LGRAY);

  txt(doc, "Por que estas 3 funciones aumentan las consultas?", 30, 444, { size: 12, bold: true });
  const reasons = [
    "El cliente encuentra TODA la informacion que necesita en un solo lugar, sin buscar en otro sitio",
    "La calculadora elimina la incertidumbre financiera y el miedo a preguntar por precio",
    "Ver lo que hay cerca del barrio genera confianza y apego emocional a la propiedad",
    "Las propiedades similares retienen al visitante mas tiempo y aumentan las chances de cierre",
    "Cada funcion esta disenada para acortar el camino desde el interes hasta la consulta real",
  ];
  reasons.forEach((r, i) => {
    bullet(doc, "+", 30, 462 + i * 18, r, GOLD, MID, 9);
  });

  pageFooter(doc, "Barrio + Calculadora + Propiedades Similares");
}

// ── PAGE 6: APP MOVIL PWA ─────────────────────────────────────────────────
function pageApp(doc) {
  fillRect(doc, 0, 0, W, H, DARK);
  fillCircle(doc, W - 70, 70, 110, "#353A3F");
  fillCircle(doc, 60, H - 80, 80, "#323740");

  fillRect(doc, 0, 0, W, 80, GOLD);
  txt(doc, "09", 30, 14, { size: 10, color: DARK, bold: true });
  txt(doc, "App Instalable en el Celular", 30, 30, { size: 22, color: DARK, bold: true });
  txt(doc, "Progressive Web App (PWA)  |  Sin App Store  |  Sin costo adicional para la inmobiliaria", 30, 58, { size: 9, color: DARK });

  txt(doc, "Que es una PWA?", 0, 98, { size: 16, color: WHITE, bold: true, align: "center", width: W });
  const desc = [
    "Una PWA (Progressive Web App) es el sitio web de Pino Galant que se puede",
    "instalar en el celular como si fuera una app nativa, sin necesitar Google Play",
    "ni App Store. El cliente la instala directo desde su navegador, al instante.",
  ];
  desc.forEach((d, i) => {
    doc.font("Helvetica").fontSize(10).fillColor("#CCCCCC").text(d, 0, 122 + i * 15, { align: "center", width: W });
  });

  // Comparacion
  const halfW = W / 2 - 30;
  const comps = [
    {
      x: 25, title: "App tradicional (Play Store)", titleBg: "#8B0000",
      items: [
        ["x", "Requiere Google Play o App Store"],
        ["x", "Proceso de aprobacion de dias"],
        ["x", "Ocupa mucho espacio en el celular"],
        ["x", "Requiere actualizaciones manuales"],
        ["x", "Muy costosa de desarrollar"],
      ],
    },
    {
      x: W / 2 + 5, title: "PWA Pino Galant", titleBg: GOLD,
      items: [
        ["+", "Instala desde el sitio web directo"],
        ["+", "Disponible al instante, sin esperas"],
        ["+", "Liviana, casi no ocupa espacio"],
        ["+", "Siempre actualizada automaticamente"],
        ["+", "Ya incluida (sin costo extra)"],
      ],
    },
  ];
  comps.forEach(col => {
    fillRect(doc, col.x, 178, halfW, 138, "#2D3134", 8);
    fillRect(doc, col.x, 178, halfW, 14, col.titleBg, 4);
    const fg = col.titleBg === GOLD ? DARK : WHITE;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(fg).text(col.title, col.x, 183, { width: halfW, align: "center" });
    col.items.forEach(([icon, label], i) => {
      const icolor = icon === "+" ? GREEN : "#FF6B6B";
      doc.font("Helvetica-Bold").fontSize(10).fillColor(icolor).text(icon, col.x + 10, 198 + i * 22, { lineBreak: false });
      doc.font("Helvetica").fontSize(8.5).fillColor("#CCCCCC").text(label, col.x + 24, 199 + i * 22, { lineBreak: false });
    });
  });

  // QR + pasos
  txt(doc, "Codigo QR para instalar la app", 0, 334, { size: 15, color: WHITE, bold: true, align: "center", width: W });

  // QR simulado
  fillRect(doc, W / 2 - 58, 354, 116, 110, WHITE, 6);
  const qx = W / 2 - 46; const qy = 362; const bs = 7;
  const pat = [
    [1,1,1,1,1,1,1,0,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0],
    [1,0,0,0,0,0,1,0,1,0,0,1,1],
    [1,1,1,1,1,1,1,0,0,1,0,1,0],
    [0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,1,0,1,0,1,1,1,0,1,0,0,1],
    [0,1,1,0,1,0,0,0,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0],
    [1,1,1,1,1,1,1,1,0,1,1,0,1],
  ];
  pat.forEach((row, ri) => {
    row.forEach((val, ci) => {
      if (val) fillRect(doc, qx + ci * bs, qy + ri * bs, bs - 1, bs - 1, DARK);
    });
  });
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text("pinogalant.com.ar/app", W / 2 - 58, 470, { width: 116, align: "center" });

  // Instrucciones
  txt(doc, "Como instalar la app en el celular:", W / 2 + 70, 354, { size: 11, color: WHITE, bold: true });
  const stepsList = [
    ["Android (Chrome)", "Toca los 3 puntos en la esquina > 'Agregar a pantalla de inicio' > Instalar"],
    ["iPhone / iPad (Safari)", "Toca el boton Compartir (cuadrado con flecha) > 'Agregar a pantalla de inicio'"],
    ["O escanea el QR", "Con la camara del celular apunta al codigo QR y abre el link que aparece"],
  ];
  stepsList.forEach((s, i) => {
    fillRect(doc, W / 2 + 65, 372 + i * 54, W / 2 - 85, 46, "#383D42", 6);
    fillRect(doc, W / 2 + 65, 372 + i * 54, W / 2 - 85, 3, GOLD);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD).text(s[0], W / 2 + 76, 382 + i * 54, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor("#CCCCCC").text(s[1], W / 2 + 76, 395 + i * 54, { width: W / 2 - 100 });
  });

  // Beneficio app
  fillRect(doc, 25, 536, W - 50, 72, "#383D42", 8);
  fillRect(doc, 25, 536, W - 50, 3, GOLD);
  txt(doc, "Por que la app beneficia a la inmobiliaria?", 0, 546, { size: 12, color: WHITE, bold: true, align: "center", width: W });
  const appBenefits = [
    "El cliente tiene el logo de Pino Galant en su pantalla de inicio: presencia constante de la marca",
    "Puede consultar propiedades en cualquier momento sin buscar en Google cada vez",
    "Mayor fidelizacion: cuando este listo para comprar, la inmobiliaria ya esta en su mente",
  ];
  appBenefits.forEach((b, i) => {
    bullet(doc, "+", 40, 564 + i * 16, b, GOLD, "#CCCCCC", 9);
  });

  fillRect(doc, 0, H - 34, W, 1, "#555555");
  txt(doc, "pinogalant.com.ar  |  App Movil PWA", 0, H - 28, { size: 7.5, color: "#777777", align: "center", width: W });
  txt(doc, "Creado por www.localweb.ar", 0, H - 16, { size: 7.5, color: GOLD, align: "center", width: W });
}

// ── PAGE 7: ADMIN + RESUMEN ───────────────────────────────────────────────
function pageAdminResumen(doc) {
  fillRect(doc, 0, 0, W, H, LIGHT);
  pageHeader(doc, "PANEL ADMIN  +  RESUMEN FINAL", "Panel de Administracion", "Herramientas exclusivas para gestionar el sitio web");

  // Admin cards
  const adminF = [
    { title: "Estadisticas", items: ["Visitas por propiedad", "Consultas recibidas", "Propiedades mas vistas"] },
    { title: "Gestion", items: ["Agregar / editar propiedades", "Marcar como vendida o alquilada", "Destacar propiedades especiales"] },
    { title: "Usuarios", items: ["Ver consultas de clientes", "Gestionar roles de agentes", "Control de accesos y permisos"] },
    { title: "Contactos", items: ["Ver leads recibidos", "Historial de consultas WhatsApp", "Formularios de tasacion y contacto"] },
  ];
  const gw = (W - 60) / 2;
  adminF.forEach((af, i) => {
    const rx = 25 + (i % 2) * (gw + 10);
    const ry = 90 + Math.floor(i / 2) * 100;
    fillRect(doc, rx, ry, gw, 90, WHITE, 8);
    fillRect(doc, rx, ry, gw, 4, GOLD);
    badgeRect(doc, rx + gw - 52, ry + 10, 46, 16, "INCLUIDO", GOLD, WHITE, 7);
    txt(doc, af.title, rx + 10, ry + 12, { size: 11, bold: true });
    af.items.forEach((item, j) => {
      bullet(doc, "+", rx + 10, ry + 36 + j * 18, item, GOLD, MID, 8.5);
    });
  });

  fillRect(doc, 25, 302, W - 50, 1.5, LGRAY);

  txt(doc, "Resumen completo - Todas las mejoras implementadas", 0, 314, { size: 14, bold: true, align: "center", width: W });

  const all = [
    ["01", "Busqueda IA", "El cliente describe lo que quiere y la IA encuentra la propiedad ideal"],
    ["02", "Buscador dinamico", "Filtros de tipo, operacion, provincia y localidad desde propiedades reales"],
    ["03", "Mapa interactivo", "Propiedades en mapa con iconos personalizados, fotos y datos al hacer clic"],
    ["04", "Oficinas comerciales", "Popup con mapa OpenStreetMap, como llegar e iniciar viaje con GPS"],
    ["05", "Compartir propiedad", "Boton para compartir en WhatsApp, Facebook, X, Instagram o copiar link"],
    ["06", "Info del barrio", "Muestra escuelas, hospitales, comercios y mas cerca de la propiedad"],
    ["07", "Calculadora hipotecaria", "Simula cuotas de credito directamente en la pagina de la propiedad"],
    ["08", "Propiedades similares", "Sugerencias automaticas para retener al visitante y mostrar mas opciones"],
    ["09", "App instalable (PWA)", "Se instala en el celular via QR o directo desde el navegador, sin costo"],
  ];

  all.forEach((row, i) => {
    const ry = 334 + i * 25;
    fillRect(doc, 25, ry, W - 50, 23, i % 2 === 0 ? LIGHT : WHITE, 3);
    fillRect(doc, 25, ry, 24, 23, GOLD, 3);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE).text(row[0], 25, ry + 8, { width: 24, align: "center" });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(row[1], 56, ry + 8, { lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text(row[2], 208, ry + 8, { width: W - 228, lineBreak: false });
  });

  // CTA final
  fillRect(doc, 25, H - 78, W - 50, 46, DARK, 8);
  fillRect(doc, 25, H - 78, W - 50, 3, GOLD);
  txt(doc, "pinogalant.com.ar", 0, H - 68, { size: 14, color: WHITE, bold: true, align: "center", width: W });
  txt(doc, "Todas estas funcionalidades ya estan activas y disponibles en el sitio web", 0, H - 52, { size: 9, color: "#AAAAAA", align: "center", width: W });

  fillRect(doc, 0, H - 34, W, 1, LGRAY);
  txt(doc, "pinogalant.com.ar  |  Junio 2026  |  Resumen de mejoras implementadas", 0, H - 28, { size: 7.5, color: GRAY, align: "center", width: W });
  txt(doc, "Creado por www.localweb.ar", 0, H - 16, { size: 7.5, color: GOLD, bold: true, align: "center", width: W });
}

// ── MAIN ──────────────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: "A4",
  margin: 0,
  info: {
    Title: "Pino Galant - Nuevas Funcionalidades 2026",
    Author: "LocalWeb.ar",
    Subject: "Presentacion de mejoras del sitio web pinogalant.com.ar",
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

pageCover(doc);
doc.addPage();
pageIA(doc);
doc.addPage();
pageSearchMap(doc);
doc.addPage();
pageOficinasShare(doc);
doc.addPage();
pageBarrioCalc(doc);
doc.addPage();
pageApp(doc);
doc.addPage();
pageAdminResumen(doc);

doc.end();
stream.on("finish", () => console.log("PDF generado:", OUT));
stream.on("error", e => console.error("Error:", e));
