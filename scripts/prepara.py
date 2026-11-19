"""Copia statica di lsdv-sito/public in lsdv-anteprima/sito con i percorsi sotto /lsdv-anteprima/."""
import re, shutil
from pathlib import Path

SRC = Path(r"C:/Users/vince/progetti/lsdv-sito/public")
DST = Path(r"C:/Users/vince/progetti/lsdv-anteprima/sito")
PRE = "/lsdv-anteprima"
FUORI = {"admin", "api.php", ".htaccess"}

DST.mkdir(parents=True, exist_ok=True)
for v in DST.iterdir():  # svuota il contenuto, non la cartella (su Windows può essere in uso)
    shutil.rmtree(v) if v.is_dir() else v.unlink()
shutil.copytree(SRC, DST, dirs_exist_ok=True, ignore=lambda d, names: [n for n in names if Path(d) == SRC and n in FUORI])

nomi = sorted((p.name for p in SRC.iterdir() if p.name not in FUORI), key=len, reverse=True)
alt = "|".join(re.escape(n) for n in nomi) + "|api/"
# "/storia/", '/vendor/..', `/${x}`, url(/shared/..), "/" e "/#..." diventano /lsdv-anteprima/...
rx = re.compile(r"""(?<=["'`(=])/(?=(?:%s)|\$\{|["'`#?])""" % alt)

BANNER = ('<div style="position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#442413;color:#FCF6E1;'
          'font:600 13px/1.4 system-ui,sans-serif;text-align:center;padding:8px 12px">'
          'Anteprima del sito: moduli, newsletter e area riservata non sono attivi.</div>')

n = 0
for f in DST.rglob("*"):
    if f.suffix not in {".html", ".css", ".js", ".mjs", ".json", ".webmanifest"} or "vendor" in f.parts:
        continue
    s = f.read_text(encoding="utf-8")
    t = rx.sub(PRE + "/", s)
    if f.suffix == ".html":
        t = t.replace("<head>", '<head>\n<meta name="robots" content="noindex, nofollow">', 1)
        t = t.replace("</body>", BANNER + "</body>", 1)
    if t != s:
        f.write_text(t, encoding="utf-8", newline="\n")
        n += 1
# gli addon di three.js importano /vendor/three/three.module.js con percorso assoluto
for f in (DST / "vendor/three/addons").rglob("*.js"):
    s = f.read_text(encoding="utf-8"); t = s.replace("from '/vendor/", "from '" + PRE + "/vendor/")
    if t != s: f.write_text(t, encoding="utf-8", newline="\n")
(DST / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8", newline="\n")
(DST / ".nojekyll").write_text("", encoding="utf-8")
print("file riscritti:", n)
