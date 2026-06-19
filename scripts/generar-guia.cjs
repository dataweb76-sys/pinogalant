"use strict";
// Generador de guía PDF para Pino Galant
// Ejecutar: node scripts/generar-guia.cjs

const PDFDocument = require("../node_modules/pdfkit");
const fs   = require("fs");
const path = require("path");

const BRONZE = "#B48A73";
const DARK   = "#2D3134";
const WHITE  = "#FFFFFF";
const LGRAY  = "#F8F5F2";
const GRAY   = "#888888";
const BORDER = "#E0D8D2";

const outPath = path.join(__dirname, "..", "guia-pino-galant.pdf");
const doc = new PDFDocument({ size: "A4", margin: 48, info: {
  Title: "Guía de Uso – Plataforma Pino Galant",
  Author: "Pino Galant Inmobiliaria",
  Subject: "Manual completo de la plataforma web",
} });

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

// ── utilidades ───────────────────────────────────────────────────────────────

function bronzeRect(x, y, w, h) {
  doc.rect(x, y, w, h).fill(DARK);
}

function sectionHeader(title) {
  doc.addPage();
  const y = doc.y;
  doc.rect(48, y, doc.page.width - 96, 34).fill(DARK);
  doc.fillColor(WHITE).fontSize(14).font("Helvetica-Bold")
     .text(title, 62, y + 9, { width: doc.page.width - 124 });
  doc.fillColor(DARK).moveDown(1.2);
}

function h2(title) {
  doc.moveDown(0.5);
  doc.fillColor(BRONZE).fontSize(11).font("Helvetica-Bold").text(title);
  doc.fillColor(DARK).font("Helvetica").fontSize(10).moveDown(0.3);
}

function para(text) {
  doc.fillColor(DARK).font("Helvetica").fontSize(10).text(text, { align: "justify", lineGap: 2 });
  doc.moveDown(0.4);
}

function bullet(items) {
  items.forEach(item => {
    doc.fillColor(BRONZE).font("Helvetica-Bold").fontSize(10).text("•  ", { continued: true, indent: 12 });
    doc.fillColor(DARK).font("Helvetica").text(item, { lineGap: 2 });
  });
  doc.moveDown(0.4);
}

function labelValue(label, value) {
  doc.fillColor(BRONZE).font("Helvetica-Bold").fontSize(10).text(label + "  ", { continued: true });
  doc.fillColor(DARK).font("Helvetica").text(value, { lineGap: 2 });
}

function divider() {
  doc.moveDown(0.4);
  doc.rect(48, doc.y, doc.page.width - 96, 1).fill(BORDER);
  doc.moveDown(0.6);
}

function noteBox(text) {
  const bx = 48, bw = doc.page.width - 96;
  const y0 = doc.y;
  doc.rect(bx, y0, bw, 1).fill(BRONZE);
  doc.rect(bx, y0, 3, 40).fill(BRONZE);
  doc.fillColor(DARK).font("Helvetica-Oblique").fontSize(9)
     .text(text, bx + 10, y0 + 6, { width: bw - 16, lineGap: 2 });
  doc.moveDown(0.8);
}

function roleTag(role, desc) {
  doc.rect(48, doc.y, 90, 20).fill(DARK);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9).text(role, 54, doc.y - 14, { width: 78 });
  doc.fillColor(DARK).font("Helvetica").fontSize(9).text(desc, { indent: 8, lineGap: 2 });
  doc.moveDown(0.3);
}

// ── PORTADA ──────────────────────────────────────────────────────────────────

const PW = doc.page.width;
const PH = doc.page.height;

// fondo oscuro superior
doc.rect(0, 0, PW, 280).fill(DARK);

// franja bronce
doc.rect(0, 280, PW, 6).fill(BRONZE);

// título
doc.fillColor(BRONZE).font("Helvetica-Bold").fontSize(32)
   .text("PINO GALANT", 48, 90, { width: PW - 96, align: "center" });
doc.fillColor(WHITE).font("Helvetica").fontSize(16)
   .text("INMOBILIARIA", 48, 135, { width: PW - 96, align: "center" });
doc.fillColor(LGRAY).font("Helvetica-Oblique").fontSize(12)
   .text("Guía completa de la plataforma digital", 48, 165, { width: PW - 96, align: "center" });

