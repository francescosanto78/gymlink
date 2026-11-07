import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Calendar, RefreshCw, Share2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TutorialPage() {
  const { t } = useLanguage();

  return (
    <div className="gl-page-in max-w-[900px] mx-auto px-4 pt-4 pb-12 space-y-6">
      
      {/* Testata della Guida */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Link
          to="/"
          className="gl-btn !h-8 !px-3 !rounded-lg text-dim hover:text-acc font-mono text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('tutorialBackHome')}</span>
        </Link>
        <span className="gl-tag" style={{ '--fc': 'rgb(var(--c-acc))' }}>
          PT MANUAL • V1.1
        </span>
      </div>

      <div className="gl-panel p-6 sm:p-8 space-y-3">
        <span className="gl-eyebrow flex items-center gap-2">
          <span className="gl-dot pulse" />
          {t('tutorialEyebrow')}
        </span>
        <h1 className="font-dot font-black text-[clamp(28px,4.5vw,48px)] leading-[1.05] tracking-wide text-acc [text-shadow:0_0_30px_var(--glow)]">
          {t('tutorialTitle')}
        </h1>
        <p className="text-sm text-dim leading-relaxed max-w-2xl">
          {t('tutorialSubtitle')}
        </p>
      </div>

      {/* Sezioni Guida a blocchi sintetici per punti */}
      <div className="space-y-4">
        
        {/* Blocco 1 */}
        <section className="gl-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5 border-b border-sline/70 pb-3">
            <span className="w-6 h-6 rounded-md bg-acc/10 border border-acc/30 text-acc font-dot font-black text-xs grid place-items-center">
              1
            </span>
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg">
              {t('tutSec1Title')}
            </h2>
          </div>
          <ul className="space-y-2 text-xs font-mono text-dim leading-relaxed list-disc list-inside">
            <li><strong className="text-fg">{t('tutSec1P1')}</strong></li>
            <li>{t('tutSec1P2')}</li>
            <li>{t('tutSec1P3')}</li>
          </ul>
        </section>

        {/* Blocco 2 */}
        <section className="gl-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5 border-b border-sline/70 pb-3">
            <span className="w-6 h-6 rounded-md bg-acc/10 border border-acc/30 text-acc font-dot font-black text-xs grid place-items-center">
              2
            </span>
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg">
              {t('tutSec2Title')}
            </h2>
          </div>
          <ul className="space-y-2 text-xs font-mono text-dim leading-relaxed list-disc list-inside">
            <li><strong className="text-fg">{t('tutSec2P1')}</strong></li>
            <li>{t('tutSec2P2')}</li>
            <li>{t('tutSec2P3')}</li>
          </ul>
        </section>

        {/* Blocco 3: Eccezioni */}
        <section className="gl-card p-5 sm:p-6 space-y-3" style={{ '--fc': 'rgb(var(--c-warn))' }}>
          <div className="flex items-center gap-2.5 border-b border-sline/70 pb-3">
            <span className="w-6 h-6 rounded-md bg-warn/10 border border-warn/30 text-warn font-dot font-black text-xs grid place-items-center">
              3
            </span>
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg">
              {t('tutSec3Title')}
            </h2>
          </div>
          <div className="p-3 rounded-lg border border-warn/25 bg-warn/5 text-warn text-xs font-mono mb-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('tutSec3Notice')}</span>
          </div>
          <ul className="space-y-2 text-xs font-mono text-dim leading-relaxed list-disc list-inside">
            <li><strong className="text-fg">{t('tutSec3P1')}</strong></li>
            <li>{t('tutSec3P2')}</li>
            <li>{t('tutSec3P3')}</li>
          </ul>
        </section>

        {/* Blocco 4 */}
        <section className="gl-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5 border-b border-sline/70 pb-3">
            <span className="w-6 h-6 rounded-md bg-acc/10 border border-acc/30 text-acc font-dot font-black text-xs grid place-items-center">
              4
            </span>
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg">
              {t('tutSec4Title')}
            </h2>
          </div>
          <ul className="space-y-2 text-xs font-mono text-dim leading-relaxed list-disc list-inside">
            <li><strong className="text-fg">{t('tutSec4P1')}</strong></li>
            <li>{t('tutSec4P2')}</li>
            <li>{t('tutSec4P3')}</li>
          </ul>
        </section>

        {/* Blocco 5 */}
        <section className="gl-card p-5 sm:p-6 space-y-3" style={{ '--fc': 'rgb(var(--c-info))' }}>
          <div className="flex items-center gap-2.5 border-b border-sline/70 pb-3">
            <span className="w-6 h-6 rounded-md bg-info/10 border border-info/30 text-info font-dot font-black text-xs grid place-items-center">
              5
            </span>
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg">
              {t('tutSec5Title')}
            </h2>
          </div>
          <ul className="space-y-2 text-xs font-mono text-dim leading-relaxed list-disc list-inside">
            <li><strong className="text-fg">{t('tutSec5P1')}</strong></li>
            <li>{t('tutSec5P2')}</li>
            <li>{t('tutSec5P3')}</li>
          </ul>
        </section>

        {/* Blocco 6: Nuove Funzionalità v1.1 - Progressioni e Dati */}
        <section className="gl-card p-5 sm:p-6 space-y-3" style={{ '--fc': 'rgb(var(--c-acc))' }}>
          <div className="flex items-center gap-2.5 border-b border-sline/70 pb-3">
            <span className="w-6 h-6 rounded-md bg-acc/10 border border-acc/30 text-acc font-dot font-black text-xs grid place-items-center">
              6
            </span>
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg">
              {t('tutSec6Title')}
            </h2>
          </div>
          <ul className="space-y-2 text-xs font-mono text-dim leading-relaxed list-disc list-inside">
            <li><strong className="text-fg">{t('tutSec6P1')}</strong></li>
            <li>{t('tutSec6P2')}</li>
            <li>{t('tutSec6P3')}</li>
          </ul>
        </section>

      </div>

      {/* Box CTA di Ritorno & Link Guida Atleta */}
      <div className="pt-4 flex flex-col items-center gap-3">
        <Link to="/" className="gl-btn-primary">
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          <span>{t('tutorialStartNow')}</span>
        </Link>
        <Link
          to="/guida"
          className="text-xs font-mono text-dim hover:text-acc inline-flex items-center gap-1.5 transition-colors mt-1"
        >
          <span>Vuoi vedere cosa legge il tuo cliente?</span>
          <span className="underline font-bold text-fg">Apri la Guida per l'Atleta ➔</span>
        </Link>
      </div>

    </div>
  );
}

