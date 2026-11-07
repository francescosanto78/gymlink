import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, ChevronLeft, ChevronRight, X, Info, Download, Copy, Check, Scale } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

/**
 * Modale Grafico Progressione Carico per Singolo Esercizio
 * Mostra storico pesi registrati dall'atleta, trendline e vista a finestre trimestrali (~12 settimane).
 */
export default function ExerciseProgressModal({
  isOpen,
  onClose,
  exerciseName,
  weightHistory = [],
  currentWeight = ''
}) {
  const { t, lang } = useLanguage();
  // Offset trimestrale (0 = trimestre corrente/più recente, 1 = trimestre precedente, ecc.)
  const [quarterOffset, setQuarterOffset] = useState(0);

  // Normalizza e ordina i punti storici nel tempo
  const sortedPoints = useMemo(() => {
    if (!Array.isArray(weightHistory) || weightHistory.length === 0) {
      return [];
    }
    return [...weightHistory]
      .filter((p) => p && p.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weightHistory]);

  // Seleziona la finestra di 3 mesi in base a quarterOffset
  const { windowPoints, windowLabel, canGoPrev, canGoNext } = useMemo(() => {
    if (sortedPoints.length === 0) {
      return { windowPoints: [], windowLabel: 'Ultimi 3 Mesi', canGoPrev: false, canGoNext: false };
    }

    const now = new Date();
    // Calcola il range di date per il trimestre selezionato (3 mesi per finestra)
    const endWindow = new Date(now.getFullYear(), now.getMonth() - quarterOffset * 3 + 1, 0); // fine mese
    const startWindow = new Date(now.getFullYear(), now.getMonth() - (quarterOffset + 1) * 3 + 1, 1); // inizio mese

    const pts = sortedPoints.filter((p) => {
      const ptDate = new Date(p.date);
      return ptDate >= startWindow && ptDate <= endWindow;
    });

    const localeStr = lang === 'es' ? 'es-ES' : lang === 'en' ? 'en-US' : 'it-IT';
    const startLabel = startWindow.toLocaleDateString(localeStr, { month: 'short', year: 'numeric' });
    const endLabel = endWindow.toLocaleDateString(localeStr, { month: 'short', year: 'numeric' });
    const windowLabel = `${startLabel} - ${endLabel}`;

    // Possiamo andare indietro se ci sono punti antecedenti alla data startWindow
    const canGoPrev = sortedPoints.some((p) => new Date(p.date) < startWindow);
    // Possiamo andare avanti se quarterOffset > 0
    const canGoNext = quarterOffset > 0;

    return { windowPoints: pts, windowLabel, canGoPrev, canGoNext };
  }, [sortedPoints, quarterOffset]);

  // Calcolo dati geometrici SVG per grafico e trendline lineare
  const chartData = useMemo(() => {
    const validNumeric = windowPoints.filter((p) => typeof p.weight === 'number' && !isNaN(p.weight));
    if (validNumeric.length === 0) return null;

    const weights = validNumeric.map((p) => p.weight);
    const minW = Math.max(0, Math.floor(Math.min(...weights) - 5));
    const maxW = Math.ceil(Math.max(...weights) + 5);
    const rangeW = maxW - minW || 1;

    // Dimensioni SVG responsive
    const svgWidth = 460;
    const svgHeight = 180;
    const padX = 40;
    const padY = 25;
    const plotW = svgWidth - padX * 2;
    const plotH = svgHeight - padY * 2;

    const pointsCoords = validNumeric.map((p, idx) => {
      const x = validNumeric.length === 1 ? svgWidth / 2 : padX + (idx / (validNumeric.length - 1)) * plotW;
      const y = svgHeight - padY - ((p.weight - minW) / rangeW) * plotH;
      return { x, y, ...p };
    });

    // Calcolo retta di regressione (Trendline lineare) y = m*x + q
    let trendCoords = null;
    if (validNumeric.length >= 2) {
      const n = validNumeric.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      validNumeric.forEach((p, i) => {
        sumX += i;
        sumY += p.weight;
        sumXY += i * p.weight;
        sumX2 += i * i;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;

      const yStart = svgHeight - padY - ((intercept - minW) / rangeW) * plotH;
      const yEnd = svgHeight - padY - (((slope * (n - 1) + intercept) - minW) / rangeW) * plotH;

      trendCoords = {
        x1: padX,
        y1: Math.min(svgHeight - 10, Math.max(10, yStart)),
        x2: padX + plotW,
        y2: Math.min(svgHeight - 10, Math.max(10, yEnd)),
        isPositive: slope >= 0
      };
    }

    const pathD = pointsCoords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
      .join(' ');

    return {
      pointsCoords,
      trendCoords,
      pathD,
      minW,
      maxW,
      svgWidth,
      svgHeight
    };
  }, [windowPoints]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="center"
      maxWidth="max-w-lg"
      title={t('modalProgressionTitle')}
      subtitle={exerciseName || 'Esercizio'}
      icon={<TrendingUp className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Se non ci sono punti storici */}
        {sortedPoints.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-sline bg-bg2/50 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-acc/10 border border-acc/30 grid place-items-center text-acc">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-dot text-sm font-bold text-fg">
                {t('modalProgressionTitle')}
              </p>
              <p className="text-xs font-mono text-dim leading-relaxed max-w-sm mx-auto">
                {t('emptyProgressionPrompt')}
              </p>
            </div>
            <div className="inline-block px-3 py-1.5 rounded-lg bg-bg border border-sline text-xs font-mono text-acc">
              {t('lblWeight')}: <strong>{currentWeight || t('feelingWeight')}</strong>
            </div>
          </div>
        ) : (
          <>
            {/* Selettore Trimestre con frecce in basso */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-sline bg-bg2 text-xs font-mono">
              <span className="text-dim uppercase text-[10px] tracking-wider">{t('timeWindowLabel')}</span>
              <span className="font-bold text-acc">{windowLabel}</span>
            </div>

            {/* Grafico SVG interattivo */}
            {chartData && chartData.pointsCoords.length > 0 ? (
              <div className="rounded-xl border border-line bg-bg2/90 p-3 relative overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartData.svgWidth} ${chartData.svgHeight}`}
                  className="w-full h-auto overflow-visible"
                >
                  {/* Linee di guida orizzontali */}
                  <line
                    x1="35"
                    y1={chartData.svgHeight - 25}
                    x2={chartData.svgWidth - 35}
                    y2={chartData.svgHeight - 25}
                    stroke="currentColor"
                    className="text-sline/60"
                    strokeWidth="1"
                  />
                  <line
                    x1="35"
                    y1="25"
                    x2={chartData.svgWidth - 35}
                    y2="25"
                    stroke="currentColor"
                    className="text-sline/40"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />

                  {/* Etichette Min/Max */}
                  <text x="5" y="28" className="text-[10px] fill-dim font-mono">
                    {chartData.maxW}kg
                  </text>
                  <text x="5" y={chartData.svgHeight - 22} className="text-[10px] fill-dim font-mono">
                    {chartData.minW}kg
                  </text>

                  {/* Trendline Tratteggiata */}
                  {chartData.trendCoords && (
                    <line
                      x1={chartData.trendCoords.x1}
                      y1={chartData.trendCoords.y1}
                      x2={chartData.trendCoords.x2}
                      y2={chartData.trendCoords.y2}
                      stroke={chartData.trendCoords.isPositive ? '#3ee6a0' : '#f5c76b'}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="opacity-70"
                    />
                  )}

                  {/* Linea collegata dei pesi */}
                  {chartData.pointsCoords.length > 1 && (
                    <path
                      d={chartData.pathD}
                      fill="none"
                      stroke="rgb(var(--c-acc))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Punti con tooltip / etichetta e data giorno/mese */}
                  {chartData.pointsCoords.map((pt, i) => {
                    const d = new Date(pt.date);
                    const localeStr = lang === 'es' ? 'es-ES' : lang === 'en' ? 'en-US' : 'it-IT';
                    const dayMonthStr = !isNaN(d.getTime()) 
                      ? `${d.getDate()} ${d.toLocaleDateString(localeStr, { month: 'short' })}`
                      : pt.date;

                    return (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4.5"
                          fill="rgb(var(--c-acc))"
                          stroke="#0d1e17"
                          strokeWidth="2"
                          className="cursor-pointer hover:r-6 transition-all"
                        />
                        {/* Valore Peso sopra al punto */}
                        <text
                          x={pt.x}
                          y={pt.y - 8}
                          textAnchor="middle"
                          className="text-[9.5px] font-mono font-bold fill-fg"
                        >
                          {pt.weight}kg
                        </text>
                        {/* Data giorno/mese sotto al punto */}
                        <text
                          x={pt.x}
                          y={pt.y + 15}
                          textAnchor="middle"
                          className="text-[8.5px] font-mono fill-dim"
                        >
                          {dayMonthStr}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legenda Trendline */}
                {chartData.trendCoords && (
                  <div className="flex items-center justify-between text-[10px] font-mono text-dim pt-2 border-t border-sline/50">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-3 h-0.5 border-t-2 border-dashed ${
                          chartData.trendCoords.isPositive ? 'border-acc' : 'border-warn'
                        }`}
                      />
                      <span>{t('trendlineLabel')}</span>
                    </span>
                    <span className="text-acc font-bold">
                      {chartData.trendCoords.isPositive ? `↗ ${t('trendPositive')}` : `→ ${t('trendFlat')}`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-sline bg-bg2/40 text-center text-xs font-mono text-dim">
                {t('emptyProgressionPrompt')}
              </div>
            )}

            {/* Frecce di navigazione temporale in basso */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQuarterOffset((prev) => prev + 1)}
                disabled={!canGoPrev}
                className="gl-btn !h-8 !px-3 text-xs font-mono inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t('btnPrevQuarter')}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuarterOffset((prev) => Math.max(0, prev - 1))}
                disabled={!canGoNext}
                className="gl-btn !h-8 !px-3 text-xs font-mono inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>{t('btnNextQuarter')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

