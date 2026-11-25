// Regole della domanda di ammissione a socio. Lo stesso file gira nel browser
// (pagina /aderisci/) e sul server (functions/api/adesione.js): il server decide.

export const CATEGORIE = ["cantine", "ristorazione", "ospitalita", "agroalimentare", "cultura", "enti", "sostenitori"];

// Versione dell'informativa sul trattamento dei dati mostrata nel modulo.
export const INFORMATIVA = "2026-11";

// Colonne della tabella "domande" riempite dal modulo, nello stesso ordine di "puliti".
export const CAMPI = [
  "tipo", "categoria", "nome", "cognome", "nascita_data", "nascita_luogo", "codice_fiscale",
  "indirizzo", "cap", "comune", "provincia", "nazione", "email", "telefono",
  "ente_nome", "ente_cf", "ente_sede", "ente_pec", "ente_sito", "messaggio",
  "dich_statuto", "dich_informativa", "dich_rappresentante", "cons_newsletter", "cons_scheda",
];

const DISPARI = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
const OMOCODIA = "LMNPQRSTUV"; // lettere che sostituiscono le cifre 0-9 nei codici omocodici
const MESI = "ABCDEHLMPRST";
const RE_CF = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
const RE_EMAIL = /^[^\s@<>()[\],;:"']+@[^\s@<>()[\],;:"']+\.[^\s@<>()[\],;:"']{2,}$/; // niente caratteri da intestazioni o HTML

export function cfValido(cf) {
  if (!RE_CF.test(cf)) return false;
  let s = 0;
  for (let i = 0; i < 15; i++) {
    const c = cf.charCodeAt(i), n = c < 65 ? c - 48 : c - 65;
    s += i % 2 === 0 ? DISPARI[n] : n;
  }
  return cf[15] === String.fromCharCode(65 + (s % 26));
}

// Anno (due cifre), mese e giorno scritti nel codice fiscale. Le donne hanno il giorno + 40.
export function cfNascita(cf) {
  const cifra = (c) => (OMOCODIA.includes(c) ? OMOCODIA.indexOf(c) : +c);
  const g = cifra(cf[9]) * 10 + cifra(cf[10]);
  return { aa: cifra(cf[6]) * 10 + cifra(cf[7]), mm: MESI.indexOf(cf[8]) + 1, gg: g > 40 ? g - 40 : g };
}

// Partita IVA e codice fiscale numerico di enti e società: 11 cifre con cifra di controllo.
export function pivaValida(p) {
  if (!/^\d{11}$/.test(p)) return false;
  let s = 0;
  for (let i = 0; i < 11; i++) {
    let n = +p[i];
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    s += n;
  }
  return s % 10 === 0;
}

export const emailValida = (e) => e.length <= 254 && RE_EMAIL.test(e);

const dataValida = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === iso;
};

function eta(iso, oggi) {
  const [a, m, g] = iso.split("-").map(Number);
  const prima = oggi.getMonth() + 1 < m || (oggi.getMonth() + 1 === m && oggi.getDate() < g);
  return oggi.getFullYear() - a - (prima ? 1 : 0);
}

const si = (v) => (v === true || v === 1 || v === "1" || v === "on" ? 1 : 0);

