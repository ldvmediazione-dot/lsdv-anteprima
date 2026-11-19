/* Nucleo comune della home: utilità, carta del territorio, scroll fluido, intro. */
(function () {
  "use strict";
  const D = window.LSDV, M = window.LSDV_MAP;
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- scroll fluido (Lenis) sincronizzato con ScrollTrigger ---------- */
  function smooth(opts = {}) {
    if (RM || !window.Lenis) return null;
    const lenis = new Lenis(Object.assign({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true }, opts));
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: 0, duration: 1.4 });
    }));
    window.__lenis = lenis;
    return lenis;
  }

  /* ---------- carta del territorio (SVG reale) ---------- */
  function mapSVG(o = {}) {
    const vb = o.viewBox || `0 0 ${M.vw} ${M.vh}`;
    const paths = M.paths.map(([z, ma, d]) => `<path class="ct ${ma ? "ma" : "mi"}" data-z="${z}" d="${d}"/>`).join("");
    const fiume = M.fiume.map((d) => `<path class="fiume" d="${d}"/>`).join("");
    const pins = M.comuni.map((c) => `<g class="pin" data-id="${c.id}" transform="translate(${c.x} ${c.y})" tabindex="0" role="button" aria-label="${esc(c.nome)}, ${c.quota} metri"><circle class="pin-halo" r="26"/><circle class="pin-dot" r="7"/><text class="pin-lbl" x="14" y="5">${esc(c.nome)}</text></g>`).join("");
    const luoghi = (o.luoghi === false ? [] : M.luoghi).map((c) => `<g class="luogo" data-id="${c.id}" transform="translate(${c.x} ${c.y})"><path class="luogo-mk" d="M-6 0L0-6L6 0L0 6Z"/><text class="luogo-lbl" x="12" y="4">${esc(c.nome)}</text></g>`).join("");
    return `<svg class="terra ${o.cls || ""}" viewBox="${vb}" preserveAspectRatio="${o.par || "xMidYMid slice"}" role="img" aria-label="Carta delle curve di livello dell'area della DOC Casavecchia di Pontelatone con gli otto comuni"><g class="ct-g">${paths}</g><g class="fiume-g">${fiume}</g><g class="luoghi-g">${luoghi}</g><g class="pins-g">${pins}</g></svg>`;
  }

  /* ---------- numeri che contano ---------- */
  function counter(el, to, dur = 1.6) {
    if (RM || !window.gsap) { el.textContent = to; return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: dur, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v)) });
  }

  /* ---------- intro una volta per sessione ---------- */
  function introOnce(key) {
    if (RM) return false;
    try { const q = new URLSearchParams(location.search); if (q.has("noi")) return false; if (q.has("intro")) return true; if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); } catch (e) {}
    return true;
  }

  /* ---------- scheda di un'azienda: descrizione e collegamento al suo sito ---------- */
  function schedaAzienda(nome) {
    const i = (D.info || {})[nome] || {};
    const etichetta = i.tipo === "social" ? (/instagram/.test(i.sito) ? "Vai al profilo Instagram" : "Vai alla pagina Facebook") : "Vai al sito";
    return `${i.testo ? `<p class="sch-t">${esc(i.testo)}</p>` : ""}` +
      `${i.sito ? `<a class="sch-b" href="${esc(i.sito)}" target="_blank" rel="noopener">${etichetta}<i aria-hidden="true">↗</i></a>` : '<p class="sch-no">Nessun sito indicato dall\'azienda</p>'}`;
  }

  /* ---------- sezione «Chi siamo»: stesso testo, grafica di ciascuna versione ---------- */
  function chiSiamo(el) {
    const c = D.chisiamo; if (!el || !c) return;
    el.innerHTML = `<div class="cs-in"><header class="cs-h"><p class="cs-kick">${esc(c.occhiello)}</p><h2 class="cs-t">${esc(c.titolo)}</h2></header>
      <div class="cs-grid">${c.blocchi.map((b, i) => `<article class="cs-b"><span class="cs-n">${String(i + 1).padStart(2, "0")}</span><h3>${esc(b.t)}</h3><p>${esc(b.d)}</p></article>`).join("")}</div></div>`;
  }
  $$("[data-chisiamo]").forEach(chiSiamo);
  // entrata dei tre blocchi, quando GSAP e ScrollTrigger sono pronti
  addEventListener("load", () => {
    if (RM || !window.gsap || !window.ScrollTrigger) return;
    $$("[data-chisiamo]").forEach((s) => {
      gsap.from($$(".cs-kick, .cs-t", s), { y: 30, autoAlpha: 0, duration: 1, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 78%" } });
      gsap.from($$(".cs-b", s), { y: 50, autoAlpha: 0, duration: 1.1, stagger: 0.14, ease: "expo.out", scrollTrigger: { trigger: $(".cs-grid", s), start: "top 85%" } });
    });
  });

  window.LSDVCore = { D, M, RM, $, $$, esc, smooth, mapSVG, counter, introOnce, chiSiamo, schedaAzienda };
})();
