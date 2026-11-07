import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Dumbbell, Calendar, User, FileEdit, Clock, CheckCircle2, ChevronDown,
  ChevronUp, Eye, Share2, Copy, Check, Printer, ArrowLeft, ArrowRight,
  AlertCircle, ShieldCheck, Play, Pause, RotateCcw, Volume2,
  LayoutList, LayoutGrid, CopyPlus, TrendingUp, BarChart3, Edit3, BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getExerciseImageUrl, getExerciseMediaUrl, translateTarget, translateEquipment, getExerciseDescription, getExerciseDisplayName, fetchExercises } from '../services/exerciseService';
import { playTimerCompleteSound } from '../utils/sound';
import { getWorkoutById, trackWorkoutView, updateExerciseWeight } from '../services/workoutService';
import ExerciseProgressModal from '../components/ExerciseProgressModal';
import GlobalProgressExportModal from '../components/GlobalProgressExportModal';

const RECENT_KEY = 'gymlink_recent_workouts';

// Protocollo dimostrativo di fallback (se l'ID non è ancora nel database locale)
const DEMO_WORKOUT = {
  id: 'demo-protocol',
  title: 'Ipertrofia Mesociclo 1 (Push - Pull - Legs)',
  ptName: 'Marco PT Pro',
  clientName: 'Atleta Demo',
  date: new Date().toISOString().split('T')[0],
  generalNotes: 'Riscaldamento articolare 7-10 minuti prima di ogni seduta. Mantieni 1 ripetizione in riserva (RIR 1-2) su tutti gli esercizi tranne l\'ultima serie dove puoi andare a cedimento tecnico. Idratazione costante.',
  days: [
    {
      id: 'day_1',
      title: 'Giorno A - Spinta (Petto, Spalle, Tricipiti)',
      exercises: [
        {
          id: 'ex_1',
          name: 'Barbell Bench Press (Panca Piana Bilanciere)',
          sets: '4',
          reps: '6-8',
          weight: '80 kg',
          rest: '120"',
          notes: 'Fermo al petto di 1 secondo, discesa in 3 secondi. Spalle addotte e depresse.',
          target: 'Pettorali',
          equipment: 'Bilanciere',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0025.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0025.jpg',
          description: 'Sdraiati sulla panca piana, impugna il bilanciere a larghezza leggermente superiore alle spalle. Abbassa il peso con controllo fino a toccare il mediopetto, poi spingi con decisione verso l\'alto.',
          isCustom: false
        },
        {
          id: 'ex_2',
          name: 'Incline Dumbbell Press (Spinte Manubri Panca 30°)',
          sets: '3',
          reps: '8-10',
          weight: '26 kg',
          rest: '90"',
          notes: 'Inclinazione panca 30 gradi. Massimo allungamento in basso.',
          target: 'Pettorali Alti',
          equipment: 'Manubri',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0314.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0314.jpg',
          description: 'Siediti su panca inclinata a 30°, porta i manubri all\'altezza delle spalle. Spingi verso l\'alto senza toccarli insieme al vertice per mantenere tensione continua.',
          isCustom: false
        },
        {
          id: 'ex_3',
          name: 'Dumbbell Lateral Raise (Alzate Laterali Manubri)',
          sets: '4',
          reps: '12-15',
          weight: '12 kg',
          rest: '60"',
          notes: 'Gomiti leggermente flessi, salita controllata fino a livello spalle senza slancio.',
          target: 'Deltoidi Laterali',
          equipment: 'Manubri',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0334.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0334.jpg',
          description: 'In piedi con manubri lungo i fianchi, solleva le braccia lateralmente guidando con i gomiti fino all\'altezza delle spalle. Ritorna lentamente.',
          isCustom: false
        },
        {
          id: 'ex_4',
          name: 'Triceps Pushdown Cavi',
          sets: '3',
          reps: '10-12',
          weight: '25 kg',
          rest: '60"',
          notes: 'Gomiti serrati ai fianchi, enfasi sul blocco articolare in basso con contrazione di picco.',
          target: 'Tricipiti',
          equipment: 'Cavi',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0241.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0241.jpg',
          description: 'Afferra la corda o sbarra alla carrucola alta, mantieni i gomiti fermi vicino al busto ed estendi gli avambracci verso il basso.',
          isCustom: false
        }
      ]
    },
    {
      id: 'day_2',
      title: 'Giorno B - Trazione (Dorso, Deltoidi Posteriori, Bicipiti)',
      exercises: [
        {
          id: 'ex_5',
          name: 'Lat Pulldown (Trazioni alla Lat Machine)',
          sets: '4',
          reps: '8-10',
          weight: '65 kg',
          rest: '90"',
          notes: 'Tira la sbarra fino alla parte alta del petto, spingi i gomiti in basso e indietro.',
          target: 'Gran Dorsale',
          equipment: 'Cavi',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0198.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0198.jpg',
          description: 'Seduto con cosce bloccate sotto i rulli, afferra la sbarra con presa larga. Tira verso lo sterno contraendo i dorsali.',
          isCustom: false
        },
        {
          id: 'ex_6',
          name: 'Barbell Bent Over Row (Rematore con Bilanciere)',
          sets: '3',
          reps: '8-10',
          weight: '70 kg',
          rest: '90"',
          notes: 'Busto a 45 gradi, schiena perfettamente dritta e core saldo.',
          target: 'Dorso e Romboidi',
          equipment: 'Bilanciere',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0027.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0027.jpg',
          description: 'Fletti le ginocchia e inclina il busto mantenendo la curva lombare. Tira il bilanciere verso l\'ombelico stringendo le scapole.',
          isCustom: false
        },
        {
          id: 'ex_7',
          name: 'Barbell Bicep Curl (Curl Bicipiti con Bilanciere)',
          sets: '4',
          reps: '10-12',
          weight: '30 kg',
          rest: '60"',
          notes: 'Zero oscillazioni con la schiena, discesa lenta in 2.5 secondi.',
          target: 'Bicipiti',
          equipment: 'Bilanciere',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0031.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0031.jpg',
          description: 'In piedi, impugna il bilanciere con palmi rivolti in avanti. Fletti le braccia portando il bilanciere verso il petto.',
          isCustom: false
        }
      ]
    },
    {
      id: 'day_3',
      title: 'Giorno C - Gambe & Core (Quadricipiti, Femorali, Polpacci, Addome)',
      exercises: [
        {
          id: 'ex_8',
          name: 'Barbell Back Squat (Squat con Bilanciere)',
          sets: '4',
          reps: '6-8',
          weight: '100 kg',
          rest: '120"',
          notes: 'Discesa fino al parallelo, talloni saldi al suolo.',
          target: 'Quadricipiti e Glutei',
          equipment: 'Bilanciere',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0043.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0043.jpg',
          description: 'Posiziona il bilanciere sui trapezi, piedi larghezza spalle. Scendi piegando anche e ginocchia fino al parallelo, poi risali con forza.',
          isCustom: false
        },
        {
          id: 'ex_9',
          name: 'Romanian Deadlift (Stacco Rumeno con Manubri)',
          sets: '3',
          reps: '8-10',
          weight: '24+24 kg',
          rest: '90"',
          notes: 'Focus sull\'allungamento dei femorali. Spingi il bacino indietro.',
          target: 'Femorali / Glutei',
          equipment: 'Manubri',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0378.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0378.jpg',
          description: 'In piedi con ginocchia morbide, fai scivolare i pesi lungo le cosce arretrando le anche finché senti tirare i femorali.',
          isCustom: false
        },
        {
          id: 'ex_10',
          name: 'Plank Addominale Isometrico',
          sets: '3',
          reps: '45-60"',
          weight: 'Corpo Libero',
          rest: '60"',
          notes: 'Glutei e addome contratti al massimo. Non inarcare la zona lombare.',
          target: 'Addome e Core',
          equipment: 'Corpo Libero',
          gifUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0472.gif',
          imageUrl: 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/exercises/0472.jpg',
          description: 'In appoggio su avambracci e punte dei piedi, mantieni il corpo in una linea retta perfetta tenendo l\'ombelico risucchiato verso la colonna.',
          isCustom: false
        }
      ]
    }
  ]
};

