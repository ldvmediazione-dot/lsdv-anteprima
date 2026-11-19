/* Home della Strada del Vino */
(function () {
  "use strict";
  const { D, M, RM, $, $$, esc, smooth, mapSVG, counter, introOnce } = window.LSDVCore;
  const B = window.LSDV_BRAND, H = document.documentElement;
  const hasG = !!window.gsap;
  if (hasG) gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, Flip);
  const NS = "http://www.w3.org/2000/svg";

  /* ================= RENDER ================= */
  const logo = (el, br, gr) => { el.setAttribute("viewBox", B.logo.vb); el.innerHTML = `<path fill="${br}" fill-rule="evenodd" d="${B.logo.br}"/><path fill="${gr}" fill-rule="evenodd" d="${B.logo.gr}"/>`; };
  $$("[data-logo]").forEach((el) => logo(el, "#442413", "#ADC136"));
  logo($("[data-logow]"), "#FCF6E1", "#ADC136"); logo($("[data-logow2]"), "#FCF6E1", "#ADC136");

  $("[data-missione]").textContent = (D.ente.intro && D.ente.intro.c) || D.ente.missione;
  $("[data-nums]").innerHTML = D.numeri.map((n) => `<div class="num"><b data-count="${n.n}">${n.n}</b><span>${esc(n.label)}</span></div>`).join("");
  $("[data-quote]").textContent = `«${D.ente.citazione.testo}» ${D.ente.citazione.autore}, ${D.ente.citazione.ruolo}.`;

  $("[data-vlog]").innerHTML = D.vlog.map((v, i) => `<article class="voce" data-i="${i}" tabindex="0" role="button" aria-label="Guarda la cartolina ${esc(v.titolo)}"><img src="/lsdv-anteprima/${v.img}" alt="${esc(v.testo)}" loading="lazy"><video muted loop playsinline preload="none" aria-hidden="true"><source src="/lsdv-anteprima/${v.video}" type="video/mp4"></video><span class="snd" aria-hidden="true">▶</span><div class="who"><h3>${esc(v.titolo)}</h3><p>${esc(v.testo)}</p></div></article>`).join("");

  // tappe in data.js: un'azienda della rete (a) o un comune (c). Sulla mappa si accendono i comuni attraversati.
  const nomeTappa = (s) => s.a || M.comuni.find((m) => m.id === s.c).nome;
  const comuneTappa = (s) => s.c || D.info[s.a].comune;
  const ORDER = Object.fromEntries(D.percorsi.map((p) => [p.id, p.tappe.map(comuneTappa).filter((c, i, l) => l.indexOf(c) === i)]));
  $("[data-ptabs]").innerHTML = D.percorsi.map((p, i) => `<button class="ptab" role="tab" data-p="${p.id}" aria-selected="${i === 0}"><h3>${esc(p.nome)} <i>→</i></h3><p>${esc(p.testo)}</p><p class="st">${p.tappe.length} tappe · ${esc(p.tappe.map(nomeTappa).join(", "))}</p></button>`).join("");
  $("[data-pmap]").innerHTML = mapSVG({ luoghi: false, par: "xMidYMid meet" });

  $("[data-storia]").innerHTML = D.storia.map((s, i) => `<article class="scard"><div><p class="y">${esc(s.anno)}</p><p class="n">${String(i + 1).padStart(2, "0")} / ${String(D.storia.length).padStart(2, "0")}</p></div><div><h3>${esc(s.titolo)}</h3><p>${esc(s.testo)}</p><span class="src">${esc(s.fonte)}</span></div></article>`).join("");

  $("[data-eventi]").innerHTML = D.eventi.map((e) => `<li class="ev-row" data-img="/lsdv-anteprima/${e.img}"><p class="d">${esc(e.data)}</p><div><h3><a href="/lsdv-anteprima/eventi/${e.slug}/">${esc(e.titolo)}</a>${e.stato === "archivio" ? '<span class="tag">archivio</span>' : ""}</h3></div><p>${esc(e.luogo)}</p><span class="go" aria-hidden="true">→</span></li>`).join("");

  $("[data-blog]").innerHTML = D.blog.slice(0, 4).map((b) => `<a class="art" href="/lsdv-anteprima/magazine/${b.slug}/"><div class="im"><img src="/lsdv-anteprima/${b.img}" alt="${esc(b.alt || "")}" loading="lazy"><span class="cat">${esc(b.cat)}</span></div><h3><span>${esc(b.titolo)}</span></h3><p>${esc(b.estratto)}</p><span class="min">${b.min} minuti di lettura</span></a>`).join("");

  $("[data-adintro]").textContent = D.adesione.intro;
  $("[data-passi]").innerHTML = D.adesione.passi.map((p) => `<li><b>${esc(p.t)}</b>${esc(p.d)}</li>`).join("");
  $("#mnav nav").innerHTML = $$(".hd-nav a").map((a) => `<a href="${a.getAttribute("href")}">${a.textContent}</a>`).join("") + '<a href="/lsdv-anteprima/aderisci/">Aderisci</a>';

  /* ================= TESSERA ================= */
  const card = $("[data-card]");
  card.addEventListener("pointermove", (e) => { if (card.classList.contains("flip")) return; const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; $(".card-in", card).style.transform = `rotateY(${(x - 0.5) * 16}deg) rotateX(${-(y - 0.5) * 12}deg)`; $(".card-f", card).style.setProperty("--gx", x * 100 + "%"); $(".card-f", card).style.setProperty("--gy", y * 100 + "%"); });
  card.addEventListener("pointerleave", () => { if (!card.classList.contains("flip")) $(".card-in", card).style.transform = ""; });
  card.addEventListener("click", () => { $(".card-in", card).style.transform = ""; card.classList.toggle("flip"); });

  /* ================= MENU ================= */
  const burger = $(".hd-burger"), mnav = $("#mnav");
  const setMenu = (open) => { burger.setAttribute("aria-expanded", open); mnav.hidden = !open; H.classList.toggle("menu-open", open); window.__lenis && (open ? window.__lenis.stop() : window.__lenis.start()); };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  // in cattura: il menu si chiude (e Lenis riparte) prima che il link avvii lo scorrimento, altrimenti start() lo annulla
  mnav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); }, true);

  /* ================= VOCI: video ================= */
  const modal = $(".modal"), mv = $("video", modal);
  $$(".voce").forEach((v) => {
    const vid = $("video", v);
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting && !RM) { if (vid.preload !== "auto") { vid.preload = "auto"; vid.load(); } vid.play().then(() => v.classList.add("on")).catch(() => {}); } else { vid.pause(); v.classList.remove("on"); } }, { threshold: 0.55 });
    io.observe(v);
    const open = () => {
      const x = D.vlog[+v.dataset.i];
      mv.src = "/lsdv-anteprima/" + x.video;
      $(".modal-t", modal).innerHTML = `${esc(x.titolo)}<small>${esc(x.testo)}</small>`;
      modal.hidden = false; mv.play().catch(() => {}); window.__lenis && window.__lenis.stop();
      if (hasG && !RM) { const r = v.getBoundingClientRect(), mi = $(".modal-in", modal).getBoundingClientRect(); gsap.fromTo(".modal-in", { x: r.left + r.width / 2 - (mi.left + mi.width / 2), y: r.top + r.height / 2 - (mi.top + mi.height / 2), scale: r.width / mi.width, borderRadius: 22 }, { x: 0, y: 0, scale: 1, duration: 0.9, ease: "expo.inOut" }); gsap.from(modal, { backgroundColor: "rgba(40,20,10,0)", duration: 0.6 }); }
    };
    v.addEventListener("click", open); v.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  const closeModal = () => { modal.hidden = true; mv.pause(); window.__lenis && window.__lenis.start(); };
  $(".modal-x").addEventListener("click", closeModal); modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ================= IL TRALCIO DELLA RETE ================= */
  // il grappolo 3D si monta da shared/grappolo3d.js (modulo); il tralcio 2D parte solo se WebGL non c'è

  /* ================= PERCORSI ================= */
  const pmap = $(".perc-map svg");
  const bx = M.comuni.map((c) => c.x), by = M.comuni.map((c) => c.y);
  const pad = 140, vx0 = Math.min(...bx) - pad, vy0 = Math.min(...by) - pad * 1.2;
  pmap.setAttribute("viewBox", `${vx0} ${vy0} ${Math.max(...bx) - vx0 + pad * 1.6} ${Math.max(...by) - vy0 + pad * 1.2}`);
  const gR = document.createElementNS(NS, "g"); pmap.insertBefore(gR, pmap.querySelector(".pins-g"));
  const catmull = (pts) => { let d = `M${pts[0].x} ${pts[0].y}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x} ${p2.y}`; } return d; };
  let walkTw = null;
  function route(id, anim = true) {
    const pts = ORDER[id].map((c) => M.comuni.find((m) => m.id === c));
    const d = catmull(pts);
    gR.innerHTML = `<path class="route-shadow" d="${d}"/><path class="route" d="${d}"/><circle class="walker-ring" r="16"/><circle class="walker" r="8"/>`;
    $$(".perc-map .pin").forEach((p) => p.classList.toggle("on", ORDER[id].includes(p.dataset.id)));
    if (!hasG || RM) return;
    walkTw && walkTw.kill();
    gsap.fromTo($$("path", gR), { drawSVG: "0%" }, { drawSVG: "100%", duration: anim ? 2 : 0.01, ease: "power2.inOut" });
    walkTw = gsap.to([$(".walker", gR), $(".walker-ring", gR)], { motionPath: { path: $(".route", gR), align: $(".route", gR), alignOrigin: [0.5, 0.5] }, duration: pts.length * 1.6, ease: "none", repeat: -1, delay: 1.6 });
    gsap.fromTo($(".walker-ring", gR), { scale: 0.6, transformOrigin: "center" }, { scale: 1.3, opacity: 0.4, duration: 0.9, yoyo: true, repeat: -1 });
  }
  $("[data-ptabs]").addEventListener("click", (e) => { const b = e.target.closest(".ptab"); if (!b) return; $$(".ptab").forEach((x) => x.setAttribute("aria-selected", x === b)); route(b.dataset.p); });

  /* ================= EVENTI: immagine che segue ================= */
  const fl = $(".ev-float"), fli = $("img", fl);
  if (hasG && !RM && matchMedia("(hover:hover)").matches) {
    const qx = gsap.quickTo(fl, "x", { duration: 0.5, ease: "power3" }), qy = gsap.quickTo(fl, "y", { duration: 0.5, ease: "power3" });
    $$(".ev-row").forEach((r) => { r.addEventListener("pointerenter", () => { fli.src = r.dataset.img; gsap.to(fl, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: "expo.out" }); }); r.addEventListener("pointerleave", () => gsap.to(fl, { opacity: 0, scale: 0.6, duration: 0.4 })); });
    $(".ev-rows").addEventListener("pointermove", (e) => { qx(e.clientX + 170); qy(e.clientY); });
  }

  if (!hasG || RM) { route("borghi", false); return; }

  /* ================= MOTION ================= */
  const lenis = smooth({ lerp: 0.09 });

  let lastY = 0; const hd = $(".hd");
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: (st) => { const y = st.scroll(); hd.classList.toggle("solid", y > innerHeight * 0.7); lastY = y; } });
  $$('.hd-nav a[href^="#"]').forEach((a) => { const t = $(a.getAttribute("href")); if (t) ScrollTrigger.create({ trigger: t, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("on", s.isActive) }); });

  $$("section h2").forEach((h) => { const sp = SplitText.create(h, { type: "lines,words", mask: "lines" }); gsap.from(sp.words, { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 85%" } }); });

  // ---------- LA STRADA che si disegna lungo la pagina ----------
  // il tracciato passa da un margine all'altro a ogni capitolo; scorrendo, la parte percorsa diventa strada (asfalto, bordi chiari, mezzeria)
  // e un punto avanza. Disegno su un canvas fisso grande quanto lo schermo: si traccia solo il tratto visibile, quindi resta fluido.
  (function () {
    if (!hasG || RM) return;
    const cv = document.createElement("canvas"); cv.className = "strada-cv"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    let pts = [], cum = [], total = 0, dpr = 1, docH = 1, dt = 0, dv = 0, sy = 0, vh = innerHeight, lw = innerWidth;
    function costruisci() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      vh = cv.clientHeight || innerHeight; lw = innerWidth; // 100lvh: non cambia quando sul telefono compare o sparisce la barra degli indirizzi
      cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(vh * dpr);
      docH = document.documentElement.scrollHeight;
      const w = document.documentElement.clientWidth, gut = Math.max(9, Math.min(34, w * 0.02));
      const knots = $$("[data-knot]").map((el) => el.getBoundingClientRect().top + scrollY).slice(1);
      pts = []; let x = w / 2, y = innerHeight * 0.92; pts.push([x, y]);
      const linea = (nx, ny) => { const n = Math.max(1, Math.round(Math.abs(ny - y) / 40)); for (let i = 1; i <= n; i++) pts.push([x + ((nx - x) * i) / n, y + ((ny - y) * i) / n]); x = nx; y = ny; };
      const curva = (c1x, c1y, c2x, c2y, ex, ey) => { const x0 = x, y0 = y; for (let i = 1; i <= 22; i++) { const t = i / 22, u = 1 - t; pts.push([u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex, u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]); } x = ex; y = ey; };
      knots.forEach((ky, i) => { const nx = i % 2 === 0 ? w - gut : gut, cy = ky + 30; linea(x, Math.max(y, cy - 80)); curva(x, cy, nx, cy - 40, nx, cy + 40); });
      linea(x, docH - 40);
      cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      total = cum[cum.length - 1] || 1; aggiorna(true);
    }
    const primoDopo = (yy) => { let lo = 0, hi = pts.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; pts[m][1] < yy ? (lo = m + 1) : (hi = m); } return lo; };
    function punto(d) { let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; cum[m] < d ? (lo = m + 1) : (hi = m); } const i = Math.max(1, lo), t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, i]; }
    function disegna() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, -sy * dpr); ctx.clearRect(0, sy - 4, innerWidth, vh + 8);
      if (!pts.length) return;
      const i0 = Math.max(0, primoDopo(sy - 60) - 2), i1 = Math.min(pts.length - 1, primoDopo(sy + vh + 60) + 2);
      const traccia = (da, a, fine) => { ctx.beginPath(); ctx.moveTo(pts[da][0], pts[da][1]); for (let i = da + 1; i <= a; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (fine) ctx.lineTo(fine[0], fine[1]); };
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      // tratto ancora da percorrere: solo un punteggiato sottile
      ctx.setLineDash([2, 9]); ctx.strokeStyle = "rgba(68,36,19,.34)"; ctx.lineWidth = 2.4; traccia(i0, i1); ctx.stroke(); ctx.setLineDash([]);
      // tratto percorso: strada
      const q = punto(dv), iv = q[2] - 1;
      if (iv >= i0) {
        const da = i0, a = Math.min(iv, i1);
        ctx.strokeStyle = "#FCF6E1"; ctx.lineWidth = 14; traccia(da, a, iv <= i1 ? q : null); ctx.stroke();
        ctx.strokeStyle = "#442413"; ctx.lineWidth = 8.5; traccia(da, a, iv <= i1 ? q : null); ctx.stroke();
        ctx.strokeStyle = "#ADC136"; ctx.lineWidth = 1.8; ctx.setLineDash([6, 6]); traccia(da, a, iv <= i1 ? q : null); ctx.stroke(); ctx.setLineDash([]);
      }
      // il punto che avanza
      if (q[1] > sy - 20 && q[1] < sy + vh + 20) {
        ctx.fillStyle = "rgba(173,193,54,.3)"; ctx.beginPath(); ctx.arc(q[0], q[1], 15, 0, 7); ctx.fill();
        ctx.fillStyle = "#ADC136"; ctx.strokeStyle = "#442413"; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(q[0], q[1], 7.2, 0, 7); ctx.fill(); ctx.stroke();
      }
    }
    function aggiorna(forza) {
      sy = scrollY; const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      dt = (sy / max) * total; if (forza) dv = dt; disegna();
    }
    // il punto raggiunge il bersaglio con un piccolo ritardo morbido
    gsap.ticker.add(() => { sy = scrollY; const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); dt = (sy / max) * total; if (Math.abs(dt - dv) > 0.4) { dv += (dt - dv) * 0.18; disegna(); } else if (dv !== dt) { dv = dt; disegna(); } else if (cv._y !== sy) { disegna(); } cv._y = sy; });
    costruisci(); ScrollTrigger.addEventListener("refresh", costruisci); addEventListener("resize", () => { if (innerWidth !== lw) costruisci(); }); // solo se cambia la larghezza
  })();

  // il territorio come motivo del sito: curve di livello in filigrana dietro la missione
  const isec = $(".intro-sec");
  if (isec) isec.insertAdjacentHTML("afterbegin", `<div class="terr-bg" aria-hidden="true">${mapSVG({ cls: "terr-bg-svg", luoghi: false, viewBox: "0 180 1600 760" })}</div>`);


  // ---------- INTRO ----------
  const hsplit = SplitText.create(".hero-t", { type: "words", mask: "words" });
  gsap.set(hsplit.words, { yPercent: 110 }); gsap.set([".hero-act", ".hero-count"], { autoAlpha: 0, y: 20 }); gsap.set(".hero-logo path", { autoAlpha: 0 });
  function heroIn(dl = 0) {
    gsap.timeline({ delay: dl })
      .fromTo(".hero-img img", { scale: 1.3 }, { scale: 1.04, duration: 3.2, ease: "expo.out" }, 0)
      .to(".hero-logo path:first-child", { autoAlpha: 1, duration: 1.2 }, 0.2)
      .fromTo(".hero-logo path:last-child", { autoAlpha: 1, drawSVG: "0%", stroke: "#ADC136", strokeWidth: 6 }, { drawSVG: "100%", duration: 1.4, ease: "power2.inOut" }, 0.3)
      .to(hsplit.words, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.045 }, 0.5)
      .to([".hero-act", ".hero-count"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.15 }, 1.2);
  }
  const intro = $("#intro");
  if (introOnce("lsdvC")) {
    H.classList.add("intro-run"); lenis && lenis.stop();
    // la carta nasce in linea, poi il punto percorre la strada e la colora, paese per paese
    const st = window.LSDVStrada.crea($("[data-instrada]")), prog = { p: 0 };
    st.render(0);
    const tw = SplitText.create(".in-t", { type: "words", mask: "words" });
    gsap.set(tw.words, { yPercent: 110 });
    const tl = gsap.timeline();
    tl.to(prog, { p: 1, duration: 4, ease: "none", onUpdate: () => st.render(prog.p) }, 0)
      .to(tw.words, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.35)
      .addLabel("out", 4.05)
      .to(tw.words, { yPercent: -110, duration: 0.4, ease: "power3.in", stagger: 0.03 }, "out")
      .to(intro, { opacity: 0, duration: 0.55, ease: "power1.out" }, "out+=0.1")
      .add(() => heroIn(0), "out+=0.3")
      .add(() => { H.classList.remove("intro-run"); intro.remove(); lenis && lenis.start(); ScrollTrigger.refresh(); }, "out+=0.75");
    const skip = () => tl.timeScale(5);
    $(".in-skip").addEventListener("click", skip); addEventListener("wheel", skip, { once: true, passive: true }); addEventListener("touchmove", skip, { once: true, passive: true }); addEventListener("keydown", (e) => e.key === "Escape" && skip(), { once: true });
  } else { intro.remove(); heroIn(0.1); }
  gsap.to(".hero-img img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // ---------- missione parola per parola ----------
  const bw = SplitText.create("[data-missione]", { type: "words", wordsClass: "w" });
  gsap.to(bw.words, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".big", start: "top 80%", end: "bottom 45%", scrub: true } });
  $$("[data-count]").forEach((c) => { c.textContent = "0"; ScrollTrigger.create({ trigger: c, start: "top 90%", once: true, onEnter: () => counter(c, +c.dataset.count, 1.8) }); });
  gsap.from(".num", { y: 60, rotate: (i) => [-3, 2, -2, 3][i], autoAlpha: 0, stagger: 0.1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".nums", start: "top 85%" } });

  // ---------- voci ----------
  gsap.from(".voce", { y: 140, rotate: (i) => (i % 2 ? 5 : -5), autoAlpha: 0, stagger: 0.12, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".voci-row", start: "top 85%" } });
  gsap.fromTo(".voci", { borderRadius: "120px 120px 0 0" }, { borderRadius: "40px 40px 0 0", ease: "none", scrollTrigger: { trigger: ".voci", start: "top bottom", end: "top 40%", scrub: true } });

  // ---------- costellazione e percorsi ----------
  ScrollTrigger.create({ trigger: ".perc-map", start: "top 70%", once: true, onEnter: () => route("borghi") });
  gsap.from(".ptab", { x: -40, autoAlpha: 0, stagger: 0.1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".perc-tabs", start: "top 85%" } });

  // ---------- mazzo della storia ----------
  const cards = $$(".scard");
  cards.forEach((c, i) => {
    if (i < cards.length - 1) gsap.to(c, { scale: 0.94, ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 110px", scrub: true } });
    gsap.from($$("h3,p,.src", c), { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 80%" } });
  });

  // ---------- eventi, magazine, adesione ----------
  gsap.from(".ev-row", { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".ev-rows", start: "top 85%" } });
  gsap.from(".art", { y: 80, autoAlpha: 0, stagger: 0.1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".mag-grid", start: "top 85%" } });
  gsap.from(".card3d", { rotateY: -40, rotateX: 20, autoAlpha: 0, y: 60, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".ad-flow", start: "top 80%" } });
  gsap.from(".card-thread path", { drawSVG: "0%", duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: ".ad-flow", start: "top 75%" } });
  gsap.from(".passi li", { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ".passi", start: "top 90%" } });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
