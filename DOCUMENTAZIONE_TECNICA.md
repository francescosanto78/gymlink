# GymLink — Documentazione Tecnica & Architettura di Progetto

> **Versione:** 1.0.0 (Production Release)  
> **Data:** 02 Novembre 2026  
> **Autore:** Francesco Santo ([GitHub](https://github.com/francescosanto78/gymlink))  
> **Production URL:** [https://gymlink.pages.dev](https://gymlink.pages.dev)  
> **Repository GitHub:** [https://github.com/francescosanto78/gymlink](https://github.com/francescosanto78/gymlink)

---

## 1. Visione del Progetto & Filosofia Architetturale

GymLink è una Single Page Application (SPA) mobile-first pensata per Personal Trainer (PT) e atleti con un focus radicale su **Zero-Friction**:
1. **Nessun Login/Registrazione Obbligatoria:** I PT possono creare una routine immediatamente. Gli atleti possono aprirla con un singolo tap da WhatsApp o browser.
2. **Link Unici non indicizzabili:** Ogni routine generata riceve un identificatore univoco `nanoid(10)` (es. `w/k9Z1pX7aB3`). I file `robots.txt` impediscono ai crawler (Google, Bing) di indicizzare le routine private degli atleti.
3. **Persistenza Ibrida Cloud + Cache Locale:**
   - Supabase PostgreSQL come sorgente di verità Cloud remota.
   - `localStorage` per le bozze in corso (`gymlink_draft`) e la cronologia locale del PT (`gymlink_recent_workouts`).
   - `sessionStorage` per lo stato di esecuzione dell'atleta (serie spuntate e anti-refresh spam sul contatore visualizzazioni).
4. **Design System "Emerald Night":** Palette ispirata a console di controllo hardware vintage/futuristico:
   - Sfondo profondo: `#07100d` (Dark), `#0d1713` (Pannelli), `#13221c` (Card)
   - Accento neon: `#3ee6a0` (Smeraldo)
   - Font: *Doto* (dot-matrix display per numeri, timer e titoli) + font di sistema ad alta leggibilità.

---

## 2. Struttura del Repository e File Chiave

```
GymLink/
├── public/
│   ├── _redirects            # Regola SPA Cloudflare (/* /index.html 200)
│   ├── robots.txt            # Blocco crawler per /w/, /workout/, /admin
│   ├── timer-dark.mp3        # Suono countdown per tema dark
│   ├── timer-light.mp3       # Suono countdown per tema light
│   └── biceps2.gif           # GIF illustrativa tutorial
├── src/
│   ├── components/
│   │   ├── CookieBanner.jsx          # Banner GDPR per consenso GA4
│   │   ├── ExerciseSearchModal.jsx   # Modale ancorata ricerca esercizi con filtri
│   │   ├── FeedbackModal.jsx         # Form feedback per utenti
│   │   ├── Footer.jsx                # Footer dell'applicazione
│   │   ├── LegalDisclaimerModal.jsx  # Disclaimer medico/legale fitness
│   │   ├── Modal.jsx                 # Modale generica con portal e overlay
│   │   ├── Navbar.jsx                # Header con logo context-aware (PT vs Atleta)
│   │   └── Starfield.jsx             # Sfondo animato a particelle stellari
│   ├── context/
│   │   ├── LanguageContext.jsx       # Gestione internazionalizzazione (IT/EN)
│   │   └── ThemeContext.jsx          # Gestione Dark/Light Mode
│   ├── pages/
│   │   ├── AdminMaintenancePage.jsx  # Console segreta gestione DB e pulizia schede
│   │   ├── ClientGuidePage.jsx       # Guida all'uso per l'atleta (/guida)
│   │   ├── EditorPage.jsx            # Creazione, modifica e template routine (/editor)
│   │   ├── HomePage.jsx              # Landing page di presentazione (/)
│   │   ├── StatsPage.jsx             # Telemetria pubblica (/stats)
│   │   ├── TutorialPage.jsx          # Guida rapida interattiva (/tutorial)
│   │   └── WorkoutViewPage.jsx       # Pagina visualizzazione/allenamento (/w/:id)
│   ├── services/
│   │   ├── analyticsService.js       # Iniezione condizionale GA4 e tracking route
│   │   ├── exerciseService.js        # Catalogo completo esercizi e filtri muscolari
│   │   ├── supabase.js               # Client Supabase con fallback graceful
│   │   └── workoutService.js         # CRUD schede, view counter e restore backup
│   ├── utils/
│   │   └── sound.js                  # Audio Beep Web Audio API + timer mp3
│   ├── App.jsx                       # Router centrale e hook GA4
│   ├── index.css                     # Tailwind utilities e classi custom (.gl-*)
│   └── main.jsx                      # Entrypoint React
├── .env.example                      # Schema variabili d'ambiente
├── .node-version                     # Specifica Node.js 20 per Cloudflare
├── package.json                      # Dipendenze e script
├── tailwind.config.js                # Configurazione colori, bordi e font Doto
└── vite.config.js                    # Configurazione Vite
```

---

## 3. Database Schema & Supabase Configuration

Il backend è hostato su **Supabase Cloud** (PostgreSQL).

### Tabella: `workouts`
```sql
create table if not exists public.workouts (
  id text primary key,                   -- nanoid(10) alfanumerico (es. k9Z1pX7aB3)
  data jsonb not null,                   -- Oggetto completo scheda (titolo, giorni, esercizi, carichi)
  views_count integer not null default 0,-- Contatore visualizzazioni dell'atleta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indici di performance
create index if not exists idx_workouts_created_at on public.workouts (created_at desc);
create index if not exists idx_workouts_views_count on public.workouts (views_count);
```

### Funzioni PostgreSQL (RPC Atomiche)

1. **`increment_workout_view(workout_id text)`**:
   Incrementa atomicamente di 1 le visualizzazioni senza race conditions.
   ```sql
   create or replace function public.increment_workout_view(workout_id text)
   returns void language plpgsql security definer as $$
   begin
     update public.workouts
     set views_count = views_count + 1,
         updated_at = now()
     where id = workout_id;
   end;
   $$;
   ```

2. **`get_global_stats()`**:
   Restituisce i totali aggregati per la pagina `/stats`.
   ```sql
   create or replace function public.get_global_stats()
   returns json language plpgsql security definer as $$
   declare
     v_total_workouts bigint;
     v_total_views bigint;
   begin
     select count(*), coalesce(sum(views_count), 0)
     into v_total_workouts, v_total_views
     from public.workouts;
     return json_build_object(
       'total_workouts', v_total_workouts,
       'total_views', v_total_views
     );
   end;
   $$;
   ```

### Row Level Security (RLS)
- **Select (Lettura):** `true` (chiunque abbia l'ID può leggere la scheda).
- **Insert (Creazione):** `true` (i PT possono salvare senza registrazione).
- **Update (Modifica/Upsert):** `true` (aggiornamento per salvataggio o ripristino).
- **Delete (Eliminazione):** `true` (richiamabile dall'admin console).

---

## 4. Flussi Operativi e Logiche di Business

### A. Creazione e Salvataggio Routine (`EditorPage.jsx`)
1. Generazione di un ID unico a 10 caratteri tramite `nanoid(10)`.
2. Salvataggio automatico continuo in `localStorage.gymlink_draft` per prevenire perdite accidentali di dati.
3. Al clic su **"Salva e Genera Link"**:
   - Chiamata a `workoutService.saveWorkout(workoutData)`.
   - Inserimento/Upsert su Supabase Cloud.
   - Aggiunta della scheda alla lista locale `gymlink_recent_workouts`.
   - Rimozione della bozza da `localStorage`.
   - Apertura della modale di successo con:
     - Link di produzione: `https://gymlink.pages.dev/w/:id`
     - Pulsante **"Copia Link"**
     - Pulsante **"Condividi su WhatsApp"** con messaggio formattato:  
       `"Ciao! Ecco la tua nuova scheda di allenamento preparata su GymLink: https://gymlink.pages.dev/w/..."`

### B. Visualizzazione Atleta (`WorkoutViewPage.jsx`)
1. Lettura del parametro `:id` dall'URL.
2. Query a Supabase `workouts.select().eq('id', id)`. Se offline, fallback sulla cache locale.
3. Chiamata atomica a `trackWorkoutView(id)`:
   - Controlla `sessionStorage.getItem('gl_viewed_' + id)`.
   - Incrementa il contatore nel database solo una volta per sessione (evita spam al refresh).
4. **Protezione Allenamento:** Il logo GymLink nella Navbar viene disabilitato (statico) per i soli atleti, evitando che un tocco accidentale durante le serie faccia uscire dalla scheda.
5. **Funzionalità Interattive:**
   - Timer di recupero sonoro con preset rapidi (30s, 60s, 90s, 120s, 180s) ed estensione manuale (`+15s`, `-15s`).
   - Checkbox di serie completata con salvataggio dello stato in memoria locale.
   - Pulsante "Stampa / Salva PDF" con foglio di stile ottimizzato per stampa su carta.
   - Pulsante "Usa come Template" (consente a un altro PT di duplicare la scheda generando un nuovo ID autonomo).

### C. Console di Manutenzione (`AdminMaintenancePage.jsx`)
- Accessibile su `/admin` e `/manutenzione`.
- **Protezione:** Richiede la chiave segreta `VITE_ADMIN_KEY` (configurata in `.env` e Cloudflare). La sessione viene memorizzata in `sessionStorage`.
- **Filtri di Igiene e Pruning:**
  - *Preset Rapido "Test":* Routine con $\le 1$ esercizio e create da più di 15 giorni.
  - *Preset Rapido "Zombie":* Routine con 0 visualizzazioni e create da più di 90 giorni.
  - *Filtri Manuali Componibili:* Ricerca testo (titolo, PT, atleta, ID), numero esercizi, età in giorni, conteggio visualizzazioni.
- **Eliminazione Massiva:** Selezione a checkbox con calcolo dello spazio liberato (KB) e modale di sicurezza.
- **Disaster Recovery (Backup & Ripristino):**
  - **Esporta Backup JSON:** Scarica un dump completo in formato `.json` sul PC dell'amministratore.
  - **Ripristina da Backup JSON:** Lettura del file locale, validazione schema e operazione di **Upsert massivo**. Le schede cancellate vengono ricreate con il loro **ID originale**, preservando i link già inviati agli atleti.

### D. Conformità GDPR & Analytics (`analyticsService.js` + `CookieBanner.jsx`)
- **GDPR Compliant:** Google Analytics (`gtag.js`) **non** viene caricato al caricamento iniziale della pagina.
- Il banner chiede consenso:
  - *"Accetta Tutti"*: Salva `gymlink_cookie_consent = 'accepted'`, inietta `gtag.js` con IP anonimizzato e avvia il tracking delle visualizzazioni route SPA.
  - *"Solo Tecnici"*: Salva `gymlink_cookie_consent = 'declined'`. Nessuno script esterno o cookie di terze parti viene caricato.

---

## 5. Pipeline di Deploy & Hosting (Cloudflare Pages)

- **Provider:** Cloudflare Pages (Free Tier globale con CDN Anycast a bassa latenza).
- **Trigger:** Ogni `git push origin main` su GitHub avvia automaticamente la compilazione e il deploy globale in ~30 secondi.
- **Configurazione di Build:**
  - Framework Preset: `React (Vite)`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Node Version: `20` (configurata tramite file `.node-version` e variabile `NODE_VERSION=20`).
- **Supporto SPA Routing:** Il file `public/_redirects` contenente `/* /index.html 200` istruisce l'edge router di Cloudflare a reindirizzare tutte le route dinamiche (`/w/:id`, `/editor`, `/admin`, ecc.) al file `index.html` senza generare errori 404.

---

## 6. Linee Guida per Future Implementazioni

Quando vorrai espandere l'applicazione con nuove feature, ecco i punti di estensione consigliati:

1. **Autenticazione Opzionale per PT (Area Personale):**
   - Mantenere la creazione anonima per chi non vuole registrarsi.
   - Aggiungere il login via Supabase Auth (Magic Link o Google) solo per chi desidera sincronizzare il proprio archivio su più dispositivi.
2. **Cronologia Esecuzione Atleta:**
   - Possibilità per l'atleta di salvare i pesi effettivamente usati per ogni serie (es. con sincronizzazione su una tabella secondaria `workout_logs`).
3. **PWA (Progressive Web App):**
   - Aggiungere un `manifest.json` e un service worker tramite `vite-plugin-pwa` per consentire l'installazione su home screen di iPhone/Android e l'uso 100% offline in palestra.
4. **Dominio Personalizzato:**
   - Su Cloudflare Pages -> scheda **Custom domains** è possibile collegare con 1 clic un dominio personale acquistato (es. `gymlink.it` o `gymlink.app`) con certificato SSL HTTPS gratuito automatico.
