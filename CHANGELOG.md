# Changelog - GymLink

Tutte le modifiche rilevanti a questo progetto saranno documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.4] - 2026-11-24 (Traduttore Esercizi IT/EN/ES, Cronometro Attivo & Animazioni Guidate)

### 🌍 Internazionalizzazione Esercizi
- **Traduzione Completa Titoli Esercizi (`src/services/exerciseService.js`):**
  - Introdotta ricerca bidirezionale (`IT ↔ EN ↔ ES`) su dizionario curato con priorità esatta/lunghezza chiave.
  - Aggiunto **traduttore composizionale leggero** locale (zero chiamate esterne, < 2 KB) per tradurre automaticamente in Italiano e Spagnolo tutti i 1300+ esercizi del catalogo preservando invariati gli esercizi personalizzati (`isCustom: true`).

### ✨ Animazioni & Cronometro "Allenamento Guidato" (`GuidedWorkoutModal.jsx` + `index.css`)
- **Cronometro di Attività Effettiva Raddoppiato:** posizionato in alto sopra la barra percentuale; conta **solo il tempo reale di lavoro** fermandosi automaticamente durante il recupero e tra un esercizio e l'altro, riprendendo al secondo esatto alla serie successiva. Barra di avanzamento raddoppiata in altezza.
- **Sequenza Animata in 3 Fasi ad ogni nuova serie:**
  1. Il riquadro dell'istruzione si ingrandisce con effetto fascio di luce luminosa e si riposiziona dolcemente.
  2. Parte il conto alla rovescia ingrandito **`3` ➔ `2` ➔ `1`**.
  3. Il badge **`GO!`** con doppie frecce lampeggia e scorre in loop da sinistra a destra (colore verde in tema chiaro).
- **Badge `RECUPERO` a Battito Cardiaco:** durante il conto alla rovescia di recupero compare un badge arancione fermo sul posto con animazione a doppio battito cardiaco.
- **Animazioni di Festeggiamento App-Style:**
  - **Completamento singolo esercizio:** card con flash luminoso, doppia onda d'urto radiale, 12 scintille e testo animato a cascata sopra alle 100 frasi motivazionali.
  - **Completamento allenamento:** pioggia di coriandoli non bloccante, trofeo eroico fluttuante con scintille e riepilogo statistico sfalsato.

---

## [1.1.3] - 2026-11-23 (Allenamento Guidato, Piramidali & Mobile UX Fix)

### 🛠️ Bug Fix & UX Mobile
- **Nomi esercizi completi su Smartphone:** risolto il troncamento dei titoli degli esercizi nell'Editor PT (`src/pages/EditorPage.jsx`), nel Database Esercizi (`src/components/ExerciseSearchModal.jsx`) e nella scheda cliente (`src/pages/WorkoutViewPage.jsx`) riorganizzando i controlli su righe dedicate su mobile.
- **Piramidali compatti su 1 riga anche da mobile:** in fase di compilazione scheda, ogni serie differenziata (`S1`–`S5`) viene mostrata su una singola riga orizzontale allineata (`S1 | Reps | Carico | Recupero`), identica alla vista atleta.

### ✨ Nuove Funzionalità
- **Serie Differenziate per Righe (Piramidali, max 5 serie):**
  - Toggle opzionale **"Dividi serie (Piramidale)"** nell'Editor per impostare Reps, Carico e Recupero specifici per ciascuna serie (`S1`–`S5`).
  - Vista estesa lato cliente dedicata con una riga interattiva per ogni serie, peso modificabile al tocco e pulsante recupero singolo.
  - Storico giornaliero aggiornato con snapshot completo delle 5 serie (con regola di sovrascrittura nello stesso giorno) e filtro per singola serie / picco `Max` nel grafico Trendline.
  - Esportazione **CSV Excel** aggiornata a 10 colonne con 5 colonne peso dedicate (`Serie 1`..`Serie 5`); per gli esercizi classici non divisi il carico viene inserito in `Serie 1`.
