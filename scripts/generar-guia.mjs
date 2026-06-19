// Generador de guía PDF para Pino Galant
// Ejecutar: node scripts/generar-guia.mjs

import pdfmakePkg from "pdfmake";
const PdfPrinter = pdfmakePkg.default ?? pdfmakePkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colores de marca
const BRONZE  = "#B48A73";
const DARK    = "#2D3134";
const LIGHT   = "#F8F5F2";
const WHITE   = "#FFFFFF";
const GREEN   = "#22C55E";
const GRAY    = "#888888";
const LGRAY   = "#F3F4F6";
const BORDER  = "#E5E7EB";

const fonts = {
  Helvetica: {
    normal:      "Helvetica",
    bold:        "Helvetica-Bold",
    italics:     "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function chip(text, bg = BRONZE, color = WHITE) {
  return {
    text,
    fontSize: 8,
    bold: true,
    color,
    background: bg,
    margin: [0, 0, 4, 0],
    // pdfmake no soporta borderRadius en texto inline; usamos un rectángulo
  };
}

function sectionTitle(text) {
  return [
    {
      canvas: [{ type: "rect", x: 0, y: 0, w: 515, h: 36, r: 8, color: DARK }],
      margin: [0, 16, 0, 0],
    },
    {
      text,
      fontSize: 16,
      bold: true,
      color: WHITE,
      margin: [12, -28, 0, 16],
    },
  ];
}

function subTitle(text) {
  return {
    text,
    fontSize: 12,
    bold: true,
    color: BRONZE,
    margin: [0, 14, 0, 6],
    decoration: "underline",
    decorationColor: BRONZE,
  };
}

function feature(icon, title, desc) {
  return {
    columns: [
      { text: icon, width: 24, fontSize: 16, margin: [0, 1, 0, 0] },
      {
        stack: [
          { text: title, fontSize: 11, bold: true, color: DARK },
          { text: desc,  fontSize: 9,  color: GRAY, margin: [0, 2, 0, 0] },
        ],
        margin: [6, 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 10],
  };
}

function infoBox(lines, bg = LGRAY) {
  return {
    table: {
      widths: ["*"],
      body: [[
        {
          stack: lines.map(l =>
            typeof l === "string"
              ? { text: l, fontSize: 9, color: DARK, margin: [0, 2, 0, 2] }
              : l
          ),
          margin: [12, 10, 12, 10],
          fillColor: bg,
        },
      ]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
    },
    margin: [0, 6, 0, 10],
  };
}

function stepRow(num, text) {
  return {
    columns: [
      {
        canvas: [{ type: "ellipse", x: 10, y: 10, r1: 10, r2: 10, color: BRONZE }],
        width: 24,
        margin: [0, -2, 0, 0],
      },
      {
        text: String(num),
        width: 0,
        fontSize: 9,
        bold: true,
        color: WHITE,
        margin: [-20, 2, 0, 0],
        alignment: "center",
      },
      {
        text,
        fontSize: 10,
        color: DARK,
        margin: [8, 2, 0, 0],
      },
    ],
    margin: [0, 0, 0, 8],
  };
}

function roleTag(role, color) {
  return {
    table: {
      body: [[
        { text: role, fontSize: 8, bold: true, color: WHITE, fillColor: color, margin: [6, 3, 6, 3] },
      ]],
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 0, 6, 0],
  };
}

// ─── PORTADA ─────────────────────────────────────────────────────────────────

const cover = [
  // Fondo superior
  {
    canvas: [{ type: "rect", x: 0, y: 0, w: 595, h: 260, color: DARK }],
    margin: [-40, -40, -40, 0],
    pageBreak: undefined,
  },
  // Logo PG
  {
    table: {
      body: [[
        {
          text: "PG",
          fontSize: 36,
          bold: true,
          color: WHITE,
          fillColor: BRONZE,
          margin: [20, 14, 20, 14],
          alignment: "center",
        },
      ]],
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, -220, 0, 0],
    alignment: "center",
  },
  { text: "Pino Galant", fontSize: 32, bold: true, color: WHITE, alignment: "center", margin: [0, 12, 0, 0] },
  { text: "Inmobiliaria", fontSize: 14, color: BRONZE, alignment: "center", margin: [0, 4, 0, 8] },
  {
    canvas: [{ type: "line", x1: 180, y1: 0, x2: 360, y2: 0, lineWidth: 1, lineColor: BRONZE }],
    margin: [0, 4, 0, 12],
  },
  { text: "GUÍA COMPLETA DE LA PLATAFORMA", fontSize: 12, bold: true, color: "#aaaaaa", alignment: "center", characterSpacing: 2 },

  // Caja de versión
  {
    text: "Versión 1.0  ·  Mayo 2026  ·  Uso interno",
    fontSize: 9,
    color: GRAY,
    alignment: "center",
    margin: [0, 180, 0, 0],
  },
  {
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: BORDER }],
    margin: [0, 10, 0, 10],
  },
  {
    text: "Este documento describe todas las funcionalidades de la plataforma web Pino Galant, " +
          "incluyendo el registro de usuarios, publicación de propiedades, panel de inquilinos y propietarios, " +
          "y el panel administrativo para agentes y la Coordinadora.",
    fontSize: 10,
    color: GRAY,
    alignment: "center",
    margin: [20, 0, 20, 0],
  },
];

// ─── INDICE ───────────────────────────────────────────────────────────────────

const indice = [
  ...sectionTitle("Índice de contenidos"),
  {
    ul: [
      "1. Acceso al sitio web",
      "2. Registro de usuarios (Inquilinos y Propietarios)",
      "3. Inicio de sesión (Email y Google)",
      "4. Portal del Inquilino — Mi Alquiler",
      "5. Portal del Propietario — Mi Propiedad",
      "6. Publicación de propiedades",
      "7. Chat de consultas en el encabezado",
      "8. Panel Administrativo — Dashboard",
      "9. Panel Administrativo — Propiedades",
      "10. Panel Administrativo — Alquileres y Contratos",
      "11. Panel Administrativo — Consultas",
      "12. Panel Administrativo — Caja y Auditoría",
      "13. Panel Administrativo — Usuarios",
      "14. Roles y permisos",
    ],
    fontSize: 11,
    color: DARK,
    margin: [20, 10, 0, 0],
    lineHeight: 1.8,
  },
];

// ─── SECCIÓN 1: ACCESO ────────────────────────────────────────────────────────

const acceso = [
  ...sectionTitle("1. Acceso al sitio web"),
  { text: "El sitio está disponible en:", fontSize: 10, color: GRAY, margin: [0, 0, 0, 8] },
  {
    table: {
      widths: ["*"],
      body: [[
        { text: "https://pinogalant.vercel.app", fontSize: 13, bold: true, color: BRONZE, fillColor: LGRAY, margin: [16, 12, 16, 12], alignment: "center" },
      ]],
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 0, 0, 16],
  },
  { text: "Desde cualquier dispositivo (computadora, celular, tablet) se puede acceder al sitio. La plataforma es responsiva y se adapta a todos los tamaños de pantalla.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  subTitle("Navegación principal"),
  {
    table: {
      widths: [100, "*"],
      body: [
        [{ text: "Sección", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 6, 8, 6] }, { text: "Descripción", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 6, 8, 6] }],
        [{ text: "Propiedades", fontSize: 9, margin: [8, 5, 8, 5] }, { text: "Listado completo de propiedades publicadas con filtros de búsqueda", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "Venta", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }, { text: "Propiedades en venta", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }],
        [{ text: "Alquiler", fontSize: 9, margin: [8, 5, 8, 5] }, { text: "Propiedades en alquiler", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "Publicar", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }, { text: "Formulario para que propietarios publiquen sus propiedades", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }],
        [{ text: "Mi alquiler", fontSize: 9, color: BRONZE, bold: true, margin: [8, 5, 8, 5] }, { text: "Panel privado del inquilino (visible solo si tiene sesión iniciada)", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "Mi propiedad", fontSize: 9, color: BRONZE, bold: true, fillColor: LGRAY, margin: [8, 5, 8, 5] }, { text: "Panel del propietario (visible solo si tiene sesión iniciada)", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }],
        [{ text: "Admin", fontSize: 9, color: BRONZE, bold: true, margin: [8, 5, 8, 5] }, { text: "Panel administrativo (solo para agentes y coordinadora)", fontSize: 9, margin: [8, 5, 8, 5] }],
      ],
    },
    layout: { hLineColor: () => BORDER, vLineColor: () => BORDER },
    margin: [0, 0, 0, 0],
  },
];

// ─── SECCIÓN 2: REGISTRO ──────────────────────────────────────────────────────

const registro = [
  ...sectionTitle("2. Registro de usuarios"),
  { text: "El sistema distingue dos tipos de usuarios que se pueden registrar desde el sitio público:", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  {
    columns: [
      {
        stack: [
          { canvas: [{ type: "rect", x: 0, y: 0, w: 235, h: 150, r: 8, color: "#f0fdf4" }] },
          { text: "🏠  Inquilino", fontSize: 13, bold: true, color: DARK, margin: [12, -140, 0, 6] },
          { text: "Quiere alquilar una propiedad", fontSize: 9, color: GRAY, margin: [12, 0, 0, 10] },
          { text: "Completa:", fontSize: 9, bold: true, color: DARK, margin: [12, 0, 0, 4] },
          { ul: ["Nombre y apellido", "DNI", "Teléfono / WhatsApp", "Ciudad y código postal", "Tipo de ingreso laboral", "Empleador e ingreso mensual", "Cantidad de personas que vivirán", "¿Tiene mascotas?", "Datos del garante"], fontSize: 8, color: DARK, margin: [20, 0, 0, 0] },
        ],
        width: 240,
      },
      { width: 20, text: "" },
      {
        stack: [
          { canvas: [{ type: "rect", x: 0, y: 0, w: 235, h: 150, r: 8, color: "#eff6ff" }] },
          { text: "🏢  Propietario", fontSize: 13, bold: true, color: DARK, margin: [12, -140, 0, 6] },
          { text: "Tiene una propiedad para alquilar o vender", fontSize: 9, color: GRAY, margin: [12, 0, 0, 10] },
          { text: "Completa:", fontSize: 9, bold: true, color: DARK, margin: [12, 0, 0, 4] },
          { ul: ["Nombre y apellido", "DNI", "Teléfono / WhatsApp", "Ciudad y código postal"], fontSize: 8, color: DARK, margin: [20, 0, 0, 0] },
          { text: "\nPuede ver el estado de su propiedad y\ncomunicarse con el agente asignado.", fontSize: 8, color: GRAY, margin: [12, 4, 0, 0] },
        ],
        width: 240,
      },
    ],
    margin: [0, 0, 0, 16],
  },

  subTitle("Registro con Google"),
  { text: "Ambos tipos de usuario pueden registrarse usando su cuenta de Google con un solo clic. Luego completan el formulario con los datos necesarios.", fontSize: 10, color: DARK, margin: [0, 0, 0, 8] },
  {
    columns: [
      { text: "G", bold: true, fontSize: 14, color: "#4285F4", width: 20, margin: [0, 0, 0, 0] },
      { text: "Botón \"Continuar con Google\" disponible en las páginas de registro e inicio de sesión", fontSize: 10, color: DARK, margin: [8, 1, 0, 0] },
    ],
    margin: [0, 0, 0, 4],
  },
];

// ─── SECCIÓN 3: LOGIN ─────────────────────────────────────────────────────────

const login = [
  ...sectionTitle("3. Inicio de sesión"),
  { text: "Todos los usuarios (inquilinos, propietarios y agentes) ingresan desde la misma página de login.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  { text: "URL de acceso: /login", fontSize: 9, color: GRAY, margin: [0, 0, 0, 10] },

  feature("✉️", "Email + Contraseña", "Ingreso tradicional con credenciales creadas al registrarse."),
  feature("G", "Google OAuth", "Inicio de sesión con cuenta de Google. Rápido y sin recordar contraseñas."),

  infoBox([
    { text: "Redirección automática según rol:", fontSize: 9, bold: true, color: DARK, margin: [0, 0, 0, 4] },
    { text: "• Inquilino  →  /mi-alquiler", fontSize: 9, color: DARK },
    { text: "• Propietario  →  /mi-propiedad", fontSize: 9, color: DARK },
    { text: "• Agente / Coordinadora  →  /admin", fontSize: 9, color: DARK },
  ]),
];

// ─── SECCIÓN 4: PORTAL INQUILINO ──────────────────────────────────────────────

const portalInquilino = [
  ...sectionTitle("4. Portal del Inquilino — Mi Alquiler"),
  { text: "Cada inquilino tiene un portal privado donde puede gestionar todo lo relacionado a su alquiler.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  feature("📊", "Dashboard principal", "Muestra el estado del contrato, próximo pago, días restantes del contrato y accesos rápidos."),
  feature("📄", "Mi contrato", "El inquilino puede ver el contrato completo en formato legal argentino (Ley 27.551) y firmarlo digitalmente."),
  feature("💰", "Mis pagos", "Historial completo de cuotas con estado (pagado / pendiente / vencido / próximo), monto, fecha de vencimiento y método de pago."),
  feature("🔔", "Alertas de vencimiento", "Si hay cuotas vencidas o que vencen en menos de 7 días, aparece una alerta destacada en rojo o amarillo."),
  feature("🛠️", "Mis reclamos", "El inquilino puede abrir reclamos de mantenimiento con 10 categorías y 4 niveles de prioridad. Ve el estado de cada reclamo."),
  feature("📝", "Nuevo reclamo", "Formulario para crear reclamos con categoría, descripción, prioridad y ubicación dentro del inmueble."),

  subTitle("Estados de cuotas"),
  {
    table: {
      widths: [80, 60, "*"],
      body: [
        [{ text: "Estado", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 5, 8, 5] }, { text: "Color", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 5, 8, 5] }, { text: "Descripción", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 5, 8, 5] }],
        [{ text: "Pagado", fontSize: 9, margin: [8, 5, 8, 5] }, { text: "Verde", fontSize: 9, color: "#15803d", margin: [8, 5, 8, 5] }, { text: "Cuota abonada", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "Próximo", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }, { text: "Amarillo", fontSize: 9, color: "#b45309", fillColor: LGRAY, margin: [8, 5, 8, 5] }, { text: "Vence en 7 días o menos", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] }],
        [{ text: "Pendiente", fontSize: 9, margin: [8, 5, 8, 5] }, { text: "Gris", fontSize: 9, margin: [8, 5, 8, 5] }, { text: "Sin vencer aún", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "Vencido", fontSize: 9, fillColor: "#fff1f2", margin: [8, 5, 8, 5] }, { text: "Rojo", fontSize: 9, color: "#dc2626", fillColor: "#fff1f2", margin: [8, 5, 8, 5] }, { text: "Fecha de vencimiento pasada", fontSize: 9, fillColor: "#fff1f2", margin: [8, 5, 8, 5] }],
      ],
    },
    layout: { hLineColor: () => BORDER, vLineColor: () => BORDER },
    margin: [0, 0, 0, 12],
  },

  subTitle("Cómo pagar"),
  feature("🏢", "En las oficinas", "El inquilino se presenta con su número de referencia de contrato y paga en efectivo o tarjeta."),
  feature("💬", "Por WhatsApp", "Escribe al número de la inmobiliaria indicando su referencia de contrato. Le informan los datos para transferencia."),
];

