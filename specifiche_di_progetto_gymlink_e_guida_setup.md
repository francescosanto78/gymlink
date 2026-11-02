# GymLink - Specifiche Tecniche e Roadmap di Sviluppo (Antigravity IDE Blueprint)

> **DIRETTIVA PER L'AGENTE AI (Google Antigravity IDE):**
>
> 1. Questo file è la guida ufficiale e vincolante del progetto **GymLink**.
> 2. **NON sviluppare l'intera applicazione in un singolo passaggio.**
> 3. Procedi **TASSATIVAMENTE per Step sequenziali** come indicato nella **Sezione 7 (Roadmap di Sviluppo Controllata)**.
> 4. Al termine di ogni Step, fermati, presenta il risultato all'utente, richiedi approvazione visiva/funzionale e attendi il suo via libera prima di passare allo Step successivo.
> 5. Quando uno step richiede la creazione o configurazione di account esterni (Web3Forms, Supabase, GitHub, Cloudflare Pages, Google Analytics), **guida l'utente in modo interattivo**: digli esattamente cosa cliccare, cosa copiare/incollare e attendi la sua conferma prima di proseguire.

---

## 1. Panoramica del Progetto

**GymLink** è una Web Application (SPA) open-source, progettata con approccio **Mobile-First**, che consente ai Personal Trainer (PT) di creare, modificare, duplicare, condividere ed eliminare schede di allenamento per la palestra senza alcuna registrazione (modalità Guest).
Al salvataggio della scheda, l'applicazione genera un **link univoco non indicizzato** che il PT condivide con il proprio cliente. Il cliente apre il link in **sola lettura** dal proprio smartphone per consultare il proprio programma diviso in giornate, visualizzando su richiesta (al clic sul nome dell'esercizio) le GIF animate e le istruzioni tecniche.

---

## 2. Design System & Stile Grafico

L'estetica dell'applicazione si ispira all'interfaccia di **`https://stanleygurvich.github.io/FMDB_FM1_FirmwareDatabase/`**: uno stile **tecnico, minimale, strutturato a database, ad alta leggibilità e zero fronzoli**.

### Linee Guida Visive:
1. **Layout stile "Technical Database / Dashboard":**
   * Struttura a card e tabelle con bordo sottile ben definito (`1px solid`), angoli compatti (`rounded-md`), spaziatura pulita e gerarchia tipografica netta.
2. **Tipografia:**
   * Font Sans-Serif ultra-leggibile per titoli, nomi esercizi e note (`Inter` o `system-ui`).
   * Font **Monospace** (`JetBrains Mono`, `Fira Code` o `ui-monospace`) per tutti i dati numerici e tecnici: Serie, Ripetizioni, Peso (Kg), Recupero (es. `90"`), Date, ID scheda, metriche statistiche e Badge di stato.
3. **Palette Colori (Dark/Technical Theme ad alto contrasto per palestra):**
   * **Background principale:** Grigio/Ardesia molto scuro (`#0d1117` o `#0f172a`).
   * **Superfici / Card / Tabelle:** Grigio scuro tecnico (`#161b22` o `#1e293b`) con bordi sottili ad alto contrasto (`#30363d` o `#334155`).
   * **Testo primario:** Bianco nitido (`#f0f6fc` / `#f8fafc`).
   * **Testo secondario / Label colonne:** Grigio tecnico (`#8b949e` / `#94a3b8`) in `uppercase` con `tracking-wider` e dimensione compatta (`text-xs`).
   * **Colore Primario / Accent:** Blu elettrico/Ciano tecnico (`#3b82f6` o `#38bdf8`) per tab attive, link, metriche, badge e pulsanti principali.
   * **Stati:** Verde smeraldo (`#10b981`) per salvataggio/condivisione WhatsApp, Rosso (`#ef4444`) per eliminazione scheda/esercizi.

---

## 3. Crediti, Branding Personale, Feedback (Web3Forms) e Aspetti Legali

