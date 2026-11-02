import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Modal from './Modal';

export default function FeedbackModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    botcheck: false
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // La chiave arriva solo dalla variabile d'ambiente: nessuna email nel codice frontend
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

  const handleClose = () => {
    if (status !== 'loading') {
      if (status === 'success') setStatus('idle');
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.botcheck) {
      // Bot detected via honeypot
      return;
    }

    if (!accessKey) {
      setStatus('error');
      setErrorMessage(t('feedbackNoKeyWarning'));
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `GymLink Feedback from ${formData.name}`,
          from_name: 'GymLink System',
          name: formData.name,
          email: formData.email,
          message: formData.message,
          botcheck: formData.botcheck ? '1' : ''
        })
      });

      const result = await response.json();
      if (result.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '', botcheck: false });
      } else {
        setStatus('error');
        setErrorMessage(result.message || t('feedbackError'));
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(t('feedbackError'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={<MessageSquare className="w-4 h-4" />}
      title={t('feedbackModalTitle')}
      subtitle={t('feedbackModalSubtitle')}
      closeLabel={t('btnClose')}
    >
      {status === 'success' ? (
        <div className="py-6 text-center space-y-3 gl-page-in">
          <div className="w-12 h-12 mx-auto rounded-full bg-acc/10 border border-acc/40 grid place-items-center text-acc gl-flash">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-fg">{t('feedbackSuccess')}</p>
          <button type="button" onClick={handleClose} className="gl-btn mt-2">
            {t('btnClose')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Web3Forms Honeypot field (hidden from humans, catches bots) */}
          <input
            type="checkbox"
            name="botcheck"
            checked={formData.botcheck}
            onChange={(e) => setFormData({ ...formData, botcheck: e.target.checked })}
            className="hidden"
            style={{ display: 'none' }}
            tabIndex="-1"
            autoComplete="off"
          />

          {status === 'error' && (
            <div className="gl-page-in p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-xs text-danger flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold tracking-wider">[ERROR] </span>
                <span className="text-fg/90">{errorMessage || t('feedbackError')}</span>
              </div>
            </div>
          )}

          <div>
            <label className="gl-label" htmlFor="fb-name">
              {t('lblName')} <span className="text-danger">*</span>
            </label>
            <input
              id="fb-name"
              type="text"
              required
              placeholder={t('phName')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="gl-input"
            />
          </div>

          <div>
            <label className="gl-label" htmlFor="fb-email">
              {t('lblEmail')} <span className="text-danger">*</span>
            </label>
            <input
              id="fb-email"
              type="email"
              required
              placeholder={t('phEmail')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="gl-input"
            />
          </div>

          <div>
            <label className="gl-label" htmlFor="fb-message">
              {t('lblMessage')} <span className="text-danger">*</span>
            </label>
            <textarea
              id="fb-message"
              required
              rows={4}
              placeholder={t('phMessage')}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="gl-input"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-sline">
            <span className="gl-eyebrow !text-dim !text-[9.5px]">Powered by Web3Forms</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleClose} className="gl-btn">
                {t('btnClose')}
              </button>
              <button type="submit" disabled={status === 'loading'} className="gl-btn-primary !h-8 !px-3.5 !text-[11px] !rounded-lg">
                <Send className="w-3.5 h-3.5" />
                <span>{status === 'loading' ? t('btnSubmitting') : t('btnSubmitFeedback')}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
