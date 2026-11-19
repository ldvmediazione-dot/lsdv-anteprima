// Voci pubblicate dall'area riservata e non ancora diventate pagine statiche (arrivano con la pubblicazione successiva).
// Elenchi eventi e magazine: aggiunge le voci che mancano. /novita/?s=slug: mostra la voce. Solo textContent, niente HTML.
(async () => {
  const liste = document.querySelectorAll("[data-red]"), novita = document.querySelector("[data-novita]");
  if (!liste.length && !novita) return;
  let voci = [];
  try { voci = (await (await fetch("/lsdv-anteprima/api/redazione")).json()).voci || []; } catch { /* senza API restano le voci statiche */ }
  const el = (tag, cls, testo) => { const x = document.createElement(tag); if (cls) x.className = cls; if (testo != null) x.textContent = testo; return x; };
  const MESI = "gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre".split(" ");
  const giorno = (iso) => { const [a, m, g] = iso.split("-"); return `${+g} ${MESI[m - 1]} ${a}`; };
  // come periodo() in build.py: 18–19 settembre 2027, 30 giugno – 2 luglio 2027
  const quando = ({ data: i, fine: f }) => (!f || f === i ? giorno(i) : i.slice(0, 7) === f.slice(0, 7) ? `${+i.slice(8)}–${giorno(f)}`
    : `${i.slice(0, 4) === f.slice(0, 4) ? giorno(i).replace(/ \d{4}$/, "") : giorno(i)} – ${giorno(f)}`);
  const oggi = new Date().toISOString().slice(0, 10);
  const link = (v) => `/lsdv-anteprima/novita/?s=${encodeURIComponent(v.slug)}`;
  const statica = (v) => document.querySelector(`a[href="/lsdv-anteprima/${v.tipo === "evento" ? "eventi" : "magazine"}/${v.slug}/"]`);

  liste.forEach((lista) => {
    const tipo = lista.dataset.red;
    voci.filter((v) => !statica(v) && (tipo === "articolo" ? v.tipo === "articolo"
      : v.tipo === "evento" && ((v.fine || v.data) >= oggi) === (tipo === "evento-futuro")))
      .forEach((v) => {
        if (v.tipo === "articolo") {
          const a = el("a", "art"); a.href = link(v);
          const im = el("div", "im"), img = el("img"); img.src = "/lsdv-anteprima/" + (v.img || "shared/img/vigna-lmp02008.webp"); img.alt = ""; img.loading = "lazy";
          im.append(img, el("span", "cat", v.categoria || "Notizie"));
          const h = el("h2"); h.append(el("span", "", v.titolo));
          a.append(im, h, el("p", "", v.sommario), el("span", "min", giorno(v.data)));
          lista.prepend(a);
        } else {
          const li = el("li", "ev-row"), d = el("div"), h = el("h3"), a = el("a", "", v.titolo);
          a.href = link(v); h.append(a); d.append(h, el("p", "", v.sommario));
          li.append(el("p", "d", quando(v)), d, el("p", "", v.luogo), el("span", "go", "→"));
          li.lastChild.setAttribute("aria-hidden", "true");
          tipo === "evento-futuro" ? lista.append(li) : lista.prepend(li);
        }
      });
  });

  if (novita) {
    const s = new URLSearchParams(location.search).get("s"), v = voci.find((x) => x.slug === s);
    const testa = novita.querySelector("header"), h1 = testa.querySelector("h1");
    if (!v) { h1.textContent = "Voce non trovata"; testa.append(el("p", "sommario", "Questa voce non è più pubblicata.")); return; }
    // se la pagina statica esiste già (link vecchio), meglio quella: ha anche i dati per i motori di ricerca
    const dove = `/lsdv-anteprima/${v.tipo === "evento" ? "eventi" : "magazine"}/${v.slug}/`;
    fetch(dove, { method: "HEAD" }).then((r) => r.ok && location.replace(dove)).catch(() => {});
    document.title = v.titolo + " · Strada del Vino";
    const kick = testa.querySelector(".kick"); kick.textContent = "";
    const torna = el("a", "", v.tipo === "evento" ? "Eventi" : "Magazine"); torna.href = v.tipo === "evento" ? "/lsdv-anteprima/eventi/" : "/lsdv-anteprima/magazine/";
    kick.append(torna, ` · ${v.tipo === "evento" ? (((v.fine || v.data) >= oggi) ? "In programma" : "Evento concluso") : v.categoria || "Notizie"}`);
    h1.textContent = v.titolo;
    testa.append(el("p", "sommario", v.sommario), el("p", "pg-dati", v.tipo === "evento" ? `${quando(v)} · ${v.luogo}` : giorno(v.data)));
    if (v.img) { const f = el("figure", "pg-foto pg-foto-grande"), img = el("img"); img.src = "/lsdv-anteprima/" + v.img; img.alt = ""; f.append(img); novita.append(f); }
    // Markdown essenziale: paragrafi, titoli ## e ###, elenchi con "- "
    const prosa = el("div", "pg-prosa");
    (v.corpo || "").split(/\n\s*\n/).forEach((b) => {
      const t = b.trim(); if (!t) return;
      const m = t.match(/^(#{2,3}) (.+)$/);
      if (m) return prosa.append(el(m[1].length === 2 ? "h2" : "h3", "", m[2]));
      if (t.split("\n").every((r) => /^[-*] /.test(r))) { const ul = el("ul"); t.split("\n").forEach((r) => ul.append(el("li", "", r.slice(2).replace(/\*\*/g, "")))); return prosa.append(ul); }
      prosa.append(el("p", "", t.replace(/\*\*|__/g, "").replace(/\n/g, " ")));
    });
    novita.append(prosa);
  }
})();