// bajada
doc.fillColor(DARK).font("Helvetica").fontSize(11)
   .text("Esta guía describe todas las funcionalidades disponibles en la plataforma web de Pino Galant Inmobiliaria: registro de usuarios, portal de propietarios, portal de inquilinos, panel administrativo para agentes y coordinadora, gestión de propiedades, alquileres, caja y más.",
         48, 316, { width: PW - 96, align: "justify", lineGap: 3 });

doc.moveDown(1);

// recuadro de acceso
doc.rect(48, doc.y, PW - 96, 60).fill(LGRAY);
const boxY = doc.y - 60;
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Acceso a la plataforma", 62, boxY + 10);
doc.fillColor(BRONZE).font("Helvetica").fontSize(10).text("https://pinogalant.vercel.app", 62, boxY + 26);
doc.fillColor(GRAY).font("Helvetica-Oblique").fontSize(9).text("Disponible 24/7 desde cualquier dispositivo con conexión a internet", 62, boxY + 42);

doc.moveDown(3.5);

// fecha y versión
doc.fillColor(GRAY).font("Helvetica").fontSize(9)
   .text("Versión 1.0  ·  Mayo 2026", { align: "center" });

// ── ÍNDICE ───────────────────────────────────────────────────────────────────

doc.addPage();
doc.rect(0, 0, PW, 8).fill(BRONZE);
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(20).text("Índice de contenidos", 48, 30);
divider();

const sections = [
  ["01", "Acceso al sitio y navegación"],
  ["02", "Registro de nuevos usuarios"],
  ["03", "Inicio de sesión"],
  ["04", "Portal del Inquilino  –  /mi-alquiler"],
  ["05", "Portal del Propietario  –  /mi-propiedad"],
  ["06", "Chat y consultas en tiempo real"],
  ["07", "Panel Administrativo  –  /admin"],
  ["08", "Gestión de propiedades"],
  ["09", "Alquileres y contratos"],
  ["10", "Consultas y reclamos"],
  ["11", "Caja y auditoría"],
  ["12", "Gestión de usuarios"],
  ["13", "Roles y permisos"],
  ["14", "Seguridad y buenas prácticas"],
];

sections.forEach(([num, title]) => {
  const y = doc.y;
  doc.rect(48, y, 28, 18).fill(BRONZE);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9).text(num, 54, y + 4, { width: 16, align: "center" });
  doc.fillColor(DARK).font("Helvetica").fontSize(10).text(title, 84, y + 4);
  doc.moveDown(0.5);
});

// ── 01 ACCESO ────────────────────────────────────────────────────────────────

sectionHeader("01  –  Acceso al sitio y navegación");

para("La plataforma de Pino Galant está disponible en internet desde cualquier dispositivo: computadora, tablet o celular. No requiere instalación.");

h2("URL de acceso");
para("https://pinogalant.vercel.app");

h2("Encabezado y menú de navegación");
para("El encabezado superior muestra el logo de la inmobiliaria y enlaces de navegación que varían según el tipo de usuario conectado:");
bullet([
  "Visitante (sin cuenta): acceso a Inicio, Propiedades, Contacto. Botones Ingresar y Registrarse.",
  "Inquilino: enlace «Mi alquiler» para acceder a su portal personal.",
  "Propietario: enlace «Mi propiedad» con datos de sus inmuebles.",
  "Agente / Coordinadora: acceso al panel administrativo completo.",
]);

h2("Menú móvil");
para("En pantallas pequeñas el menú se despliega con el botón ≡ (hamburguer). Incluye las mismas opciones adaptadas para uso táctil.");

noteBox("Tip: guardá la dirección en favoritos de tu navegador para acceder más rápido.");

// ── 02 REGISTRO ──────────────────────────────────────────────────────────────

sectionHeader("02  –  Registro de nuevos usuarios");

para("Existen dos tipos de usuario que se pueden registrar desde la página pública: Inquilino y Propietario. El proceso es guiado y toma menos de 3 minutos.");

h2("Opciones de registro");
bullet([
  "Con email y contraseña: completar el formulario completo.",
  "Con Google: un clic, se inicia sesión con tu cuenta de Google y luego se completan los datos faltantes.",
]);

h2("Formulario para Inquilinos");
para("El formulario de inquilino solicita la siguiente información:");
bullet([
  "Nombre, apellido, DNI, teléfono.",
  "Ciudad y código postal.",
  "Situación laboral: empleado, autónomo, jubilado u otro.",
  "Empleador / empresa y cargo u ocupación.",
  "Ingreso mensual estimado (en pesos argentinos).",
  "Grupo familiar: cantidad de personas y si tiene mascotas.",
  "Garantía: nombre, teléfono, DNI y relación del garante.",
  "Referencia de alquiler anterior (opcional).",
]);

