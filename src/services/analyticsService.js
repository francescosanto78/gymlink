/**
 * Servizio per l'inizializzazione e il tracciamento di Google Analytics 4 (GA4).
 * Conforme al GDPR: viene inizializzato SOLO se l'utente ha fornito il consenso ai cookie analitici.
 */

let isInitialized = false;

export function initGA(measurementId) {
  if (isInitialized || !measurementId || typeof window === 'undefined') return;

  // Se lo script gtag è già presente nel DOM, non duplicarlo
  if (document.getElementById('ga-gtag-script')) {
    isInitialized = true;
    return;
  }

  // Crea e inietta il tag script per gtag.js
  const script = document.createElement('script');
  script.id = 'ga-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Inizializza dataLayer e funzione gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: true
  });

  isInitialized = true;
  console.log(`[GymLink] GA4 inizializzato con ID: ${measurementId}`);
}

/**
 * Traccia una visualizzazione di pagina (utile per SPA con React Router).
 */
export function trackPageView(path, title) {
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title
      });
    }
  }
}

/**
 * Traccia un evento personalizzato (es. save_workout, export_pdf, share_whatsapp).
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