- **Smarcamento Manuale delle Singole Serie & Salvataggio Giornaliero:**
  - Anche fuori dalla modalità guidata è possibile spuntare manualmente ogni singola serie (`S1`, `S2`…) sia sugli esercizi piramidali che su quelli classici (barra dedicata), con spunta automatica dell'esercizio al completamento di tutte le serie e persistenza giornaliera su `localStorage`.
- **Modalità "Allenamento Guidato" (Focus step-by-step):**
  - Pulsante **"▶ Allenamento Guidato"** nella scheda atleta con scelta della giornata e visualizzazione dedicata a singolo esercizio.
  - Barra di progressione e percentuale calcolate sul **numero totale di serie della giornata**.
  - Guida chiara serie per serie con **timer zoomato ad alta leggibilità**, supporto Wake Lock e riacquisizione automatica al risveglio schermo, pausa, **Salta recupero / Avanti** e **Modifica peso al volo**.
  - **Salvataggio continuo e Ripresa Automatica:** se lo schermo del cellulare si spegne o il browser va in risparmio energetico/riavvio, alla riapertura un prompt dedicato consente di riprendere l'Allenamento Guidato esattamente dall'esercizio, serie o recupero in corso.
  - Avanzamento automatico allo scadere del timer con smarcamento delle serie, spunta automatica dell'esercizio completato e **100 frasi di incoraggiamento** variegate con intestazione ordinale (*"Primo esercizio completato!"*).
  - Pulsante diretto **"🏁 Completa Allenamento"** sull'ultima serie dell'ultimo esercizio e schermata celebrativa finale.
- **Guide & Manuali:** aggiornati Guida Atleta (`/guida`) e Manuale PT (`/tutorial`) alla `V1.1.3` in tutte e 3 le lingue (`IT / EN / ES`).

---

## [1.1.0] - 2026-11-07 (Enhanced Athlete Experience & Progression Analytics)

Aggiornamento mirato al miglioramento dell'esperienza utente in sala pesi, tracciamento del sovraccarico progressivo e supporto multilingua completo.

### ✨ Novità & Funzionalità Core (v1.1)
- **Doppia Modalità di Visualizzazione (Elenco Compatto vs Dettagli Estesi):**
  - Switcher rapido nella scheda per passare dalla modalità **Elenco** (sintetica, titolo ed esercizio in grassetto ingrandito con numero identificativo `#`, serie x reps e timer recupero a un tocco) alla modalità **Dettagli** con dimostrazioni biomeccaniche complete.
  - La preferenza utente viene memorizzata localmente (`gymlink_view_mode`).
- **Tracciamento Sovraccarico Progressivo & Aggiornamento Pesi:**
  - Gli atleti possono modificare il carico direttamente durante l'allenamento con sincronizzazione istantanea su cloud.
  - **Regola di consolidamento giornaliero:** Più modifiche apportate nello stesso giorno vengono unificate sull'ultimo carico registrato, evitando frammentazioni.
  - Alla prima modifica del carico viene automaticamente congelato il valore di partenza come punto base storico.
- **Grafico di Progressione & Trendline a 3 Mesi:**
  - Modale interattiva SVG per singolo esercizio con visualizzazione dell'andamento dei carichi a finestre trimestrali (~12 settimane).
  - Calcolo matematico della linea di tendenza (regressione lineare `m*x + q`) con indicazione di andamento (positivo, calante, stabile).
  - Navigazione temporale a ritroso (`← Trimestre Prec.` / `Trimestre Succ. →`) e date esatte sotto ogni punto.
  - Messaggio informativo di guida iniziale quando l'esercizio non ha ancora registrato variazioni.
- **Esportazione Globale Dati & Analisi per PT / AI:**
  - Modulo "📊 Progressioni & Scarica Dati" accessibile dalla testata della scheda.
  - Download di file CSV Excel con struttura tabellare analitica: una riga per ogni variazione con colonne ordinate (`Esercizio, Target, Serie, Reps, Peso, Data`).
  - Pulsante 1-click per copiare la tabella formattata pronta per consultare un'AI (ChatGPT, Claude, Gemini) o il proprio Personal Trainer.
- **Supporto Template Cross-Device ("Usa come Template"):**
  - Possibilità di clonare qualsiasi scheda esistente incollando link o ID nella Home (anche da un dispositivo diverso dal creatore).
  - La duplicazione azzera il nome del cliente e lo storico carichi per il nuovo atleta, generando un nuovo ID univoco (`nanoid(10)`).