h2("Formulario para Propietarios");
para("Formulario más breve, enfocado en datos de contacto:");
bullet([
  "Nombre, apellido, DNI, teléfono.",
  "Ciudad y código postal.",
  "Dirección (opcional).",
]);

noteBox("Todos los datos ingresados quedan guardados en el panel administrativo para que los agentes puedan consultarlos al evaluar candidatos.");

h2("Registro con Google OAuth");
para("Al hacer clic en «Continuar con Google»:");
bullet([
  "Se abre la pantalla de selección de cuenta Google.",
  "Al confirmar, el sistema crea automáticamente el perfil base con el nombre y foto de Google.",
  "Se redirige a «Completar perfil» para ingresar DNI, teléfono y demás datos requeridos.",
  "Una vez completado, el usuario queda logueado y accede a su portal.",
]);

// ── 03 LOGIN ─────────────────────────────────────────────────────────────────

sectionHeader("03  –  Inicio de sesión");

para("El inicio de sesión está disponible en /login. Los usuarios que ya tienen cuenta pueden ingresar de dos formas:");

h2("Con email y contraseña");
bullet([
  "Ingresar el email registrado y la contraseña elegida al momento del registro.",
  "Al confirmar, el sistema detecta el rol y redirige automáticamente al portal correspondiente.",
]);

h2("Con Google");
bullet([
  "Hacer clic en «Ingresar con Google».",
  "Seleccionar la cuenta Google con la que se registró.",
  "Redirección automática al portal según el rol.",
]);

h2("Redirección automática por rol");
bullet([
  "Inquilino → /mi-alquiler",
  "Propietario → /mi-propiedad",
  "Agente o Coordinadora → /admin (panel administrativo)",
]);

noteBox("Si olvidaste la contraseña, contactate con un agente para que la restablezca desde el panel de administración.");

// ── 04 PORTAL INQUILINO ──────────────────────────────────────────────────────

sectionHeader("04  –  Portal del Inquilino  ( /mi-alquiler )");

para("Cuando un inquilino inicia sesión es redirigido automáticamente a su portal personal en /mi-alquiler. Desde allí puede ver todo lo relacionado con su alquiler activo.");

h2("Sección: Mi alquiler activo");
bullet([
  "Dirección completa de la propiedad alquilada.",
  "Fecha de inicio y fecha de vencimiento del contrato.",
  "Importe mensual actual del alquiler.",
  "Nombre y teléfono del agente asignado.",
]);

h2("Sección: Historial de pagos");
bullet([
  "Listado de todos los meses registrados.",
  "Estado de cada pago: Pagado / Pendiente / Vencido.",
  "Fecha de acreditación y monto abonado.",
]);

h2("Sección: Consultas y reclamos");
bullet([
  "Formulario para enviar consultas o reportar problemas en la propiedad.",
  "Historial de consultas anteriores con estado (Pendiente / En trámite / Resuelto).",
]);

h2("Cerrar sesión");
para("El botón de cierre de sesión está en el menú superior. Al salir, la sesión se cierra de forma segura.");

// ── 05 PORTAL PROPIETARIO ─────────────────────────────────────────────────────

sectionHeader("05  –  Portal del Propietario  ( /mi-propiedad )");

para("Los propietarios que inician sesión acceden a su portal en /mi-propiedad, donde pueden ver sus propiedades registradas y la información del agente a cargo.");

h2("Mis propiedades");
bullet([
  "Lista de propiedades asociadas al propietario.",
  "Foto principal, dirección y estado: disponible, alquilada o en venta.",
  "Nombre del agente asignado con botón de contacto por WhatsApp.",
]);

h2("Reseñas de agentes");
para("Desde el portal de propietarios es posible dejar una reseña sobre el agente que gestiona la propiedad:");
bullet([
  "Calificación de 1 a 5 estrellas.",
  "Comentario libre (opcional).",
  "Cada propietario puede dejar una reseña por agente.",
]);

h2("Consultas directas");
para("El botón «Consultar por WhatsApp» abre una conversación directa con el número de la inmobiliaria, con un mensaje predefinido que incluye el nombre de la propiedad.");

// ── 06 CHAT ──────────────────────────────────────────────────────────────────

sectionHeader("06  –  Chat y consultas en tiempo real");

