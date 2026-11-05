# Changelog - GymLink

Tutte le modifiche rilevanti a questo progetto saranno documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/) e aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
