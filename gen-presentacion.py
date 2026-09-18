"""
Genera presentacion-pinogalant-nueva.pdf con todas las nuevas funcionalidades.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

W, H = A4

# Paleta Pino Galant
DARK   = HexColor("#2D3134")
GOLD   = HexColor("#B48A73")
WHITE  = HexColor("#FFFFFF")
LIGHT  = HexColor("#F7F4F1")
GRAY   = HexColor("#888888")
LGRAY  = HexColor("#EEEBE8")
GREEN  = HexColor("#4CAF50")

def draw_bg(c, dark=False):
    c.setFillColor(DARK if dark else LIGHT)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def gold_bar(c, y, h=3):
    c.setFillColor(GOLD)
    c.rect(0, y, W, h, fill=1, stroke=0)

def centered_text(c, text, y, size=12, color=DARK, bold=False):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawCentredString(W/2, y, text)

def left_text(c, text, x, y, size=11, color=DARK, bold=False):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, text)

def badge(c, x, y, w, h, text, bg=GOLD, fg=WHITE, size=9):
    c.setFillColor(bg)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=0)
    c.setFillColor(fg)
    c.setFont("Helvetica-Bold", size)
    c.drawCentredString(x + w/2, y + h/2 - 3, text)

def feature_card(c, x, y, w, h, icon, title, desc_lines, new=True):
    # Card shadow
    c.setFillColor(HexColor("#D0C8C0"))
    c.roundRect(x+2, y-2, w, h, 8, fill=1, stroke=0)
    # Card bg
    c.setFillColor(WHITE)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    # Top accent
    c.setFillColor(GOLD)
    c.roundRect(x, y+h-6, w, 6, 4, fill=1, stroke=0)
    c.rect(x, y+h-6, w, 3, fill=1, stroke=0)

    if new:
        badge(c, x+w-46, y+h-20, 42, 16, "NUEVO", bg=GOLD)

    # Icon circle
    c.setFillColor(LIGHT)
    c.circle(x+32, y+h-40, 20, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(x+32, y+h-47, icon)

    # Title
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x+60, y+h-36, title)

    # Separator
    c.setFillColor(LGRAY)
    c.rect(x+12, y+h-56, w-24, 1, fill=1, stroke=0)

    # Desc lines
    c.setFont("Helvetica", 8.5)
    c.setFillColor(HexColor("#555555"))
    for i, line in enumerate(desc_lines):
        c.drawString(x+14, y+h-70-(i*13), line)

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 1 — PORTADA
# ─────────────────────────────────────────────────────────────────────────────
def page_cover(c):
    draw_bg(c, dark=True)

    # Fondo decorativo - círculos
    c.setFillColor(HexColor("#3A3F44"))
    c.circle(W-80, H-80, 120, fill=1, stroke=0)
    c.circle(80, 80, 80, fill=1, stroke=0)
    c.setFillColor(HexColor("#333840"))
    c.circle(W/2, H/2+40, 200, fill=1, stroke=0)

    # Barra dorada top
    c.setFillColor(GOLD)
    c.rect(0, H-6, W, 6, fill=1, stroke=0)

    # Logo placeholder (círculo dorado con iniciales)
    cx, cy = W/2, H-160
    c.setFillColor(GOLD)
    c.circle(cx, cy, 55, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(cx, cy-10, "PG")

    # Titulo principal
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(W/2, H-260, "PINO GALANT")
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 13)
    c.drawCentredString(W/2, H-282, "Negocios Inmobiliarios")

    # Linea decorativa
    c.setFillColor(GOLD)
    c.rect(W/2-60, H-298, 120, 1.5, fill=1, stroke=0)

    # Subtitulo
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W/2, H-330, "Nuevas Funcionalidades")
    c.setFont("Helvetica", 13)
    c.setFillColor(HexColor("#AAAAAA"))
    c.drawCentredString(W/2, H-352, "Presentacion de mejoras para el sitio web")
    c.drawCentredString(W/2, H-368, "pinogalant.com.ar")

    # Caja resumen
    c.setFillColor(HexColor("#383D42"))
    c.roundRect(W/2-165, H/2-60, 330, 110, 10, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(W/2-165, H/2+44, 330, 3, fill=1, stroke=0)

    features_count = [
        ("9", "Funcionalidades nuevas"),
        ("IA", "Busqueda inteligente"),
        ("PWA", "App instalable"),
    ]
    col_w = 330/3
    for i, (num, label) in enumerate(features_count):
        cx2 = W/2 - 165 + col_w*i + col_w/2
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(cx2, H/2+12, num)
        c.setFillColor(HexColor("#CCCCCC"))
        c.setFont("Helvetica", 8)
        c.drawCentredString(cx2, H/2-5, label)
        if i < 2:
            c.setFillColor(HexColor("#555555"))
            c.rect(W/2-165+col_w*(i+1)-0.5, H/2-30, 1, 70, fill=1, stroke=0)

    # Intro text
    c.setFillColor(HexColor("#BBBBBB"))
    c.setFont("Helvetica", 9.5)
    intro = [
        "Este documento detalla todas las mejoras implementadas en el sitio web",
        "de Pino Galant, pensadas para brindar una experiencia superior a los",
        "visitantes y optimizar la captacion de clientes potenciales.",
    ]
    for i, line in enumerate(intro):
        c.drawCentredString(W/2, H/2-100-(i*14), line)

    # Footer
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    c.setFillColor(HexColor("#777777"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(W/2, 12, "pinogalant.com.ar  |  Junio 2026")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 2 — BUSQUEDA IA
# ─────────────────────────────────────────────────────────────────────────────
def page_ia(c):
    draw_bg(c)

    # Header
    c.setFillColor(DARK)
    c.rect(0, H-80, W, 80, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-83, W, 3, fill=1, stroke=0)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, H-25, "01")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(30, H-50, "Busqueda de tus Suenos")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 10)
    c.drawString(30, H-68, "Inteligencia Artificial para encontrar la propiedad ideal")

    # Badge IA
    badge(c, W-100, H-58, 70, 22, "IA ACTIVA", bg=GREEN)

    # Descripcion principal
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(30, H-110, "Como funciona?")

    # Caja explicacion
    c.setFillColor(WHITE)
    c.roundRect(25, H-220, W-50, 100, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(25, H-220, 4, 100, fill=1, stroke=0)

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(42, H-135, "El cliente escribe como habla:")
    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica", 10)
    examples = [
        '"Quiero una casa en Santa Rosa con jardin para mis hijos, hasta 80 mil dolares"',
        '"Busco departamento para alquilar, 2 ambientes, cerca del centro"',
        '"Necesito un campo de al menos 100 hectareas en La Pampa"',
    ]
    for i, ex in enumerate(examples):
        c.setFillColor(HexColor("#666666"))
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(42, H-155-(i*17), ex)

    # Flecha proceso
    cy = H-250
    steps = [
        ("1", "Cliente escribe", "en lenguaje natural"),
        ("2", "IA analiza", "con Groq / Llama 3.1"),
        ("3", "Filtra automatico", "tipo, precio, zona"),
        ("4", "Muestra resultados", "propiedades exactas"),
    ]
    step_w = (W-60) / 4
    for i, (num, t1, t2) in enumerate(steps):
        sx = 30 + step_w*i
        # Circulo
        c.setFillColor(GOLD)
        c.circle(sx + step_w/2, cy, 22, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(sx + step_w/2, cy-5, num)
        # Textos
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(sx + step_w/2, cy-36, t1)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8)
        c.drawCentredString(sx + step_w/2, cy-48, t2)
        # Flecha
        if i < 3:
            c.setFillColor(GOLD)
            c.rect(sx + step_w - 6, cy-2, 12, 4, fill=1, stroke=0)

    # Video popup
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-330, "Experiencia del usuario")

    # Mock popup
    popup_y = H-500
    c.setFillColor(HexColor("#1A1C1E"))
    c.roundRect(30, popup_y, W-60, 155, 10, fill=1, stroke=0)
    # Video area
    c.setFillColor(HexColor("#2D3134"))
    c.roundRect(40, popup_y+50, W-80, 95, 6, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.circle((W)/2, popup_y+97, 18, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(W/2+2, popup_y+92, u"▶")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(W/2, popup_y+60, "Video de presentacion con sonido")
    # Boton
    c.setFillColor(GOLD)
    c.roundRect(W/2-60, popup_y+10, 120, 28, 6, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(W/2, popup_y+21, u"✨ A tu medida")
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W/2, popup_y+153, "Popup: Busqueda de tus suenos  |  Boton en la pagina de inicio")

    # Texto area busqueda
    c.setFillColor(WHITE)
    c.roundRect(30, H-580, W-60, 60, 8, fill=1, stroke=0)
    c.setFillColor(HexColor("#DDDDDD"))
    c.rect(30, H-580, W-60, 1, fill=1, stroke=0)
    c.setFillColor(HexColor("#999999"))
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(44, H-555, '"Describime la propiedad que buscas..."')
    c.setFillColor(GOLD)
    c.roundRect(W-90, H-574, 50, 22, 6, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(W-65, H-566, "Buscar")

    # Beneficios
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-610, "Beneficios clave")

    benefits = [
        (u"✔", "Sin formularios complicados: el cliente habla naturalmente"),
        (u"✔", "Respuestas en menos de 2 segundos"),
        (u"✔", "Detecta tipo de propiedad, precio y zona automaticamente"),
        (u"✔", "Tecnologia IA gratuita (Groq + Llama 3.1)"),
    ]
    for i, (icon, text) in enumerate(benefits):
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(30, H-630-(i*16), icon)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 9.5)
        c.drawString(48, H-630-(i*16), text)

    # Footer
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 3, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W/2, 10, "pinogalant.com.ar  |  Busqueda IA")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 3 — BUSCADOR HERO DINAMICO + MAPA
# ─────────────────────────────────────────────────────────────────────────────
def page_search_map(c):
    draw_bg(c)

    # Header
    c.setFillColor(DARK)
    c.rect(0, H-80, W, 80, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-83, W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, H-25, "02  /  03")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(30, H-50, "Buscador Dinamico  +  Mapa Interactivo")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 10)
    c.drawString(30, H-68, "Filtros reales segun propiedades disponibles  |  Mapa con iconos y fotos")

    # ── BUSCADOR HERO ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-108, "Buscador Inteligente en el Hero")

    # Mock hero
    c.setFillColor(HexColor("#1A1C1E"))
    c.roundRect(25, H-220, W-50, 100, 8, fill=1, stroke=0)

    # Selects row 1
    sel_y1 = H-155
    sel_y2 = H-190
    sel_w = (W-70) / 2 - 4
    selects = [
        (30, sel_y1, "Tipo de propiedad"),
        (30+sel_w+8, sel_y1, "Venta o Alquiler"),
        (30, sel_y2, "Provincia"),
        (30+sel_w+8, sel_y2, "Localidad"),
    ]
    for sx, sy, label in selects:
        c.setFillColor(WHITE)
        c.roundRect(sx, sy, sel_w, 24, 4, fill=1, stroke=0)
        c.setFillColor(HexColor("#888888"))
        c.setFont("Helvetica", 8.5)
        c.drawString(sx+8, sy+8, label)

    # Boton buscar
    c.setFillColor(GOLD)
    c.roundRect(W-90, sel_y2, 55, 24, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(W-62, sel_y2+9, "Buscar")

    # Explicacion dinamico
    benefits = [
        u"• Los tipos de propiedad se cargan desde las propiedades reales (Casa, Depto, Campo...)",
        u"• Las provincias y localidades se generan automaticamente",
        u"• Seleccionar Provincia filtra las localidades disponibles",
        u"• Siempre actualizado: si se agrega una propiedad nueva, aparece en el filtro",
    ]
    c.setFillColor(HexColor("#333333"))
    c.setFont("Helvetica", 9)
    for i, b in enumerate(benefits):
        c.drawString(30, H-240-(i*14), b)

    # ── MAPA INTERACTIVO ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-330, "Mapa Interactivo con Propiedades")

    # Mock mapa
    c.setFillColor(HexColor("#E8F4E8"))
    c.roundRect(25, H-500, W-50, 155, 8, fill=1, stroke=0)
    # Grid calles
    c.setStrokeColor(HexColor("#C8DCC8"))
    c.setLineWidth(0.5)
    for i in range(6):
        y = H-500 + 25*i + 10
        c.line(25, y, W-25, y)
    for i in range(10):
        x = 25 + (W-50)/10 * i
        c.line(x, H-500, x, H-345)

    # Pins propiedades
    pins = [
        (W/2-60, H-420, "$65.000", "Casa"),
        (W/2+30, H-390, "$42.000", "Depto"),
        (W/2-20, H-460, "$280.000", "Campo"),
        (W/2+80, H-430, "$850/mes", "Alquiler"),
    ]
    for px, py, price, ptype in pins:
        # Pin marker
        c.setFillColor(GOLD)
        c.circle(px, py, 10, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(px, py-2.5, "$")
        # Label
        c.setFillColor(WHITE)
        c.roundRect(px-20, py+12, 40, 14, 3, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(px, py+16, price)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 5.5)
        c.drawCentredString(px, py+10, ptype)

    # Popup propiedad
    c.setFillColor(WHITE)
    c.roundRect(W-185, H-488, 150, 120, 6, fill=1, stroke=0)
    c.setFillColor(HexColor("#DDDDDD"))
    c.roundRect(W-183, H-456, 146, 86, 4, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(W-181, H-474, "FOTO DE LA PROPIEDAD")
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(W-181, H-394, "Casa - Santa Rosa")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(W-181, H-408, "USD 65.000")
    c.setFillColor(HexColor("#666666"))
    c.setFont("Helvetica", 6.5)
    c.drawString(W-181, H-422, "3 amb | 2 banos | 120 m2")
    c.setFillColor(WHITE)
    c.roundRect(W-181, H-490, 70, 16, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.roundRect(W-181, H-490, 70, 16, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(W-146, H-485, "Ver propiedad")

    # Features mapa
    map_features = [
        (u"•", "Icono dorado personalizado por tipo (casa, campo, depto...)"),
        (u"•", "Click en el marcador muestra foto, precio y datos"),
        (u"•", "Zoom y navegacion tactil"),
        (u"•", "Actualizado automaticamente con nuevas propiedades"),
    ]
    c.setFillColor(DARK)
    c.setFont("Helvetica", 9)
    for i, (icon, text) in enumerate(map_features):
        c.setFillColor(GOLD)
        c.drawString(30, H-518-(i*14), icon)
        c.setFillColor(HexColor("#333333"))
        c.drawString(44, H-518-(i*14), text)

    # Footer
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 3, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W/2, 10, "pinogalant.com.ar  |  Buscador y Mapa")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 4 — OFICINAS + COMPARTIR
# ─────────────────────────────────────────────────────────────────────────────
def page_oficinas_share(c):
    draw_bg(c)

    # Header
    c.setFillColor(DARK)
    c.rect(0, H-80, W, 80, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-83, W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, H-25, "04  /  05")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(30, H-50, "Oficinas Comerciales  +  Compartir Propiedad")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 10)
    c.drawString(30, H-68, "Ubicacion con mapa y navegacion  |  Viralizar propiedades en redes sociales")

    # ── OFICINAS ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-108, "Modal Oficinas Comerciales")

    # Descripcion
    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica", 9.5)
    c.drawString(30, H-126, "Un boton en la seccion 'Quienes somos' abre un popup con la ubicacion de la oficina:")

    # Mock modal
    c.setFillColor(HexColor("#00000033"))
    c.rect(0, H-370, W, 240, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.roundRect(50, H-365, W-100, 230, 10, fill=1, stroke=0)

    # Header modal
    c.setFillColor(DARK)
    c.roundRect(50, H-145, W-100, 10, 5, fill=1, stroke=0)
    c.rect(50, H-150, W-100, 10, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.roundRect(50, H-152, W-100, 12, 5, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(62, H-148, u"\U0001F4CD  Nuestras Oficinas")

    # Mapa mock
    c.setFillColor(HexColor("#E0EEE0"))
    c.roundRect(60, H-260, W/2-70, 100, 4, fill=1, stroke=0)
    c.setFillColor(HexColor("#C0D8C0"))
    c.setFont("Helvetica", 7)
    c.drawCentredString(W/4+10, H-208, "OpenStreetMap")
    c.setFillColor(GOLD)
    c.circle(W/4+10, H-220, 8, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(W/4+10, H-223, u"★")

    # Datos oficina
    ox = W/2 + 10
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(ox, H-168, u"\U0001F3E2  Direccion:")
    c.setFillColor(HexColor("#333333"))
    c.setFont("Helvetica", 8.5)
    c.drawString(ox, H-180, 'General Pico 364 1 "A"')
    c.drawString(ox, H-192, "Santa Rosa, La Pampa")

    # Botones
    c.setFillColor(HexColor("#25D366"))
    c.roundRect(ox, H-228, 65, 20, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(ox+32, H-221, u"→ Como llegar")

    c.setFillColor(GOLD)
    c.roundRect(ox+72, H-228, 65, 20, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.drawCentredString(ox+104, H-221, u"\U0001F697 Iniciar viaje")

    c.setFillColor(DARK)
    c.roundRect(ox, H-254, 138, 20, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.drawCentredString(ox+69, H-247, "Ver en Google Maps")

    # Nota
    c.setFillColor(GOLD)
    c.roundRect(50, H-290, W-100, 22, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(W/2, H-282, u"Sin costo de API  •  Usa OpenStreetMap (gratuito)  •  Los botones abren Google Maps en el celular")

    # ── COMPARTIR ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-400, "Boton Compartir en cada Propiedad")

    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica", 9.5)
    c.drawString(30, H-418, "Cada tarjeta de propiedad tiene un boton para compartir en redes sociales:")

    # Tarjeta propiedad mock
    c.setFillColor(WHITE)
    c.roundRect(25, H-580, W/2-35, 145, 8, fill=1, stroke=0)
    c.setFillColor(LGRAY)
    c.roundRect(33, H-520, W/2-51, 65, 4, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(36, H-538, "Casa en Santa Rosa")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(36, H-552, "USD 65.000")
    c.setFillColor(HexColor("#666666"))
    c.setFont("Helvetica", 8)
    c.drawString(36, H-566, "3 amb | 2 banos | 120 m2")
    # Botones accion
    c.setFillColor(HexColor("#25D366"))
    c.roundRect(33, H-580, 55, 18, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(60, H-574, "Consultar")
    c.setFillColor(HexColor("#EEEEEE"))
    c.roundRect(96, H-580, 40, 18, 4, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(116, H-574, u"↗ Comp.")

    # Popup compartir
    share_x = W/2 - 20
    c.setFillColor(WHITE)
    c.roundRect(share_x, H-565, 130, 130, 8, fill=1, stroke=0)
    c.setStrokeColor(LGRAY)
    c.setLineWidth(0.5)
    c.roundRect(share_x, H-565, 130, 130, 8, fill=0, stroke=1)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(share_x+65, H-450, "Compartir propiedad")

    share_opts = [
        (HexColor("#25D366"), "WhatsApp"),
        (HexColor("#1877F2"), "Facebook"),
        (HexColor("#000000"), "X / Twitter"),
        (HexColor("#E1306C"), "Instagram"),
        (GRAY,               "Copiar link"),
    ]
    for i, (col, label) in enumerate(share_opts):
        sy = H-470-(i*18)
        c.setFillColor(col)
        c.circle(share_x+18, sy+5, 7, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 8.5)
        c.drawString(share_x+30, sy+1, label)

    # Footer
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 3, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W/2, 10, "pinogalant.com.ar  |  Oficinas y Compartir")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 5 — BARRIO + CALC HIPOTECARIA + SIMILARES
# ─────────────────────────────────────────────────────────────────────────────
def page_barrio_calc(c):
    draw_bg(c)

    # Header
    c.setFillColor(DARK)
    c.rect(0, H-80, W, 80, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-83, W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, H-25, "06  /  07  /  08")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(30, H-50, "Barrio + Calculadora + Propiedades Similares")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 10)
    c.drawString(30, H-68, "Todo en la pagina de cada propiedad")

    # ── BARRIO ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-108, "Informacion del Barrio y Alrededores")

    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica", 9)
    c.drawString(30, H-124, "Cada propiedad muestra que hay cerca:")

    barrio_items = [
        (u"\U0001F3EB", "Escuelas"),
        (u"\U0001F3E5", "Hospitales"),
        (u"\U0001F6D2", "Comercios"),
        (u"\U0001F68C", "Transporte"),
        (u"\U0001F333", "Plazas"),
        (u"\U0001F3CB", "Gimnasios"),
    ]
    items_y = H-135
    for i, (icon, label) in enumerate(barrio_items):
        ix = 30 + (i % 3) * 90
        iy = items_y - (i // 3) * 40
        c.setFillColor(LIGHT)
        c.roundRect(ix-2, iy-26, 80, 32, 6, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.rect(ix-2, iy+3, 80, 3, fill=1, stroke=0)
        c.setFont("Helvetica", 14)
        c.setFillColor(DARK)
        c.drawCentredString(ix+38, iy-8, icon)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(ix+38, iy-20, label)

    # Separador
    c.setFillColor(LGRAY)
    c.rect(25, H-230, W-50, 1, fill=1, stroke=0)

    # ── CALCULADORA ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, H-250, "Calculadora Hipotecaria")

    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica", 9)
    c.drawString(30, H-266, "El cliente puede simular su credito directamente en la propiedad:")

    # Mock calculadora
    c.setFillColor(WHITE)
    c.roundRect(25, H-390, W/2-35, 110, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(25, H-280, W/2-35, 3, fill=1, stroke=0)

    campos = [
        ("Precio de la propiedad", "USD 65.000"),
        ("Porcentaje de entrada (%)", "30"),
        ("Plazo (meses)", "120"),
        ("Tasa de interes anual (%)", "8.5"),
    ]
    for i, (label, val) in enumerate(campos):
        cy2 = H-298-(i*20)
        c.setFillColor(HexColor("#666666"))
        c.setFont("Helvetica", 7.5)
        c.drawString(36, cy2, label)
        c.setFillColor(LGRAY)
        c.roundRect(36, cy2-14, W/2-66, 13, 3, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(42, cy2-8, val)

    # Resultado
    c.setFillColor(DARK)
    c.roundRect(36, H-388, W/2-66, 22, 4, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(W/4+5, H-378, "Cuota estimada: USD 521 / mes")

    # ── PROPIEDADES SIMILARES ──
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(W/2+5, H-250, "Propiedades Similares")

    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica", 9)
    c.drawString(W/2+5, H-266, "Al ver una propiedad, se sugieren similares:")

    # Cards similares (2 mini)
    for j in range(2):
        cx3 = W/2+5 + j*(W/4+5)
        c.setFillColor(WHITE)
        c.roundRect(cx3, H-390, W/4, 110, 6, fill=1, stroke=0)
        c.setFillColor(LGRAY)
        c.roundRect(cx3+5, H-350, W/4-10, 62, 3, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(cx3+7, H-360, "Casa en Santa Rosa" if j==0 else "Depto en Gral. Pico")
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(cx3+7, H-374, "USD 58.000" if j==0 else "USD 35.000")
        c.setFillColor(HexColor("#666666"))
        c.setFont("Helvetica", 7)
        c.drawString(cx3+7, H-386, "3 amb | 110 m2" if j==0 else "2 amb | 60 m2")
        # Boton
        c.setFillColor(DARK)
        c.roundRect(cx3+5, H-393, W/4-10, 14, 3, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(cx3+W/8-5, H-388, "Ver propiedad")

    # Beneficios combinados
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, H-415, "Por que estas funciones aumentan las consultas?")

    reasons = [
        (u"✔", "El cliente tiene toda la informacion que necesita en un solo lugar"),
        (u"✔", "La calculadora reduce el miedo a no poder acceder a la propiedad"),
        (u"✔", "Ver lo que hay cerca aumenta la confianza en la ubicacion"),
        (u"✔", "Las propiedades similares mantienen al cliente navegando mas tiempo"),
    ]
    for i, (icon, text) in enumerate(reasons):
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(30, H-435-(i*16), icon)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 9)
        c.drawString(46, H-435-(i*16), text)

    # Footer
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 3, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W/2, 10, "pinogalant.com.ar  |  Barrio + Calculadora + Similares")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 6 — APP MOVIL + QR
# ─────────────────────────────────────────────────────────────────────────────
def page_app(c):
    draw_bg(c, dark=True)

    # Fondo decorativo
    c.setFillColor(HexColor("#383D42"))
    c.circle(W-60, H-60, 100, fill=1, stroke=0)
    c.circle(60, 60, 70, fill=1, stroke=0)

    # Header
    c.setFillColor(GOLD)
    c.rect(0, H-83, W, 83, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, H-25, "09")
    c.setFont("Helvetica-Bold", 22)
    c.drawString(30, H-55, "App Instalable en el Celular")
    c.setFont("Helvetica", 11)
    c.drawString(30, H-73, "Progressive Web App (PWA)  |  Sin App Store  |  Gratis")

    # Explicacion PWA
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(W/2, H-120, "Que es una PWA?")
    c.setFillColor(HexColor("#CCCCCC"))
    c.setFont("Helvetica", 10)
    desc = [
        "Una PWA (Progressive Web App) es un sitio web que se puede instalar",
        "en el celular como si fuera una app nativa. No necesita Google Play",
        "ni App Store. El cliente la instala directamente desde el navegador.",
    ]
    for i, line in enumerate(desc):
        c.drawCentredString(W/2, H-140-(i*15), line)

    # Comparacion
    col1x = 30
    col2x = W/2 + 10
    coly = H-205

    c.setFillColor(HexColor("#2D3134"))
    c.roundRect(col1x, coly-100, W/2-40, 110, 8, fill=1, stroke=0)
    c.setFillColor(HexColor("#8B0000"))
    c.roundRect(col1x, coly+2, W/2-40, 12, 4, fill=1, stroke=0)
    c.rect(col1x, coly+2, W/2-40, 6, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(col1x+(W/2-40)/2, coly+5, "App tradicional")

    trad = ["Requiere Google Play / App Store", "Proceso de aprobacion (semanas)", "Ocupa mucho espacio", "Necesita actualizaciones manuales", "Costosa de desarrollar"]
    for i, t in enumerate(trad):
        c.setFillColor(HexColor("#FF6B6B"))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(col1x+10, coly-18-(i*16), "x")
        c.setFillColor(HexColor("#CCCCCC"))
        c.setFont("Helvetica", 8.5)
        c.drawString(col1x+22, coly-18-(i*16), t)

    c.setFillColor(HexColor("#2D3134"))
    c.roundRect(col2x, coly-100, W/2-40, 110, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.roundRect(col2x, coly+2, W/2-40, 12, 4, fill=1, stroke=0)
    c.rect(col2x, coly+2, W/2-40, 6, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(col2x+(W/2-40)/2, coly+5, "PWA Pino Galant")

    pwa = ["Instala directamente desde el sitio web", "Disponible al instante", "Liviana, casi no ocupa espacio", "Siempre actualizada automaticamente", "Incluida en el sitio (sin costo extra)"]
    for i, t in enumerate(pwa):
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(col2x+10, coly-18-(i*16), u"✔")
        c.setFillColor(HexColor("#CCCCCC"))
        c.setFont("Helvetica", 8.5)
        c.drawString(col2x+22, coly-18-(i*16), t)

    # QR Section
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(W/2, H-338, "Codigo QR para instalar la app")

    # QR placeholder
    c.setFillColor(WHITE)
    c.roundRect(W/2-55, H-430, 110, 90, 6, fill=1, stroke=0)
    # QR pattern simulado
    qr_x = W/2 - 45
    qr_y = H-425
    c.setFillColor(DARK)
    block = 7
    pattern = [
        [1,1,1,1,1,1,1,0,0,0,1,0,1],
        [1,0,0,0,0,0,1,0,1,1,0,1,1],
        [1,0,1,1,1,0,1,0,0,1,1,0,1],
        [1,0,1,1,1,0,1,0,1,0,0,1,0],
        [1,0,1,1,1,0,1,0,0,1,1,0,1],
        [1,0,0,0,0,0,1,0,1,1,0,0,1],
        [1,1,1,1,1,1,1,0,1,0,1,0,1],
        [0,0,0,0,0,0,0,0,0,1,1,1,0],
        [1,0,1,1,0,0,1,1,0,0,1,0,1],
        [0,1,0,1,1,0,0,0,1,1,0,1,0],
        [1,1,1,1,1,1,1,0,1,0,1,1,1],
        [1,0,0,0,0,0,1,0,0,1,0,0,1],
        [1,1,1,1,1,1,1,1,1,0,1,1,0],
    ]
    for row_i, row in enumerate(pattern):
        for col_i, val in enumerate(row):
            if val:
                c.rect(qr_x + col_i*block, qr_y + (12-row_i)*block, block-1, block-1, fill=1, stroke=0)

    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(W/2, H-438, "pinogalant.com.ar/app")

    # Instrucciones
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(W/2+65, H-360, "Como instalar:")

    steps = [
        (u"\U0001F4F1", "Android", "Abre Chrome, menu > Agregar a inicio"),
        (u"\U0001F34E", "iPhone", "Abre Safari, boton Compartir > Agregar"),
        (u"\U0001F4F2", "O escanea", "el QR con la camara del celular"),
    ]
    for i, (icon, t1, t2) in enumerate(steps):
        sy = H-385-(i*38)
        c.setFillColor(HexColor("#383D42"))
        c.roundRect(W/2+60, sy-24, W/2-80, 32, 6, fill=1, stroke=0)
        c.setFont("Helvetica", 14)
        c.setFillColor(WHITE)
        c.drawString(W/2+68, sy-12, icon)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(W/2+88, sy-5, t1)
        c.setFillColor(HexColor("#AAAAAA"))
        c.setFont("Helvetica", 7.5)
        c.drawString(W/2+88, sy-17, t2)

    # Footer
    c.setFillColor(GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)
    c.setFillColor(HexColor("#777777"))
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W/2, 12, "pinogalant.com.ar  |  App Movil PWA")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 7 — ADMIN + RESUMEN
# ─────────────────────────────────────────────────────────────────────────────
def page_admin_resumen(c):
    draw_bg(c)

    # Header
    c.setFillColor(DARK)
    c.rect(0, H-80, W, 80, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H-83, W, 3, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, H-25, "PANEL ADMIN  +  RESUMEN")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(30, H-50, "Panel de Administracion")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 10)
    c.drawString(30, H-68, "Herramientas exclusivas para la inmobiliaria")

    # Admin features grid
    admin_feats = [
        (u"\U0001F4CA", "Estadisticas", ["Visitas por propiedad", "Consultas recibidas", "Propiedades mas vistas"]),
        (u"\U0001F4DD", "Gestion", ["Agregar / editar propiedades", "Marcar como vendida", "Destacar propiedades"]),
        (u"\U0001F464", "Usuarios", ["Ver consultas de clientes", "Gestionar agentes", "Control de accesos"]),
        (u"\U0001F4E7", "Contactos", ["Ver leads recibidos", "Historial de WhatsApp", "Formularios completados"]),
    ]

    gx = 25
    gy = H-280
    gw = (W-60)/2
    gh = 85

    for i, (icon, title, items) in enumerate(admin_feats):
        rx = gx + (i % 2) * (gw + 10)
        ry = gy - (i // 2) * (gh + 10)

        c.setFillColor(WHITE)
        c.roundRect(rx, ry, gw, gh, 8, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.roundRect(rx, ry+gh-8, gw, 8, 4, fill=1, stroke=0)
        c.rect(rx, ry+gh-8, gw, 4, fill=1, stroke=0)

        c.setFont("Helvetica", 16)
        c.setFillColor(DARK)
        c.drawString(rx+10, ry+gh-32, icon)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(rx+35, ry+gh-25, title)

        for j, item in enumerate(items):
            c.setFillColor(GOLD)
            c.setFont("Helvetica-Bold", 7)
            c.drawString(rx+12, ry+gh-44-(j*13), u"•")
            c.setFillColor(HexColor("#444444"))
            c.setFont("Helvetica", 8)
            c.drawString(rx+22, ry+gh-44-(j*13), item)

    # Separador
    c.setFillColor(LGRAY)
    c.rect(25, H-395, W-50, 1.5, fill=1, stroke=0)

    # RESUMEN FINAL
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(W/2, H-420, "Resumen de todas las mejoras implementadas")

    all_features = [
        ("01", u"\U0001F52D  Busqueda IA", "El cliente describe lo que quiere en lenguaje natural"),
        ("02", u"\U0001F5FA  Buscador dinamico", "Filtros reales: tipo, operacion, provincia, localidad"),
        ("03", u"\U0001F4CD  Mapa interactivo", "Propiedades en mapa con iconos personalizados y fotos"),
        ("04", u"\U0001F3E2  Oficinas comerciales", "Popup con mapa OpenStreetMap y botones de navegacion"),
        ("05", u"\U0001F4E4  Compartir propiedad", "WhatsApp, Facebook, X, Instagram, copiar link"),
        ("06", u"\U0001F3D8  Info del barrio", "Lo que hay cerca de cada propiedad"),
        ("07", u"\U0001F4B0  Calculadora hipotecaria", "Simula cuotas directamente en la propiedad"),
        ("08", u"\U0001F3E0  Propiedades similares", "Sugerencias al ver una propiedad"),
        ("09", u"\U0001F4F1  App instalable (PWA)", "Se instala en el celular con QR o directo desde el sitio"),
    ]

    row_h = 22
    for i, (num, feat, desc) in enumerate(all_features):
        ry = H-448-(i*row_h)
        bg = LIGHT if i%2==0 else WHITE
        c.setFillColor(bg)
        c.roundRect(25, ry-4, W-50, row_h-2, 4, fill=1, stroke=0)

        c.setFillColor(GOLD)
        c.roundRect(28, ry, 20, row_h-8, 3, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(38, ry+4, num)

        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(56, ry+4, feat)

        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8.5)
        c.drawString(210, ry+4, desc)

    # CTA final
    c.setFillColor(DARK)
    c.roundRect(25, 30, W-50, 40, 8, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(25, 62, W-50, 3, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W/2, 48, "pinogalant.com.ar")
    c.setFillColor(HexColor("#AAAAAA"))
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(W/2, 35, "Todas estas funciones ya estan activas en el sitio web")

    c.showPage()

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main():
    out = r"C:\inmobiliaria\public\presentacion-pinogalant-nueva.pdf"
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle("Pino Galant - Nuevas Funcionalidades 2026")
    c.setAuthor("Pino Galant Negocios Inmobiliarios")
    c.setSubject("Presentacion de mejoras del sitio web")

    page_cover(c)
    page_ia(c)
    page_search_map(c)
    page_oficinas_share(c)
    page_barrio_calc(c)
    page_app(c)
    page_admin_resumen(c)

    c.save()
    print(f"PDF generado: {out}")

if __name__ == "__main__":
    main()
