// Modulo di adesione: tre passaggi, stessa validazione del server (valida.mjs), invio JSON a /api/adesione.
import { valida } from "/lsdv-anteprima/shared/valida.mjs";

const form = document.querySelector("[data-form]");
const passi = [...form.querySelectorAll("[data-step]")];
const avviso = form.querySelector("[data-avviso]");
const barra = form.querySelector("[data-progress]");
const card = document.querySelector("[data-card]");
const inizio = Date.now();
let passo = 0;

const dati = () => {
  const d = Object.fromEntries(new FormData(form));
  form.querySelectorAll("input[type=checkbox]").forEach((c) => (d[c.name] = c.checked));
  return d;
};
const campo = (nome) => form.elements[nome];
// visibile = non dentro un blocco persona/ente nascosto (i passi nascosti contano come visibili)
const visibile = (el) => el && !el.closest("[data-solo][hidden]");

// Persona o ente: mostra e nasconde i blocchi [data-solo]
function tipo() {
  const t = dati().tipo;
  form.querySelectorAll("[data-solo]").forEach((el) => (el.hidden = el.dataset.solo !== t));
}

function categoria() {
  const r = form.querySelector("input[name=categoria]:checked");
  const nota = form.querySelector("[data-catdesc]");
  nota.textContent = r ? r.closest("label").dataset.desc : "";
  if (card) card.querySelector("[data-ccat]").textContent = r ? r.closest("label").textContent.trim() : "Categoria";
}

function pulisci() {
  form.querySelectorAll(".fld-err").forEach((e) => e.remove());
  form.querySelectorAll(".err").forEach((e) => e.classList.remove("err"));
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
  avviso.hidden = true;
}

// Quando l'utente corregge un campo, il suo errore sparisce (il controllo vero si rifà all'invio).
form.addEventListener("change", (e) => {
  const err = document.getElementById("err-" + e.target.name);
  if (!err) return;
  err.remove();
  (e.target.closest(".cats") || e.target.closest(".fld"))?.classList.remove("err");
  form.querySelectorAll(`[name="${e.target.name}"]`).forEach((x) => { x.removeAttribute("aria-invalid"); x.removeAttribute("aria-describedby"); });
});

// Mostra gli errori dei campi visibili del passo indicato. Ritorna il numero di errori mostrati.
function mostra(errori, quale) {
  let primo = null, n = 0;
  for (const [nome, msg] of Object.entries(errori)) {
    const el = campo(nome);
    const nodo = el instanceof RadioNodeList ? el[0] : el;
    if (!visibile(nodo) || !passi[quale].contains(nodo)) continue;
    n++;
    const box = nodo.type === "radio" ? nodo.closest(".cats") : nodo.closest(".fld");
    box.classList.add("err");
    const p = document.createElement("span");
    p.className = "fld-err";
    p.id = "err-" + nome;
    p.textContent = msg;
    if (nodo.type === "radio") box.after(p);
    else if (nodo.type === "checkbox") box.querySelector("span").append(p);
    else box.append(p);
    (el instanceof RadioNodeList ? [...el] : [el]).forEach((x) => { x.setAttribute("aria-invalid", "true"); x.setAttribute("aria-describedby", p.id); });
    primo ??= nodo;
  }
  if (primo) primo.focus();
  return n;
}

function vai(i, sposta = true) {
  passo = i;
  passi.forEach((f, j) => (f.hidden = j !== i));
  barra.style.setProperty("--p", i / (passi.length - 1));
  if (!sposta) return;
  const titolo = passi[i].querySelector("legend:not([hidden])");
  titolo?.setAttribute("tabindex", "-1");
  titolo?.focus({ preventScroll: true });
  form.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

const nodo = (k) => { const el = campo(k); return el instanceof RadioNodeList ? el[0] : el; };
const primoPassoConErrori = (errori) => passi.findIndex((f) => Object.keys(errori).some((k) => visibile(nodo(k)) && f.contains(nodo(k))));

form.addEventListener("change", (e) => {
  if (e.target.name === "tipo") tipo();
  if (e.target.name === "categoria") categoria();
});
form.addEventListener("input", (e) => {
  if (card && (e.target.name === "nome" || e.target.name === "cognome" || e.target.name === "ente_nome")) {
    const d = dati();
    card.querySelector("[data-cname]").textContent = (d.tipo === "ente" && d.ente_nome) || `${d.nome || ""} ${d.cognome || ""}`.trim() || "Il tuo nome";
  }
});

form.addEventListener("click", (e) => {
  if (e.target.closest("[data-prev]")) { pulisci(); vai(passo - 1); }
  if (e.target.closest("[data-next]")) {
    pulisci();
    const { errori } = valida(dati());
    if (!mostra(errori, passo)) vai(passo + 1);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  pulisci();
  const d = dati();
  const { errori } = valida(d);
  if (Object.keys(errori).length) {
    const i = primoPassoConErrori(errori);
    if (i >= 0 && i !== passo) vai(i);
    if (!mostra(errori, i >= 0 ? i : passo)) { avviso.textContent = Object.values(errori)[0]; avviso.hidden = false; }
    return;
  }
  const bottone = form.querySelector("[type=submit]");
  bottone.disabled = true;
  try {
    const r = await fetch(form.action, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...d, tempo: Date.now() - inizio }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) return fatto(j);
    if (j.errori) {
      const i = primoPassoConErrori(j.errori);
      if (i >= 0) vai(i);
      if (!mostra(j.errori, i >= 0 ? i : passo)) { avviso.textContent = Object.values(j.errori)[0]; avviso.hidden = false; }
    } else {
      avviso.textContent = {
        troppi: "Abbiamo ricevuto troppe domande da questa connessione. Riprova tra un'ora.",
        invio: "Non siamo riusciti a inviare l'email di conferma. Controlla l'indirizzo e riprova tra qualche minuto.",
      }[j.errore] || "La domanda non è partita per un problema tecnico. Riprova tra qualche minuto oppure scrivi a info@stradadelvino.org.";
      avviso.hidden = false;
      avviso.focus?.();
    }
  } catch {
    avviso.textContent = "Connessione assente: la domanda non è partita. Controlla la rete e riprova.";
    avviso.hidden = false;
  } finally {
    bottone.disabled = false;
  }
});

function fatto(j) {
  passi.forEach((f) => (f.hidden = true));
  barra.style.setProperty("--p", 1);
  const ok = form.querySelector("[data-ok]");
  ok.hidden = false;
  if (j.dev_link) {
    const p = ok.querySelector("[data-devlink]");
    p.hidden = false;
    p.innerHTML = "Prova in locale: <a></a>";
    p.querySelector("a").href = p.querySelector("a").textContent = j.dev_link;
  }
  ok.focus();
  card?.classList.add("flip");
}

// Riflesso sulla tessera che segue il puntatore
card?.addEventListener("pointermove", (e) => {
  const r = card.getBoundingClientRect();
  card.style.setProperty("--gx", ((e.clientX - r.left) / r.width) * 100 + "%");
  card.style.setProperty("--gy", ((e.clientY - r.top) / r.height) * 100 + "%");
});

tipo();
categoria();
vai(0, false);
