# GymLink 🏋️‍♂️⚡

> **Workout routines made frictionless.**  
> Applicazione web open source, mobile-first, per Personal Trainer (PT) e atleti: crea, gestisci e condividi schede di allenamento professionali tramite link unici, senza obbligo di registrazione o login per gli atleti.

🌐 **Live Demo:** [https://gymlink.pages.dev](https://gymlink.pages.dev)  
📦 **Repository:** [https://github.com/francescosanto78/gymlink](https://github.com/francescosanto78/gymlink)

---

## ✨ Caratteristiche Principali

- **Nessuna Registrazione Obbligatoria (Zero Friction):** I Personal Trainer possono iniziare a comporre una scheda immediatamente. Gli atleti la aprono con un tap sul link.
- **Link Unici di Condivisione (BaaS Cloud):** Salvataggio su Supabase Cloud con generazione di URL unici e non indicizzabili da Google (`nanoid(10)`).
- **Condivisione WhatsApp & Stampa PDF:** Condivisione 1-click su WhatsApp con messaggio preformattato ed esportazione PDF pulita per la sala pesi.
- **Interfaccia Esecuzione Allenamento per l'Atleta:**
  - Timer di recupero sonoro con sintesi vocale / segnale acustico.
  - Spunte interattive per serie completate (con persistenza di sessione).
  - Modalità Focus / Fullscreen per la massima leggibilità durante il workout.
  - Logo bloccato in sola lettura per evitare uscite accidentali durante le serie.
- **Database Esercizi Completo:** Ricerca rapida tra centinaia di esercizi divisi per gruppo muscolare, con varianti, note su tempo di esecuzione e RPE.
- **Console di Manutenzione & Igiene Dati (`/admin`):**
  - Area riservata e protetta da PIN per l'amministratore.
  - Filtri 1-click per eliminare routine di test o abbandonate (zombie).
  - Esportazione completa Backup JSON e **Ripristino / Upload** con operazione di upsert sicuro (non altera gli ID dei link già inviati agli atleti).
- **GDPR Compliant & Analytics Anonimizzato:** Banner cookie minimale che abilita Google Analytics 4 solo su consenso esplicito dell'utente.

---

## 🛠️ Stack Tecnologico

- **Frontend:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Tema personalizzato Emerald Night `#07100d`, accento `#3ee6a0`, Doto dot-matrix typography, animated starfield)
- **Icone:** [Lucide React](https://lucide.dev/)
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL Cloud con RLS & RPC atomiche)
- **Analytics:** [Google Analytics 4](https://analytics.google.com/) (integrazione condizionale post-consenso)
- **Hosting & CI/CD:** [Cloudflare Pages](https://pages.cloudflare.com/) collegato a GitHub con deploy continuo e supporto SPA (`_redirects`)

---

## 🚀 Avvio in Locale

### Prerequisiti
- [Node.js](https://nodejs.org/) versione 20 o superiore
- [Git](https://git-scm.com/)

### Installazione

```bash
# 1. Clona il repository
git clone https://github.com/francescosanto78/gymlink.git
cd gymlink

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env
# Inserisci le tue credenziali Supabase, GA4 e PIN Admin in .env

# 4. Avvia il server di sviluppo
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`.

---

## 🔒 Variabili d'Ambiente

Nel file `.env` (o nei Secret di Cloudflare Pages) configurare:

| Variabile | Descrizione |
|---|---|
| `VITE_SUPABASE_URL` | URL del progetto Supabase Cloud |
| `VITE_SUPABASE_ANON_KEY` | Chiave pubblica Anon di Supabase |
| `VITE_ADMIN_KEY` | PIN segreto per accedere a `/admin` |
| `VITE_GA_MEASUREMENT_ID` | Measurement ID di Google Analytics (es. `G-XXXXXXXXXX`) |
| `VITE_WEB3FORMS_ACCESS_KEY` | *(Opzionale)* Chiave Web3Forms per ricezione feedback |

---

## 📄 Licenza & Autore

- **Autore:** [Francesco Santo](https://github.com/francescosanto78)
- Progetto distribuito sotto licenza **MIT**. Sentiti libero di clonarlo, personalizzarlo e utilizzarlo per la tua attività o palestra!