para("La plataforma incluye un widget de chat flotante disponible en todas las páginas para visitantes y usuarios registrados.");

h2("Cómo abrir el chat");
bullet([
  "Hacer clic en el ícono de burbuja de conversación en la esquina inferior derecha.",
  "El widget se abre mostrando dos pestañas: Chat y Agentes.",
]);

h2("Pestaña Chat");
bullet([
  "Campo de texto para escribir y enviar mensajes.",
  "Respuestas automatizadas para consultas frecuentes.",
  "Los mensajes quedan registrados para seguimiento por parte del equipo.",
]);

h2("Pestaña Agentes");
bullet([
  "Muestra el listado de agentes disponibles en línea.",
  "Indicador de estado (En línea / Ausente).",
  "Posibilidad de iniciar una conversación directa con un agente específico.",
]);

noteBox("El chat es visible para todos los visitantes, incluso sin iniciar sesión. Es ideal para resolver dudas rápidas sobre propiedades disponibles.");

// ── 07 PANEL ADMIN ───────────────────────────────────────────────────────────

sectionHeader("07  –  Panel Administrativo  ( /admin )");

para("El panel administrativo es el centro de operaciones de la inmobiliaria. Solo pueden acceder usuarios con rol Agente o Coordinadora.");

h2("Dashboard principal");
bullet([
  "Resumen en tiempo real: propiedades activas, alquileres vigentes, consultas pendientes.",
  "Accesos directos a las secciones más utilizadas.",
  "Actividad reciente: últimos movimientos de caja, consultas nuevas, usuarios registrados.",
]);

h2("Módulos disponibles en el menú lateral");
bullet([
  "Propiedades: alta, edición y gestión de inmuebles.",
  "Alquileres: contratos activos, vencimientos y pagos.",
  "Consultas y Reclamos: bandeja de mensajes entrantes.",
  "Caja: ingresos, egresos y resumen financiero.",
  "Usuarios: gestión de inquilinos, propietarios y agentes.",
]);

noteBox("La Coordinadora tiene acceso completo. Los Agentes pueden ver y editar propiedades y alquileres, pero no pueden modificar usuarios ni configuración del sistema.");

// ── 08 PROPIEDADES ────────────────────────────────────────────────────────────

sectionHeader("08  –  Gestión de propiedades  ( /admin/propiedades )");

para("Desde este módulo se administran todas las propiedades de la inmobiliaria: carga de nuevas unidades, edición de información y seguimiento del estado.");

h2("Lista de propiedades");
bullet([
  "Tabla con todas las propiedades: dirección, tipo, estado y agente asignado.",
  "Filtros por estado (disponible, alquilada, en venta) y tipo de operación.",
  "Buscador por dirección o propietario.",
]);

h2("Agregar nueva propiedad  ( botón + Nueva propiedad )");
para("Hacer clic en el botón verde «+ Nueva propiedad» abre el formulario de alta:");
bullet([
  "Datos básicos: título, dirección, ciudad, código postal.",
  "Tipo de propiedad: casa, departamento, local, terreno, etc.",
  "Operación: alquiler, venta o ambos.",
  "Precio y moneda (ARS o USD).",
  "Ambientes, superficie cubierta y descubierta.",
  "Descripción detallada.",
  "Fotografías: carga múltiple de imágenes.",
  "Propietario: asignación desde la lista de propietarios registrados.",
  "Agente responsable: asignación del agente que gestiona la propiedad.",
]);

h2("Editar propiedad");
bullet([
  "Clic en el ícono de edición en la tabla para modificar cualquier campo.",
  "Cambio de estado: disponible → alquilada → desocupada, etc.",
  "Actualización de precio con historial de cambios.",
]);

h2("Estados de una propiedad");
bullet([
  "Disponible: visible en el sitio público, apta para consultas.",
  "Alquilada: con contrato activo asociado.",
  "En venta: publicada para operación de compra/venta.",
  "Pausada: oculta temporalmente del sitio.",
]);

// ── 09 ALQUILERES ─────────────────────────────────────────────────────────────

sectionHeader("09  –  Alquileres y contratos  ( /admin/alquileres )");

para("Módulo de gestión de contratos de alquiler. Permite registrar nuevos contratos, hacer seguimiento de pagos y recibir alertas de vencimientos.");

