import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Modal from './Modal';

export default function LegalDisclaimerModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<ShieldAlert className="w-4 h-4" />}
      iconColor="rgb(var(--c-warn))"
      title={t('disclaimerModalTitle')}
      subtitle="Compliance & medical notice"
      closeLabel={t('btnClose')}
      footer={
        <button type="button" onClick={onClose} className="gl-btn">
          {t('btnClose')}
        </button>
      }
    >
      <div className="space-y-3.5 text-[12.5px] text-dim leading-relaxed">
        <p className="text-fg">{t('disclaimerP1')}</p>
        <div className="p-3 rounded-[10px] border border-warn/25 bg-warn/5 text-warn/90">
          <strong className="font-mono tracking-wider">{t('disclaimerWarnLabel')} </strong>
          {t('disclaimerP2')}
        </div>
        <p>{t('disclaimerP3')}</p>
        <p className="pt-3 border-t border-sline text-[11px] font-mono">{t('disclaimerDatasetNote')}</p>
      </div>
    </Modal>
  );
}
