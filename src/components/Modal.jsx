import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Guscio comune delle modali: sfondo sfocato con dissolvenza, pannello che sale (animazione FMDB "welup"),
 * chiusura con ESC, clic fuori dal pannello o pulsante X.
 *
 * La modale viene renderizzata in un portal su document.body: in questo modo non eredita mai
 * transform/animazioni dei contenitori di pagina (che rendevano la posizione "fixed" instabile).
 *
 * variant="anchored": la modale si apre a tutta larghezza/altezza SOTTO la Navbar (#gl-navbar),
 * che resta sempre visibile e cliccabile sopra di essa.
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  icon, 
  iconColor = 'rgb(var(--c-acc))', 
  title, 
  subtitle, 
  children, 
  footer, 
  closeLabel,
  maxWidth = 'max-w-lg',
  customScroll = false,
  contentClassName = '',
  variant = 'center'
}) {
  const { t } = useLanguage();
  const effectiveCloseLabel = closeLabel || t('btnClose') || 'Chiudi';
  const isAnchored = variant === 'anchored';
  const [navBottom, setNavBottom] = useState(60);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('gl-modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('gl-modal-open');
    };
  }, [isOpen, onClose]);

  // Misura il bordo inferiore reale della Navbar (linea di ancoraggio) e lo aggiorna al resize
  useLayoutEffect(() => {
    if (!isOpen || !isAnchored) return;
    const measure = () => {
      const nav = document.getElementById('gl-navbar');
      if (nav) setNavBottom(Math.max(0, Math.round(nav.getBoundingClientRect().bottom)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, isAnchored]);

  if (!isOpen) return null;

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      className="gl-btn !h-8 !px-2.5 !rounded-lg shrink-0 inline-flex items-center gap-1.5 hover:!border-danger/60 hover:!text-danger"
      aria-label={effectiveCloseLabel}
      title={effectiveCloseLabel}
    >
      <X className="w-4 h-4" strokeWidth={2.5} />
      <span className="hidden sm:inline font-mono text-[11px] font-bold uppercase tracking-wider">{effectiveCloseLabel}</span>
    </button>
  );

  const header = (
    <div className="gl-card-head flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {icon && (
          <div
            className="grid place-items-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0"
            style={{
              color: iconColor,
              background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${iconColor} 35%, transparent)`,
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-dot font-extrabold text-[15px] sm:text-[17px] leading-tight text-fg tracking-wide uppercase truncate">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] sm:text-xs text-dim mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {closeButton}
    </div>
  );

  const body = customScroll ? (
    <div className={`p-2.5 sm:p-4 md:p-5 flex-1 min-h-0 flex flex-col overflow-hidden ${contentClassName}`}>
      {children}
    </div>
  ) : (
    <div className={`p-3 sm:p-5 overflow-y-auto flex-1 min-h-0 ${contentClassName}`}>
      {children}
    </div>
  );

  const footerEl = footer && (
    <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-sline flex justify-end shrink-0 bg-bg2/40">
      {footer}
    </div>
  );

  const content = isAnchored ? (
    // Area fissa che parte esattamente dalla linea inferiore della Navbar fino al fondo dello schermo
    <div
      className="gl-modal-backdrop fixed left-0 right-0 bottom-0 z-[35] flex justify-center px-2 pb-2 pt-2 sm:px-4 sm:pb-4 sm:pt-3 bg-black/75 backdrop-blur-md"
      style={{ top: navBottom }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`gl-modal gl-card w-full ${maxWidth} h-full flex flex-col shadow-2xl overflow-hidden`}
        style={{ '--fc': iconColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        {body}
        {footerEl}
      </div>
    </div>
  ) : (
    <div
      className="gl-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`gl-modal gl-card w-full ${maxWidth} max-h-[92vh] flex flex-col shadow-2xl overflow-hidden`}
        style={{ '--fc': iconColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        {body}
        {footerEl}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
