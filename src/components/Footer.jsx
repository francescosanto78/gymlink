import React, { useState } from 'react';
import { MessageSquare, ShieldAlert, Linkedin, Database, Dumbbell, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import FeedbackModal from './FeedbackModal';
import LegalDisclaimerModal from './LegalDisclaimerModal';

export default function Footer() {
  const { t } = useLanguage();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  return (
    <>
      <footer className="relative z-10 w-full mt-auto border-t border-line bg-bg2/60 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Crediti autore + LinkedIn */}
            <div className="flex items-center gap-2 text-xs font-mono text-dim flex-wrap justify-center">
              <Link to="/" className="inline-flex items-center gap-1.5 text-acc font-bold hover:underline">
                <Dumbbell className="w-3.5 h-3.5 -rotate-45" />
                <span>GymLink</span>
              </Link>
              <span className="text-line2">•</span>
              <span>{t('createdBy')}</span>
              <a
                href="https://www.linkedin.com/in/francescosanto/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-fg font-semibold border-b border-dotted border-line2 hover:text-acc hover:border-acc transition-colors"
              >
                <span>{t('authorName')}</span>
                <Linkedin className="w-3.5 h-3.5 text-[#0a8fd8] group-hover:text-acc transition-colors" />
              </a>
              <span className="text-line2">•</span>
              <a
                href="https://github.com/francescosanto78/gymlink"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-dim hover:text-fg font-semibold transition-colors"
                title="Repository GitHub di GymLink"
              >
                <Github className="w-3.5 h-3.5 group-hover:text-acc transition-colors" />
                <span>GitHub</span>
              </a>
            </div>

            {/* Note legali + CTA Feedback */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => setIsDisclaimerOpen(true)} className="gl-btn !border-transparent hover:!border-warn/50 hover:!text-warn">
                <ShieldAlert className="w-3.5 h-3.5 text-warn/80" />
                <span>{t('legalDisclaimerLink')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="gl-btn !h-8 !rounded-[10px] !border-acc/45 !text-acc bg-acc/5 hover:bg-acc/15 hover:shadow-[0_0_20px_-6px_var(--glow)]"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] font-bold tracking-wider uppercase">💬 {t('feedbackBtn')}</span>
              </button>
            </div>
          </div>

          {/* Attribuzioni obbligatorie dataset & media */}
          <div className="mt-5 pt-4 border-t border-line/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-dim/85 text-center sm:text-left">
            <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
              <Database className="w-3 h-3 text-acc/70 shrink-0" />
              <span>{t('datasetAttribution')}</span>
              <a
                href="https://github.com/hasaneyldrm/exercises-dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-4 hover:text-acc transition-colors"
              >
                {t('datasetRepoNote')}
              </a>
              <span className="text-line2">•</span>
              <span>{t('mediaAttribution')}</span>
              <a
                href="https://gymvisual.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-4 hover:text-acc transition-colors"
              >
                {t('gymVisualNote')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <LegalDisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
    </>
  );
}
