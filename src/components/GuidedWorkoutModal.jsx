import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play, Pause, SkipForward, Check, CheckCircle2, Dumbbell, Eye,
  ChevronDown, ChevronUp, ChevronRight, Volume2, Edit3, Trophy, Sparkles, X, ArrowRight,
  Clock, Flame, Timer
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

const SPARK_PARTICLES = [
  { sx: '0px', sy: '-54px', size: 7, color: 'rgb(var(--c-acc))', delay: '60ms' },
  { sx: '38px', sy: '-38px', size: 6, color: '#facc15', delay: '90ms' },
  { sx: '54px', sy: '0px', size: 7, color: 'rgb(var(--c-acc2))', delay: '70ms' },
  { sx: '38px', sy: '38px', size: 6, color: 'rgb(var(--c-acc))', delay: '120ms' },
  { sx: '0px', sy: '54px', size: 6, color: '#facc15', delay: '80ms' },
  { sx: '-38px', sy: '38px', size: 7, color: 'rgb(var(--c-acc2))', delay: '110ms' },
  { sx: '-54px', sy: '0px', size: 6, color: 'rgb(var(--c-acc))', delay: '70ms' },
  { sx: '-38px', sy: '-38px', size: 7, color: '#facc15', delay: '100ms' },
  { sx: '22px', sy: '-48px', size: 5, color: 'rgb(var(--c-acc2))', delay: '130ms' },
  { sx: '-22px', sy: '-48px', size: 5, color: 'rgb(var(--c-acc))', delay: '140ms' },
  { sx: '48px', sy: '20px', size: 5, color: '#facc15', delay: '135ms' },
  { sx: '-48px', sy: '20px', size: 5, color: 'rgb(var(--c-acc2))', delay: '145ms' }
];