// Funzione di normalizzazione robusta: garantisce che la scheda non abbia mai campi nulli o array undefined
function normalizeWorkout(raw, fallbackId) {
  if (!raw) {
    return { ...DEMO_WORKOUT, id: fallbackId || 'demo-protocol' };
  }

  const days = Array.isArray(raw.days) && raw.days.length > 0
    ? raw.days.map((d, i) => ({
      id: d?.id || `day_${i + 1}`,
      title: d?.title || `Giorno ${String.fromCharCode(65 + i)}`,
      exercises: Array.isArray(d?.exercises)
        ? d.exercises.map((ex, j) => ({
          id: ex?.id || `ex_${i}_${j}`,
          exerciseId: ex?.exerciseId || null,
          name: ex?.name || 'Esercizio',
          sets: ex?.sets || '—',
          reps: ex?.reps || '—',
          weight: ex?.weight || '',
          weightHistory: Array.isArray(ex?.weightHistory) ? ex.weightHistory : [],
          rest: ex?.rest || '60"',
          notes: ex?.notes || '',
          target: ex?.target || '',
          equipment: ex?.equipment || '',
          gifUrl: ex?.gifUrl || '',
          imageUrl: ex?.imageUrl || '',
          description: ex?.description || '',
          instructions: ex?.instructions || null,
          isCustom: !!ex?.isCustom
        }))
        : []
    }))
    : DEMO_WORKOUT.days;

  return {
    id: raw.id || fallbackId || 'demo-protocol',
    title: raw.title || 'Scheda di Allenamento',
    ptName: raw.ptName || '',
    clientName: raw.clientName || '',
    date: raw.date || '',
    generalNotes: raw.generalNotes || '',
    days
  };
}

