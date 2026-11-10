"""Gera os 3 modelos de apresentação da FloresESer a partir de floresser/index.html.

Uso:  python3 ferramentas/gerar_modelos.py
Cria floresser/modelos/ (modelo-1-completo, modelo-2-visual, modelo-3-direto).
O modelo 4 (interativo) é escrito à mão: modelo-4-interativo.html + interativo.css + interativo.js.
Apagar a pasta floresser/modelos/ depois de o cliente escolher.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "floresser"
OUT = ROOT / "modelos"
OUT.mkdir(exist_ok=True)
src = (ROOT / "index.html").read_text(encoding="utf-8")


def U(pid, w=1200):
    return f"https://images.unsplash.com/photo-{pid}?w={w}&q=70"


def img(pid, alt, w=1200, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<img{c} src="{U(pid, w)}" alt="{alt}" loading="lazy">'


def cut(start, end, include_end=False):
    a = src.index(start)
    b = src.index(end, a)
    return src[a:b + (len(end) if include_end else 0)]


# ---------- blocos reutilizados do site principal ----------
HEAD = src[:src.index("</head>")]
HEAD = re.sub(r'href="styles\.css(\?v=\w+)?">', lambda m: f'href="../styles.css{m.group(1) or ""}">\n<link rel="stylesheet" href="modelos.css{m.group(1) or ""}">', HEAD)
HEAD = HEAD.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">')
HEADER = cut('<header class="topbar"', '</header>', include_end=True)
QUOTE = cut('<!-- ORÇAMENTO -->', '<!-- SOBRE -->')
FORM = cut('<form class="quote-form"', '</form>', include_end=True)
FOOTER = src[src.index('<!-- CONTACTOS / FOOTER -->'):]
FOOTER = FOOTER.replace('src="config.js', 'src="../config.js').replace('src="script.js', 'src="../script.js')

MODELS = [("modelo-1-completo.html", "1 · Completo"),
          ("modelo-2-visual.html", "2 · Visual"),
          ("modelo-3-direto.html", "3 · Direto"),
          ("modelo-4-interativo.html", "4 · Interativo")]


def bar(active):
    links = "".join(f'<a href="{f}"{" class=\"on\"" if f == active else ""}>{n}</a>' for f, n in MODELS)
    return (f'<div class="model-bar"><span>Proposta · fotos ilustrativas</span>'
            f'<a href="index.html">Todos</a>{links}</div>\n')


def page(fname, title, body):
    head = HEAD.replace("<title>FloresESer · Jardins e Piscinas</title>",
                        f"<title>{title} · FloresESer</title>")
    return head + "</head>\n<body>\n" + bar(fname) + body + "\n" + FOOTER


# ---------------- MODELO 1: o site principal ----------------
m1 = src.replace(src[:src.index("</head>")], HEAD.replace(
    "<title>FloresESer · Jardins e Piscinas</title>", "<title>Modelo 1 · Completo · FloresESer</title>"), 1)
m1 = m1.replace('src="config.js', 'src="../config.js').replace('src="script.js', 'src="../script.js')
m1 = re.sub(r"(<body[^>]*>\n)", lambda m: m.group(1) + bar("modelo-1-completo.html"), m1, count=1)
(OUT / "modelo-1-completo.html").write_text(m1, encoding="utf-8")

# ---------------- MODELO 2: visual ----------------
TILES = [
    ("Manutenção de jardins", "1558904541-efa843a96f01"),
    ("Construção e paisagismo", "1600585154340-be6161a56a0c"),
    ("Manutenção de piscinas", "1572331165267-854da2b10ccc"),
    ("Construção de piscinas", "1613490493576-7fde63acd811"),
    ("Poda e abate de árvores", "1617576683096-00fc8eecb3af"),
    ("Sistemas de rega", "1592595896551-12b371d546d5"),
    ("Limpeza de terrenos", "1598902108854-10e335adac99"),
    ("Plantações e hortas", "1622383563227-04401ab4e5ea"),
]
tiles = "\n".join(
    f'      <a class="v-tile reveal-me" href="#orcamento">{img(p, n, 900)}<span>{n}</span></a>' for n, p in TILES)

GAL = ["1585320806297-9794b3e4eeae", "1582268611958-ebfd161ef9cf", "1534710961216-75c88202f43e",
       "1564013799919-ab600027ffc6", "1591857177580-dc82b9ac4e1e", "1558293842-c0fd3db86157",
       "1600047509807-ba8f99d2cdde", "1563911302283-d2bc129e7570", "1600566753190-17f0baa2a6c3",
       "1576013551627-0cc20b96c2a7", "1542601906990-b4d3fb778b09", "1466692476868-aef1dfb1e735"]
SIZES = ["tall", "", "", "wide", "", "tall", "", "", "wide", "", "", ""]
gal = "\n".join(f'      <button class="g {s}">{img(p, "Trabalho realizado", 1000)}</button>' for p, s in zip(GAL, SIZES))

m2_body = HEADER + f'''

<section class="v-hero">
  {img("1576013551627-0cc20b96c2a7", "Piscina rodeada de jardim", 1920)}
  <div class="wrap v-hero-text">
    <p class="eyebrow">Jardins · Piscinas · Espaços verdes</p>
    <h1>O seu jardim, <em>sempre</em> pronto a aproveitar.</h1>
    <a href="#orcamento" class="btn btn-lg">Pedir orçamento grátis</a>
  </div>
</section>

<div class="v-strip">
  <a href="#servicos">{img("1557429287-b2e26467fc2b", "Jardim florido", 1000)}<span><small>Serviços</small>Jardins</span></a>
  <a href="#servicos">{img("1582268611958-ebfd161ef9cf", "Piscina", 1000)}<span><small>Serviços</small>Piscinas</span></a>
  <a href="#servicos">{img("1617576683096-00fc8eecb3af", "Poda", 1000)}<span><small>Serviços</small>Poda e limpeza</span></a>
</div>

<section class="section" id="servicos">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">O que fazemos</p><h2>Tudo para o seu espaço exterior</h2></div>
    <div class="v-tiles">
{tiles}
    </div>
  </div>
</section>

<section class="section v-ba" id="sobre">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Antes e depois</p><h2>A diferença vê-se</h2>
      <p>Arraste a barra para comparar o mesmo espaço antes e depois da nossa intervenção.</p></div>
    <div class="ba reveal-me" id="ba">
      {img("1557429287-b2e26467fc2b", "Depois", 1600, "ba-after")}
      <div class="ba-before">{img("1598902108854-10e335adac99", "Antes", 1600)}</div>
      <span class="ba-tag l">Antes</span><span class="ba-tag r">Depois</span>
      <input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois">
      <div class="ba-line"></div>
    </div>
  </div>
</section>

<section class="section" id="galeria">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Galeria</p><h2>Os nossos trabalhos</h2></div>
    <div class="gallery" id="gallery">
{gal}
    </div>
  </div>
</section>

<section class="v-banner">
  {img("1558293842-c0fd3db86157", "Túnel de glicínias", 1920)}
  <blockquote>“Cuidamos de cada jardim como se fosse o nosso.”<cite>FloresESer</cite></blockquote>
</section>

{QUOTE}
<script>
  (function () {{
    var ba = document.getElementById('ba'); if (!ba) return;
    var r = ba.querySelector('input');
    var set = function () {{ ba.style.setProperty('--pos', r.value + '%'); }};
    r.addEventListener('input', set); set();
  }})();
</script>
'''
m2_body = m2_body.replace('<a href="#processo">Como funciona</a>', '').replace('<a href="#sobre">Sobre nós</a>', '<a href="#sobre">Antes e depois</a>')
(OUT / "modelo-2-visual.html").write_text(page("modelo-2-visual.html", "Modelo 2 · Visual", m2_body), encoding="utf-8")

# ---------------- MODELO 3: direto ----------------
I = lambda d: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{d}</svg>'
ICONS = [
    ("Manutenção de jardins", "Corte de relva, adubação, canteiros e limpezas regulares.",
     I('<path d="M4 20c1-5 2-8 2-12M10 20c0-5 1-9 3-13M16 20c0-4 1-7 4-10M2 20h20"/>')),
    ("Construção e paisagismo", "Jardins novos de raiz, relvados, caminhos e iluminação.",
     I('<path d="M3 21h18M5 21V10l7-6 7 6v11"/><path d="M10 21v-5h4v5"/>')),
    ("Manutenção de piscinas", "Limpeza, tratamento da água e verificação de equipamentos.",
     I('<path d="M2 16c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M8 14V5a2 2 0 0 1 4 0M14 14V5"/><path d="M8 9h6"/>')),
    ("Construção de piscinas", "Construção, remodelação e revestimentos.",
     I('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 13c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>')),
    ("Poda e abate de árvores", "Poda de formação, sebes e abate controlado.",
     I('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>')),
    ("Sistemas de rega", "Rega automática gota-a-gota e aspersão.",
     I('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>')),
    ("Limpeza de terrenos", "Desmatação e faixas de gestão de combustível.",
     I('<path d="M12 22V12M12 12c-4 0-7-3-7-8 4 0 7 3 7 8zM12 15c3 0 6-2 6-6-3 0-6 2-6 6z"/>')),
    ("Plantações e hortas", "Árvores, arbustos, flores e hortas.",
     I('<path d="M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-3 2-6 7-6 0 4-3 6-7 6z"/>')),
]
items = "\n".join(f'      <div class="d-item reveal-me"><span class="d-ico">{ic}</span><div><h3>{n}</h3><p>{d}</p></div></div>'
                  for n, d, ic in ICONS)

d_header = '''<header class="topbar d-top scrolled" id="topo">
  <div class="wrap topbar-inner">
    <a href="#topo" class="logo"><span class="logo-mark">❀</span><span>Flores<em>E</em>Ser</span></a>
    <div class="d-actions">
      <a class="d-tel" href="tel:+351910000000" data-cfg="phone">910 000 000</a>
      <a href="#orcamento" class="btn btn-sm">Pedir orçamento</a>
    </div>
  </div>
</header>'''

m3_body = d_header + f'''

<section class="d-hero" id="orcamento">
  {img("1557429287-b2e26467fc2b", "", 1920, "d-bg")}
  <div class="wrap d-hero-grid">
    <div class="d-hero-text">
      <p class="eyebrow">Jardins · Piscinas · Espaços verdes</p>
      <h1>Peça já o orçamento para o seu jardim ou piscina</h1>
      <p class="lead">Resposta por email em até 24 horas úteis. Grátis e sem compromisso.</p>
      <ul class="d-checks">
        <li>Visita gratuita ao local</li>
        <li>Serviço pontual ou contrato regular</li>
        <li>Equipa própria e qualificada</li>
      </ul>
    </div>
    <div class="d-form-wrap">
      {FORM}
    </div>
  </div>
</section>

<section class="section" id="servicos">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Serviços</p><h2>O que fazemos</h2></div>
    <div class="d-list">
{items}
    </div>
  </div>
</section>

<section class="d-steps">
  <div class="wrap">
    <div><strong>1</strong><span>Preenche o pedido</span></div>
    <div><strong>2</strong><span>Visitamos o local</span></div>
    <div><strong>3</strong><span>Recebe a proposta por email</span></div>
  </div>
</section>
'''
(OUT / "modelo-3-direto.html").write_text(page("modelo-3-direto.html", "Modelo 3 · Direto", m3_body), encoding="utf-8")

for f in sorted(OUT.glob("modelo-*.html")):
    t = f.read_text(encoding="utf-8")
    print(f.name, len(t), "imgs:", t.count("<img"), "form:", t.count('id="quoteForm"'))
