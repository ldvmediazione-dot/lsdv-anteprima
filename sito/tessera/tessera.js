// Verifica di una tessera: /tessera/?c=CODICE oppure codice scritto a mano. Se è valida, tessera con QR da stampare.
import qrcode from "/lsdv-anteprima/vendor/qrcode/qrcode.mjs";

{
  const f = document.querySelector("[data-tessera]"), out = document.querySelector("[data-esito-tessera]");
  const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const data = (iso) => { const [a, m, g] = iso.split("-"); return `${+g} ${MESI[m - 1]} ${a}`; };
  const riga = (dl, t, v) => { const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = t; dd.textContent = v; dl.append(dt, dd); };

  async function verifica(c) {
    out.replaceChildren();
    document.querySelectorAll("[data-carta]").forEach((x) => { x.hidden = true; });
    const box = document.createElement("div");
    box.className = "tessera-esito";
    const h = document.createElement("h2");
    box.append(h);
    try {
      const j = await (await fetch("/lsdv-anteprima/api/tessera?c=" + encodeURIComponent(c))).json();
      if (j.valida) {
        box.classList.add("si");
        h.textContent = "Tessera valida";
        const dl = document.createElement("dl");
        riga(dl, "Socio n.", j.numero);
        riga(dl, "Intestata a", j.intestatario);
        riga(dl, "Categoria", j.categoria);
        riga(dl, "Socio dal", data(j.dal));
        riga(dl, "Quota " + j.anno, j.quota_versata ? "versata" : "non ancora registrata");
        box.append(dl);
        carta(c, j);
      } else {
        box.classList.add("no");
        h.textContent = j.errore ? "Verifica non disponibile" : "Tessera non trovata";
        const p = document.createElement("p");
        p.textContent = j.errore ? "Il servizio non risponde. Riprova più tardi." : "Il codice non corrisponde a un socio in carica. Controlla di averlo scritto bene: sono dieci caratteri, senza le lettere I e O e senza i numeri 0 e 1.";
        box.append(p);
      }
    } catch {
      h.textContent = "Connessione assente";
    }
    out.append(box);
  }

  // Il QR porta a questa pagina col codice: chi lo inquadra vede subito se la tessera è valida.
  function carta(c, j) {
    const t = document.querySelector(".tessera-carta");
    const v = { ...j, codice: c.replace(/(.{5})/, "$1 ") };
    t.querySelectorAll("[data-c]").forEach((x) => { x.textContent = v[x.dataset.c]; });
    const qr = qrcode(0, "M");
    qr.addData(`${location.origin}/tessera/?c=${c}`);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) d += `M${k + 4} ${r + 4}h1v1h-1z`;
    const svg = t.querySelector("[data-qr]");
    svg.setAttribute("viewBox", `0 0 ${n + 8} ${n + 8}`);
    svg.querySelector("path").setAttribute("d", d);
    document.querySelectorAll("[data-carta]").forEach((x) => { x.hidden = false; });
  }
  document.querySelector("[data-stampa]").addEventListener("click", () => print());

  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const c = f.elements.c.value.trim().toUpperCase();
    if (!c) { out.textContent = "Scrivi il codice della tessera."; return f.elements.c.focus(); }
    history.replaceState(null, "", "?c=" + encodeURIComponent(c));
    verifica(c);
  });
  const c = new URLSearchParams(location.search).get("c");
  if (c) { f.elements.c.value = c; verifica(c.toUpperCase()); }
}