// d: i campi del modulo. Restituisce { ok, errori: {campo: messaggio}, puliti }.
export function valida(d, oggi = new Date()) {
  const e = {}, p = {};
  const testo = (k, max) => (p[k] = String(d[k] ?? "").replace(/\s+/g, " ").trim().slice(0, max));
  const vuoto = (...chiavi) => chiavi.forEach((k) => (p[k] = ""));

  p.tipo = d.tipo === "ente" ? "ente" : "persona";
  if (d.tipo !== "persona" && d.tipo !== "ente") e.tipo = "Indica se presenti la domanda per te o per un'azienda o un ente.";
  const ente = p.tipo === "ente";

  p.categoria = CATEGORIE.includes(d.categoria) ? d.categoria : "";
  if (!p.categoria) e.categoria = "Scegli una categoria.";
  else if (p.categoria === "enti" && !ente) e.categoria = "Per un ente o un'istituzione la domanda la presenta il legale rappresentante: scegli «Un'azienda o un ente».";

  if (!testo("nome", 80)) e.nome = "Scrivi il nome.";
  if (!testo("cognome", 80)) e.cognome = "Scrivi il cognome.";

  testo("nascita_data", 10);
  if (!dataValida(p.nascita_data)) e.nascita_data = "Indica la data di nascita.";
  else {
    const anni = eta(p.nascita_data, oggi);
    if (anni < 18) e.nascita_data = "La domanda è riservata ai maggiorenni.";
    else if (anni > 120) e.nascita_data = "Controlla l'anno di nascita.";
  }
  if (!testo("nascita_luogo", 80)) e.nascita_luogo = "Scrivi il comune o lo stato di nascita.";

  // Residenza: solo per le persone. Per un ente vale la sede.
  if (ente) vuoto("indirizzo", "cap", "comune", "provincia", "nazione");
  else {
    if (!testo("indirizzo", 120)) e.indirizzo = "Scrivi via e numero civico.";
    if (!testo("comune", 80)) e.comune = "Scrivi il comune di residenza.";
    if (!testo("nazione", 60)) p.nazione = "Italia";
    testo("cap", 12);
    p.provincia = testo("provincia", 30).toUpperCase();
    if (p.nazione.toLowerCase() === "italia") {
      p.nazione = "Italia";
      if (!/^\d{5}$/.test(p.cap)) e.cap = "Il CAP ha 5 cifre.";
      if (!/^[A-Z]{2}$/.test(p.provincia)) e.provincia = "Scrivi la sigla della provincia, per esempio CE.";
    } else if (!p.cap) e.cap = "Scrivi il codice postale.";
  }

  // Codice fiscale: facoltativo solo per chi risiede all'estero e non lo ha.
  p.codice_fiscale = String(d.codice_fiscale ?? "").replace(/\s+/g, "").toUpperCase().slice(0, 16);
  const cfServe = ente || p.nazione === "Italia";
  if (!p.codice_fiscale) { if (cfServe) e.codice_fiscale = "Scrivi il codice fiscale."; }
  else if (!cfValido(p.codice_fiscale)) e.codice_fiscale = "Il codice fiscale non è corretto: controlla i 16 caratteri.";
  else if (!e.nascita_data) {
    const n = cfNascita(p.codice_fiscale), [a, m, g] = p.nascita_data.split("-").map(Number);
    if (n.aa !== a % 100 || n.mm !== m || n.gg !== g) e.codice_fiscale = "Il codice fiscale non corrisponde alla data di nascita.";
  }

  p.email = testo("email", 254).toLowerCase();
  if (!emailValida(p.email)) e.email = "Scrivi un indirizzo email valido: ti serve per confermare la domanda.";
  if (testo("telefono", 20) && !/^\+?[\d\s./-]{6,20}$/.test(p.telefono)) e.telefono = "Controlla il numero di telefono.";

  if (!ente) vuoto("ente_nome", "ente_cf", "ente_sede", "ente_pec", "ente_sito");
  else {
    if (!testo("ente_nome", 160)) e.ente_nome = "Scrivi la denominazione o ragione sociale.";
    p.ente_cf = String(d.ente_cf ?? "").replace(/\s+/g, "").toUpperCase().replace(/^IT(?=\d{11}$)/, "").slice(0, 16);
    if (!pivaValida(p.ente_cf) && !cfValido(p.ente_cf)) e.ente_cf = "Scrivi la partita IVA o il codice fiscale dell'azienda o dell'ente.";
    if (!testo("ente_sede", 200)) e.ente_sede = "Scrivi l'indirizzo della sede.";
    p.ente_pec = testo("ente_pec", 254).toLowerCase();
    if (p.ente_pec && !emailValida(p.ente_pec)) e.ente_pec = "Controlla l'indirizzo PEC.";
    if (testo("ente_sito", 200) && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(p.ente_sito)) e.ente_sito = "Scrivi l'indirizzo completo, per esempio https://www.esempio.it";
  }

  p.messaggio = String(d.messaggio ?? "").trim();
  if (p.messaggio.length > 1000) e.messaggio = "Il messaggio supera i 1000 caratteri.";

  p.dich_statuto = si(d.dich_statuto);
  p.dich_informativa = si(d.dich_informativa);
  p.dich_rappresentante = ente ? si(d.dich_rappresentante) : 0;
  p.cons_newsletter = si(d.cons_newsletter);
  p.cons_scheda = si(d.cons_scheda);
  if (!p.dich_statuto) e.dich_statuto = "Per presentare la domanda devi dichiarare di aver letto lo statuto.";
  if (!p.dich_informativa) e.dich_informativa = "Per presentare la domanda devi dichiarare di aver letto l'informativa.";
  if (ente && !p.dich_rappresentante) e.dich_rappresentante = "Per un'azienda o un ente la domanda la firma il legale rappresentante.";

  return { ok: !Object.keys(e).length, errori: e, puliti: p };
}
