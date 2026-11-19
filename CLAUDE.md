# LSDV anteprima (GitHub Pages, temporanea)

Copia statica del sito `ldvmediazione-dot/lsdv-sito` (cartella `sito/`), pubblicata su
https://ldvmediazione-dot.github.io/lsdv-anteprima/ per 49 ore. Repo pubblico: serve al piano gratuito di Pages.

- Niente PHP: moduli, newsletter e area riservata non funzionano (avviso fisso in fondo alle pagine).
- Tutte le pagine hanno `noindex, nofollow` e robots.txt blocca tutto.
- Scadenza in `.github/workflows/pagine.yml` (variabile SCADENZA, ora UTC): dopo quell'ora il workflow orario
  pubblica la pagina "Questa anteprima non è più disponibile" e si disattiva.
- Rifare la copia: in lsdv-sito `python scripts/build.py --sito=https://ldvmediazione-dot.github.io/lsdv-anteprima`,
  poi `python -I ../lsdv-anteprima/scripts/prepara.py`, poi di nuovo `python scripts/build.py` (rimette gli indirizzi normali).
  prepara.py riscrive i percorsi assoluti `/...` in `/lsdv-anteprima/...`.
- Finita l'anteprima il repo si può rendere privato o cancellare (chiedere prima all'utente).
