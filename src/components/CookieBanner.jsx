import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X } from 'lucide-react';
import { initGA } from '../services/analyticsService';

const COOKIE_CONSENT_KEY = 'gymlink_cookie_consent';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

    if (consent === 'accepted') {
      if (measurementId) {
        initGA(measurementId);
      }
    } else if (!consent) {
      // Mostra il banner dopo 800ms per non impattare il primo paint
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      initGA(measurementId);
    }
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Informativa Cookie e Privacy"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 gl-rise"
    >
      <div className="gl-card p-4 sm:p-5 border-acc/40 shadow-2xl backdrop-blur-md bg-bg2/95 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-acc/10 border border-acc/30 grid place-items-center text-acc shrink-0 mt-0.5">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-dot font-black text-xs text-fg uppercase tracking-wide">
                Privacy & Cookie
              </h4>
              <button
                type="button"
                onClick={handleDecline}
                className="text-dim hover:text-fg p-0.5 -mr-1"
                title="Chiudi e rifiuta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] font-mono text-dim leading-relaxed">
              Utilizziamo cookie tecnici per salvare le schede e, previo tuo consenso, Google Analytics anonimizzato per misurare le visite. Nessun dato personale viene venduto o profilato.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="gl-btn-primary flex-1 justify-center !h-8 text-xs font-mono font-bold"
          >
            Accetta Tutti
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="gl-btn flex-1 justify-center !h-8 text-xs font-mono text-dim hover:text-fg"
          >
            Solo Tecnici
          </button>
        </div>
      </div>
    </div>
  );
}

