# GymLink — Roadmap di Prodotto (v1.1 & v2.0)

> **Ultimo aggiornamento:** 07 Novembre 2026  
> **Stato attuale:** `v1.0.0` rilasciata e taggata su GitHub / Cloudflare Pages.  
> **Obiettivo corrente:** Sviluppo, test e rilascio della **Versione `v1.1.0`** oggi stesso.

---

## 🚀 VERSIONE 1.1.0 — Esperienza Atleta Evoluta, Progressioni & Multilingua (OGGI)

### ✅ 1. UI/UX & Design System (Già verificato in locale)
- **Tema Chiaro di Default:** Light Theme impostato come predefinito al primo accesso (con persistenza delle scelte successive in `localStorage`).
- **Stacco Visivo & Profondità Card Esercizi:** Superficie elevata con ombreggiatura multilivello su tema scuro (`#0d1e17`) e ombra morbida tridimensionale su tema chiaro; spaziatura maggiorata tra gli esercizi.
- **Gerarchia Tipografica Potenziata:** Badge numero esercizio (`#1`, `#2`) ingranditi e titolo esercizio più grande e in grassetto (`font-black`).
- **Doppia Modalità di Visualizzazione:** Toggle rapido **Elenco (Compatto)** vs **Dettagli (Esteso)** con espansione singola senza duplicazioni.

---

### 🛠️ 2. Timer di Recupero Rapido (Compatto & Dettagliato)
- **Versione Compatta (Elenco):** Aggiunta del badge cliccabile del recupero (es. `▶ 90"`) direttamente nella riga sintetica accanto a `Serie × Reps`. L'atleta che conosce già gli esercizi può tenere tutta la scheda compatta e avviare il timer con un solo tap senza dover espandere la card.
- **Versione Dettagliata:** L'icona `Play (▶)` accanto al tempo di recupero nel riquadro "RECUPERO" diventa **sempre visibile e ben evidente** (non solo al passaggio del mouse), invitando chiaramente al tap su mobile e desktop.

---

### 🌍 3. Internazionalizzazione Completa (IT / EN / ES)
- **Traduzione Totale Interfaccia:** Collegamento di tutte le stringhe di `WorkoutViewPage`, `EditorPage`, `HomePage`, `Navbar` e `Footer` al dizionario `LanguageContext` (`it`, `en`, `es`).
- **Traduzione Dinamica Contenuti Esercizi:** Quando si cambia lingua dal selettore in alto, vengono tradotti dinamicamente:
  - Muscoli target (`Pettorali` ↔ `Chest` ↔ `Pectorales`)
  - Attrezzatura (`Bilanciere` ↔ `Barbell` ↔ `Barra`)
  - Descrizioni biomeccaniche di esecuzione (pescando dal dataset multilingua `instructions[lang]`)
  - Etichette operative (`Serie`, `Reps`, `Carico`, `Recupero`, `Elenco`, `Dettagli`, `Giorno`, ecc.).

---

