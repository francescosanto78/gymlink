import React, { useState } from 'react';
import { BarChart3, Download, Copy, Check, FileText, Dumbbell, Calendar, ExternalLink } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { getExerciseDisplayName, translateTarget } from '../services/exerciseService';

/**
 * Modale Panoramica Globale Progressioni & Download Dati
 * Raccoglie i carichi e gli aumenti di tutti gli esercizi della scheda e permette l'esportazione per PT o prompt AI.
 */
export default function GlobalProgressExportModal({
  isOpen,
  onClose,
  workout
}) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!workout) return null;

  // Estrai tutti gli esercizi con i relativi carichi e storici
  const allExercises = [];
  if (Array.isArray(workout.days)) {
    workout.days.forEach((day, dayIdx) => {
      if (Array.isArray(day.exercises)) {
        day.exercises.forEach((ex) => {
          allExercises.push({
            dayTitle: day.title || `Giorno ${String.fromCharCode(65 + dayIdx)}`,
            id: ex.id,
            name: ex.name,
            target: ex.target || 'Generale',
            sets: ex.sets || '—',
            reps: ex.reps || '—',
            weight: ex.weight || 'A sensazione',
            history: Array.isArray(ex.weightHistory) ? ex.weightHistory : []
          });
        });
      }
    });
  }

  // Genera testo formattato pronto da incollare su ChatGPT / Claude / Gemini
  const generateAiPromptText = () => {
    let text = `ANALISI PROGRESSIONE CARICHI - GYMLINK\n`;
    text += `Scheda: ${workout.title || 'Scheda'}\n`;
    text += `Atleta: ${workout.clientName || 'Atleta'}\n`;
    text += `Personal Trainer: ${workout.ptName || 'PT'}\n`;
    text += `Data Report: ${new Date().toISOString().split('T')[0]}\n\n`;
    text += `DETTAGLIO ESERCIZI E CARICHI ATTUALI:\n`;

    allExercises.forEach((ex, idx) => {
      const exDisplayName = getExerciseDisplayName(ex.name, lang);
      const exTargetName = translateTarget(ex.target, lang);
      text += `${idx + 1}. [${ex.dayTitle}] ${exDisplayName} (${exTargetName})\n`;
      text += `   - Target: ${ex.sets} serie × ${ex.reps} reps | Carico attuale: ${ex.weight}\n`;
      if (ex.history.length > 0) {
        text += `   - Storico aumenti registrati: ${ex.history.map((h) => `${h.date}: ${h.raw || h.weight}`).join(' → ')}\n`;
      } else {
        text += `   - Storico: Nessuna variazione registrata finora.\n`;
      }
    });

    text += `\nOBIETTIVO ANALISI PER AI / PT:\nValuta la progressione del sovraccarico progressivo, identifica eventuali squilibri muscolari o stalli tra gruppi muscolari di spinta, trazione e gambe e suggerisci accorgimenti per il prossimo mesociclo.`;
    return text;
  };

  // Download CSV normalizzato per analisi e tabelle pivot Excel / AI:
  // Una riga per ogni variazione temporale partendo dal carico iniziale.
  // Ordine colonne: Esercizio, Target, Serie, Reps, Peso, Data
  const handleDownloadCsv = () => {
    let csv = 'Esercizio,Target,Serie,Reps,Peso,Data\n';

    allExercises.forEach((ex) => {
      const exDisplayName = getExerciseDisplayName(ex.name, lang);
      const exTargetName = translateTarget(ex.target, lang);
      if (ex.history && ex.history.length > 0) {
        // Se ci sono variazioni registrate, cicla cronologicamente tutti i punti (dal base alle variazioni successive)
        ex.history.forEach((h) => {
          const weightVal = h.raw || (typeof h.weight === 'number' ? `${h.weight} kg` : h.weight);
          csv += `"${exDisplayName}","${exTargetName}","${ex.sets}","${ex.reps}","${weightVal}","${h.date}"\n`;
        });
      } else {
        // Se non ci sono ancora variazioni registrate, emetti la riga con il carico iniziale della scheda
        const dateVal = workout.date || new Date().toISOString().split('T')[0];
        csv += `"${exDisplayName}","${exTargetName}","${ex.sets}","${ex.reps}","${ex.weight}","${dateVal}"\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymlink_progressioni_${workout.id || 'scheda'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = () => {
    const text = generateAiPromptText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="center"
      maxWidth="max-w-xl"
      title={t('globalExportTitle')}
      subtitle={`${workout.title || 'Scheda'} · ${allExercises.length} ${t('exercises')}`}
      icon={<BarChart3 className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Box Spiegazione Utilità PT & AI */}
        <div className="p-3.5 rounded-xl border border-line bg-bg2/90 space-y-1.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-acc font-bold uppercase text-[11px]">
            <span>💡 {t('globalExportSubtitle')}</span>
          </div>
          <p className="text-dim leading-relaxed font-sans text-xs">
            Puoi scaricare il file o copiare il report testuale formattato per inviarlo al tuo Personal Trainer o incollarlo nella tua AI preferita (ChatGPT, Claude, Gemini) per analizzare i progressi e individuare eventuali stalli muscolari.
          </p>
        </div>

        {/* Tabella Sintetica Esercizi & Carichi */}
        <div className="max-h-[240px] overflow-y-auto rounded-xl border border-sline bg-bg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-bg2/80 text-[10px] text-dim uppercase border-b border-sline sticky top-0">
              <tr>
                <th className="p-2.5">{t('exerciseSingular')}</th>
                <th className="p-2.5">{t('lblSets')} × {t('lblReps')}</th>
                <th className="p-2.5">{t('lblWeight')}</th>
                <th className="p-2.5 text-right">📈</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sline/50">
              {allExercises.map((ex, i) => (
                <tr key={i} className="hover:bg-bg2/40">
                  <td className="p-2.5 font-bold text-fg truncate max-w-[180px]">
                    {getExerciseDisplayName(ex.name, lang)}
                  </td>
                  <td className="p-2.5 text-dim">
                    {ex.sets} × {ex.reps}
                  </td>
                  <td className="p-2.5 text-acc font-bold">
                    {ex.weight}
                  </td>
                  <td className="p-2.5 text-right text-dim">
                    {ex.history.length > 0 ? (
                      <span className="text-acc font-bold">+{ex.history.length}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Azioni di Esportazione */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="gl-btn-primary flex-1 justify-center !h-9 text-xs font-mono font-bold gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-ink" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('copiedAiPrompt') : t('btnCopyAiPrompt')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="gl-btn flex-1 justify-center !h-9 text-xs font-mono font-bold gap-2 text-fg hover:text-acc"
          >
            <Download className="w-4 h-4" />
            <span>{t('btnDownloadCsv')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

