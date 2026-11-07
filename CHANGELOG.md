# Changelog - GymLink

Tutte le modifiche rilevanti a questo progetto saranno documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

---

