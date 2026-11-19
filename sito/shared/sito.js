// Comune a tutte le pagine interne e al piede della home: menu mobile, newsletter, modulo contatti, esito dei collegamenti email.
(() => {
  // Menu mobile
  const burger = document.querySelector(".hd-burger"), mnav = document.getElementById("mnav");
  if (burger && mnav && !burger.dataset.core) {
    const apri = (si) => { burger.setAttribute("aria-expanded", si); mnav.hidden = !si; document.body.style.overflow = si ? "hidden" : ""; };
    burger.addEventListener("click", () => apri(mnav.hidden));
    mnav.addEventListener("click", (e) => e.target.closest("a") && apri(false));
    addEventListener("keydown", (e) => e.key === "Escape" && !mnav.hidden && (apri(false), burger.focus()));
  }

  // Newsletter con doppia conferma
  document.querySelectorAll("[data-nl]").forEach((f) => {
    const msg = f.querySelector("[role=status]");
    const scrivi = (t) => { msg.textContent = t; f.classList.add("ok"); };
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = f.elements.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return scrivi("Scrivi un indirizzo email valido."), f.elements.email.focus();
      const b = f.querySelector("button");
      b.disabled = true;
      try {
        const r = await fetch("/lsdv-anteprima/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, website: f.elements.website.value }) });
        const j = await r.json().catch(() => ({}));
        if (j.ok) { scrivi("Ti abbiamo scritto: apri il collegamento nell'email per confermare l'iscrizione."); f.elements.email.value = ""; if (j.dev_link) console.info("Conferma in locale:", j.dev_link); }
        else scrivi(j.errori?.email || (j.errore === "troppi" ? "Troppi tentativi da questa connessione. Riprova tra un'ora." : "Iscrizione non riuscita per un problema tecnico. Riprova più tardi."));
      } catch { scrivi("Connessione assente. Riprova tra poco."); }
      b.disabled = false;
    });
  });

  // Modulo contatti: errori sotto ai campi, esito nel riquadro di stato
  document.querySelectorAll("[data-contatto]").forEach((f) => {
    const inizio = Date.now(), msg = f.querySelector("[role=status]"), b = f.querySelector("button");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      f.querySelectorAll(".fld-err").forEach((x) => x.remove());
      f.querySelectorAll("[aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
      const el = f.elements, d = { nome: el.nome.value, email: el.email.value, messaggio: el.messaggio.value, privacy: el.privacy.checked, website: el.website.value, tempo: Date.now() - inizio };
      b.disabled = true; msg.textContent = "Invio in corso…";
      try {
        const r = await fetch("/lsdv-anteprima/api/contatto", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
        const j = await r.json().catch(() => ({}));
        if (j.ok) { f.reset(); msg.textContent = "Messaggio inviato. Ti rispondiamo per email appena possibile."; }
        else if (j.errori) {
          Object.entries(j.errori).forEach(([k, t]) => {
            const c = el[k], s = document.createElement("span");
            s.className = "fld-err"; s.id = "err-" + k; s.textContent = t;
            c.setAttribute("aria-invalid", "true"); c.setAttribute("aria-describedby", s.id);
            c.closest(".fld").append(s);
          });
          msg.textContent = "Controlla i campi segnati.";
          el[Object.keys(j.errori)[0]].focus();
        } else msg.textContent = j.errore === "troppi" ? "Troppi messaggi da questa connessione. Riprova tra un'ora." : "Invio non riuscito per un problema tecnico. Scrivici direttamente per email.";
      } catch { msg.textContent = "Connessione assente. Riprova tra poco."; }
      b.disabled = false;
    });
  });

  // Pagina /aderisci/esito/: mostra il messaggio indicato da ?s=
  const esiti = document.querySelectorAll("[data-esito]");
  if (esiti.length) {
    const s = new URLSearchParams(location.search).get("s") || "";
    const scelto = [...esiti].find((el) => el.dataset.esito === s) || [...esiti].find((el) => el.dataset.esito === "");
    esiti.forEach((el) => (el.hidden = el !== scelto));
    document.querySelectorAll("[data-solo-esito]").forEach((el) => (el.hidden = el.dataset.soloEsito !== s));
    const h = scelto.querySelector("h1");
    if (h) document.title = h.textContent + " · Strada del Vino";
  }

  // Storia: evidenzia nell'indice la tappa che si sta leggendo
  const voci = document.querySelectorAll(".tl-indice a");
  if (voci.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((ee) => ee.forEach((x) => {
      if (!x.isIntersecting) return;
      voci.forEach((a) => {
        const on = a.hash === "#" + x.target.id;
        a.classList.toggle("on", on);
        if (on) { a.setAttribute("aria-current", "location"); a.scrollIntoView({ block: "nearest", inline: "center" }); } else a.removeAttribute("aria-current");
      });
    }), { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll(".tl-cap").forEach((c) => io.observe(c));
  }
})();
