import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Dumbbell, Calendar, User, FileEdit, Clock, CheckCircle2, ChevronDown, 
  ChevronUp, Eye, Share2, Copy, Check, Printer, ArrowLeft, ArrowRight, 
  AlertCircle, ShieldCheck, Play, Pause, RotateCcw, Volume2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getExerciseImageUrl, getExerciseMediaUrl } from '../services/exerciseService';
import { playTimerCompleteSound } from '../utils/sound';
import { getWorkoutById, trackWorkoutView } from '../services/workoutService';

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
              name: ex?.name || 'Esercizio',
              sets: ex?.sets || '—',
              reps: ex?.reps || '—',
              weight: ex?.weight || '',
              rest: ex?.rest || '60"',
              notes: ex?.notes || '',
              target: ex?.target || '',
              equipment: ex?.equipment || '',
              gifUrl: ex?.gifUrl || '',
              imageUrl: ex?.imageUrl || '',
              description: ex?.description || '',
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
    const text = encodeURIComponent(`Ecco la tua scheda di allenamento "${title}"${pt}:\n${window.location.href}`);
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
      
      {/* ---------- 1. BARRA DI CONTROLLO DEL PERSONAL TRAINER (VISIBILE SOLO AL PT) ---------- */}
      {isPtUser ? (
        <div className="rounded-xl border border-acc/40 bg-acc/10 p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_24px_-8px_var(--glow)] gl-rise">
          <div className="flex items-center gap-2.5 text-xs font-mono text-acc">
            <span className="w-2 h-2 rounded-full bg-acc animate-ping" />
            <span className="font-bold uppercase tracking-wider">
              👤 Modalità PT Rilevata · Tu hai creato questa scheda
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            <Link
              to={`/edit/${workout.id}`}
              className="gl-btn-primary !h-8 !px-3.5 !text-xs !rounded-lg inline-flex items-center gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>✏️ Modifica Scheda</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              className="gl-btn !h-8 !px-3 !text-xs !rounded-lg inline-flex items-center gap-1.5 text-fg hover:text-acc"
              title="Copia link cliente da inviare su chat"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-acc" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiato!' : 'Copia Link'}</span>
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
        /* Badge di riservatezza per il cliente (Zero tasti di modifica) */
        <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-mono text-dim">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-acc" />
            <span>Protocollo Privato Non Indicizzato · Sola Lettura</span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="hover:text-fg inline-flex items-center gap-1"
            title="Stampa o Salva PDF"
          >
            <Printer className="w-3 h-3" />
            <span className="hidden sm:inline">Stampa / PDF</span>
          </button>
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
              {totalDays} {totalDays === 1 ? 'GIORNO' : 'GIORNI'}
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
                {isHeaderOpen ? 'Comprimi' : 'Dettagli'}
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
                  <span className="block text-[10px] text-dim uppercase">Personal Trainer</span>
                  <span className="font-bold text-fg text-[13px] truncate block mt-0.5">
                    {workout.ptName}
                  </span>
                </div>
              )}

              {workout.clientName && (
                <div className="p-2.5 rounded-lg border border-sline bg-bg/50">
                  <span className="block text-[10px] text-dim uppercase">Atleta / Destinatario</span>
                  <span className="font-bold text-acc text-[13px] truncate block mt-0.5">
                    {workout.clientName}
                  </span>
                </div>
              )}

              {workout.date && (
                <div className="p-2.5 rounded-lg border border-sline bg-bg/50 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-dim uppercase">Data Revisione</span>
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
                  <span>Indicazioni & Linee Guida Generali</span>
                </div>
                <p className="text-fg/90 leading-relaxed font-sans text-xs pt-0.5 whitespace-pre-line">
                  {workout.generalNotes}
                </p>
              </div>
            )}

            {/* Barra di Progresso Seduta Attiva per il Cliente */}
            <div className="pt-1 flex items-center justify-between gap-3 text-xs font-mono border-t border-sline/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${progressPercent === 100 ? 'text-acc' : 'text-dim'}`} />
                <span className="text-dim">
                  Progresso seduta: <strong className="text-fg">{completedInDay}</strong> di <strong className="text-fg">{totalInDay}</strong> esercizi completati
                </span>
              </div>
              <span className="font-bold text-acc">{progressPercent}%</span>
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
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border font-mono text-xs sm:text-[13px] whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'border-acc bg-acc/15 text-acc font-bold shadow-[0_0_16px_-4px_var(--glow)]'
                    : 'border-sline bg-bg2/90 text-dim hover:text-fg hover:border-line2'
                }`}
              >
                <span>{day.title || `Giorno ${String.fromCharCode(65 + idx)}`}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  isActive ? 'bg-acc text-ink' : 'bg-bg border border-sline text-dim'
                }`}>
                  {exCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Titolo Giorno Attivo */}
        <div className="flex items-center justify-between px-1">
          <h2 className="font-dot font-extrabold text-[16px] sm:text-[18px] text-fg tracking-wide uppercase">
            {currentDay?.title || `Giorno ${String.fromCharCode(65 + activeDayIndex)}`}
          </h2>
          <span className="text-xs font-mono text-dim">
            {exercisesList.length} esercizi programmati
          </span>
        </div>
      </section>

      {/* ---------- 4. LISTA ESERCIZI DELLA GIORNATA ---------- */}
      <section className="space-y-3">
        {exercisesList.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-sline rounded-xl bg-bg2/40 text-dim text-xs font-mono">
            Nessun esercizio registrato per questa giornata.
          </div>
        ) : (
          exercisesList.map((ex, idx) => {
            const isCompleted = !!completedExercises[ex.id];
            const isExpanded = expandedExerciseId === ex.id;
            const staticImg = ex.imageUrl || getExerciseImageUrl(ex.image);
            const gifUrl = ex.gifUrl || getExerciseMediaUrl(ex.gif_url);

            return (
              <article
                key={ex.id || idx}
                className={`gl-exercise-card rounded-xl overflow-hidden ${
                  isCompleted 
                    ? '!border-acc/30 bg-bg2/50 opacity-80' 
                    : ''
                }`}
              >
                {/* Header Esercizio: Spunta, Miniatura, Titolo e Toggle Dettagli */}
                <div className="p-3 sm:p-4 flex items-center justify-between gap-3 bg-acc/[0.10] border-b border-line">
                  
                  {/* Spunta di completamento & # */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(ex.id)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border grid place-items-center shrink-0 transition-colors ${
                        isCompleted
                          ? 'border-acc bg-acc text-ink shadow-[0_0_12px_-2px_var(--glow)]'
                          : 'border-sline bg-bg2 hover:border-acc text-dim hover:text-acc'
                      }`}
                      title={isCompleted ? 'Segna come da fare' : 'Segna come completato'}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="font-mono text-xs">#{idx + 1}</span>}
                    </button>

                    {/* Miniatura statica (JPG) */}
                    <div 
                      onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border border-sline bg-bg shrink-0 overflow-hidden cursor-pointer hover:border-acc transition-colors p-0.5 flex items-center justify-center relative group"
                      title="Clicca per visualizzare animazione"
                    >
                      {staticImg ? (
                        <img
                          src={staticImg}
                          alt=""
                          className="w-full h-full object-cover rounded"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Dumbbell className="w-4 h-4 text-dim opacity-50" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                        <Eye className="w-3.5 h-3.5 text-acc" />
                      </div>
                    </div>

                    {/* Nome Esercizio e Tag */}
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-dot font-extrabold text-[14px] sm:text-[16px] leading-snug tracking-wide text-fg truncate ${
                        isCompleted ? 'line-through text-dim' : ''
                      }`}>
                        {ex.name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {ex.target && (
                          <span className="text-[10px] font-mono text-acc/80 uppercase font-bold">
                            {ex.target}
                          </span>
                        )}
                        {ex.equipment && (
                          <span className="text-[10px] font-mono text-dim uppercase">
                            · {ex.equipment}
                          </span>
                        )}
                        {ex.isCustom && (
                          <span className="gl-tag !text-[8px] !py-0.2 !px-1.5" style={{ '--fc': 'rgb(var(--c-info))' }}>
                            CUSTOM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pulsante Toggle GIF / Istruzioni */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                      className={`gl-btn !h-8 !px-2.5 !text-xs font-mono gap-1 ${
                        isExpanded ? '!border-acc !text-acc' : 'text-dim hover:text-fg'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isExpanded ? 'Chiudi' : 'Animazione'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                </div>

                {/* Telemetria Parametri di Carico (FMDB Digital Grid) */}
                <div className="p-3 sm:px-5 sm:py-3 bg-bg2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 font-mono text-xs border-b border-sline/40">
                  
                  {/* SERIE */}
                  <div className="gl-param-card p-2.5">
                    <span className="block text-[9.5px] text-dim uppercase tracking-wider">SERIE</span>
                    <span className="font-bold text-fg text-sm sm:text-base font-mono block mt-0.5">
                      {ex.sets || '—'}
                    </span>
                  </div>

                  {/* REPS */}
                  <div className="gl-param-card p-2.5">
                    <span className="block text-[9.5px] text-dim uppercase tracking-wider">REPS</span>
                    <span className="font-bold text-fg text-sm sm:text-base font-mono block mt-0.5">
                      {ex.reps || '—'}
                    </span>
                  </div>

                  {/* CARICO / PESO */}
                  <div className="gl-param-card p-2.5">
                    <span className="block text-[9.5px] text-dim uppercase tracking-wider">CARICO</span>
                    <span className="font-bold text-acc text-sm sm:text-base font-mono block mt-0.5">
                      {ex.weight || 'A sensazione'}
                    </span>
                  </div>

                  {/* RECUPERO (CON AVVIO TIMER A UN TOCCO) */}
                  <div 
                    onClick={() => ex.rest && handleStartRestTimer(ex.rest)}
                    className="gl-param-card p-2.5 cursor-pointer group"
                    title="Clicca per avviare il countdown di recupero"
                  >
                    <div className="flex items-center justify-between text-[9.5px] text-dim uppercase tracking-wider">
                      <span>RECUPERO</span>
                      <Play className="w-2.5 h-2.5 text-acc opacity-0 group-hover:opacity-100 transition-opacity" />
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
                      NOTE PT:
                    </span>
                    <p className="text-fg/90 leading-relaxed font-sans text-xs">
                      {ex.notes}
                    </p>
                  </div>
                )}

                {/* Sezione Espansa: Dimostrazione Biomeccanica Animata (Lazy GIF) */}
                {isExpanded && (
                  <div className="p-4 bg-bg/90 border-t border-sline/80 space-y-3 gl-page-in">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {gifUrl && (
                        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl border border-sline bg-bg2 overflow-hidden flex items-center justify-center p-1.5 shrink-0 shadow-lg">
                          <img
                            src={gifUrl}
                            alt={ex.name}
                            className="w-full h-full object-contain rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 text-xs">
                        <span className="font-mono text-[10.5px] text-acc uppercase font-bold tracking-wider block">
                          Istruzioni e Biomeccanica di Esecuzione
                        </span>
                        <p className="text-fg/90 leading-relaxed font-sans text-xs">
                          {ex.description || 'Esegui il movimento controllando la fase eccentrica e mantenendo costante la respirazione.'}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-dim pt-2 border-t border-sline/50">
                          <span>Target: <strong className="text-acc">{ex.target || 'Muscolo Primario'}</strong></span>
                          <span>Attrezzatura: <strong className="text-info">{ex.equipment || 'Standard'}</strong></span>
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

    </div>
  );
}