const CONFETTI_PIECES = [
  { left: '5%', cx: '18px', w: 7, h: 12, color: '#3ee6a0', dur: '2.9s', del: '0s' },
  { left: '10%', cx: '-22px', w: 6, h: 10, color: '#facc15', dur: '3.4s', del: '0.25s' },
  { left: '15%', cx: '26px', w: 8, h: 8, color: '#38bdf8', dur: '2.7s', del: '0.1s' },
  { left: '20%', cx: '-15px', w: 6, h: 12, color: '#fb923c', dur: '3.2s', del: '0.45s' },
  { left: '25%', cx: '24px', w: 7, h: 11, color: '#3ee6a0', dur: '3.0s', del: '0.18s' },
  { left: '30%', cx: '-28px', w: 6, h: 9, color: '#a78bfa', dur: '3.5s', del: '0.6s' },
  { left: '35%', cx: '14px', w: 8, h: 10, color: '#facc15', dur: '2.8s', del: '0.05s' },
  { left: '40%', cx: '-18px', w: 6, h: 12, color: '#38bdf8', dur: '3.3s', del: '0.35s' },
  { left: '45%', cx: '22px', w: 7, h: 9, color: '#3ee6a0', dur: '2.9s', del: '0.5s' },
  { left: '50%', cx: '-20px', w: 8, h: 12, color: '#fb923c', dur: '3.1s', del: '0.12s' },
  { left: '55%', cx: '26px', w: 6, h: 10, color: '#facc15', dur: '3.4s', del: '0.4s' },
  { left: '60%', cx: '-16px', w: 7, h: 8, color: '#a78bfa', dur: '2.7s', del: '0.22s' },
  { left: '65%', cx: '20px', w: 6, h: 12, color: '#3ee6a0', dur: '3.2s', del: '0.55s' },
  { left: '70%', cx: '-24px', w: 8, h: 10, color: '#38bdf8', dur: '2.85s', del: '0.08s' },
  { left: '75%', cx: '16px', w: 6, h: 11, color: '#fb923c', dur: '3.45s', del: '0.3s' },
  { left: '80%', cx: '-22px', w: 7, h: 9, color: '#facc15', dur: '3.0s', del: '0.48s' },
  { left: '85%', cx: '24px', w: 8, h: 12, color: '#3ee6a0', dur: '2.75s', del: '0.15s' },
  { left: '90%', cx: '-18px', w: 6, h: 10, color: '#38bdf8', dur: '3.35s', del: '0.42s' },
  { left: '95%', cx: '14px', w: 7, h: 11, color: '#a78bfa', dur: '2.95s', del: '0.2s' },
  { left: '12%', cx: '20px', w: 6, h: 8, color: '#fb923c', dur: '3.15s', del: '0.9s' },
  { left: '38%', cx: '-20px', w: 7, h: 11, color: '#3ee6a0', dur: '3.25s', del: '0.85s' },
  { left: '62%', cx: '22px', w: 6, h: 9, color: '#facc15', dur: '2.9s', del: '0.75s' },
  { left: '82%', cx: '-16px', w: 7, h: 12, color: '#fb923c', dur: '3.1s', del: '0.95s' }
];

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

  // Statistiche sessione + cronometro attivo (in pausa durante recupero / tra esercizi)
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [activeElapsedMs, setActiveElapsedMs] = useState(0);
  const activeSegmentStartRef = useRef(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [goIntroStep, setGoIntroStep] = useState(3);
  const [completedSetsCount, setCompletedSetsCount] = useState(0);
  const [localSavedInPicker, setLocalSavedInPicker] = useState(null);

  const wakeLockRef = useRef(null);
  const completeFnRef = useRef(null);

  const commitActiveSegment = () => {
    if (activeSegmentStartRef.current !== null) {
      const delta = Math.max(0, Date.now() - activeSegmentStartRef.current);
      activeSegmentStartRef.current = null;
      setActiveElapsedMs((prev) => prev + delta);
    }
  };

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
    setActiveElapsedMs(saved.activeElapsedMs || 0);
    activeSegmentStartRef.current = null;
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
          activeSegmentStartRef.current = Date.now();
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
      if (!saved.timerPaused) {
        activeSegmentStartRef.current = Date.now();
      }
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
      setActiveElapsedMs(0);
      activeSegmentStartRef.current = null;
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
          activeElapsedMs,
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
    activeElapsedMs,
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
      // Riprende il cronometro attivo dopo il recupero (se fermo)
      if (activeSegmentStartRef.current === null) {
        activeSegmentStartRef.current = Date.now();
      }
      return;
    }

    // Fine di tutte le serie dell'esercizio corrente: ferma temporaneamente il cronometro attivo
    commitActiveSegment();
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

  // Cronometro totale di attività effettiva (scorre durante l'esecuzione, si ferma durante il recupero e riparte dopo)
  useEffect(() => {
    if (!isOpen || !sessionStartTime) {
      setElapsedSeconds(0);
      return;
    }
    const isActivelyExercising = phase === 'exercise' && timerSeconds === null;
    if (!isActivelyExercising) {
      setElapsedSeconds(Math.max(0, Math.floor(activeElapsedMs / 1000)));
      return;
    }

    const tick = () => {
      const currentSeg = activeSegmentStartRef.current !== null
        ? Math.max(0, Date.now() - activeSegmentStartRef.current)
        : 0;
      setElapsedSeconds(Math.max(0, Math.floor((activeElapsedMs + currentSeg) / 1000)));
    };
    tick();
    const idInterval = setInterval(tick, 500);
    return () => clearInterval(idInterval);
  }, [isOpen, phase, timerSeconds !== null, sessionStartTime, activeElapsedMs]);

  // Sequenza coreografata all'inizio di ogni serie attiva:
  // 1) Prima animazione grande+luce sull'istruzione (0..1700ms)
  // 2) Poi parte countdown 3 -> 2 -> 1 più grande
  // 3) Poi badge GO! lampeggiante che scorre da sinistra verso destra
  useEffect(() => {
    if (!isOpen || phase !== 'exercise' || timerSeconds !== null) return;
    setGoIntroStep('prompt');
    const t0 = setTimeout(() => setGoIntroStep(3), 1700);
    const t1 = setTimeout(() => setGoIntroStep(2), 2350);
    const t2 = setTimeout(() => setGoIntroStep(1), 3000);
    const t3 = setTimeout(() => setGoIntroStep('go'), 3650);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, phase, exIdx, setIdx, timerSeconds !== null]);

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
    const now = Date.now();
    setSessionStartTime(now);
    setActiveElapsedMs(0);
    activeSegmentStartRef.current = now;
    setCompletedSetsCount(0);
    setPhase('exercise');
  };

  const handleStartRest = () => {
    // Ferma il cronometro attivo durante il recupero
    commitActiveSegment();
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
    activeSegmentStartRef.current = Date.now();
    setPhase('exercise');
  };

  const handleFinishWorkoutDirect = () => {
    commitActiveSegment();
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

  const formatDurationClock = (totalSecs) => {
    const safe = Math.max(0, Math.floor(totalSecs || 0));
    const hrs = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatElapsed = () => {
    if (!sessionStartTime) return '—';
    return formatDurationClock(Math.floor(activeElapsedMs / 1000));
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
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col justify-center overflow-x-hidden">

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
            {/* Fascia Alta Raddoppiata: Cronometro Totale + Track Animato 3, 2, 1 -> GO! »» / RECUPERO arancione pulsante + Barra Progresso */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3.5 min-h-[68px] sm:min-h-[76px] rounded-2xl border border-sline bg-bg2/95 shadow-sm">
                <div className="flex items-center gap-2.5 font-mono shrink-0 pr-2 border-r border-sline/70">
                  <Timer className="w-6 h-6 sm:w-7 sm:h-7 text-acc shrink-0" />
                  <div className="leading-none">
                    <span className="text-[9.5px] sm:text-[10px] text-dim uppercase tracking-wider block mb-0.5">
                      {t('guidedDurationLabel')}
                    </span>
                    <span className="font-black text-2xl sm:text-3xl text-fg tabular-nums">
                      {formatDurationClock(elapsedSeconds)}
                    </span>
                  </div>
                </div>

                {/* Pista orizzontale: overflow-hidden solo durante lo scorrimento GO!, overflow-visible per il battito RECUPERO */}
                <div className={`flex-1 relative h-11 sm:h-12 flex items-center justify-end ${
                  timerSeconds === null && goIntroStep === 'go' ? 'overflow-hidden' : 'overflow-visible pr-1.5'
                }`}>
                  {timerSeconds !== null ? (
                    <span className="gl-rest-heartbeat-badge gl-heartbeat inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{t('lblRest')}</span>
                    </span>
                  ) : goIntroStep === 'prompt' ? (
                    <span className="text-[11px] font-mono text-dim/70 uppercase tracking-widest animate-pulse">
                      ···
                    </span>
                  ) : goIntroStep !== 'go' ? (
                    <div className="w-full flex items-center justify-center">
                      <span
                        key={`cd_${exIdx}_${setIdx}_${goIntroStep}`}
                        className="gl-countdown-pop gl-go-badge inline-flex items-center justify-center min-w-[76px] px-5 py-1.5 rounded-xl font-dot font-black text-2xl sm:text-3xl leading-none tracking-wider"
                      >
                        {goIntroStep}
                      </span>
                    </div>
                  ) : (
                    <div className="gl-go-glide">
                      <span className="gl-go-badge gl-go-blink inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-dot font-black text-sm sm:text-base tracking-widest uppercase whitespace-nowrap">
                        <span>GO!</span>
                        <span className="inline-flex items-center">
                          <ChevronRight className="w-4 h-4 gl-chevron-1" strokeWidth={3} />
                          <ChevronRight className="w-4 h-4 -ml-2.5 gl-chevron-2" strokeWidth={3} />
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono gap-2">
                  <span className="text-acc font-bold uppercase tracking-wider">
                    {t('exerciseSingular')} {exIdx + 1} {t('lblOf')} {exercises.length}
                  </span>
                  <span className="text-dim">
                    {setsCompletedProgress}/{totalSetsInDay} {t('lblSets').toLowerCase()} · <strong className="text-acc text-sm sm:text-base">{guidedProgressPercent}%</strong>
                  </span>
                </div>
                <div className="h-5 sm:h-6 rounded-full bg-bg2 border border-sline overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-acc transition-all duration-300"
                    style={{ width: `${guidedProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card Esercizio Focus (overflow-visible per consentire il grande zoom iniziale dell'istruzione) */}
            <div className="gl-card rounded-2xl !overflow-visible">
              <div className="p-4 bg-acc/[0.08] border-b border-line rounded-t-2xl flex items-start gap-3.5">
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
                    {getExerciseDisplayName(currentEx, lang)}
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
                <div className="p-6 sm:p-8 bg-bg2 rounded-b-2xl text-center space-y-5 gl-page-in">
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
                <div className="p-4 sm:p-5 bg-bg2 rounded-b-2xl space-y-4">
                  {/* Banner Guida Chiaro con animazione luce + movimento all'avvio della serie */}
                  <div
                    key={`prompt_${exIdx}_${setIdx}`}
                    className="gl-prompt-spotlight p-3.5 rounded-xl border border-acc/50 bg-acc/10 flex items-center gap-3"
                  >
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

        {/* ---------- FASE 3: INCORAGGIAMENTO ANIMATO TRA UN ESERCIZIO E L'ALTRO ---------- */}
        {phase === 'encouragement' && (
          <div
            key={`enc_${exIdx}`}
            className="gl-card gl-celebrate-card p-6 sm:p-8 text-center space-y-5"
          >
            {/* Badge esplosione energia con anelli radiali e scintille */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span className="gl-ring-burst rounded-2xl" />
              <span className="gl-ring-burst-delay rounded-2xl" />
              {SPARK_PARTICLES.map((sp, sIdx) => (
                <span
                  key={sIdx}
                  className="gl-spark-dot"
                  style={{
                    width: `${sp.size}px`,
                    height: `${sp.size}px`,
                    background: sp.color,
                    '--sx': sp.sx,
                    '--sy': sp.sy,
                    '--sd': sp.delay
                  }}
                />
              ))}
              <div className="gl-celebrate-pop relative z-10 w-16 h-16 rounded-2xl bg-acc/15 border-2 border-acc grid place-items-center text-acc shadow-[0_0_32px_-4px_var(--glow)]">
                <CheckCircle2 className="w-9 h-9" strokeWidth={2.4} />
              </div>
            </div>

            <div className="space-y-2.5">
              <div
                className="gl-phrase-rise inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-acc/10 border border-acc/30 text-xs font-mono text-acc font-bold"
                style={{ '--d': '80ms' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{setsCompletedProgress}/{totalSetsInDay} {t('lblSets').toLowerCase()} · {guidedProgressPercent}%</span>
              </div>
              <h2 className="gl-title-slam font-dot font-black text-2xl sm:text-3xl text-acc [text-shadow:0_0_24px_var(--glow)]">
                {encouragementData.heading}
              </h2>
              <p
                className="gl-phrase-rise text-sm sm:text-base font-sans font-medium text-fg max-w-md mx-auto leading-relaxed"
                style={{ '--d': '240ms' }}
              >
                {encouragementData.phrase}
              </p>
            </div>

            {nextEx && (
              <div
                className="gl-phrase-rise p-3.5 rounded-xl border border-sline bg-bg2/80 text-xs font-mono space-y-1 max-w-md mx-auto"
                style={{ '--d': '340ms' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-dim block">
                  {t('guidedNextUp')} ({exIdx + 2}/{exercises.length})
                </span>
                <span className="font-dot font-extrabold text-sm sm:text-base text-fg block break-words">
                  {getExerciseDisplayName(nextEx, lang)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoToNextExercise}
              className="gl-phrase-rise gl-btn-primary !h-12 !px-6 text-sm font-mono font-black inline-flex items-center gap-2 mx-auto"
              style={{ '--d': '420ms' }}
            >
              <span>{t('guidedNextExerciseBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---------- FASE 4: ALLENAMENTO COMPLETATO CON FESTEGGIAMENTO ---------- */}
        {phase === 'completed' && (
          <>
            {/* Pioggia di coriandoli non bloccante */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-10" aria-hidden="true">
              {CONFETTI_PIECES.map((c, idx) => (
                <span
                  key={idx}
                  className="gl-confetti-piece"
                  style={{
                    left: c.left,
                    width: `${c.w}px`,
                    height: `${c.h}px`,
                    background: c.color,
                    '--cx': c.cx,
                    '--cdur': c.dur,
                    '--cdel': c.del
                  }}
                />
              ))}
            </div>

            <div className="gl-card gl-celebrate-card relative z-20 p-6 sm:p-10 text-center space-y-6">
              {/* Trofeo eroico con doppia onda d'urto e scintille */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <span className="gl-ring-burst rounded-full" />
                <span className="gl-ring-burst-delay rounded-full" />
                {SPARK_PARTICLES.map((sp, sIdx) => (
                  <span
                    key={sIdx}
                    className="gl-spark-dot"
                    style={{
                      width: `${sp.size + 1}px`,
                      height: `${sp.size + 1}px`,
                      background: sp.color,
                      '--sx': sp.sx,
                      '--sy': sp.sy,
                      '--sd': sp.delay
                    }}
                  />
                ))}
                <div className="gl-trophy-hero relative z-10 w-20 h-20 rounded-full bg-acc/15 border-2 border-acc grid place-items-center text-acc">
                  <Trophy className="w-10 h-10" />
                </div>
              </div>

              <div className="space-y-2.5">
                <span
                  className="gl-phrase-rise gl-tag !text-[10px]"
                  style={{ '--fc': 'rgb(var(--c-acc))', '--d': '80ms' }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  100%
                </span>
                <h2 className="gl-title-slam font-dot font-black text-2xl sm:text-4xl text-acc [text-shadow:0_0_28px_var(--glow)]">
                  {t('guidedWorkoutDoneTitle')}
                </h2>
                <p
                  className="gl-phrase-rise text-sm sm:text-base font-sans text-dim max-w-md mx-auto"
                  style={{ '--d': '200ms' }}
                >
                  {t('guidedWorkoutDoneSub')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 font-mono max-w-md mx-auto">
                <div className="gl-phrase-rise gl-param-card p-3" style={{ '--d': '240ms' }}>
                  <span className="block text-[9.5px] text-dim uppercase">{t('exercises')}</span>
                  <span className="text-lg font-black text-acc block mt-0.5">{exercises.length}</span>
                </div>
                <div className="gl-phrase-rise gl-param-card p-3" style={{ '--d': '320ms' }}>
                  <span className="block text-[9.5px] text-dim uppercase">{t('lblSets')}</span>
                  <span className="text-lg font-black text-fg block mt-0.5">{totalSetsInDay}</span>
                </div>
                <div className="gl-phrase-rise gl-param-card p-3" style={{ '--d': '400ms' }}>
                  <span className="block text-[9.5px] text-dim uppercase">{t('guidedDurationLabel')}</span>
                  <span className="text-lg font-black text-fg block mt-0.5">{formatElapsed()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="gl-phrase-rise gl-btn-primary !h-12 !px-6 text-xs sm:text-sm font-mono font-bold inline-flex items-center gap-2 mx-auto"
                style={{ '--d': '460ms' }}
              >
                <Check className="w-4 h-4" />
                <span>{t('guidedBackToSheet')}</span>
              </button>
            </div>
          </>
        )}

      </main>
    </div>,
    document.body
  );
}