export default function WorkoutViewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();

  const [workout, setWorkout] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [, setDbRefresh] = useState(0);

  // Pre-caricamento in background del dataset esercizi per traduzioni dinamiche istantanee delle istruzioni
  useEffect(() => {
    fetchExercises()
      .then(() => setDbRefresh((v) => v + 1))
      .catch(() => {});
  }, []);

  // Modalità di visualizzazione: 'detailed' (estesa con parametri a vista) o 'compact' (elenco sintetico espandibile)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('gymlink_view_mode') || 'detailed';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('gymlink_view_mode', mode);
  };

  // Modali Progressioni
  const [progressModalEx, setProgressModalEx] = useState(null); // esercizio selezionato per modale grafico
  const [isGlobalExportOpen, setIsGlobalExportOpen] = useState(false);
  const [editingWeightExId, setEditingWeightExId] = useState(null);
  const [editWeightVal, setEditWeightVal] = useState('');
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);

  // Gestione aggiornamento peso cliente
  const handleSaveEditedWeight = async (exerciseId) => {
    if (!editWeightVal.trim() || !workout?.id) {
      setEditingWeightExId(null);
      return;
    }
    setIsUpdatingWeight(true);
    try {
      const res = await updateExerciseWeight(workout.id, exerciseId, editWeightVal.trim());
      if (res.success && res.updatedWorkout) {
        setWorkout(res.updatedWorkout);
      }
    } catch (err) {
      console.error('Errore aggiornamento peso:', err);
    } finally {
      setIsUpdatingWeight(false);
      setEditingWeightExId(null);
    }
  };

  // Stato apertura/chiusura testata protocollo (aperto al caricamento, auto-chiuso allo scroll e persistente)
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const hasAutoClosedRef = useRef(false);

  // All'ingresso della pagina, posiziona lo scroll in cima e mostra l'intestazione completa
  useEffect(() => {
    window.scrollTo(0, 0);
    hasAutoClosedRef.current = false;
    setIsHeaderOpen(true);
  }, [id]);

  // Auto-chiusura allo scroll verso il basso solo dopo che l'utente ha iniziato a scorrere oltre 120px
  useEffect(() => {
    let isArmed = false;
    const timer = setTimeout(() => {
      isArmed = true;
    }, 400);

    const handleScroll = () => {
      if (isArmed && window.scrollY > 120 && !hasAutoClosedRef.current) {
        hasAutoClosedRef.current = true;
        setIsHeaderOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [id]);

  // Timer di Recupero Integrato
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerInitial, setTimerInitial] = useState(90);
  const [forceClientPreview, setForceClientPreview] = useState(false);

  // Rilevamento se l'utente è il PT che ha creato la scheda su questo dispositivo
  const isPtUser = useMemo(() => {
    if (location.state?.fromPt) return true;
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          return list.some((w) => w?.id === id);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return false;
  }, [id, location.state]);

  // Caricamento dati della Scheda (Cloud Supabase con fallback su cache locale/bozza)
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getWorkoutById(id);
        if (isMounted) {
          setWorkout(normalizeWorkout(data, id));
          // Traccia la visualizzazione in modo atomico (con protezione anti-refresh per sessione)
          trackWorkoutView(id);
        }
      } catch (err) {
        console.warn('Errore load workout:', err);
        if (isMounted) {
          setWorkout(normalizeWorkout(null, id));
        }
      }
    }

    load();
    return () => { isMounted = false; };
  }, [id]);

  // Gestione Timer Countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      // Riproduce il suono dedicato al tema (campanella per chiaro, laser arcade per scuro)
      playTimerCompleteSound(theme);
      // Feedback vibrazione su smartphone compatibili
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const handleStartRestTimer = (restString) => {
    // Estrae i secondi da stringhe tipo 90", 60s, 120, 2', 90
    let seconds = 90;
    if (restString) {
      const cleaned = restString.replace(/[^\d]/g, '');
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > 0) {
        // Se l'utente ha scritto "2" intendendo minuti
        seconds = parsed <= 5 ? parsed * 60 : parsed;
      }
    }
    setTimerInitial(seconds);
    setTimerSeconds(seconds);
    setTimerActive(true);
  };

  const handleToggleCompleted = (exId) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [exId]: !prev[exId]
    }));
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    const title = workout?.title || 'Scheda di Allenamento';
    const pt = workout?.ptName ? ` preparata da ${workout.ptName}` : '';
    const text = encodeURIComponent(
      `Ecco la tua scheda di allenamento "${title}"${pt}:\n${window.location.href}\n\n🔒 Nota: questo link è strettamente personale, conservalo e non condividerlo con altri per evitare modifiche ai tuoi dati di allenamento.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!workout) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Dumbbell className="w-8 h-8 mx-auto text-acc animate-pulse" />
        <p className="font-dot text-sm text-dim">Caricamento protocollo di allenamento...</p>
      </div>
    );
  }

  const daysList = Array.isArray(workout?.days) && workout.days.length > 0 ? workout.days : DEMO_WORKOUT.days;
  const currentDay = daysList[activeDayIndex] || daysList[0] || { exercises: [] };
  const exercisesList = Array.isArray(currentDay?.exercises) ? currentDay.exercises : [];
  const totalDays = daysList.length;

  // Calcolo progresso completamento per la giornata attiva
  const completedInDay = exercisesList.filter((ex) => ex?.id && completedExercises[ex.id]).length;
  const totalInDay = exercisesList.length;
  const progressPercent = totalInDay > 0 ? Math.round((completedInDay / totalInDay) * 100) : 0;

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

      {/* Banner se il PT ha attivato l'anteprima esatta del cliente */}
      {isPtUser && forceClientPreview && (
        <div className="rounded-xl border border-info/40 bg-info/10 p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs font-mono text-info gl-rise">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-info shrink-0" />
            <span>Anteprima <strong>Modalità Cliente</strong> attiva</span>
          </div>
          <button
            type="button"
            onClick={() => setForceClientPreview(false)}
            className="gl-btn !h-7 !px-2.5 text-xs text-info hover:text-fg font-bold"
          >
            {t('btnExitClientPreview')}
          </button>
        </div>
      )}

      {/* ---------- 1. BARRA DI CONTROLLO DEL PERSONAL TRAINER (VISIBILE SOLO AL PT) ---------- */}
      {isPtUser && !forceClientPreview ? (
        <div className="rounded-xl border border-acc/40 bg-acc/10 p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_24px_-8px_var(--glow)] gl-rise">
          <div className="flex items-center gap-2.5 text-xs font-mono text-acc">
            <span className="w-2 h-2 rounded-full bg-acc animate-ping" />
            <span className="font-bold uppercase tracking-wider">
              {t('ptDetectedBadge')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setForceClientPreview(true)}
              className="gl-btn !h-8 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5 text-fg hover:text-acc"
              title="Visualizza la scheda esattamente come la vede il tuo atleta"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('btnToggleClientPreview')}</span>
            </button>

            <Link
              to={`/edit/${workout.id}`}
              className="gl-btn-primary !h-8 !px-3.5 !text-xs !rounded-lg inline-flex items-center gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>{t('btnEditWorkout')}</span>
            </Link>

            <Link
              to={`/editor?templateId=${workout.id}`}
              className="gl-btn !h-8 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5 text-acc hover:!border-acc"
              title="Usa questa scheda come base per un nuovo cliente"
            >
              <CopyPlus className="w-3.5 h-3.5" />
              <span>{t('btnUseTemplate')}</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              className="gl-btn !h-8 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5 text-fg hover:text-acc"
              title="Copia link cliente da inviare su chat"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-acc" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t('copiedSuccess') : t('actionCopy')}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="gl-btn !h-8 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5 text-fg hover:text-emerald-400"
              title="Condividi direttamente su WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>
      ) : (
        /* Badge di riservatezza per il cliente (con Link alla Guida Atleta e Stampa) */
        <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-mono text-dim">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-acc" />
            <span>{t('privateBadge')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/guida"
              className="hover:text-acc inline-flex items-center gap-1 text-acc font-bold transition-colors"
              title="Guida operativa all'uso della scheda per l'atleta"
            >
              <BookOpen className="w-3.5 h-3.5 text-acc" />
              <span>{t('clientGuideBtn')}</span>
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="hover:text-fg inline-flex items-center gap-1"
              title="Stampa o Salva PDF"
            >
              <Printer className="w-3 h-3" />
              <span className="hidden sm:inline">{t('btnPrintPdf')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------- 2. SCHEDA INTESTAZIONE PROTOCOLLO (AUTO-COLLASSABILE ALLO SCROLL) ---------- */}
      <header className="gl-card gl-rise" style={{ '--d': '40ms' }}>
        <div
          onClick={() => setIsHeaderOpen(!isHeaderOpen)}
          className="gl-card-head flex items-center justify-between gap-3 !pr-3 sm:!pr-4 cursor-pointer select-none transition-colors hover:bg-fg/[0.02]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Dumbbell className="w-4 h-4 text-acc -rotate-45 shrink-0" />
            <h1 className="font-dot font-black text-[16px] sm:text-[20px] tracking-wide text-fg uppercase truncate">
              {workout.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="gl-tag !text-[9.5px] shrink-0 hidden sm:inline-flex">
              {totalDays} {totalDays === 1 ? (lang === 'en' ? 'DAY' : lang === 'es' ? 'DÍA' : 'GIORNO') : (lang === 'en' ? 'DAYS' : lang === 'es' ? 'DÍAS' : 'GIORNI')}
            </span>

            {/* Pulsante Toggle con freccia per aprire/chiudere l'intestazione */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsHeaderOpen(!isHeaderOpen);
              }}
              className="gl-btn !h-7 !px-2 sm:!px-2.5 !text-[10.5px] sm:!text-[11px] font-mono inline-flex items-center gap-1.5 hover:!border-acc"
              title={isHeaderOpen ? 'Comprimi intestazione' : 'Espandi dettagli protocollo'}
              aria-expanded={isHeaderOpen}
            >
              <span className="uppercase font-bold text-dim hover:text-fg">
                {isHeaderOpen ? t('btnCollapse') : t('btnExpand')}
              </span>
              {isHeaderOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-acc transition-transform duration-200" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-acc transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Corpo Espanso: Dettagli PT, Atleta, Data, Note & Progresso */}
        {isHeaderOpen && (
          <div className="p-4 sm:p-5 space-y-4 gl-page-in border-t border-sline/50">

            {/* Griglia Metadati: PT, Atleta, Data */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              {workout.ptName && (
                <div className="p-2.5 rounded-lg border border-sline bg-bg/50">
                  <span className="block text-[10px] text-dim uppercase">{t('lblPt')}</span>
                  <span className="font-bold text-fg text-[13px] truncate block mt-0.5">
                    {workout.ptName}
                  </span>
                </div>
              )}

              {workout.clientName && (
                <div className="p-2.5 rounded-lg border border-sline bg-bg/50">
                  <span className="block text-[10px] text-dim uppercase">{t('lblClient')}</span>
                  <span className="font-bold text-acc text-[13px] truncate block mt-0.5">
                    {workout.clientName}
                  </span>
                </div>
              )}

              {workout.date && (
                <div className="p-2.5 rounded-lg border border-sline bg-bg/50 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-dim uppercase">{t('lblRevisionDate')}</span>
                  <span className="text-dim text-[13px] block mt-0.5 font-mono">
                    {workout.date}
                  </span>
                </div>
              )}
            </div>

            {/* Note Generali / Raccomandazioni del PT */}
            {workout.generalNotes && (
              <div className="p-3.5 rounded-xl border border-line bg-bg2/70 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-acc font-mono text-[11px] font-bold uppercase">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('lblGeneralNotes')}</span>
                </div>
                <p className="text-fg/90 leading-relaxed font-sans text-xs pt-0.5 whitespace-pre-line">
                  {workout.generalNotes}
                </p>
              </div>
            )}

            {/* Barra di Progresso Seduta Attiva per il Cliente & Pulsante Storico Progressioni */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono border-t border-sline/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${progressPercent === 100 ? 'text-acc' : 'text-dim'}`} />
                <span className="text-dim">
                  {t('lblSessionProgress')} <strong className="text-fg">{completedInDay}</strong> {t('lblOf')} <strong className="text-fg">{totalInDay}</strong> {t('lblExercisesCompleted')} ({progressPercent}%)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsGlobalExportOpen(true)}
                className="gl-btn !h-8 !px-3 text-xs font-mono inline-flex items-center gap-1.5 text-acc hover:border-acc self-stretch sm:self-auto justify-center"
                title="Visualizza e scarica lo storico progressioni di tutti gli esercizi"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t('btnProgressionsAndExport')}</span>
              </button>
            </div>

          </div>
        )}
      </header>

      {/* ---------- 3. SELETTORE GIORNATE (TAB THUMB-FRIENDLY) ---------- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {daysList.map((day, idx) => {
            const isActive = idx === activeDayIndex;
            const exCount = Array.isArray(day?.exercises) ? day.exercises.length : 0;

            return (
              <button
                key={day.id || idx}
                type="button"
                onClick={() => {
                  setActiveDayIndex(idx);
                  setExpandedExerciseId(null);
                }}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border font-mono text-xs sm:text-[13px] whitespace-nowrap transition-all flex items-center gap-2 ${isActive
                    ? 'border-acc bg-acc/15 text-acc font-bold shadow-[0_0_16px_-4px_var(--glow)]'
                    : 'border-sline bg-bg2/90 text-dim hover:text-fg hover:border-line2'
                  }`}
              >
                <span>{day.title || `Giorno ${String.fromCharCode(65 + idx)}`}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isActive ? 'bg-acc text-ink' : 'bg-bg border border-sline text-dim'
                  }`}>
                  {exCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Titolo Giorno Attivo & Selettore Visualizzazione Elenco/Dettagli */}
        <div className="flex items-center justify-between px-1">
          <h2 className="font-dot font-extrabold text-[16px] sm:text-[18px] text-fg tracking-wide uppercase">
            {currentDay?.title || `Giorno ${String.fromCharCode(65 + activeDayIndex)}`}
          </h2>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono text-dim mr-1">
              {exercisesList.length} {t('navExercises').toLowerCase()}
            </span>

            {/* Toggle Tipo Visualizzazione: Elenco Compatto vs Dettagli Estesi */}
            <div className="flex items-center p-0.5 rounded-lg border border-sline bg-bg2/90">
              <button
                type="button"
                onClick={() => handleToggleViewMode('compact')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono transition-all ${viewMode === 'compact'
                    ? 'bg-acc text-ink font-bold shadow-sm'
                    : 'text-dim hover:text-fg'
                  }`}
                title="Visualizzazione compatta ad elenco (solo titoli e serie)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('viewModeList')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('detailed')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono transition-all ${viewMode === 'detailed'
                    ? 'bg-acc text-ink font-bold shadow-sm'
                    : 'text-dim hover:text-fg'
                  }`}
                title="Visualizzazione dettagliata con parametri e carichi completi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('viewModeDetails')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 4. LISTA ESERCIZI DELLA GIORNATA ---------- */}
      <section className="space-y-4 sm:space-y-5">
        {exercisesList.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-sline rounded-xl bg-bg2/40 text-dim text-xs font-mono">
            {lang === 'en' ? 'No exercises registered for this day.' : lang === 'es' ? 'No hay ejercicios registrados para este día.' : 'Nessun esercizio registrato per questa giornata.'}
          </div>
        ) : (
          exercisesList.map((ex, idx) => {
            const isCompleted = !!completedExercises[ex.id];
            const isExpanded = expandedExerciseId === ex.id;
            const staticImg = ex.imageUrl || getExerciseImageUrl(ex.image);
            const gifUrl = ex.gifUrl || getExerciseMediaUrl(ex.gif_url);

            // In modalità compatta (elenco), se non è esplicitamente espanso, mostriamo la riga sintetica
            const isRowCompact = viewMode === 'compact' && !isExpanded;

            return (
              <article
                key={ex.id || idx}
                className={`gl-exercise-card rounded-2xl overflow-hidden transition-all ${isCompleted
                    ? '!border-acc/30 bg-bg2/50 opacity-80'
                    : ''
                  }`}
              >
                {/* Header Esercizio: Spunta, Miniatura, Titolo e Toggle Dettagli */}
                <div
                  onClick={() => {
                    if (viewMode === 'compact') {
                      setExpandedExerciseId(isExpanded ? null : ex.id);
                    }
                  }}
                  className={`p-3 sm:p-4 flex items-center justify-between gap-3 bg-acc/[0.08] ${isRowCompact ? 'cursor-pointer hover:bg-acc/[0.12]' : 'border-b border-line'
                    }`}
                >

                  {/* Spunta di completamento & # Badge Ingrandito */}
                  <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompleted(ex.id);
                      }}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border grid place-items-center shrink-0 transition-all ${isCompleted
                          ? 'border-acc bg-acc text-ink shadow-[0_0_14px_-2px_var(--glow)] font-black'
                          : 'border-sline bg-bg2 hover:border-acc text-acc/90 hover:text-acc font-mono font-bold'
                        }`}
                      title={isCompleted ? 'Segna come da fare' : 'Segna come completato'}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <span className="font-mono text-xs sm:text-[13px] font-extrabold tracking-tight">#{idx + 1}</span>
                      )}
                    </button>

                    {/* Miniatura statica (JPG) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedExerciseId(isExpanded ? null : ex.id);
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-sline bg-bg shrink-0 overflow-hidden cursor-pointer hover:border-acc transition-colors p-0.5 flex items-center justify-center relative group shadow-sm"
                      title="Clicca per visualizzare animazione"
                    >
                      {staticImg ? (
                        <img
                          src={staticImg}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Dumbbell className="w-5 h-5 text-dim opacity-50" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <Eye className="w-4 h-4 text-acc" />
                      </div>
                    </div>

                    {/* Nome Esercizio e Tag (Più grande, marcato ed evidente) */}
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-dot font-black text-[15px] sm:text-[18px] leading-snug tracking-wide text-fg truncate ${isCompleted ? 'line-through text-dim' : ''
                        }`}>
                        {getExerciseDisplayName(ex.name, lang)}
                      </h3>

                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {ex.target && (
                          <span className="text-[10.5px] sm:text-[11px] font-mono text-acc font-bold uppercase tracking-wider">
                            {translateTarget(ex.target, lang)}
                          </span>
                        )}
                        {ex.equipment && (
                          <span className="text-[10px] sm:text-[10.5px] font-mono text-dim uppercase">
                            · {translateEquipment(ex.equipment, lang)}
                          </span>
                        )}
                        {isRowCompact && (
                          <div className="ml-auto sm:ml-0 flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-fg bg-bg px-2 py-0.5 rounded border border-sline">
                              {ex.sets || '—'} {t('lblSets').toLowerCase()} × {ex.reps || '—'}
                            </span>
                            {/* Timer Rapido Cliccabile anche in modalità compatta */}
                            {ex.rest && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRestTimer(ex.rest);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-acc/40 bg-acc/10 text-acc hover:bg-acc hover:text-ink font-mono text-[11px] font-bold transition-all shadow-sm"
                                title="Avvia subito timer recupero"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>{ex.rest}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pulsante Toggle GIF / Istruzioni / Espandi */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedExerciseId(isExpanded ? null : ex.id);
                      }}
                      className={`gl-btn !h-8 !px-2.5 !text-xs font-mono gap-1 rounded-lg ${isExpanded ? '!border-acc !text-acc' : 'text-dim hover:text-fg'
                        }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {isRowCompact ? t('viewModeDetails') : isExpanded ? t('btnClose') : (lang === 'en' ? 'Animation' : lang === 'es' ? 'Animación' : 'Animazione')}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                </div>

                {/* Se non è in modalità sintetica compatta, oppure se è espanso, mostra la griglia parametri completa con note */}
                {(!isRowCompact || isExpanded) && (
                  <>
                    {/* Telemetria Parametri di Carico (FMDB Digital Grid) */}
                    <div className="p-3 sm:px-5 sm:py-3.5 bg-bg2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 font-mono text-xs border-b border-sline/40">

                      {/* SERIE */}
                      <div className="gl-param-card p-2.5 sm:p-3">
                        <span className="block text-[9.5px] text-dim uppercase tracking-wider font-bold">{t('lblSets')}</span>
                        <span className="font-bold text-fg text-sm sm:text-base font-mono block mt-0.5">
                          {ex.sets || '—'}
                        </span>
                      </div>

                      {/* REPS */}
                      <div className="gl-param-card p-2.5 sm:p-3">
                        <span className="block text-[9.5px] text-dim uppercase tracking-wider font-bold">{t('lblReps')}</span>
                        <span className="font-bold text-fg text-sm sm:text-base font-mono block mt-0.5">
                          {ex.reps || '—'}
                        </span>
                      </div>

                      {/* CARICO / PESO (Modificabile dall'atleta o PT con storico progressivo) */}
                      <div className="gl-param-card p-2.5 sm:p-3 relative group">
                        <div className="flex items-center justify-between text-[9.5px] text-dim uppercase tracking-wider font-bold">
                          <span>{t('lblWeight')}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProgressModalEx(ex);
                              }}
                              className="text-acc hover:text-fg p-0.5 rounded hover:bg-acc/10"
                              title="Visualizza grafico progressione e trendline"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingWeightExId(ex.id);
                                setEditWeightVal(ex.weight || '');
                              }}
                              className="text-dim hover:text-acc p-0.5 rounded hover:bg-bg"
                              title="Modifica o aumenta il carico"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {editingWeightExId === ex.id ? (
                          <div className="mt-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editWeightVal}
                              onChange={(e) => setEditWeightVal(e.target.value)}
                              placeholder="es. 75 kg"
                              className="gl-input !h-7 !px-2 font-mono text-xs !text-acc font-bold flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditedWeight(ex.id);
                                if (e.key === 'Escape') setEditingWeightExId(null);
                              }}
                            />
                            <button
                              type="button"
                              disabled={isUpdatingWeight}
                              onClick={() => handleSaveEditedWeight(ex.id)}
                              className="gl-btn-primary !h-7 !px-2 text-xs font-mono"
                            >
                              {t('btnSave') || 'Salva'}
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingWeightExId(ex.id);
                              setEditWeightVal(ex.weight || '');
                            }}
                            className="cursor-pointer flex items-center justify-between mt-0.5"
                            title="Clicca per aggiornare il carico di oggi"
                          >
                            <span className="font-bold text-acc text-sm sm:text-base font-mono block">
                              {ex.weight || (lang === 'en' ? 'By feel' : lang === 'es' ? 'Por sensaciones' : 'A sensazione')}
                            </span>
                            {Array.isArray(ex.weightHistory) && ex.weightHistory.length > 0 && (
                              <span className="text-[10px] font-mono text-dim">
                                📈 +{ex.weightHistory.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RECUPERO (CON ICONCINA PLAY SEMPRE EVIDENTE E AVVIO A UN TOCCO) */}
                      <div
                        onClick={() => ex.rest && handleStartRestTimer(ex.rest)}
                        className="gl-param-card p-2.5 sm:p-3 cursor-pointer group hover:border-acc transition-colors"
                        title="Clicca per avviare il countdown di recupero"
                      >
                        <div className="flex items-center justify-between text-[9.5px] text-dim uppercase tracking-wider font-bold">
                          <span>{t('lblRest')}</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-acc/15 text-acc text-[9px] font-bold">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{t('lblStartTimer')}</span>
                          </span>
                        </div>
                        <span className="font-bold text-fg group-hover:text-acc text-sm sm:text-base font-mono block mt-0.5">
                          {ex.rest || '60"'}
                        </span>
                      </div>

                    </div>

                    {/* Note Specifiche del PT per l'Esercizio */}
                    {ex.notes && (
                      <div className="px-3.5 py-2.5 bg-bg/40 text-xs font-sans border-b border-sline/30 flex items-start gap-2">
                        <span className="font-mono text-[10px] font-bold text-acc uppercase shrink-0 mt-0.5">
                          {t('lblNotesPt')}
                        </span>
                        <p className="text-fg/90 leading-relaxed font-sans text-xs">
                          {ex.notes}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Sezione Espansa: Dimostrazione Biomeccanica Animata (Lazy GIF) & Istruzioni di Esecuzione */}
                {isExpanded && (
                  <div className="p-4 bg-bg/95 border-t border-sline/80 space-y-3 gl-page-in">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {gifUrl && (
                        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl border border-sline bg-bg2 overflow-hidden flex items-center justify-center p-1.5 shrink-0 shadow-lg">
                          <img
                            src={gifUrl}
                            alt={getExerciseDisplayName(ex.name, lang)}
                            className="w-full h-full object-contain rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 text-xs">
                        <span className="font-mono text-[10.5px] text-acc uppercase font-bold tracking-wider block">
                          {t('lblBiomechanics')}
                        </span>
                        <p className="text-fg/90 leading-relaxed font-sans text-xs">
                          {getExerciseDescription(ex, lang) || (lang === 'en' ? 'Perform the movement controlling the eccentric phase and breathing steadily.' : lang === 'es' ? 'Realiza el movimiento controlando la fase excéntrica y manteniendo una respiración constante.' : 'Esegui il movimento controllando la fase eccentrica e mantenendo costante la respirazione.')}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-dim pt-2 border-t border-sline/50">
                          <span>Target: <strong className="text-acc">{translateTarget(ex.target, lang) || '—'}</strong></span>
                          <span>{lang === 'en' ? 'Equipment' : lang === 'es' ? 'Equipamiento' : 'Attrezzatura'}: <strong className="text-info">{translateEquipment(ex.equipment, lang) || '—'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </article>
            );
          })
        )}
      </section>

      {/* ---------- 5. NAVIGATORE INFERIORE GIORNATE (THUMB-FRIENDLY) ---------- */}
      <footer className="pt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={activeDayIndex === 0}
          onClick={() => {
            setActiveDayIndex((prev) => Math.max(0, prev - 1));
            setExpandedExerciseId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="gl-btn !h-10 !px-4 text-xs font-mono !rounded-xl disabled:opacity-30 disabled:hover:text-dim inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Giorno Prec.</span>
        </button>

        <span className="text-xs font-mono text-dim">
          Giorno <strong className="text-acc">{activeDayIndex + 1}</strong> di <strong className="text-fg">{totalDays}</strong>
        </span>

        <button
          type="button"
          disabled={activeDayIndex === totalDays - 1}
          onClick={() => {
            setActiveDayIndex((prev) => Math.min(totalDays - 1, prev + 1));
            setExpandedExerciseId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="gl-btn !h-10 !px-4 text-xs font-mono !rounded-xl disabled:opacity-30 disabled:hover:text-dim inline-flex items-center gap-2"
        >
          <span>Giorno Succ.</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>

      {/* ---------- 6. FLOATING REST TIMER (CRONOMETRO RECUPERO PALESTRA) ---------- */}
      {timerSeconds !== null && (
        <aside
          className="fixed bottom-4 right-4 z-40 bg-bg2/95 border border-acc/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3 font-mono text-xs gl-welup"
          aria-label="Cronometro di recupero"
        >
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-dim">Recupero</span>
            <span className={`font-mono font-bold text-lg leading-tight ${timerSeconds === 0 ? 'text-acc animate-pulse' : 'text-fg'}`}>
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimerActive(!timerActive)}
              className="p-1.5 rounded-lg border border-sline bg-bg hover:border-acc text-acc"
              title={timerActive ? 'Pausa' : 'Avvia'}
            >
              {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerSeconds(timerInitial);
                setTimerActive(true);
              }}
              className="p-1.5 rounded-lg border border-sline bg-bg hover:border-fg text-dim hover:text-fg"
              title="Ricomincia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => playTimerCompleteSound(theme)}
              className="p-1.5 rounded-lg border border-sline bg-bg hover:border-acc text-dim hover:text-acc"
              title="Ascolta anteprima suono fine recupero"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerSeconds(null);
                setTimerActive(false);
              }}
              className="p-1.5 rounded-lg text-dim hover:text-danger ml-1"
              title="Chiudi timer"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Modale Grafico Progressione Singolo Esercizio */}
      {progressModalEx && (
        <ExerciseProgressModal
          isOpen={!!progressModalEx}
          onClose={() => setProgressModalEx(null)}
          exerciseName={getExerciseDisplayName(progressModalEx.name, lang)}
          weightHistory={progressModalEx.weightHistory || []}
          currentWeight={progressModalEx.weight}
        />
      )}

      {/* Modale Panoramica Globale Progressioni & Download Dati */}
      <GlobalProgressExportModal
        isOpen={isGlobalExportOpen}
        onClose={() => setIsGlobalExportOpen(false)}
        workout={workout}
      />

    </div>
  );
}


