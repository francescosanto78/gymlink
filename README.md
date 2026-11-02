# GymLink 🏋️‍♂️⚡

> **Workout routines made frictionless.**  
> A mobile-first web app for Personal Trainers (PTs) and athletes: create, manage, and share routine workouts via unique links without mandatory registration or login.

🌐 **Live Application:** [https://gymlink.pages.dev](https://gymlink.pages.dev)  
📦 **GitHub Repository:** [https://github.com/francescosanto78/gymlink](https://github.com/francescosanto78/gymlink)  
⚖️ **License:** [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](./LICENSE)

---

### 🌐 Language / Lingua
- **[English (Current)](#english)**
- **[Italiano (Leggi in Italiano)](#italiano)**

---

<a name="english"></a>
## 🇬🇧 English

### ✨ Key Features

- **Zero-Friction (No Sign-Up Required):** PTs can start building a workout routine immediately. Athletes access their workout with a single tap on the received link.
- **Unique Shareable Cloud Links:** Workouts are persisted on Supabase Cloud with 10-character cryptographic unique identifiers (`nanoid(10)`). Crawler robots are blocked from indexing private routines.
- **1-Click WhatsApp & PDF Export:** Formatted sharing message for WhatsApp directly to clients, plus print-ready clean PDF export for gym floors.
- **Interactive Workout Execution View for Athletes:**
  - Auditory rest countdown timer with Web Audio API sound alerts.
  - Interactive completed set checklists (session-preserved).
  - Distraction-free / Fullscreen focus mode.
  - Read-only locked navbar logo prevents accidental loss of workout state while exercising.
- **Comprehensive Exercise Catalog:** Fast search through muscle groups, equipment, movement tempo, and RPE cues.
- **Hidden Admin & Maintenance Console (`/admin`):**
  - PIN-protected maintenance suite for the administrator.
  - 1-click preset pruning filters for test routines and zombie (abandoned) workouts.
  - Full database JSON Backup export & **Safe JSON Restore/Upsert** (restores deleted workouts keeping original IDs so existing athlete links continue working).
- **GDPR Compliant & Privacy-First:** Minimal cookie consent banner; Google Analytics 4 is strictly blocked until explicit user opt-in.

### 🛠️ Tech Stack

- **Frontend:** React 18, Vite
- **Styling:** Tailwind CSS (Custom "Emerald Night" theme `#07100d`, accent `#3ee6a0`, Doto dot-matrix typography, animated starfield)
- **Icons:** Lucide React
- **Backend as a Service:** Supabase (PostgreSQL Cloud with RLS & atomic RPCs)
- **Analytics:** Google Analytics 4 (conditional injection)
- **Deployment & Hosting:** Cloudflare Pages with Git continuous deployment and SPA redirect routing

### 🚀 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/francescosanto78/gymlink.git
cd gymlink

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Fill in your Supabase credentials, GA4 ID and Admin PIN

# 4. Start local Vite development server
npm run dev
```

### 🔒 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Cloud project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon public key |
| `VITE_ADMIN_KEY` | Master secret PIN to unlock `/admin` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`) |
| `VITE_WEB3FORMS_ACCESS_KEY` | *(Optional)* Web3Forms contact key |

### 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.  
- **Permitted:** You may view, clone, fork, and adapt the code for non-commercial and educational purposes with proper attribution to Francesco Santo.
- **Prohibited:** Any commercial use, reselling, monetizing, or proprietary commercial closed distribution by third parties without prior written consent from the author is strictly prohibited.

---

<a name="italiano"></a>
## 🇮🇹 Italiano

### ✨ Caratteristiche Principali

- **Zero Attrito (Nessuna Registrazione Obbligatoria):** I Personal Trainer possono iniziare a comporre una scheda immediatamente. Gli atleti la aprono con un tap sul link ricevuto via WhatsApp.
- **Link Unici di Condivisione Cloud:** Routine salvate su Supabase Cloud con identificatori unici crittografici a 10 caratteri (`nanoid(10)`). I motori di ricerca sono bloccati dall'indicizzare le schede private.
- **Condivisione WhatsApp & Stampa PDF in 1 Clic:** Messaggio precompilato per WhatsApp pronto per l'atleta ed esportazione PDF pulita per la sala pesi.
- **Interfaccia Esecuzione Allenamento per l'Atleta:**
  - Timer sonoro di recupero con avviso acustico via Web Audio API.
  - Spunte interattive per le serie completate con persistenza di sessione.
  - Modalità Focus a tutto schermo ad alto contrasto.
  - Logo GymLink bloccato in sola lettura per evitare uscite accidentali durante le serie.
- **Catalogo Esercizi Completo:** Ricerca rapida per gruppo muscolare, attrezzo, note sul tempo di esecuzione e RPE.
- **Console di Manutenzione Protetta (`/admin`):**
  - Accesso riservato con PIN per l'amministratore.
  - Filtri 1-click per eliminare routine di test o abbandonate (zombie).
  - Esportazione Backup JSON e **Ripristino da Backup con Upsert** (ricrea le schede cancellate mantenendo gli stessi ID, senza rompere i link già inviati agli atleti).
- **Conformità GDPR:** Banner cookie minimale; Google Analytics 4 viene caricato solo previo consenso esplicito dell'utente.

### 🛠️ Stack Tecnologico

- **Frontend:** React 18, Vite
- **Stile:** Tailwind CSS (Tema Emerald Night `#07100d`, accento neon `#3ee6a0`, Doto dot-matrix typography, animated starfield)
- **Icone:** Lucide React
- **BaaS:** Supabase Cloud (PostgreSQL, RLS e RPC atomiche)
- **Analytics:** Google Analytics 4 (GDPR-compliant)
- **Hosting:** Cloudflare Pages (Deploy continuo da GitHub con routing SPA)

### 📄 Licenza

Questo progetto è rilasciato sotto licenza **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.  
- **Consentito:** Visionare, clonare, studiare e adattare il codice per scopi personali, di studio o non commerciali con attribuzione all'autore Francesco Santo.
- **Vietato:** È espressamente vietato qualsiasi uso a scopo di lucro, vendita, distribuzione commerciale o monetizzazione da parte di terzi senza preventiva autorizzazione scritta dell'autore.