### 3.1 Crediti dell'Autore (Branding Personale)
* Nel **Footer Globale** dell'applicazione inserire:
  * `"Creato da Francesco Santo"` (o il nome indicato dall'utente) con link cliccabile al profilo **LinkedIn** (`target="_blank" rel="noopener noreferrer"`).
* Nel file `README.md` su GitHub: sezione autore con link a LinkedIn e invito a contribuire al progetto open-source.

### 3.2 Form di Contatto / Feedback tramite Web3Forms (CTA Footer)
* Nel **Footer Globale** inserire un pulsante/link: `"💬 Feedback & Contatti"`.
* Al clic si apre una **Modale compatta** con un form ultra-semplice a 3 campi:
  1. `name` (Nome - obbligatorio)
  2. `email` (Email - obbligatorio, per permettere risposta diretta con Reply-To)
  3. `message` (Messaggio - textarea obbligatoria)
* **Anti-Spam e Privacy dell'Email:**
  * L'indirizzo email del proprietario **NON deve mai comparire nel codice frontend**.
  * Il form invia una richiesta `POST` JSON a `https://api.web3forms.com/submit` utilizzando esclusivamente la variabile d'ambiente `VITE_WEB3FORMS_ACCESS_KEY`.
  * Includere il campo nascosto Honeypot nativo di Web3Forms (`<input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />`) per bloccare i bot automatici senza fastidiosi captcha visivi.

### 3.3 Attribuzione Obbligatoria del Dataset e delle GIF (Copyright Notice)
* **Dataset:** `hasaneyldrm/exercises-dataset` (Licenza MIT).
* **GIF e Animazioni:** Proprietà di **Gym Visual** (`© Gym visual — https://gymvisual.com/`).
* **Prescrizioni obbligatorie:**
  1. Nel **Footer Globale**: `"Dataset: hasaneyldrm/exercises-dataset (MIT) • Media: © Gym visual (gymvisual.com)"`.
  2. Nell'accordion di dettaglio di ogni esercizio (solo quando viene mostrata una GIF): didascalia compatta `"© Gym visual — gymvisual.com"`.
  3. Nel `README.md` di GitHub: sezione Licenze & Attribuzioni completa.

### 3.4 Cookie Banner, Note Legali & Disclaimer Medico
* **Cookie Banner (GDPR):** banner minimale a piè di pagina alla prima visita. Se l'utente clicca `"Rifiuta"`, non viene caricato alcuno script di tracciamento. Se clicca `"Accetta"`, viene salvato il consenso in `localStorage` e iniettato dinamicamente lo script di **Google Analytics 4 (`VITE_GA_MEASUREMENT_ID`)**.
* **Disclaimer Medico (Modale Note Legali & Privacy nel Footer):** specifica che GymLink è uno strumento tecnico per visualizzare schede di allenamento, non fornisce pareri medici e l'utente si allena sotto la propria esclusiva responsabilità.

---

## 4. Integrazione Tecnica del Dataset (`hasaneyldrm/exercises-dataset`)

Per evitare errori di caricamento o rallentamenti, l'Agente deve attenersi alla struttura reale del repository:

1. **Endpoint JSON Unico via CDN jsDelivr:**
   * URL: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json`
   * **Caching Locale:** Al primo avvio dell'Editor PT, scaricare il JSON e metterlo in cache in `sessionStorage` o memoria React (in modo che le ricerche siano istantanee a 0ms).
2. **Struttura di ciascun record in `exercises.json`:**
   * `id`: es. `"0001"`
   * `name`: Nome dell'esercizio (es. `"3/4 Sit-up"`)
   * `category` / `muscle_group` / `target` / `equipment`: Metadati utili come filtri o badge.
   * `instructions`: Oggetto multilingua contenente `{ en: "...", it: "...", es: "...", fr: "..." }`. Quando la lingua dell'interfaccia è impostata su `IT`, prelevare `exercise.instructions.it` (con fallback su `en`).
   * `gif_url`: Percorso relativo nel repo (es. `"videos/0001-2gPfomN.gif"`).
   * **Costruzione URL completo della GIF:**
     `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/${exercise.gif_url}`
3. **Ricerca Multilingua Intelligente:**
   * Poiché il campo `name` nel dataset originale è principalmente in inglese mentre `instructions.[lang]` è tradotto nella lingua scelta, la barra di ricerca dell'Editor PT deve cercare il testo digitato **sia** in `name`, **sia** in `target`/`category`, **sia** all'interno di `instructions[currentLang]` (così se il PT cerca *"panca"* o *"petto"* in italiano trova comunque gli esercizi pertinenti).

---

## 5. Stack Tecnologico & Struttura Dati

* **Frontend:** React 18+ con Vite, Tailwind CSS, `lucide-react` (icone), `react-router-dom` v6.
* **Generazione ID Unico:** `nanoid(10)` (URL brevi, puliti e impossibili da indovinare).
* **Database BaaS:** Supabase PostgreSQL con una sola tabella `workouts` (colonna `data` JSONB) e una funzione RPC leggera per le statistiche.
* **Protezione Anti-Bot Motori di Ricerca:**
  * In `index.html`: `<meta name="robots" content="noindex, nofollow" />`
  * In `public/robots.txt`: `User-agent: *` / `Disallow: /`

### Schema Dati Scheda (Colonna JSONB `data` in `workouts`):

```json
{
  "title": "Protocollo Ipertrofia - Mesociclo 1",
  "ptName": "Marco Verdi",
  "clientName": "Andrea Neri",
  "date": "2026-10-30",
  "generalNotes": "3 sedute settimanali. Eseguire sempre 10 min di riscaldamento articolare prima di iniziare.",
  "days": [
    {
      "id": "day_1",
      "title": "Giorno A - Push (Petto, Spalle, Tricipiti)",
      "exercises": [
        {
          "id": "ex_1",
          "name": "Panca Piana con Bilanciere",
          "sets": "4",
          "reps": "8-10",
          "weight": "70 kg",
          "rest": "120\"",
          "notes": "Fermo al petto di 1 secondo.",
          "gifUrl": "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0001-2gPfomN.gif",
          "description": "Sdraiati sulla panca piana, impugna il bilanciere..."
        }
      ]
    }
  ]
}
```

### Funzionalità Smart Lato PT (Semplificazione UX):
* **Auto-Save Bozza in Locale:** Mentre il PT compila una scheda nell'editor, salvare automaticamente la bozza in `localStorage` (`gymlink_draft`) ad ogni modifica, evitando perdite di dati se ricarica per errore la pagina.
* **Duplica Scheda ("Usa come Template"):** Quando il PT carica una scheda esistente, oltre a *"Salva Modifiche"* ed *"Elimina"*, avere il pulsante *"Salva come Nuova Copia"* (genera un nuovo link mantenendo gli esercizi, comodissimo per adattare la stessa scheda a un secondo cliente cambiando solo nome e carichi).

---

## 6. Script SQL per Supabase (Snello e Completo)

```sql
-- 1. Tabella Unica Schede di Allenamento
CREATE TABLE public.workouts (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Abilitazione Row Level Security (Accesso Guest tramite Link/ID)
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Select Workouts" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "Public Insert Workouts" ON public.workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Workouts" ON public.workouts FOR UPDATE USING (true);
CREATE POLICY "Public Delete Workouts" ON public.workouts FOR DELETE USING (true);

-- 3. Funzione Atomica per Incremento Visualizzazioni Scheda
CREATE OR REPLACE FUNCTION increment_workout_view(workout_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.workouts
    SET views_count = views_count + 1
    WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Funzione Veloce per Statistiche Pubbliche Aggregate (/stats)
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON AS $$
DECLARE
    total_workouts INTEGER;
    total_views BIGINT;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(views_count), 0)
    INTO total_workouts, total_views
    FROM public.workouts;

    RETURN json_build_object(
        'total_workouts', total_workouts,
        'total_views', total_views
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. ROADMAP DI SVILUPPO CONTROLLATA (Istruzioni Interattive per Antigravity)

> **Istruzioni operative per l'Agente Antigravity:**
> Esegui **UN SOLO STEP ALLA VOLTA**. Al termine di ogni Step, avvia il server locale (`npm run dev`), mostra il risultato all'utente e attendi la sua approvazione esplicita prima di scrivere il codice dello Step successivo.

### STEP 1: Setup Progetto, Design System, Navbar, Footer & Modale Feedback (Locale)
* **Obiettivo:** Creare la struttura base React + Vite + Tailwind CSS con estetica `FMDB_FM1_FirmwareDatabase` e dizionario multilingua (`IT` | `EN` | `ES`).
* **Azioni dell'Agente:**
  1. Configura il tema scuro tecnico (`#0d1117` / `#161b22`), i bordi sottili e il font Monospace per i dati numerici.
  2. Implementa la **Navbar Globale** con logo `GymLink`, link rapido a `/stats` e selettore lingua `IT | EN | ES` in alto a destra.
  3. Implementa il **Footer Globale** con:
     * Crediti autore + link LinkedIn.
     * Crediti obbligatori `hasaneyldrm/exercises-dataset` e `© Gym visual`.
     * Link Modale Note Legali / Disclaimer Medico.
     * Pulsante `"💬 Feedback & Contatti"` che apre la Modale con il form (Nome, Email, Messaggio + Honeypot) predisposto per **Web3Forms** (`VITE_WEB3FORMS_ACCESS_KEY`).
  4. Crea la **Home Page PT (`/`)** con:
     * Pulsante primario `"➕ Crea Nuova Scheda"`.
     * Box `"✏️ Modifica Scheda Esistente"` (campo input dove incollare il link completo o l'ID della scheda per aprirla nell'editor).
     * Tabella `"Schede Recenti su questo dispositivo"` (letta da `localStorage`).
* **Punto di Stop:** Chiedi all'utente di verificare lo stile grafico in locale e se vuole già inserire la chiave gratuita di Web3Forms nel file `.env`.

### STEP 2: Editor Scheda PT & Integrazione Dataset con GIF (In Locale)
* **Obiettivo:** Costruire l'editor completo per creare e modificare le schede con salvataggio bozza in `localStorage`.
* **Azioni dell'Agente:**
  1. Form Intestazione Scheda: Titolo Scheda, Nome e Cognome PT, Nome Cliente, Data, Note Generali a monte della scheda.
  2. Gestione Giornate (Split): tab cliccabili in alto (`Giorno 1`, `Giorno 2`...), pulsante `+ Aggiungi Giornata`, campo Titolo Seduta (es. *Push / Pull / Legs*), pulsante elimina giornata.
  3. Aggiunta Esercizi con doppia modalità:
     * **Ricerca da Database (`hasaneyldrm/exercises-dataset`)**: barra di ricerca con anteprima miniatura, che al clic popola automaticamente Nome, GIF URL e Descrizione nella lingua selezionata in alto a destra.
     * **Pulsante esplicito `"+ Nuovo Esercizio Manuale"`**: aggiunge una riga esercizio completamente vuota e personalizzabile.
  4. Card/Riga Esercizio nell'Editor:
     * Campi rapidi in stile tabella tecnica: Nome, Serie, Ripetizioni, Peso, Recupero.
     * Sezione espandibile/secondaria per l'esercizio: Note specifiche PT, Descrizione esecuzione (liberamente modificabile o cancellabile) e gestione GIF (anteprima GIF con pulsante `"Rimuovi GIF / Lascia vuoto"` oppure possibilità di incollare un URL GIF custom).
     * Frecce Su/Giù per riordinare gli esercizi ed elimina esercizio.
* **Punto di Stop:** Fai testare all'utente la creazione di una scheda multi-giornata in locale e chiedi conferma dell'esperienza d'uso.

### STEP 3: Vista Cliente Mobile-First Sola Lettura (`/w/:id`)
* **Obiettivo:** Creare l'interfaccia che vedrà il cliente aprendo il link condiviso dal PT sullo smartphone.
* **Azioni dell'Agente:**
  1. Vista pulita, priva di pulsanti di modifica, con selettore lingua in alto a destra.
  2. Intestazione scheda: Titolo, PT, Cliente, Data e box ben leggibile per le **Note Generali del protocollo**.
  3. Navigazione Giornate:
     * **In alto:** Barra di tab/pillole cliccabili (si apre sempre sulla prima giornata).
     * **In fondo alla scheda:** Frecce grandi e comode per il pollice (`← Giorno Precedente` | `Giorno Successivo →`) con scroll-to-top automatico al cambio giorno.
  4. Tabella Esercizi Mobile-First:
     * Colonne chiarissime e ben dimensionate: **Esercizio | Serie | Reps | Peso | Rec** + eventuali note rapide del PT.
     * **Interazione al Clic sul Nome dell'Esercizio:** cliccando sul nome (accompagnato da una piccola icona indicativa se sono presenti GIF o descrizione), si apre un accordion fluido sotto la riga che carica **lazy (on-demand)** la GIF animata (`180x180` con dicitura `© Gym visual`) e il testo della descrizione tecnica.
* **Punto di Stop:** Fai testare all'utente la vista cliente simulando una scheda di prova e chiedi conferma.

### STEP 4: Collegamento Interattivo Supabase, Condivisione WhatsApp & Pagina `/stats`
* **Obiettivo:** Rendere funzionante il salvataggio su database cloud, la modifica tramite link, la cancellazione e le statistiche pubbliche.
* **Azioni dell'Agente (GUIDA PASSO-PASSO PER L'UTENTE):**
  1. L'Agente si ferma e guida l'utente a:
     * Creare un progetto gratuito su [Supabase](https://supabase.com).
     * Incollare ed eseguire lo Script SQL della **Sezione 6** nel *SQL Editor* di Supabase.
     * Copiare `Project URL` e `anon public key` dentro il file `.env` locale (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
  2. Una volta ricevuta conferma dall'utente, l'Agente collega Supabase:
     * **Salvataggio Nuova Scheda:** genera `nanoid(10)` e salva su Supabase. Mostra modale di successo con pulsante **"Copia Link"** e pulsante **"Condividi su WhatsApp"** (messaggio precompilato con nome cliente e link diretto).
     * **Modifica Scheda Esistente:** incollando il link nella Home (o aprendo `/edit/:id`), carica i dati da Supabase, permette di: **Aggiornare lo stesso link**, **Duplicare come nuovo link**, oppure **Eliminare definitivamente la scheda** (con conferma di sicurezza).
     * **Pagina Statistiche Pubbliche (`/stats`):** mostra in stile dashboard tecnica il **Totale Schede Create**, il **Totale Visualizzazioni** (incrementato automaticamente quando un cliente apre `/w/:id` tramite `sessionStorage` anti-refresh) e la lista delle ultime 10 schede create (mostrando solo data, titolo generico e numero di giorni, senza dati sensibili né link cliccabili).
* **Punto di Stop:** Verifica end-to-end in locale con database reale attivo.

### STEP 5: Cookie Banner GDPR, Google Analytics 4 & Pubblicazione Online (Cloudflare Pages)
* **Obiettivo:** Rifinitura finale e messa online gratuita dell'applicazione.
* **Azioni dell'Agente (GUIDA PASSO-PASSO PER L'UTENTE):**
  1. Implementa il Cookie Banner GDPR e l'iniezione condizionale di Google Analytics 4 (`VITE_GA_MEASUREMENT_ID`).
  2. Crea il file `public/_redirects` (`/* /index.html 200`) e `public/robots.txt` per il deploy SPA perfetto e non indicizzato.
  3. Crea un `README.md` completo in stile open-source con istruzioni, crediti autore (LinkedIn) e attribuzioni di licenza.
  4. Guida passo-passo l'utente a:
     * Fare il push del codice sul proprio repository GitHub (`gymlink`).
     * Collegare il repository a **Cloudflare Pages** (piano Free), inserire le 4 variabili d'ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WEB3FORMS_ACCESS_KEY`, `VITE_GA_MEASUREMENT_ID`) e andare online.
* **Punto di Stop Finale:** Consegna del progetto live e test da smartphone.