h2("Nuevo contrato de alquiler");
bullet([
  "Selección de propiedad (debe estar en estado Disponible).",
  "Selección del inquilino (debe estar registrado en el sistema).",
  "Fechas de inicio y fin del contrato.",
  "Monto mensual y moneda.",
  "Día de vencimiento mensual del pago.",
  "Agente responsable.",
]);

h2("Registro de pagos");
bullet([
  "Cada mes se registra si el pago fue recibido o no.",
  "Fecha de pago, monto abonado y método de pago.",
  "El sistema marca automáticamente como «Vencido» si no se registra pago al cierre del período.",
]);

h2("Alertas de vencimiento");
bullet([
  "El dashboard muestra contratos que vencen en los próximos 30 días.",
  "Permite anticipar la renovación o búsqueda de nuevo inquilino.",
]);

// ── 10 CONSULTAS ──────────────────────────────────────────────────────────────

sectionHeader("10  –  Consultas y reclamos  ( /admin/consultas )");

para("Bandeja centralizada de todos los mensajes recibidos: consultas por propiedades, reclamos de inquilinos y contactos generales desde el chat.");

h2("Lista de consultas");
bullet([
  "Remitente, asunto, fecha y estado de cada consulta.",
  "Filtro por tipo: consulta de propiedad / reclamo / contacto general.",
  "Filtro por estado: Pendiente / En trámite / Resuelto.",
]);

h2("Gestión de una consulta");
bullet([
  "Ver el mensaje completo y los datos del remitente.",
  "Cambiar el estado y asignar a un agente.",
  "Responder por WhatsApp o email directamente desde el panel.",
  "Agregar notas internas visibles solo para el equipo.",
]);

// ── 11 CAJA ──────────────────────────────────────────────────────────────────

sectionHeader("11  –  Caja y auditoría  ( /admin/caja )");

para("Registro de ingresos y egresos de la inmobiliaria. Permite llevar un control financiero básico con historial de movimientos.");

h2("Registrar movimiento");
bullet([
  "Tipo: ingreso (comisión, alquiler recibido) o egreso (gasto operativo).",
  "Monto, moneda, descripción y fecha.",
  "Categoría: comisión de venta, cobro de alquiler, gastos varios, etc.",
]);

h2("Resumen del período");
bullet([
  "Total de ingresos y egresos del mes en curso.",
  "Balance neto.",
  "Gráfico de evolución por semana.",
]);

h2("Auditoría y exportación");
bullet([
  "Todos los movimientos quedan registrados con usuario, fecha y hora.",
  "Posibilidad de filtrar por período, tipo y categoría.",
  "Exportación del listado en formato CSV para procesamiento externo.",
]);

// ── 12 USUARIOS ───────────────────────────────────────────────────────────────

sectionHeader("12  –  Gestión de usuarios  ( /admin/usuarios )");

para("Listado completo de todos los usuarios registrados en la plataforma, con sus datos, rol y estado.");

h2("Lista de usuarios");
bullet([
  "Nombre completo, email, teléfono, rol y fecha de registro.",
  "Buscador por nombre, email o DNI.",
  "Filtro por rol: Inquilino / Propietario / Agente / Coordinadora.",
]);

h2("Detalle de un usuario");
bullet([
  "Ver perfil completo: datos personales, laborales (si es inquilino) y documentación.",
  "Historial de alquileres o propiedades asociadas.",
  "Ver reseñas recibidas (si es agente).",
]);

h2("Acciones sobre usuarios");
bullet([
  "Cambiar rol: ascender a agente o cambiar a propietario/inquilino.",
  "Restablecer contraseña desde el panel (la nueva contraseña se envía por email).",
  "Desactivar cuenta: el usuario no puede ingresar pero sus datos se conservan.",
]);

noteBox("Solo la Coordinadora puede cambiar roles o desactivar cuentas. Los Agentes pueden ver la información pero no modificarla.");

// ── 13 ROLES ─────────────────────────────────────────────────────────────────

sectionHeader("13  –  Roles y permisos");

para("La plataforma tiene cinco roles definidos, cada uno con acceso diferenciado a las funciones del sistema:");

h2("Resumen de roles");

const roles = [
  ["Coordinadora", "Acceso completo a toda la plataforma. Gestión de usuarios, configuración, caja y auditoría. Es el rol de máxima jerarquía."],
  ["Agente", "Acceso al panel admin. Puede gestionar propiedades, alquileres y consultas. No modifica usuarios ni configuración."],
  ["Propietario", "Acceso a su portal /mi-propiedad. Ve sus propiedades, el agente asignado y puede dejar reseñas."],
  ["Inquilino", "Acceso a su portal /mi-alquiler. Ve su contrato, pagos y puede enviar reclamos."],
  ["Visitante", "Sin cuenta. Puede ver propiedades públicas y usar el chat de contacto."],
];

