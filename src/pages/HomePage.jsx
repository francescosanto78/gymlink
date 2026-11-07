import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileEdit, Clock, Copy, Check, Dumbbell, Info, X, BookOpen, ExternalLink, Eye, CopyPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [workoutInput, setWorkoutInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const editInputRef = useRef(null);

  // Sequenza typewriter: scrive la frase intro, attende 2.5s, sfuma a scomparire, lasciando solo le statistiche del dispositivo
  const [phase, setPhase] = useState('typing_intro'); // 'typing_intro' | 'pause_intro' | 'fading_intro' | 'done'
  const [typedIntro, setTypedIntro] = useState('');

  const introText = t('heroDesc');
  const countText = `${recentWorkouts.length} ${t('statDevice')}`;

  // Load cached workouts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gymlink_recent_workouts');
      if (stored) {
        setRecentWorkouts(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Unable to load cached workouts', e);
    }
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Autofocus quando si apre il box di modifica
  useEffect(() => {
    if (isEditOpen && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditOpen]);

  // Gestione animazione typewriter introduttiva con dissolvenza a scomparire
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }

    let i = 0;
    setTypedIntro('');
    setPhase('typing_intro');

    const typingInterval = setInterval(() => {
      i += 1;
      setTypedIntro(introText.slice(0, i));
      if (i >= introText.length) {
        clearInterval(typingInterval);
        setPhase('pause_intro');
        // Pausa di lettura prima della dissolvenza
        setTimeout(() => {
          setPhase('fading_intro');
          // Tempo della transizione fade prima del passaggio definitivo
          setTimeout(() => {
            setPhase('done');
          }, 600);
        }, 2500);
      }
    }, 18);

    return () => clearInterval(typingInterval);
  }, [introText]);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  };

  // Helper to extract workout ID from URL or bare ID
  const handleOpenExisting = (e, mode = 'edit') => {
    if (e && e.preventDefault) e.preventDefault();
    setInputError('');

    const raw = workoutInput.trim();
    if (!raw) return;

    let extractedId = raw;
    if (raw.includes('/')) {
      const parts = raw.split('/');
      extractedId = parts[parts.length - 1] || parts[parts.length - 2];
    }

    extractedId = extractedId.split('?')[0].split('#')[0].trim();

    if (!extractedId || extractedId.length < 5) {
      setInputError(t('invalidIdError'));
      return;
    }

    if (mode === 'template') {
      navigate(`/editor?templateId=${extractedId}`);
    } else {
      navigate(`/edit/${extractedId}`);
    }
  };

  const handleCopyLink = (id) => {
    const fullUrl = `${window.location.origin}/w/${id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tickerItems = t('tickerItems');
  const items = Array.isArray(tickerItems) ? tickerItems : [];

  return (
    <div className="gl-page-in max-w-[1100px] mx-auto px-4 pt-4 pb-10 space-y-4">

      {/* ---------- HERO ---------- */}
      <section className="gl-panel overflow-hidden px-5 sm:px-7 pt-6 pb-6 gl-rise">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* Colonna Sinistra: Testi e Azioni */}
          <div className="lg:col-span-8 space-y-3.5">
            <div className="gl-eyebrow flex items-center gap-2">
              <span className="gl-dot pulse" />
              {t('heroBadge')}
            </div>

            <h1 className="m-0">
              <span className="block font-dot font-black text-[clamp(52px,8vw,96px)] leading-[0.9] tracking-[0.02em] text-acc [text-shadow:0_0_40px_var(--glow)]">
                GymLink
              </span>
              <span className="block mt-2 text-[clamp(18px,2vw,24px)] font-extrabold tracking-[-0.02em] text-fg">
                {t('heroSub')}
              </span>
            </h1>

            {/* Area Typewriter: intro animata che sfuma lasciando solo il conteggio schede dispositivo */}
            <div className="min-h-[2.4em] flex items-center">
              {phase !== 'done' ? (
                <p
                  className={`text-[13px] text-dim font-mono leading-relaxed transition-all duration-500 ${phase === 'fading_intro' ? 'opacity-0 -translate-y-1.5' : 'opacity-100 translate-y-0'
                    }`}
                >
                  <span className="gl-caret text-acc">{typedIntro}</span>
                </p>
              ) : (
                <p className="font-dot font-bold text-[14.5px] leading-snug tracking-[0.02em] text-acc gl-page-in flex items-center gap-2">
                  <span className="gl-dot pulse" />
                  <span>{countText}</span>
                </p>
              )}
            </div>

            {/* CTAs Gemelle: Crea Nuova Scheda + Modifica Scheda Esistente */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/editor')}
                className="gl-btn-primary"
              >
                <Plus className="w-4 h-4" strokeWidth={2.6} />
                <span>{t('btnCreateNew')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(!isEditOpen);
                  setInputError('');
                }}
                className="gl-btn-primary"
              >
                <FileEdit className="w-4 h-4" strokeWidth={2.6} />
                <span>{t('btnToggleEdit')}</span>
              </button>
            </div>

            {/* Terza CTA Sotto le Primarie: Tutorial per PT */}
            <div className="pt-1">
              <Link
                to="/tutorial"
                className="gl-btn !h-7 !px-2.5 !rounded-lg text-dim hover:text-acc font-mono text-[11px] font-semibold tracking-wider uppercase inline-flex items-center gap-1.5 border-sline hover:border-acc/40 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-acc/80" />
                <span>{t('btnTutorial')}</span>
                <span className="text-[10px] text-dim/60 font-sans">→</span>
              </Link>
            </div>

            {/* Box Modifica Scheda Esistente: compare DINAMICAMENTE al clic */}
            {isEditOpen && (
              <div className="gl-page-in pt-2 max-w-xl">
                <div className="p-4 rounded-xl border border-acc/40 bg-bg2/90 backdrop-blur-sm space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="gl-eyebrow !text-[10px]">{t('editBoxTitle')}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(false)}
                      className="text-dim hover:text-acc p-0.5"
                      aria-label="Chiudi form"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-dim">{t('editBoxDesc')}</p>

                  <form onSubmit={(e) => handleOpenExisting(e, 'edit')} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim group-focus-within:text-acc transition-colors pointer-events-none" />
                      <input
                        ref={editInputRef}
                        type="text"
                        placeholder={t('editInputPlaceholder')}
                        value={workoutInput}
                        onChange={(e) => {
                          setWorkoutInput(e.target.value);
                          if (inputError) setInputError('');
                        }}
                        className="gl-input !h-9 !pl-8 font-mono !text-[12px]"
                        aria-invalid={!!inputError}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="gl-btn !h-9 !rounded-[10px] !px-3.5 justify-center font-mono !text-[11px] font-bold tracking-wider uppercase !border-acc/50 !text-acc bg-acc/5 hover:bg-acc/15"
                      >
                        {t('btnOpenWorkout')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenExisting(e, 'template')}
                        className="gl-btn !h-9 !rounded-[10px] !px-3 justify-center font-mono !text-[11px] font-bold tracking-wider uppercase text-dim hover:text-acc hover:border-acc"
                        title="Clona come nuova scheda per un altro cliente"
                      >
                        Usa come Template
                      </button>
                    </div>
                  </form>

                  {inputError && (
                    <p className="gl-page-in text-xs text-danger font-mono">[!] {inputError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonna Destra: Riquadro Tecnico con la GIF Retro Arm (Testi aggiornati) */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            {/* Tema chiaro: riquadro pulito al posto della GIF retro */}
            <div className="gl-light-only gl-card w-full max-w-[260px] p-5 space-y-3">
              <span className="text-xs font-bold text-acc uppercase tracking-wide">GymLink</span>
              {[
                lang === 'en' ? 'No sign-up needed' : lang === 'es' ? 'Sin registro' : 'Nessuna registrazione',
                lang === 'en' ? '1,300+ exercises with animations' : lang === 'es' ? '1300+ ejercicios con animaciones' : '1300+ esercizi con animazioni',
                lang === 'en' ? 'Share with a single link' : lang === 'es' ? 'Comparte con un solo enlace' : 'Condividi con un solo link'
              ].map((txt) => (
                <div key={txt} className="flex items-center gap-2 text-sm text-fg font-sans">
                  <Check className="w-4 h-4 text-acc shrink-0" />
                  <span>{txt}</span>
                </div>
              ))}
            </div>
            <div className="gl-dark-only gl-card w-full max-w-[260px] p-2.5 bg-bg/80 border-acc/30 shadow-[0_0_30px_-10px_var(--glow)]">

              {/* Header Card con LED e slogan */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-sline/70">
                <div className="flex items-center gap-1.5">
                  <span className="gl-dot !w-[5px] !h-[5px]" />
                  <span className="gl-eyebrow !text-[9px]">LOAD YOUR AMBITIONS</span>
                </div>
                <span className="text-[9.5px] font-mono text-dim font-bold tracking-wider">SYS READY</span>
              </div>

              {/* Riquadro Immagine Retro Pixel Arm */}
              <div className="relative rounded-lg overflow-hidden border border-sline bg-bg2 flex items-center justify-center p-1">
                <img
                  src="/biceps2.gif"
                  alt="Retro Arcade Biceps Loading Animation"
                  className="w-full h-auto max-h-[175px] object-contain rounded"
                  loading="eager"
                />
              </div>

              {/* Footer Card con slogan motivazionale richiesto */}
              <div className="pt-2 mt-2 border-t border-sline/50 flex items-center justify-between text-[9.5px] font-mono text-dim">
                <span className="text-acc font-semibold tracking-wider">BEST PT APP EVER!</span>
                <span className="opacity-80 italic">You are your only limit</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ---------- TICKER ---------- */}
      <div className="gl-ticker gl-rise" style={{ '--d': '80ms' }}>
        <span className="gl-eyebrow flex items-center gap-2 shrink-0">
          <span className="gl-dot pulse" />
          {t('tickerLabel')}
        </span>
        <div className="gl-ticker-mask">
          <div className="gl-ticker-track">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
                {items.map((item, i) => (
                  <span key={`${dup}-${i}`} className="flex items-center gap-3 pr-8 text-[12px] font-mono text-dim whitespace-nowrap">
                    <span className="text-acc/60">◆</span>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- SCHEDE RECENTI SU QUESTO DISPOSITIVO ---------- */}
      <section className="gl-card gl-rise" style={{ '--d': '160ms' }}>
        <div className="gl-card-head flex items-center justify-between gap-3 !pr-9">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-acc shrink-0" />
            <h3 className="font-dot font-extrabold text-[17px] tracking-wide text-fg truncate">
              {t('recentWorkoutsTitle')}
            </h3>
          </div>
          <span className="gl-tag shrink-0" style={{ '--fc': 'rgb(var(--c-dim))' }}>
            {t('recentWorkoutsBadge')}
          </span>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-bg border border-sline grid place-items-center text-dim">
              <Dumbbell className="w-5 h-5 opacity-50 -rotate-45" />
            </div>
            <p className="font-dot font-extrabold text-[15px] text-fg tracking-wide">
              {t('noRecentWorkouts')}
            </p>
            <p className="text-xs text-dim max-w-md mx-auto mt-1.5">
              {t('noRecentWorkoutsSub')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-dim text-[10px] uppercase tracking-[0.14em] border-b border-sline">
                <tr>
                  <th className="px-4 py-2.5 font-bold">{t('colId')}</th>
                  <th className="px-4 py-2.5 font-bold">{t('colTitle')}</th>
                  <th className="px-4 py-2.5 font-bold">{t('colClient')}</th>
                  <th className="px-4 py-2.5 font-bold">{t('colDate')}</th>
                  <th className="px-4 py-2.5 font-bold text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sline/60">
                {recentWorkouts.map((item) => (
                  <tr key={item.id} className="hover:bg-acc/[0.04] transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/w/${item.id}`}
                        state={{ fromPt: true }}
                        className="inline-flex items-center gap-1.5 text-acc font-bold hover:underline"
                        title="Apri scheda in modalità PT"
                      >
                        <span>{item.id}</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/w/${item.id}`}
                        state={{ fromPt: true }}
                        className="text-fg hover:text-acc font-sans font-medium transition-colors"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-fg/90 font-sans">{item.clientName || '—'}</td>
                    <td className="px-4 py-2.5 text-dim">{item.date}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          to={`/w/${item.id}`}
                          state={{ fromPt: true }}
                          className="gl-btn !h-6 !text-[11px]"
                          title="Visualizza scheda"
                        >
                          <Eye className="w-3 h-3 text-dim" />
                          <span>Apri</span>
                        </Link>
                        <Link
                          to={`/edit/${item.id}`}
                          className="gl-btn !h-6 !text-[11px]"
                          title="Modifica scheda"
                        >
                          <FileEdit className="w-3 h-3 text-acc" />
                          <span>Modifica</span>
                        </Link>
                        <Link
                          to={`/editor?templateId=${item.id}`}
                          className="gl-btn !h-6 !text-[11px] hover:!border-acc"
                          title="Usa questa scheda come base per un nuovo cliente"
                        >
                          <CopyPlus className="w-3 h-3 text-acc" />
                          <span>Usa come Template</span>
                        </Link>
                        <button
                          onClick={() => handleCopyLink(item.id)}
                          className="gl-btn !h-6 !text-[11px]"
                          title="Copia link cliente"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-acc" />
                              <span className="text-acc">{t('copiedSuccess')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{t('actionCopy')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- TOAST ---------- */}
      {toast && (
        <div className="fixed z-50 inset-x-0 bottom-6 flex justify-center px-4 pointer-events-none">
          <div
            key={toast.key}
            role="status"
            className="gl-modal pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border border-acc/40 bg-bg2/95 backdrop-blur-md shadow-[0_10px_40px_-10px_var(--glow)]"
          >
            <Info className="w-4 h-4 text-acc shrink-0" />
            <span className="text-[12.5px] font-mono text-fg">{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
}
