import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play, Pause, SkipForward, Check, CheckCircle2, Dumbbell, Eye,
  ChevronDown, ChevronUp, Volume2, Edit3, Trophy, Sparkles, X, ArrowRight,
  Clock, Flame, RotateCcw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  getExerciseDisplayName,
  getExerciseImageUrl,
  getExerciseMediaUrl,
  getExerciseDescription,
  translateTarget,
  translateEquipment
} from '../services/exerciseService';
import { playTimerCompleteSound } from '../utils/sound';
import { getExerciseCompletedHeading, pickRandomEncouragement } from '../data/encouragements';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 ore

export function getGuidedSessionStorageKey(workoutId) {
  return `gymlink_guided_session_${workoutId || 'demo'}`;
}

export function getExerciseSetCount(ex) {
  if (!ex) return 1;
  if (Array.isArray(ex.setDetails) && ex.setDetails.length > 0) {
    return ex.setDetails.length;
  }
  return Math.min(20, Math.max(1, parseInt(ex.sets, 10) || 1));
}

export function loadSavedGuidedSession(workoutId) {
  if (!workoutId) return null;
  try {
    const raw = localStorage.getItem(getGuidedSessionStorageKey(workoutId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.phase !== 'exercise' && parsed.phase !== 'encouragement')) {
      return null;
    }
    if (parsed.updatedAt && Date.now() - parsed.updatedAt > SESSION_TTL_MS) {
      localStorage.removeItem(getGuidedSessionStorageKey(workoutId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedGuidedSession(workoutId) {
  if (!workoutId) return;
  try {
    localStorage.removeItem(getGuidedSessionStorageKey(workoutId));
  } catch {
    // ignore
  }
}

function parseRestSeconds(restStr) {
  if (!restStr) return 60;
  const clean = String(restStr).trim().toLowerCase();
  if (clean.includes('min')) {
    const mins = parseFloat(clean.replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
    return Math.round(mins * 60);
  }
  const num = parseInt(clean.replace(/\D/g, ''), 10);
  return !isNaN(num) && num > 0 ? num : 60;
}

/**
 * Modalità "Allenamento Guidato" (Focus step-by-step per l'atleta)
 * - Scelta giornata + ripresa automatica se lo schermo si blocca o la pagina si ricarica
 * - Barra di progressione pesata sulle singole serie dell'intera giornata
 * - Timer zoomato con timestamp reale + Wake Lock + ri-sincronizzazione al risveglio schermo
 */
export default function GuidedWorkoutModal({
  isOpen,
  onClose,
  workout,
  initialDayIndex = 0,
  resumeSession = null,
  onMarkExerciseCompleted,
  onMarkSetCompleted,
  onUpdateWeight,
  onClearSavedSession,
  theme = 'dark'
}) {
  const { lang, t } = useLanguage();

  const daysList = useMemo(() => {
    return Array.isArray(workout?.days) ? workout.days : [];
  }, [workout]);

  // Stati flusso guidato: 'select_day' | 'exercise' | 'encouragement' | 'completed'
  const [phase, setPhase] = useState('select_day');
  const [selectedDayIdx, setSelectedDayIdx] = useState(initialDayIndex);
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);

  // Stato dettagli & modifica peso in corso
  const [showDetails, setShowDetails] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [editWeightVal, setEditWeightVal] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  // Stato timer zoomato basato su timestamp reale (anti-throttling mobile)
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerInitial, setTimerInitial] = useState(60);
  const [timerPaused, setTimerPaused] = useState(false);
  const endTimeRef = useRef(null);

  // Frase di incoraggiamento corrente + set indici già mostrati nella sessione
  const [encouragementData, setEncouragementData] = useState({ heading: '', phrase: '' });
  const usedEncouragementsRef = useRef(new Set());

  // Statistiche sessione + eventuale sessione salvata rilevata nello screen select_day
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [completedSetsCount, setCompletedSetsCount] = useState(0);
  const [localSavedInPicker, setLocalSavedInPicker] = useState(null);

  const wakeLockRef = useRef(null);
  const completeFnRef = useRef(null);

  const applySavedSession = (saved) => {
    if (!saved) return;
    const dIdx = saved.dayIdx < daysList.length ? saved.dayIdx : 0;
    const targetDay = daysList[dIdx] || { exercises: [] };
    const rExercises = Array.isArray(targetDay.exercises) ? targetDay.exercises : [];
    const safeExIdx = Math.min(saved.exIdx || 0, Math.max(0, rExercises.length - 1));
    const rEx = rExercises[safeExIdx];
    const rTotalSets = getExerciseSetCount(rEx);
    const safeSetIdx = Math.min(saved.setIdx || 0, Math.max(0, rTotalSets - 1));

    setSelectedDayIdx(dIdx);
    setExIdx(safeExIdx);
    setSetIdx(safeSetIdx);
    setShowDetails(false);
    setIsEditingWeight(false);
    setSessionStartTime(saved.sessionStartTime || Date.now());
    setSessionEndTime(null);
    setCompletedSetsCount(saved.completedSetsCount || 0);
    setTimerInitial(saved.timerInitial || 60);

    // Se c'era un timer in esecuzione al momento dello spegnimento / chiusura
    if (saved.timerEndTime && !saved.timerPaused && saved.phase === 'exercise' && rEx) {
      const remaining = Math.ceil((saved.timerEndTime - Date.now()) / 1000);
      if (remaining > 0) {
        endTimeRef.current = saved.timerEndTime;
        setTimerSeconds(remaining);
        setTimerPaused(false);
        setPhase('exercise');
      } else {
        // Il recupero si è concluso mentre il telefono era spento/bloccato: avanza direttamente
        endTimeRef.current = null;
        setTimerSeconds(null);
        setTimerPaused(false);
        onMarkSetCompleted?.(rEx.id, safeSetIdx);
        setCompletedSetsCount((saved.completedSetsCount || 0) + 1);

        if (safeSetIdx + 1 < rTotalSets) {
          setSetIdx(safeSetIdx + 1);
          setPhase('exercise');
        } else {
          onMarkExerciseCompleted?.(rEx.id);
          if (safeExIdx + 1 < rExercises.length) {
            const heading = getExerciseCompletedHeading(safeExIdx, lang);
            const { text } = pickRandomEncouragement(lang, usedEncouragementsRef.current);
            setEncouragementData({ heading, phrase: text });
            setPhase('encouragement');
          } else {
            setSessionEndTime(Date.now());
            clearSavedGuidedSession(workout?.id);
            onClearSavedSession?.();
            setPhase('completed');
          }
        }
      }
      return;
    }

    if (saved.timerPaused && saved.timerRemainingWhenPaused > 0) {
      endTimeRef.current = null;
      setTimerSeconds(saved.timerRemainingWhenPaused);
      setTimerPaused(true);
    } else {
      endTimeRef.current = null;
      setTimerSeconds(null);
      setTimerPaused(false);
    }

    if (saved.phase === 'encouragement' && saved.encouragementData) {
      setEncouragementData(saved.encouragementData);
      setPhase('encouragement');
    } else {
      setPhase('exercise');
    }
  };

  // Inizializzazione all'apertura della modale
  useEffect(() => {
    if (!isOpen) return;
    usedEncouragementsRef.current.clear();

    if (resumeSession) {
      applySavedSession(resumeSession);
      setLocalSavedInPicker(null);
    } else {
      setPhase('select_day');
      setSelectedDayIdx(initialDayIndex < daysList.length ? initialDayIndex : 0);
      setExIdx(0);
      setSetIdx(0);
      setShowDetails(false);
      setIsEditingWeight(false);
      setTimerSeconds(null);
      setTimerPaused(false);
      endTimeRef.current = null;
      setSessionStartTime(null);
      setSessionEndTime(null);
      setCompletedSetsCount(0);
      setLocalSavedInPicker(loadSavedGuidedSession(workout?.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resumeSession]);

  // Salvataggio continuo della sessione guidata su localStorage (resiliente a blocchi/spegnimenti mobile)
  useEffect(() => {
    if (!isOpen || !workout?.id) return;

    if (phase === 'exercise' || phase === 'encouragement') {
      try {
        const snapshot = {
          workoutId: workout.id,
          dayIdx: selectedDayIdx,
          exIdx,
          setIdx,
          phase,
          encouragementData,
          timerEndTime: endTimeRef.current,
          timerInitial,
          timerPaused,
          timerRemainingWhenPaused: timerPaused ? timerSeconds : null,
          sessionStartTime,
          completedSetsCount,
          updatedAt: Date.now()
        };
        localStorage.setItem(getGuidedSessionStorageKey(workout.id), JSON.stringify(snapshot));
      } catch {
        // ignore storage quota errors
      }
    } else if (phase === 'completed') {
      clearSavedGuidedSession(workout.id);
      onClearSavedSession?.();
    }
  }, [
    isOpen,
    workout?.id,
    phase,
    selectedDayIdx,
    exIdx,
    setIdx,
    encouragementData,
    timerInitial,
    timerPaused,
    timerSeconds !== null,
    sessionStartTime,
    completedSetsCount
  ]);

  // Screen Wake Lock API + riacquisizione al risveglio schermo (visibilitychange)
  useEffect(() => {
    if (!isOpen || phase === 'select_day' || phase === 'completed') return;
    let active = true;

    async function requestLock() {
      try {
        if ('wakeLock' in navigator && active && document.visibilityState === 'visible') {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Non supportato o bloccato dal browser: continua senza errori
      }
    }
    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
        if (endTimeRef.current && !timerPaused) {
          const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
          if (remaining <= 0) {
            completeFnRef.current?.(true);
          } else {
            setTimerSeconds(remaining);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current && typeof wakeLockRef.current.release === 'function') {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isOpen, phase, timerPaused]);

  // Chiusura con tasto ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const currentDay = daysList[selectedDayIdx] || daysList[0] || { exercises: [] };
  const exercises = Array.isArray(currentDay?.exercises) ? currentDay.exercises : [];
  const currentEx = exercises[exIdx] || null;

  const hasSetDetails = !!(currentEx && Array.isArray(currentEx.setDetails) && currentEx.setDetails.length > 0);
  const totalSets = getExerciseSetCount(currentEx);

  const activeSetInfo = currentEx
    ? (hasSetDetails
      ? currentEx.setDetails[setIdx] || currentEx.setDetails[0]
      : { reps: currentEx.reps || '—', weight: currentEx.weight || '', rest: currentEx.rest || '60"' })
    : { reps: '—', weight: '', rest: '60"' };

  const isLastSetOfExercise = setIdx >= totalSets - 1;
  const isLastExerciseOfDay = exIdx >= exercises.length - 1;
  const isLastSetOfWorkout = isLastSetOfExercise && isLastExerciseOfDay;

  // Calcolo barra di progressione pesata sulle serie totali della giornata
  const totalSetsInDay = useMemo(
    () => exercises.reduce((sum, item) => sum + getExerciseSetCount(item), 0),
    [exercises]
  );
  const setsDoneBeforeCurrent = useMemo(
    () => exercises.slice(0, exIdx).reduce((sum, item) => sum + getExerciseSetCount(item), 0),
    [exercises, exIdx]
  );
  const setsCompletedProgress =
    phase === 'completed'
      ? totalSetsInDay
      : phase === 'encouragement'
        ? setsDoneBeforeCurrent + getExerciseSetCount(currentEx)
        : setsDoneBeforeCurrent + setIdx;
  const guidedProgressPercent =
    totalSetsInDay > 0 ? Math.min(100, Math.round((setsCompletedProgress / totalSetsInDay) * 100)) : 0;

  // Avanzamento dopo fine serie / fine recupero
  const completeCurrentSetAndAdvance = (playSound = false) => {
    if (playSound) {
      playTimerCompleteSound(theme);
    }
    setTimerSeconds(null);
    setTimerPaused(false);
    endTimeRef.current = null;
    setIsEditingWeight(false);
    setCompletedSetsCount((c) => c + 1);

    if (!currentEx) return;

    onMarkSetCompleted?.(currentEx.id, setIdx);

    if (!isLastSetOfExercise) {
      setSetIdx((prev) => prev + 1);
      return;
    }

    // Fine di tutte le serie dell'esercizio corrente: smarca esercizio sulla scheda
    onMarkExerciseCompleted?.(currentEx.id);

    if (!isLastExerciseOfDay) {
      const heading = getExerciseCompletedHeading(exIdx, lang);
      const { text } = pickRandomEncouragement(lang, usedEncouragementsRef.current);
      setEncouragementData({ heading, phrase: text });
      setPhase('encouragement');
    } else {
      setSessionEndTime(Date.now());
      setPhase('completed');
    }
  };

  completeFnRef.current = completeCurrentSetAndAdvance;

  // Loop countdown basato su timestamp reale
  useEffect(() => {
    if (timerSeconds === null || timerPaused || !endTimeRef.current) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        completeCurrentSetAndAdvance(true);
      } else {
        setTimerSeconds(remaining);
      }
    }, 200);

    return () => clearInterval(interval);
  });

  const handleStartDay = (dayIndexToStart) => {
    const targetDay = daysList[dayIndexToStart];
    if (!targetDay || !Array.isArray(targetDay.exercises) || targetDay.exercises.length === 0) return;
    clearSavedGuidedSession(workout?.id);
    setLocalSavedInPicker(null);
    onClearSavedSession?.();
    setSelectedDayIdx(dayIndexToStart);
    setExIdx(0);
    setSetIdx(0);
    setShowDetails(false);
    setIsEditingWeight(false);
    setTimerSeconds(null);
    setTimerPaused(false);
    endTimeRef.current = null;
    setSessionStartTime(Date.now());
    setCompletedSetsCount(0);
    setPhase('exercise');
  };

  const handleStartRest = () => {
    const secs = parseRestSeconds(activeSetInfo.rest);
    setTimerInitial(secs);
    setTimerSeconds(secs);
    setTimerPaused(false);
    endTimeRef.current = Date.now() + secs * 1000;
  };

  const handleTogglePauseTimer = () => {
    if (timerPaused) {
      endTimeRef.current = Date.now() + (timerSeconds || 1) * 1000;
      setTimerPaused(false);
    } else {
      setTimerPaused(true);
      endTimeRef.current = null;
    }
  };

  const handleSaveWeightInFocus = async () => {
    if (!editWeightVal.trim() || !currentEx || typeof onUpdateWeight !== 'function') {
      setIsEditingWeight(false);
      return;
    }
    setIsSavingWeight(true);
    try {
      await onUpdateWeight(currentEx.id, editWeightVal.trim(), hasSetDetails ? setIdx : null);
    } finally {
      setIsSavingWeight(false);
      setIsEditingWeight(false);
    }
  };

  const handleGoToNextExercise = () => {
    setExIdx((prev) => prev + 1);
    setSetIdx(0);
    setShowDetails(false);
    setIsEditingWeight(false);
    setPhase('exercise');
  };

  const handleFinishWorkoutDirect = () => {
    if (currentEx) {
      onMarkSetCompleted?.(currentEx.id, setIdx);
      onMarkExerciseCompleted?.(currentEx.id);
    }
    setCompletedSetsCount((c) => c + 1);
    setTimerSeconds(null);
    setTimerPaused(false);
    endTimeRef.current = null;
    setSessionEndTime(Date.now());
    setPhase('completed');
  };

  if (!isOpen) return null;

  const formatElapsed = () => {
    if (!sessionStartTime) return '—';
    const end = sessionEndTime || Date.now();
    const totalMins = Math.max(1, Math.round((end - sessionStartTime) / 60000));
    return `${totalMins} min`;
  };

  const staticImg = currentEx ? (currentEx.imageUrl || getExerciseImageUrl(currentEx.image)) : null;
  const gifUrl = currentEx ? (currentEx.gifUrl || getExerciseMediaUrl(currentEx.gif_url)) : null;
  const nextEx = exercises[exIdx + 1] || null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-bg flex flex-col overflow-y-auto gl-page-in"
      role="dialog"
      aria-modal="true"
      aria-label={t('guidedModeTitle')}
    >
      {/* Top Bar fissa */}
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-acc/15 border border-acc/40 grid place-items-center text-acc shrink-0">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <span className="font-dot font-black text-sm sm:text-base text-fg tracking-wide block truncate">
              {t('guidedModeTitle')}
            </span>
            {phase !== 'select_day' && (
              <span className="font-mono text-[10.5px] text-dim block truncate">
                {currentDay?.title || `${t('lblDay')} ${String.fromCharCode(65 + selectedDayIdx)}`}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="gl-btn !h-8 !px-3 !rounded-lg text-xs font-mono text-dim hover:text-danger hover:!border-danger/50 inline-flex items-center gap-1.5 shrink-0"
        >
          <X className="w-4 h-4" />
          <span>{t('btnClose')}</span>
        </button>
      </header>

      {/* Corpo centrale */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col justify-center">

        {/* ---------- FASE 1: SCELTA GIORNATA ---------- */}
        {phase === 'select_day' && (
          <div className="space-y-5 gl-rise">
            <div className="text-center space-y-2">
              <span className="gl-tag !text-[10px]" style={{ '--fc': 'rgb(var(--c-acc))' }}>
                {workout?.title || 'GymLink'}
              </span>
              <h2 className="font-dot font-black text-2xl sm:text-3xl text-fg">
                {t('guidedSelectDayTitle')}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-dim max-w-md mx-auto">
                {t('guidedSelectDaySub')}
              </p>
            </div>

            {/* Banner rapido per riprendere eventuale sessione interrotta */}
            {localSavedInPicker && (
              <div className="p-4 rounded-2xl border border-acc bg-acc/10 space-y-3 shadow-[0_0_24px_-6px_var(--glow)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-acc uppercase tracking-wider block">
                      {t('guidedResumeTitle')}
                    </span>
                    <p className="text-xs sm:text-sm font-sans text-fg">
                      {t('guidedResumeDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const saved = localSavedInPicker;
                      setLocalSavedInPicker(null);
                      applySavedSession(saved);
                    }}
                    className="gl-btn-primary !h-9 !px-4 text-xs font-mono font-bold inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t('guidedResumeBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearSavedGuidedSession(workout?.id);
                      setLocalSavedInPicker(null);
                      onClearSavedSession?.();
                    }}
                    className="gl-btn !h-9 !px-3 text-xs font-mono text-dim hover:text-fg"
                  >
                    {t('guidedDiscardResumeBtn')}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {daysList.map((day, dIdx) => {
                const count = Array.isArray(day?.exercises) ? day.exercises.length : 0;
                const isSelected = dIdx === selectedDayIdx;
                return (
                  <button
                    key={day.id || dIdx}
                    type="button"
                    disabled={count === 0}
                    onClick={() => handleStartDay(dIdx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 disabled:opacity-40 ${
                      isSelected
                        ? 'border-acc bg-acc/10 shadow-[0_0_24px_-8px_var(--glow)]'
                        : 'border-sline bg-bg2 hover:border-acc/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-dot font-extrabold text-base sm:text-lg text-fg block break-words">
                        {day.title || `${t('lblDay')} ${String.fromCharCode(65 + dIdx)}`}
                      </span>
                      <span className="text-xs font-mono text-dim">
                        {count} {t('exercises')}
                      </span>
                    </div>
                    <span className="gl-btn-primary !h-9 !px-3.5 !text-xs font-mono shrink-0 inline-flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t('guidedStartBtn')}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- FASE 2: ESERCIZIO CORRENTE & TIMER ZOOMATO ---------- */}
        {phase === 'exercise' && currentEx && (
          <div className="space-y-4 sm:space-y-5 gl-page-in">
            {/* Progresso pesato sulle serie totali della giornata */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono gap-2">
                <span className="text-acc font-bold uppercase tracking-wider">
                  {t('exerciseSingular')} {exIdx + 1} {t('lblOf')} {exercises.length}
                </span>
                <span className="text-dim">
                  {setsCompletedProgress}/{totalSetsInDay} {t('lblSets').toLowerCase()} · <strong className="text-acc">{guidedProgressPercent}%</strong>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-bg2 border border-sline overflow-hidden">
                <div
                  className="h-full bg-acc transition-all duration-300"
                  style={{ width: `${guidedProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Card Esercizio Focus */}
            <div className="gl-card rounded-2xl overflow-hidden">
              <div className="p-4 bg-acc/[0.08] border-b border-line flex items-start gap-3.5">
                <div
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-sline bg-bg shrink-0 overflow-hidden cursor-pointer hover:border-acc flex items-center justify-center p-1"
                >
                  {staticImg ? (
                    <img
                      src={staticImg}
                      alt=""
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Dumbbell className="w-6 h-6 text-dim opacity-50" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-dot font-black text-lg sm:text-2xl text-fg leading-snug break-words">
                    {getExerciseDisplayName(currentEx.name, lang)}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {currentEx.target && (
                      <span className="text-[11px] font-mono text-acc font-bold uppercase">
                        {translateTarget(currentEx.target, lang)}
                      </span>
                    )}
                    {currentEx.equipment && (
                      <span className="text-[11px] font-mono text-dim uppercase">
                        · {translateEquipment(currentEx.equipment, lang)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className={`gl-btn !h-8 !px-2.5 text-xs font-mono shrink-0 gap-1 ${showDetails ? '!border-acc !text-acc' : ''}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{showDetails ? t('btnClose') : 'GIF'}</span>
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Dettagli GIF e Biomeccanica su richiesta */}
              {showDetails && (
                <div className="p-4 bg-bg/90 border-b border-sline space-y-3 gl-page-in">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {gifUrl && (
                      <div className="w-40 h-40 rounded-xl border border-sline bg-bg2 p-1.5 shrink-0 flex items-center justify-center">
                        <img
                          src={gifUrl}
                          alt={getExerciseDisplayName(currentEx.name, lang)}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-xs font-sans text-fg/90 leading-relaxed flex-1">
                      {getExerciseDescription(currentEx, lang) || t('lblBiomechanics')}
                    </p>
                  </div>
                </div>
              )}

              {/* Pills Serie (S1..Sn) */}
              <div className="px-4 py-3 bg-bg2/60 border-b border-sline/60 flex items-center gap-2 flex-wrap">
                {Array.from({ length: totalSets }, (_, i) => {
                  const isDone = i < setIdx;
                  const isCurrent = i === setIdx;
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all ${
                        isDone
                          ? 'border-acc/40 bg-acc/15 text-acc'
                          : isCurrent
                            ? 'border-acc bg-acc text-ink shadow-[0_0_12px_-2px_var(--glow)] scale-105'
                            : 'border-sline bg-bg text-dim'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>S{i + 1}</span>
                    </span>
                  );
                })}
              </div>

              {/* Corpo Centrale: O Timer Zoomato oppure Parametri Serie Attiva */}
              {timerSeconds !== null ? (
                <div className="p-6 sm:p-8 bg-bg2 text-center space-y-5 gl-page-in">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-acc font-bold">
                      <Clock className="w-4 h-4" />
                      <span>{t('guidedRestInProgress')} · S{setIdx + 1}</span>
                    </span>
                    <div
                      className={`font-mono font-black text-6xl sm:text-8xl tracking-tight tabular-nums leading-none py-2 ${
                        timerSeconds <= 5 ? 'text-acc animate-pulse' : 'text-fg'
                      }`}
                    >
                      {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* Barra avanzamento countdown */}
                  <div className="max-w-sm mx-auto h-2.5 rounded-full bg-bg border border-sline overflow-hidden">
                    <div
                      className="h-full bg-acc transition-all duration-200"
                      style={{
                        width: `${Math.max(0, Math.min(100, Math.round((timerSeconds / Math.max(1, timerInitial)) * 100)))}%`
                      }}
                    />
                  </div>

                  <p className="text-xs font-mono text-dim">
                    {!isLastSetOfExercise
                      ? `${t('guidedNextUp')}: ${t('lblSets')} ${setIdx + 2} / ${totalSets}`
                      : !isLastExerciseOfDay
                        ? `${t('guidedNextUp')}: ${getExerciseDisplayName(nextEx?.name, lang)}`
                        : t('guidedFinalStretch')}
                  </p>

                  {/* Controlli Timer: Pausa, Salta Recupero, Suono */}
                  <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={handleTogglePauseTimer}
                      className="gl-btn !h-11 !px-4 font-mono text-xs font-bold gap-2"
                    >
                      {timerPaused ? <Play className="w-4 h-4 fill-current text-acc" /> : <Pause className="w-4 h-4 text-acc" />}
                      <span>{timerPaused ? t('guidedResumeTimer') : t('guidedPauseTimer')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => completeCurrentSetAndAdvance(false)}
                      className="gl-btn-primary !h-11 !px-5 font-mono text-xs font-bold gap-2"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>{t('guidedSkipRest')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => playTimerCompleteSound(theme)}
                      className="gl-btn !h-11 !px-3 text-dim hover:text-acc"
                      title="Test suono"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 bg-bg2 space-y-4">
                  {/* Banner Guida Chiaro */}
                  <div className="p-3.5 rounded-xl border border-acc/40 bg-acc/10 flex items-center gap-3">
                    <Flame className="w-5 h-5 text-acc shrink-0" />
                    <p className="text-xs sm:text-sm font-mono font-bold text-fg leading-relaxed">
                      {isLastSetOfWorkout
                        ? t('guidedPromptFinalSet').replace('{n}', String(setIdx + 1))
                        : t('guidedPromptDoSet').replace('{n}', String(setIdx + 1))}
                    </p>
                  </div>

                  {/* Griglia Parametri Serie Attiva */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 font-mono">
                    <div className="gl-param-card p-3 text-center">
                      <span className="block text-[9.5px] text-dim uppercase font-bold">{t('lblReps')}</span>
                      <span className="text-lg sm:text-xl font-black text-fg block mt-1">
                        {activeSetInfo.reps || '—'}
                      </span>
                    </div>

                    {/* Carico modificabile al volo */}
                    <div className="gl-param-card p-3 text-center relative">
                      <div className="flex items-center justify-center gap-1 text-[9.5px] text-dim uppercase font-bold">
                        <span>{t('lblWeight')}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingWeight(true);
                            setEditWeightVal(activeSetInfo.weight || '');
                          }}
                          className="text-dim hover:text-acc p-0.5"
                          title={t('tooltipEditWeight')}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>

                      {isEditingWeight ? (
                        <div className="mt-1 flex flex-col gap-1">
                          <input
                            type="text"
                            value={editWeightVal}
                            onChange={(e) => setEditWeightVal(e.target.value)}
                            placeholder="75 kg"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveWeightInFocus();
                              if (e.key === 'Escape') setIsEditingWeight(false);
                            }}
                            className="gl-input !h-7 !px-1.5 text-center font-mono text-xs !text-acc font-bold"
                          />
                          <button
                            type="button"
                            disabled={isSavingWeight}
                            onClick={handleSaveWeightInFocus}
                            className="gl-btn-primary !h-6 !text-[10px] justify-center"
                          >
                            {t('btnSaveWeight')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingWeight(true);
                            setEditWeightVal(activeSetInfo.weight || '');
                          }}
                          className="w-full text-lg sm:text-xl font-black text-acc hover:underline block mt-1 truncate"
                        >
                          {activeSetInfo.weight || '—'}
                        </button>
                      )}
                    </div>

                    <div className="gl-param-card p-3 text-center">
                      <span className="block text-[9.5px] text-dim uppercase font-bold">{t('lblRest')}</span>
                      <span className="text-lg sm:text-xl font-black text-fg block mt-1">
                        {activeSetInfo.rest || '60"'}
                      </span>
                    </div>
                  </div>

                  {/* Note PT se presenti */}
                  {currentEx.notes && (
                    <div className="p-3 rounded-xl bg-bg/50 border border-sline/60 text-xs font-sans flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold text-acc uppercase shrink-0 mt-0.5">
                        {t('lblNotesPt')}
                      </span>
                      <p className="text-fg/90 leading-relaxed">{currentEx.notes}</p>
                    </div>
                  )}

                  {/* Azione Principale: Avvia Recupero oppure Completa Allenamento sull'ultima serie */}
                  <div className="pt-1 flex flex-col gap-2">
                    {isLastSetOfWorkout ? (
                      <>
                        <button
                          type="button"
                          onClick={handleFinishWorkoutDirect}
                          className="gl-btn-primary w-full !h-12 text-sm font-mono font-black justify-center gap-2 shadow-[0_0_24px_-4px_var(--glow)]"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>{t('guidedCompleteWorkoutBtn')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleStartRest}
                          className="gl-btn w-full !h-9 text-xs font-mono justify-center gap-1.5 text-dim hover:text-acc"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t('guidedStartRestBtn')} ({activeSetInfo.rest || '60"'})</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleStartRest}
                          className="gl-btn-primary w-full !h-12 text-sm font-mono font-black justify-center gap-2 shadow-[0_0_24px_-4px_var(--glow)]"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>{t('guidedStartRestBtn')} ({activeSetInfo.rest || '60"'})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => completeCurrentSetAndAdvance(false)}
                          className="gl-btn w-full !h-9 text-xs font-mono justify-center gap-1.5 text-dim hover:text-fg"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          <span>{t('guidedNoRestSkip')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- FASE 3: INCORAGGIAMENTO TRA UN ESERCIZIO E L'ALTRO ---------- */}
        {phase === 'encouragement' && (
          <div className="gl-card p-6 sm:p-8 text-center space-y-5 gl-rise">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-acc/15 border border-acc/50 grid place-items-center text-acc shadow-[0_0_30px_-6px_var(--glow)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-acc font-bold">
                {setsCompletedProgress}/{totalSetsInDay} {t('lblSets').toLowerCase()} · {guidedProgressPercent}%
              </div>
              <h2 className="font-dot font-black text-2xl sm:text-3xl text-acc">
                {encouragementData.heading}
              </h2>
              <p className="text-sm sm:text-base font-sans text-fg/95 max-w-md mx-auto leading-relaxed">
                {encouragementData.phrase}
              </p>
            </div>

            {nextEx && (
              <div className="p-3.5 rounded-xl border border-sline bg-bg2/80 text-xs font-mono space-y-1 max-w-md mx-auto">
                <span className="text-[10px] uppercase tracking-wider text-dim block">
                  {t('guidedNextUp')} ({exIdx + 2}/{exercises.length})
                </span>
                <span className="font-dot font-extrabold text-sm sm:text-base text-fg block break-words">
                  {getExerciseDisplayName(nextEx.name, lang)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoToNextExercise}
              className="gl-btn-primary !h-12 !px-6 text-sm font-mono font-black inline-flex items-center gap-2 mx-auto"
            >
              <span>{t('guidedNextExerciseBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---------- FASE 4: ALLENAMENTO COMPLETATO ---------- */}
        {phase === 'completed' && (
          <div className="gl-card p-6 sm:p-10 text-center space-y-6 gl-rise">
            <div className="w-20 h-20 mx-auto rounded-full bg-acc/15 border-2 border-acc grid place-items-center text-acc shadow-[0_0_40px_-4px_var(--glow)]">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="gl-tag !text-[10px]" style={{ '--fc': 'rgb(var(--c-acc))' }}>
                <Sparkles className="w-3 h-3 mr-1" />
                100%
              </span>
              <h2 className="font-dot font-black text-2xl sm:text-4xl text-fg">
                {t('guidedWorkoutDoneTitle')}
              </h2>
              <p className="text-sm font-sans text-dim max-w-md mx-auto">
                {t('guidedWorkoutDoneSub')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 font-mono max-w-md mx-auto">
              <div className="gl-param-card p-3">
                <span className="block text-[9.5px] text-dim uppercase">{t('exercises')}</span>
                <span className="text-lg font-black text-acc block mt-0.5">{exercises.length}</span>
              </div>
              <div className="gl-param-card p-3">
                <span className="block text-[9.5px] text-dim uppercase">{t('lblSets')}</span>
                <span className="text-lg font-black text-fg block mt-0.5">{totalSetsInDay}</span>
              </div>
              <div className="gl-param-card p-3">
                <span className="block text-[9.5px] text-dim uppercase">{t('guidedDurationLabel')}</span>
                <span className="text-lg font-black text-fg block mt-0.5">{formatElapsed()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="gl-btn-primary !h-11 !px-6 text-xs sm:text-sm font-mono font-bold inline-flex items-center gap-2 mx-auto"
            >
              <Check className="w-4 h-4" />
              <span>{t('guidedBackToSheet')}</span>
            </button>
          </div>
        )}

      </main>
    </div>,
    document.body
  );
}
