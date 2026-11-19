// Ricerca nel sito su /cerca/indice.json (lo scrive build.py): tutte le parole devono comparire, il titolo pesa di più.
(() => {
  const f = document.querySelector("[data-cerca]"), n = document.querySelector("[data-cerca-n]"), ol = document.querySelector("[data-cerca-esiti]");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let indice = null;

  async function cerca(q) {
    const parole = norm(q).split(/\s+/).filter((p) => p.length > 1);
    ol.replaceChildren();
    if (!parole.length) { n.textContent = "Scrivi almeno una parola."; return; }
    try { indice ??= await (await fetch("/lsdv-anteprima/cerca/indice.json")).json(); } catch { n.textContent = "Ricerca non disponibile. Riprova più tardi."; return; }
    const esiti = indice.map((v) => {
      const t = norm(v.t), testo = norm(v.d + " " + v.x);
      if (!parole.every((p) => t.includes(p) || testo.includes(p))) return null;
      return { v, punti: parole.reduce((s, p) => s + (t.includes(p) ? 5 : 0) + testo.split(p).length - 1, 0) };
    }).filter(Boolean).sort((a, b) => b.punti - a.punti);
    n.textContent = esiti.length ? `${esiti.length === 1 ? "Una pagina trovata" : esiti.length + " pagine trovate"} per «${q}».` : `Nessuna pagina trovata per «${q}».`;
    esiti.forEach(({ v }) => {
      const li = document.createElement("li"), a = document.createElement("a"), p = document.createElement("p");
      a.href = v.u; a.textContent = v.t; p.textContent = v.d;
      li.append(a, p); ol.append(li);
    });
  }

  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = f.elements.q.value.trim();
    history.replaceState(null, "", q ? "?q=" + encodeURIComponent(q) : location.pathname);
    cerca(q);
  });
  const q = new URLSearchParams(location.search).get("q");
  if (q) { f.elements.q.value = q; cerca(q); }
})();