// ─── SECCIÓN 5: PORTAL PROPIETARIO ───────────────────────────────────────────

const portalPropietario = [
  ...sectionTitle("5. Portal del Propietario — Mi Propiedad"),
  { text: "Los propietarios tienen acceso a un panel donde pueden ver el estado de su/s propiedad/es.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  feature("🏠", "Estado de la propiedad", "Ve el estado actual: disponible, reservada, alquilada o vendida."),
  feature("👤", "Agente asignado", "Nombre del agente que gestiona su propiedad con botón de WhatsApp directo para consultas."),
  feature("📄", "Contrato activo", "Si hay un contrato activo, ve la referencia, el monto mensual y el inquilino."),
  feature("⭐", "Reseñas de agentes", "Puede dejar una puntuación (1 a 5 estrellas) y comentario sobre el agente que atendió su caso."),
  feature("💬", "Consultas", "Acceso directo a WhatsApp de la inmobiliaria para resolver dudas."),

  infoBox([
    "El propietario ve su propiedad solo cuando un agente se la asigna desde el panel administrativo.",
    "Si aún no tiene propiedades asignadas, puede publicar una desde el formulario de publicación.",
  ]),
];

// ─── SECCIÓN 6: PUBLICACIÓN ───────────────────────────────────────────────────

const publicacion = [
  ...sectionTitle("6. Publicación de propiedades"),
  { text: "Cualquier persona puede publicar una propiedad desde la página pública /publicar. Los agentes también pueden cargar propiedades directamente desde el panel admin.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  subTitle("Formulario público /publicar"),
  { text: "El formulario solicita:", fontSize: 10, color: DARK, margin: [0, 0, 0, 8] },
  {
    columns: [
      {
        ul: ["Título de la propiedad", "Tipo (casa, departamento, local, etc.)", "Operación (venta / alquiler)", "Precio y moneda (ARS / USD)", "Provincia, ciudad, barrio", "Dirección"],
        fontSize: 9,
        color: DARK,
        width: "50%",
      },
      {
        ul: ["Superficie total y cubierta", "Ambientes, dormitorios, baños", "Descripción detallada", "Fotos de la propiedad", "Datos de contacto del propietario"],
        fontSize: 9,
        color: DARK,
        width: "50%",
      },
    ],
    margin: [0, 0, 0, 12],
  },

  subTitle("Carga desde el panel admin"),
  { text: "Los agentes pueden cargar propiedades con campos adicionales:", fontSize: 10, color: DARK, margin: [0, 0, 0, 8] },
  feature("📸", "Gestión de fotos", "Subida de múltiples fotos, reordenamiento y selección de foto principal."),
  feature("✅", "Publicar / despublicar", "Control sobre si la propiedad aparece en el sitio público."),
  feature("🔗", "Asignar agente", "Cada propiedad puede tener un agente responsable asignado."),
  feature("👤", "Asignar propietario", "Vinculación con el perfil del propietario registrado en el sistema."),
];

// ─── SECCIÓN 7: CHAT ──────────────────────────────────────────────────────────

const chat = [
  ...sectionTitle("7. Chat de consultas en el encabezado"),
  { text: "En la barra de navegación hay un botón de chat/consultas entre el logo y el menú. Cambia de estado según si hay agentes disponibles:", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  {
    columns: [
      {
        stack: [
          { canvas: [{ type: "rect", x: 0, y: 0, w: 235, h: 100, r: 8, color: "#f0fdf4" }] },
          { text: "🟢  Con agentes online", fontSize: 11, bold: true, color: DARK, margin: [12, -90, 0, 6] },
          { ul: ["Punto verde pulsante en el botón", "Texto: \"Estamos disponibles\"", "Al abrir: lista de agentes con WhatsApp individual", "Botón general de contacto a la inmobiliaria"], fontSize: 9, color: DARK, margin: [20, 0, 0, 0] },
        ],
        width: 240,
      },
      { width: 20, text: "" },
      {
        stack: [
          { canvas: [{ type: "rect", x: 0, y: 0, w: 235, h: 100, r: 8, color: "#fffbeb" }] },
          { text: "🟡  Sin agentes online", fontSize: 11, bold: true, color: DARK, margin: [12, -90, 0, 6] },
          { ul: ["Punto amarillo en el botón", "Texto: \"💬 Consultas\"", "Al abrir: aviso de fuera de horario", "10 preguntas frecuentes desplegables", "Botón de WhatsApp para dejar mensaje"], fontSize: 9, color: DARK, margin: [20, 0, 0, 0] },
        ],
        width: 240,
      },
    ],
    margin: [0, 0, 0, 16],
  },

  subTitle("Preguntas frecuentes incluidas"),
  {
    ul: [
      "¿Cómo organizo una visita a una propiedad?",
      "¿Dónde están ubicadas las oficinas?",
      "¿Cuál es el horario de atención?",
      "¿Cuánto cobran de comisión?",
      "¿Qué documentación necesito para alquilar?",
      "¿Aceptan mascotas en los alquileres?",
      "¿Cuánto tiempo tarda el trámite de compraventa?",
      "¿Tienen propiedades en financiación?",
      "¿Cómo publico mi propiedad para vender o alquilar?",
      "¿Qué garantías aceptan para alquilar?",
    ],
    fontSize: 9,
    color: DARK,
    lineHeight: 1.6,
  },
];

// ─── SECCIÓN 8: PANEL ADMIN ───────────────────────────────────────────────────

const panelAdmin = [
  ...sectionTitle("8. Panel Administrativo — Dashboard"),
  { text: "El panel administrativo es accesible para agentes y la Coordinadora en /admin. Incluye un menú lateral con todas las secciones.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  subTitle("Estadísticas del Dashboard"),
  feature("🏠", "Total de propiedades", "Conteo total de propiedades cargadas en el sistema."),
  feature("✅", "Propiedades publicadas", "Cuántas están visibles en el sitio público."),
  feature("💰", "Alquileres activos", "Contratos de alquiler activos en este momento."),
  feature("📩", "Consultas pendientes", "Cantidad de consultas recibidas sin responder."),
  feature("⚠️", "Pagos pendientes", "Cuotas de alquiler que aún no fueron registradas como pagadas."),
  feature("💵", "Movimientos del mes", "Total de ingresos y egresos registrados en la caja del mes actual."),

  subTitle("Acceso rápido (NavCards)"),
  { text: "Desde el dashboard se puede navegar directamente a las secciones de Propiedades, Alquileres, Consultas, Caja y Usuarios.", fontSize: 10, color: DARK, margin: [0, 0, 0, 0] },
];

// ─── SECCIÓN 9: PROPIEDADES ADMIN ────────────────────────────────────────────

const propiedadesAdmin = [
  ...sectionTitle("9. Panel — Propiedades"),
  { text: "Gestión completa del inventario de propiedades.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  feature("➕", "Nueva propiedad", "Formulario completo para crear una propiedad con todos sus atributos."),
  feature("📋", "Listado con filtros", "Ver todas las propiedades con filtros por estado, tipo y operación."),
  feature("✏️", "Editar propiedad", "Modificar cualquier dato: precio, descripción, características, estado."),
  feature("📸", "Gestión de fotos", "Subir, reordenar y eliminar fotos. Seleccionar cuál es la foto principal."),
  feature("👁️", "Publicar / Despublicar", "Controlar si la propiedad aparece en el sitio público con un toggle."),

  subTitle("Campos de una propiedad"),
  {
    columns: [
      {
        ul: ["Título", "Tipo (casa / depto / local / campo / etc.)", "Operación (venta / alquiler)", "Estado (disponible / reservado / vendido / alquilado)", "Precio en ARS y/o USD", "Comisión"],
        fontSize: 9, color: DARK, width: "50%",
      },
      {
        ul: ["Provincia, ciudad, barrio, dirección", "Superficie total y cubierta (m²)", "Ambientes, dormitorios, baños, toilettes", "Cochera, pileta, quincho", "Piso y número de piso (para edificios)", "Descripción libre"],
        fontSize: 9, color: DARK, width: "50%",
      },
    ],
    margin: [0, 0, 0, 0],
  },
];

// ─── SECCIÓN 10: ALQUILERES ───────────────────────────────────────────────────

const alquileres = [
  ...sectionTitle("10. Panel — Alquileres y Contratos"),
  { text: "Gestión completa del ciclo de vida de los contratos de alquiler.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  subTitle("Ciclo de vida de un contrato"),
  stepRow(1, "El agente crea el contrato desde /admin/alquileres/nuevo asignando propiedad, inquilino, monto y fechas."),
  stepRow(2, "El contrato queda en estado \"Pendiente firma del inquilino\"."),
  stepRow(3, "El inquilino recibe acceso a /mi-alquiler y puede leer y firmar el contrato digitalmente."),
  stepRow(4, "El agente confirma la firma y activa el contrato."),
  stepRow(5, "Las cuotas se generan automáticamente mes a mes con fecha de vencimiento."),
  stepRow(6, "El agente registra cada pago indicando método (oficina / transferencia / online / otro)."),

  subTitle("Datos del contrato"),
  {
    columns: [
      { ul: ["Propiedad vinculada", "Inquilino (perfil registrado)", "Código de referencia único", "Monto de alquiler mensual (ARS)", "Expensas"], fontSize: 9, color: DARK, width: "50%" },
      { ul: ["Fecha de inicio y fin", "Día de vencimiento mensual", "Ajuste de precios (ICL / IPC / manual)", "Depósito de garantía", "Estado del contrato"], fontSize: 9, color: DARK, width: "50%" },
    ],
    margin: [0, 0, 0, 12],
  },

  subTitle("Estados de un contrato"),
  {
    table: {
      widths: [110, "*"],
      body: [
        [{ text: "pending_tenant", fontSize: 9, bold: true, fillColor: "#fef3c7", margin: [8, 5, 8, 5] }, { text: "Enviado al inquilino, esperando firma digital", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "pending_admin", fontSize: 9, bold: true, fillColor: "#dbeafe", margin: [8, 5, 8, 5] }, { text: "Firmado por el inquilino, pendiente de confirmación del agente", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "active", fontSize: 9, bold: true, fillColor: "#dcfce7", color: "#15803d", margin: [8, 5, 8, 5] }, { text: "Contrato activo y vigente", fontSize: 9, margin: [8, 5, 8, 5] }],
        [{ text: "terminated", fontSize: 9, bold: true, fillColor: "#f3f4f6", margin: [8, 5, 8, 5] }, { text: "Contrato finalizado", fontSize: 9, margin: [8, 5, 8, 5] }],
      ],
    },
    layout: { hLineColor: () => BORDER, vLineColor: () => BORDER },
    margin: [0, 0, 0, 0],
  },
];

// ─── SECCIÓN 11: CONSULTAS ────────────────────────────────────────────────────

const consultas = [
  ...sectionTitle("11. Panel — Consultas"),
  { text: "Gestión de todas las consultas recibidas desde el sitio público y de los reclamos de los inquilinos.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  feature("📩", "Consultas públicas", "Mensajes enviados desde las páginas de propiedades o el formulario general de contacto."),
  feature("🔧", "Reclamos de inquilinos", "Problemas de mantenimiento reportados desde el portal /mi-alquiler."),
  feature("👤", "Asignación de agentes", "Cada consulta puede ser asignada a un agente específico para su seguimiento."),
  feature("✅", "Marcar como leído / cerrar", "Control del estado de cada consulta para no perder seguimiento."),
  feature("💬", "Responder al inquilino", "El agente puede registrar la respuesta dada y notas internas."),

  subTitle("Categorías de reclamos"),
  {
    columns: [
      { ul: ["Plomería", "Electricidad", "Gas", "Humedad / filtraciones", "Pintura / paredes"], fontSize: 9, color: DARK, width: "50%" },
      { ul: ["Cerraduras / puertas", "Ventanas", "Pisos", "Electrodomésticos", "Otro"], fontSize: 9, color: DARK, width: "50%" },
    ],
  },
];

// ─── SECCIÓN 12: CAJA Y AUDITORÍA ────────────────────────────────────────────

const caja = [
  ...sectionTitle("12. Panel — Caja y Auditoría"),

  subTitle("Caja"),
  { text: "Registro de ingresos y egresos de la inmobiliaria.", fontSize: 10, color: DARK, margin: [0, 0, 0, 10] },
  feature("💵", "Nuevo movimiento", "Registrar un ingreso o egreso con monto, concepto, fecha y categoría."),
  feature("📊", "Resumen mensual", "Total de ingresos y egresos del mes actual visible en el dashboard."),
  feature("🗑️", "Eliminar movimiento", "Borrar registros incorrectos."),

  subTitle("Auditoría"),
  { text: "Registro automático de todas las acciones realizadas en el sistema.", fontSize: 10, color: DARK, margin: [0, 0, 0, 10] },
  feature("📋", "Log de acciones", "Quién hizo qué y cuándo: creación de propiedades, cambios de estado, registros de pagos, etc."),
  feature("🔍", "Trazabilidad completa", "Útil para resolver disputas o revisar el historial de cambios."),
];

// ─── SECCIÓN 13: USUARIOS ─────────────────────────────────────────────────────

const usuarios = [
  ...sectionTitle("13. Panel — Usuarios"),
  { text: "Gestión de todos los perfiles registrados en el sistema.", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  feature("👥", "Lista de usuarios", "Ver todos los usuarios registrados con su rol, email y fecha de alta."),
  feature("✏️", "Editar perfil", "Modificar datos de cualquier usuario: nombre, rol, teléfono, etc."),
  feature("🔑", "Cambiar rol", "Asignar o cambiar el rol de un usuario (inquilino, propietario, agente, coordinadora)."),
  feature("📋", "Ver datos de inquilino", "Para inquilinos registrados, el agente puede ver la ficha completa con DNI, trabajo, garante, etc."),

  infoBox([
    { text: "Nota:", fontSize: 9, bold: true, color: DARK },
    { text: "La creación de cuentas de agentes solo la puede hacer la Coordinadora o el Super Admin directamente desde el panel de Usuarios, asignando el rol correspondiente.", fontSize: 9, color: DARK },
  ], "#fff7ed"),
];

// ─── SECCIÓN 14: ROLES ────────────────────────────────────────────────────────

const roles = [
  ...sectionTitle("14. Roles y permisos"),
  { text: "El sistema tiene 5 roles con distintos niveles de acceso:", fontSize: 10, color: DARK, margin: [0, 0, 0, 12] },

  {
    table: {
      widths: [100, 100, "*"],
      body: [
        [
          { text: "Rol en sistema", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 6, 8, 6] },
          { text: "Se muestra como", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 6, 8, 6] },
          { text: "Acceso y permisos", bold: true, fontSize: 9, fillColor: DARK, color: WHITE, margin: [8, 6, 8, 6] },
        ],
        [
          { text: "super_admin", fontSize: 9, bold: true, color: BRONZE, margin: [8, 5, 8, 5] },
          { text: "Coordinadora", fontSize: 9, margin: [8, 5, 8, 5] },
          { text: "Acceso total. Ve todo el panel admin, puede gestionar usuarios, roles, caja, auditoría y todas las secciones.", fontSize: 9, margin: [8, 5, 8, 5] },
        ],
        [
          { text: "admin / agent", fontSize: 9, bold: true, fillColor: LGRAY, color: DARK, margin: [8, 5, 8, 5] },
          { text: "Agente", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] },
          { text: "Panel admin completo (propiedades, alquileres, consultas). No puede cambiar roles ni ver auditoría completa.", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] },
        ],
        [
          { text: "owner", fontSize: 9, bold: true, color: "#1d4ed8", margin: [8, 5, 8, 5] },
          { text: "Propietario", fontSize: 9, margin: [8, 5, 8, 5] },
          { text: "Portal /mi-propiedad: ve sus propiedades, el agente asignado, contratos y puede dejar reseñas.", fontSize: 9, margin: [8, 5, 8, 5] },
        ],
        [
          { text: "tenant", fontSize: 9, bold: true, color: "#15803d", fillColor: LGRAY, margin: [8, 5, 8, 5] },
          { text: "Inquilino", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] },
          { text: "Portal /mi-alquiler: ve su contrato, cuotas, puede firmarlo digitalmente y abrir reclamos.", fontSize: 9, fillColor: LGRAY, margin: [8, 5, 8, 5] },
        ],
      ],
    },
    layout: { hLineColor: () => BORDER, vLineColor: () => BORDER },
    margin: [0, 0, 0, 16],
  },

  // Cierre
  {
    canvas: [{ type: "rect", x: 0, y: 0, w: 515, h: 80, r: 8, color: DARK }],
    margin: [0, 20, 0, 0],
  },
  {
    text: "Pino Galant · Plataforma inmobiliaria completa",
    fontSize: 13,
    bold: true,
    color: WHITE,
    alignment: "center",
    margin: [0, -58, 0, 4],
  },
  {
    text: "pinogalant.vercel.app",
    fontSize: 10,
    color: BRONZE,
    alignment: "center",
    margin: [0, 0, 0, 4],
  },
  {
    text: "Desarrollado con Next.js 14 + Supabase · Mayo 2026",
    fontSize: 8,
    color: "#aaaaaa",
    alignment: "center",
  },
];

// ─── DOCUMENTO COMPLETO ───────────────────────────────────────────────────────

const docDefinition = {
  pageSize: "A4",
  pageMargins: [40, 50, 40, 50],
  defaultStyle: { font: "Helvetica", fontSize: 10, color: DARK, lineHeight: 1.4 },

  // Header en cada página (excepto portada)
  header: (currentPage) => {
    if (currentPage === 1) return {};
    return {
      columns: [
        { text: "PG  Pino Galant — Guía de plataforma", fontSize: 8, color: GRAY, margin: [40, 16, 0, 0] },
        { text: `Pág. ${currentPage}`, fontSize: 8, color: GRAY, alignment: "right", margin: [0, 16, 40, 0] },
      ],
    };
  },

  // Footer
  footer: (currentPage, pageCount) => {
    if (currentPage === 1) return {};
    return {
      canvas: [{ type: "line", x1: 40, y1: 8, x2: 555, y2: 8, lineWidth: 0.3, lineColor: BORDER }],
    };
  },

  content: [
    // Portada
    ...cover,
    { text: "", pageBreak: "after" },

    // Índice
    ...indice,
    { text: "", pageBreak: "after" },

    // Secciones
    ...acceso,     { text: "", pageBreak: "after" },
    ...registro,   { text: "", pageBreak: "after" },
    ...login,
    ...portalInquilino, { text: "", pageBreak: "after" },
    ...portalPropietario,
    ...publicacion, { text: "", pageBreak: "after" },
    ...chat,        { text: "", pageBreak: "after" },
    ...panelAdmin,
    ...propiedadesAdmin, { text: "", pageBreak: "after" },
    ...alquileres,  { text: "", pageBreak: "after" },
    ...consultas,
    ...caja,        { text: "", pageBreak: "after" },
    ...usuarios,    { text: "", pageBreak: "after" },
    ...roles,
  ],
};

// ─── GENERAR ──────────────────────────────────────────────────────────────────

const printer = new PdfPrinter(fonts);
const pdfDoc  = printer.createPdfKitDocument(docDefinition);

const outputPath = path.join(__dirname, "..", "guia-pino-galant.pdf");
pdfDoc.pipe(fs.createWriteStream(outputPath));
pdfDoc.end();

console.log(`✅ PDF generado: ${outputPath}`);