roles.forEach(([role, desc]) => {
  doc.moveDown(0.3);
  const rY = doc.y;
  doc.rect(48, rY, 100, 22).fill(DARK);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9).text(role, 54, rY + 6, { width: 88 });
  doc.fillColor(DARK).font("Helvetica").fontSize(9).text(desc, 160, rY + 6, { width: doc.page.width - 220, lineGap: 2 });
  doc.moveDown(0.7);
});

divider();

h2("¿Cómo se asigna el rol?");
bullet([
  "Al registrarse, el usuario elige si es Inquilino o Propietario.",
  "Los Agentes son creados directamente por la Coordinadora desde el panel.",
  "La Coordinadora puede cambiar el rol de cualquier usuario en cualquier momento.",
]);

// ── 14 SEGURIDAD ──────────────────────────────────────────────────────────────

sectionHeader("14  –  Seguridad y buenas prácticas");

para("La plataforma fue construida con estándares modernos de seguridad para proteger los datos de todos los usuarios.");

h2("Autenticación y sesiones");
bullet([
  "Contraseñas almacenadas con hash seguro (bcrypt). Nunca en texto plano.",
  "Sesiones con tokens JWT de corta duración y renovación automática.",
  "OAuth con Google: sin necesidad de recordar contraseñas adicionales.",
  "Cierre de sesión seguro: invalida el token inmediatamente.",
]);

h2("Control de acceso");
bullet([
  "Cada ruta del sistema verifica el rol del usuario en el servidor antes de mostrar datos.",
  "Los datos de otros usuarios nunca son accesibles desde el portal propio.",
  "El panel administrativo solo es accesible para agentes y coordinadora.",
]);

h2("Protección de datos");
bullet([
  "Toda la comunicación usa HTTPS (SSL/TLS) con certificado válido.",
  "Los datos se almacenan en Supabase (infraestructura en la nube con cumplimiento SOC2).",
  "Las imágenes de propiedades se guardan en almacenamiento seguro con URLs firmadas.",
]);

h2("Buenas prácticas recomendadas");
bullet([
  "Usar contraseñas únicas y de al menos 8 caracteres con letras y números.",
  "No compartir credenciales de acceso con terceros.",
  "Cerrar sesión al usar computadoras compartidas.",
  "Ante cualquier actividad sospechosa, avisar a la Coordinadora para restablecer la contraseña.",
]);

noteBox("Para soporte técnico o consultas sobre el sistema, contactarse con el equipo de desarrollo a través de la Coordinadora.");

// ── PIE FINAL ─────────────────────────────────────────────────────────────────

doc.addPage();
doc.rect(0, 0, PW, 8).fill(BRONZE);
doc.moveDown(3);
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(22).text("Pino Galant Inmobiliaria", { align: "center" });
doc.moveDown(0.5);
doc.fillColor(BRONZE).font("Helvetica").fontSize(12).text("https://pinogalant.vercel.app", { align: "center" });
doc.moveDown(0.4);
doc.fillColor(GRAY).font("Helvetica").fontSize(10).text("WhatsApp: +54 9 2954 320639", { align: "center" });
doc.moveDown(2);
doc.fillColor(GRAY).font("Helvetica-Oblique").fontSize(9)
   .text("Esta guía fue generada automáticamente y describe la versión 1.0 de la plataforma.\nPara consultas sobre funcionalidades adicionales o personalizaciones, contactar al equipo de desarrollo.",
         { align: "center", lineGap: 3 });

doc.moveDown(2);
doc.rect(PW/2 - 40, doc.y, 80, 2).fill(BRONZE);

// ── NUMERACIÓN ────────────────────────────────────────────────────────────────

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  if (i === range.start) continue; // sin número en portada
  doc.fillColor(GRAY).font("Helvetica").fontSize(8)
     .text(`Pino Galant Inmobiliaria  ·  pág. ${i}`, 48, doc.page.height - 30, {
       width: doc.page.width - 96,
       align: "right",
     });
}

// ── GUARDAR ───────────────────────────────────────────────────────────────────

doc.end();
stream.on("finish", () => console.log("✅  PDF generado: " + outPath));
stream.on("error", (e) => console.error("❌  Error:", e.message));
