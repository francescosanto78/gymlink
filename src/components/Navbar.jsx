import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, BookOpen, Sun, Moon, ArrowLeft, Github } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { lang, changeLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Come in FMDB: barra trasparente in cima, fondo che compare scorrendo la pagina
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const languages = ['it', 'en', 'es'];
  const RECENT_KEY = 'gymlink_recent_workouts';
  const workoutMatch = location.pathname.match(/^\/(w|workout)\/([^/]+)/);
  const workoutId = workoutMatch ? workoutMatch[2] : null;

  // Rilevamento se l'utente è in modalità PT (ha creato la scheda su questo device, arriva da dashboard, o è in home/editor)
  const isPtMode = useMemo(() => {
    if (!workoutId) return true;
    if (location.state?.fromPt) return true;
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.some((w) => w?.id === workoutId)) {
          return true;
        }
      }
      const draft = localStorage.getItem('gymlink_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed?.id === workoutId) return true;
      }
    } catch (e) {
      console.warn(e);
    }
    return false;
  }, [workoutId, location.state]);

  // Solo se siamo su una scheda di un altro e NON siamo il PT autore
  const isPureClientView = Boolean(workoutId && !isPtMode);

  const LogoTag = isPureClientView ? 'div' : Link;
  const onTutorial = location.pathname === '/tutorial' || location.pathname === '/guida';
  const tutorialPath = isPureClientView ? '/guida' : '/tutorial';
  const RETURN_KEY = 'gymlink_return_path';

  const backLabels = {
    editor: { it: 'Torna alla scheda', en: 'Back to workout', es: 'Volver a la ficha' },
    home: { it: 'Torna alla home', en: 'Back to home', es: 'Volver al inicio' }
  };
  const returnPath = (() => {
    try { return sessionStorage.getItem(RETURN_KEY) || '/'; } catch { return '/'; }
  })();
  const backKind = returnPath === '/' ? 'home' : 'editor';

  const handleTutorialClick = (e) => {
    e.preventDefault();
    if (onTutorial) {
      navigate(returnPath);
    } else {
      try { sessionStorage.setItem(RETURN_KEY, location.pathname); } catch { /* ignore */ }
      navigate(tutorialPath);
    }
  };

  return (
    <header
      id="gl-navbar"
      className={`sticky top-0 z-40 w-full transition-[background-color,border-color,backdrop-filter] duration-300 border-b ${
        scrolled ? 'bg-bg/85 backdrop-blur-md border-line' : 'bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-[1100px] mx-auto px-4 h-[60px] flex items-center justify-between gap-3">
        {/* Logo */}
        <LogoTag
          {...(isPureClientView ? {} : { to: '/' })}
          className={`group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-acc2 ${
            isPureClientView ? 'cursor-default select-none' : 'cursor-pointer'
          }`}
          title={isPureClientView ? 'GymLink' : 'Torna alla schermata iniziale PT'}
        >
          <div className="grid place-items-center w-8 h-8 rounded-[10px] bg-acc/10 border border-acc/35 text-acc transition-all duration-200 group-hover:bg-acc/20 group-hover:border-acc group-hover:shadow-[0_0_18px_-4px_var(--glow)]">
            <Dumbbell className="w-4 h-4 -rotate-45 transition-transform duration-300 group-hover:rotate-[-20deg]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-dot font-black text-[22px] tracking-wide gl-glow">GymLink</span>
            <span className="gl-eyebrow !text-[8.5px] !text-dim mt-1 hidden sm:block">{t('appSubtitle')}</span>
          </div>
        </LogoTag>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Link Tutorial nella Navbar */}
          <a
            href={tutorialPath}
            onClick={handleTutorialClick}
            className={`gl-btn !h-8 !rounded-[10px] ${onTutorial ? '!border-acc !text-acc bg-acc/10' : ''}`}
            aria-current={onTutorial ? 'page' : undefined}
          >
            {onTutorial ? <ArrowLeft className="w-3.5 h-3.5 text-acc" /> : <BookOpen className="w-3.5 h-3.5 text-acc" />}
            <span className="hidden sm:inline font-mono text-[11px] font-bold tracking-wider uppercase">
              {onTutorial ? backLabels[backKind][lang] : (isPureClientView ? 'Tutorial' : t('navTutorial'))}
            </span>
            <span className="sm:hidden font-mono text-[11px] font-bold">
              {onTutorial ? '←' : 'GUIDA'}
            </span>
          </a>

          {/* Selettore lingua: pillole di vetro con punto luminoso sulla lingua attiva */}
          <div className="flex items-center h-8 p-[3px] gap-[2px] rounded-[10px] border border-sline bg-bg2/80" role="group" aria-label="Language">
            {languages.map((code) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => changeLanguage(code)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 h-full px-2 rounded-[7px] font-mono text-[11px] font-bold tracking-wider transition-all duration-200 ${
                    active ? 'bg-acc/15 text-acc shadow-[inset_0_0_0_1px_rgb(var(--c-acc)/0.35)]' : 'text-dim hover:text-fg hover:bg-fg/5'
                  }`}
                >
                  {active && <span className="gl-dot !w-[5px] !h-[5px]" />}
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Selettore Tema: Scuro (Smeraldo) vs Chiaro (Bianco/Blu) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="gl-btn !h-8 !w-8 !p-0 !rounded-[10px] justify-center text-dim hover:text-fg hover:border-acc transition-colors shrink-0"
            title={theme === 'dark' ? 'Passa al Tema Chiaro (Bianco & Blu)' : 'Passa al Tema Scuro (Notte Smeraldo)'}
            aria-label="Cambia tema colore"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-warn transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-acc transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}