- **Internazionalizzazione e Traduzione Completa Dinamica (IT / EN / ES):**
  - Normalizzazione bidirezionale di tutti i gruppi muscolari e delle attrezzature (`translateTarget` & `translateEquipment`).
  - Traduzione automatica dei titoli degli esercizi standard del catalogo (`getExerciseDisplayName`) tra Italiano, Inglese e Spagnolo.
  - Sincronizzazione dinamica reattiva nell'Editor e nella Scheda Cliente al cambio lingua nella navbar.
  - Traduzione completa di descrizioni biomeccaniche e spiegazioni del movimento.
- **Aggiornamento Guide e Manuali:**
  - **Guida Atleta (`/guida`):** Aggiornata con 10 passaggi illustrati (modalità elenco/dettagli, tracciamento pesi, grafici trimestrali, export CSV e sicurezza del link personale).
  - **Manuale Personal Trainer (`/tutorial`):** Aggiornato alla v1.1 con sezione dedicata al sovraccarico progressivo, template cross-device ed export per AI/periodizzazione.
- **Miglioramenti Grafici & Privacy:**
  - Tema Chiaro impostato come default iniziale per nuovi visitatori, preservando le scelte manuali in `localStorage`.
  - Stacco visivo migliorato per le card degli esercizi sia in modalità scura (card sopraelevate con sfondo profondo e bordi smeraldo) che in modalità chiara (ombreggiatura volumetrica morbida).
  - Avviso di riservatezza link aggiunto nella modale di salvataggio e nel messaggio precompilato di WhatsApp.
  - Icona GitHub posizionata esclusivamente nel Footer.

---

## [1.0.0] - 2026-11-05 (Production Release)

Punto fermo di rilascio stabile della prima versione di produzione di **GymLink**.

### ✨ Novità & Funzionalità Core
- **Zero-Friction PT & Atleti:** Creazione e condivisione istantanea delle routine senza obbligo di registrazione o login per gli utenti.
- **BaaS Cloud su Supabase:** Salvataggio sul cloud PostgreSQL con generazione di link unici crittografici a 10 caratteri (`nanoid(10)`).
- **Condivisione Rapida:** Condivisione 1-click su WhatsApp con messaggio formattato personalizzato e generazione file PDF pronto per la stampa in sala pesi.
- **Interfaccia Workout per l'Atleta (`/w/:id`):**
  - Timer sonoro di recupero con preset (30s, 60s, 90s, 120s, 180s) e pulsanti rapidi `+15s` / `-15s`.
  - Spunte interattive per serie completate con salvataggio dello stato di sessione.
  - Modalità Focus / Fullscreen ad alto contrasto per la sala pesi.
  - Logo GymLink bloccato in sola lettura durante l'allenamento per evitare uscite accidentali.
- **Catalogo Esercizi Completo:** Ricerca rapida per gruppo muscolare, attrezzo, RPE e note sul tempo di esecuzione con miniature ingrandite (`80px` mobile, `96px` desktop).
- **Console di Manutenzione Amministratore (`/admin` & `/manutenzione`):**
  - Accesso protetto da master PIN.
  - Filtri 1-click per eliminare schede di prova (≤1 ex, >15gg) e schede zombie (0 view, >90gg).
  - Filtri manuali componibili per testo, numero esercizi, data e visualizzazioni.
  - Esportazione completa Backup JSON e **Ripristino / Upload con Upsert sicuro** (ripristina le schede mantenendo gli stessi ID e i link originali).
- **Privacy, Analytics & Legal:**
  - Banner Cookie GDPR: Google Analytics 4 (`G-MLHZ84YNZC`) caricato solo su consenso esplicito.
  - Licenza protetta **Creative Commons Non-Commerciale (CC BY-NC 4.0)** che vieta l'uso a scopo di lucro a terzi.
  - File `public/robots.txt` per proteggere le routine private dei clienti dai motori di ricerca.
- **Hosting & CI/CD:** Distribuzione continua su **Cloudflare Pages** con routing SPA (`_redirects`) e supporto Node 20.