### 🔗 4. Link GitHub Ufficiale
- Inserimento del link diretto al repository [github.com/francescosanto78/gymlink](https://github.com/francescosanto78/gymlink) con icona GitHub nel `Footer` (ed eventualmente nella `Navbar` / `HomePage`), valorizzando la natura open-source non-commerciale del progetto.

---

### 📋 5. Funzione "Usa come Template / Duplica Scheda" per il PT
- **Obiettivo:** Se il PT ha un nuovo cliente (Cliente B) simile al Cliente A, può aprire la scheda del Cliente A e cliccare su **"Duplica / Usa come Template"** (sia dalla barra PT nella vista scheda, sia dalla tabella "Schede Recenti" in Home, sia nell'Editor).
- **Comportamento:** Crea istantaneamente una copia completa di giornate ed esercizi, **genera un nuovo ID univoco `nanoid(10)`**, pulisce il nome del destinatario e lo storico dei carichi del vecchio cliente, e apre l'Editor pronto per salvare un link completamente indipendente.

---

### 🔒 6. Avviso di Riservatezza del Link (WhatsApp & Box Copia)
- **Nel Box di Condivisione (Modale Salvataggio & Barra PT):** Aggiunta di un avviso chiaro sotto l'URL:
  > ⚠️ *Attenzione: questo link è strettamente personale per l'atleta. Non condividerlo con terzi, poiché chiunque possieda il link può aggiornare i carichi di lavoro della scheda.*
- **Nel Messaggio Precompilato WhatsApp:** Inclusione automatica della nota di riservatezza nel testo inviato al cliente:
  > *"🔒 Nota: questo link è strettamente personale, conservalo e non condividerlo con altri per evitare modifiche ai tuoi dati di allenamento."*

---

### 📈 7. Tracking Progressione Carichi per il Cliente + Grafico Trendline + Export Globale
Questa è la funzionalità chiave di evoluzione per l'atleta:

1. **Modifica del Peso da parte del Cliente:**
   - Nella scheda cliente (`/w/:id`), il campo **CARICO** diventa interattivo (cliccabile/modificabile con un'iconcina matita o tap diretto).
   - Quando il cliente aggiorna il peso (es. da `70 kg` a `75 kg`), il sistema:
     - Aggiorna il valore corrente dell'esercizio.
     - Registra silenziosamente nel database Supabase (dentro il JSON della scheda, nell'array `ex.weightHistory`) il nuovo punto dati: `{ date: "2026-11-07", weight: 75, raw: "75 kg" }`.
2. **Grafico di Progressione per Singolo Esercizio (con Trendline):**
   - Accanto al carico (o nella barra dell'esercizio) compare un'iconcina **Grafico (`TrendingUp`)**.
   - Cliccandola si apre una modale dedicata all'esercizio con:
     - **Grafico SVG interattivo** che mostra l'andamento del peso nel tempo (aggregazione/dettaglio settimanale).
     - **Linea di Tendenza (Trendline** calcolata con regressione lineare) per visualizzare subito la direzione dei progressi.
     - **Finestra temporale di 3 mesi (~12 settimane)** con **due frecce in basso (`← Precedenti` | `Successivi →`)** per scorrere indietro o avanti nei trimestri.
3. **Pannello Globale "Progressioni & Export Dati" (nell'Intestazione della Scheda):**
   - Nell'area iniziale della scheda (sotto le note generali, accanto a *"Progresso seduta"* come da tuo screenshot), aggiungiamo il pulsante **"📊 Storico Progressioni & Export"**.
   - Permette al cliente di:
     - Vedere il riepilogo dei progressi su tutti gli esercizi della scheda.
     - **Scaricare/Copiare i dati completi (CSV / JSON / Testo formattato per AI & PT)** con un clic, così l'atleta può inviarli al proprio PT o incollarli nella sua AI preferita (ChatGPT, Claude, Gemini) per analizzare dove sta progredendo rapidamente e dove è in stallo.

---

## 🔮 VERSIONE 2.0 — Intelligenza Artificiale & Workout Guidato (FUTURO)

*(Punti salvati in roadmap per i prossimi cicli di sviluppo)*

1. **Importazione Automatica Scheda da PDF tramite AI:**
   - L'utente carica un file PDF (o foto/documento) di una vecchia scheda di allenamento.
   - Il sistema analizza il documento tramite AI, estrae giornate, nomi esercizi (mappandoli al catalogo GymLink), serie, ripetizioni, recuperi e note, e genera automaticamente la scheda interattiva su GymLink*(in attesa del tuo documento di specifiche dedicato)*.
2. **Modalità Allenamento Guidata ("Play Workout" Focus Mode):**
   - Il cliente clicca su **"▶ Avvia Allenamento"**, sceglie il giorno e l'interfaccia entra in modalità guidata step-by-step.
   - Focus automatico sul **1° esercizio e sulla 1ª serie**.
   - Quando l'atleta clicca sul recupero, il sistema spunta automaticamente la 1ª serie come completata, avvia il countdown e prepara la 2ª serie.
   - Completate tutte le serie previste, segna l'intero esercizio come completato e scorre automaticamente al 2° esercizio fino al termine della seduta.

