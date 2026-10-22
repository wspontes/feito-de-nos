"""
Gera os icones do PWA do Feito de Nos.
  python make_icons.py
"""
import os

from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.abspath(__file__))
DIR_ICONES = os.path.join(RAIZ, "icons")
os.makedirs(DIR_ICONES, exist_ok=True)

CREME = (243, 233, 216)
OLIVA = (141, 155, 110)
OLIVA_ESCURO = (113, 128, 85)
ROSA = (201, 155, 142)
TINTA = (74, 61, 49)


def fonte(caminho, tamanho):
    for nome in (caminho, "C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        if os.path.exists(nome):
            try:
                return ImageFont.truetype(nome, tamanho)
            except OSError:
                pass
    return ImageFont.load_default()


def desenha(tamanho, margem, cantos=True, arquivo="icon.png"):
    img = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # fundo: degradê oliva
    fundo = Image.new("RGB", (tamanho, tamanho), CREME)
    fd = ImageDraw.Draw(fundo)
    for y in range(tamanho):
        t = y / max(1, tamanho - 1)
        cor = tuple(int(CREME[i] + (OLIVA[i] - CREME[i]) * (t * 0.85 + 0.15)) for i in range(3))
        fd.line([(0, y), (tamanho, y)], fill=cor)
    if cantos:
        mascara = Image.new("L", (tamanho, tamanho), 0)
        ImageDraw.Draw(mascara).rounded_rectangle(
            [0, 0, tamanho - 1, tamanho - 1], radius=int(tamanho * 0.22), fill=255
        )
    else:
        mascara = Image.new("L", (tamanho, tamanho), 255)
    img.paste(fundo, (0, 0), mascara)

    d = ImageDraw.Draw(img)
    # moldura
    d.rounded_rectangle(
        [int(tamanho * 0.045), int(tamanho * 0.045), int(tamanho * 0.955), int(tamanho * 0.955)],
        radius=int(tamanho * 0.2),
        outline=OLIVA_ESCURO,
        width=max(2, int(tamanho * 0.028)),
    )
    # marca circular creme (igual ao logo do site)
    cx = cy = tamanho / 2
    r = tamanho * 0.3
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREME, outline=OLIVA_ESCURO, width=max(2, int(tamanho * 0.016)))
    # "FN"
    f = fonte("C:/Windows/Fonts/georgiab.ttf", int(tamanho * 0.27))
    texto = "FN"
    caixa = d.textbbox((0, 0), texto, font=f)
    d.text((cx - (caixa[2] - caixa[0]) / 2 - caixa[0], cy - (caixa[3] - caixa[1]) / 2 - caixa[1]),
           texto, font=f, fill=OLIVA_ESCURO)
    # pontinho rosa
    pr = tamanho * 0.045
    d.ellipse([cx + r * 0.72 - pr, cy - r * 0.78 - pr, cx + r * 0.72 + pr, cy - r * 0.78 + pr], fill=ROSA)

    img.save(os.path.join(DIR_ICONES, arquivo), "PNG")
    return img


def maskable(tamanho=512):
    """Icone maskable: conteudo dentro da area segura (80%)."""
    img = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(tamanho):
        t = y / max(1, tamanho - 1)
        cor = tuple(int(CREME[i] + (OLIVA[i] - CREME[i]) * (t * 0.85 + 0.15)) for i in range(3))
        d.line([(0, y), (tamanho, y)], fill=cor)
    d.rounded_rectangle([0, 0, tamanho - 1, tamanho - 1], radius=int(tamanho * 0.22),
                        outline=OLIVA_ESCURO, width=max(2, int(tamanho * 0.028)))
    base = desenha(tamanho, 0, cantos=False, arquivo="_tmp.png")
    # desenha a marca reduzida sobre o fundo
    marca = base.resize((int(tamanho * 0.62), int(tamanho * 0.62)), Image.LANCZOS)
    img.alpha_composite(marca, (int((tamanho - marca.width) / 2), int((tamanho - marca.height) / 2)))
    img.save(os.path.join(DIR_ICONES, "icon-maskable-512.png"), "PNG")
    os.remove(os.path.join(DIR_ICONES, "_tmp.png"))


desenha(192, 0, arquivo="icon-192.png")
desenha(512, 0, arquivo="icon-512.png")
desenha(180, 0, arquivo="apple-touch-icon.png")
desenha(32, 0, arquivo="favicon-32.png")
maskable(512)

# favicon ICO
img = Image.open(os.path.join(DIR_ICONES, "favicon-32.png"))
img.save(os.path.join(RAIZ, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

for nome in sorted(os.listdir(DIR_ICONES)):
    print("icons/" + nome, os.path.getsize(os.path.join(DIR_ICONES, nome)), "bytes")
print("favicon.ico", os.path.getsize(os.path.join(RAIZ, "favicon.ico")), "bytes")
