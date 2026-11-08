import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  Save, Eye, Check, AlertCircle, Dumbbell, Calendar, User, FileText, Sparkles,
  RotateCcw, Image as ImageIcon, Link as LinkIcon, ExternalLink, Share2, Copy
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';
import ExerciseSearchModal from '../components/ExerciseSearchModal';
import { saveWorkout, getWorkoutById } from '../services/workoutService';
import { translateTarget, translateEquipment, getExerciseDisplayName, getExerciseDescription } from '../services/exerciseService';

const DRAFT_KEY = 'gymlink_draft';
const RECENT_KEY = 'gymlink_recent_workouts';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function createEmptyDay(index = 1) {
  return {
    id: `day_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: `Giorno ${String.fromCharCode(64 + index)} - Seduta ${index}`,
    exercises: []
  };
}

export default function EditorPage() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();

  const editId = params.id || searchParams.get('id');
  const templateId = searchParams.get('templateId');

  // Stato principale della Scheda
  const [workout, setWorkout] = useState(() => {
    // Se c'è un ID esistente nei recenti, carica quello
    if (editId) {
      try {
        const stored = localStorage.getItem(RECENT_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          const found = list.find((w) => w.id === editId);
          if (found) return found;
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // Se stiamo usando una scheda come template, clona subito la base con nuovo ID
    if (templateId) {
      try {
        const stored = localStorage.getItem(RECENT_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          const found = list.find((w) => w.id === templateId);
          if (found) {
            return {
              ...found,
              id: nanoid(10),
              title: `${found.title || 'Scheda'} (Copia)`,
              clientName: '',
              date: getTodayString(),
              days: Array.isArray(found.days) ? found.days.map((d) => ({
                ...d,
                exercises: Array.isArray(d.exercises) ? d.exercises.map((ex) => ({
                  ...ex,
                  weightHistory: [] // Reset storico pesi per il nuovo atleta
                })) : []
              })) : [createEmptyDay(1)]
            };
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // 3. Altrimenti (Crea Nuova Scheda da Zero):
    // Deve partire sempre da zero! Non ripristinare vecchie schede o bozze precedenti.
    let defaultPtName = '';
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0 && list[0]?.ptName) {
          defaultPtName = list[0].ptName;
        }
      }
    } catch (e) {
      // ignore
    }

    // Rimuove qualsiasi residuo di bozza precedente
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      // ignore
    }

    // Default template iniziale pulito da zero
    return {
      id: nanoid(10),
      title: 'Nuovo Protocollo',
      ptName: defaultPtName,
      clientName: '',
      date: getTodayString(),
      generalNotes: '',
      days: [createEmptyDay(1)]
    };
  });

  // Se c'è un editId o templateId e non era nei recenti locali, caricalo da Supabase Cloud
  useEffect(() => {
    const targetId = editId || templateId;
    if (!targetId) return;
    let isMounted = true;
    (async () => {
      try {
        const remote = await getWorkoutById(targetId);
        if (remote && isMounted) {
          if (templateId) {
            setWorkout({
              ...remote,
              id: nanoid(10),
              title: `${remote.title || 'Scheda'} (Copia)`,
              clientName: '',
              date: getTodayString(),
              days: Array.isArray(remote.days) ? remote.days.map((d) => ({
                ...d,
                exercises: Array.isArray(d.exercises) ? d.exercises.map((ex) => ({
                  ...ex,
                  weightHistory: []
                })) : []
              })) : [createEmptyDay(1)]
            });
          } else {
            setWorkout(remote);
          }
        }
      } catch (err) {
        console.warn('Errore fetch workout remoto:', err);
      }
    })();
    return () => { isMounted = false; };
  }, [editId, templateId]);

  // Sincronizzazione dinamica lingua esercizi nell'editor quando si cambia lingua nella navbar
  useEffect(() => {
    setWorkout((prev) => {
      if (!prev || !Array.isArray(prev.days)) return prev;
      let hasChanges = false;
      const updatedDays = prev.days.map((day) => {
        if (!Array.isArray(day.exercises)) return day;
        const updatedExercises = day.exercises.map((ex) => {
          if (!ex.isCustom && ex.name) {
            const translatedName = getExerciseDisplayName(ex.name, lang);
            const translatedTarget = translateTarget(ex.target, lang);
            const translatedEquip = translateEquipment(ex.equipment, lang);
            const translatedDesc = getExerciseDescription(ex, lang);
            if (
              (translatedName && translatedName !== ex.name) ||
              (translatedTarget && translatedTarget !== ex.target) ||
              (translatedEquip && translatedEquip !== ex.equipment) ||
              (translatedDesc && translatedDesc !== ex.description)
            ) {
              hasChanges = true;
              return {
                ...ex,
                name: translatedName || ex.name,
                target: translatedTarget || ex.target,
                equipment: translatedEquip || ex.equipment,
                description: translatedDesc || ex.description
              };
            }
          }
          return ex;
        });
        return { ...day, exercises: updatedExercises };
      });
      return hasChanges ? { ...prev, days: updatedDays } : prev;
    });
  }, [lang]);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [saveSuccessModal, setSaveSuccessModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const autoSaveTimer = useRef(null);

  // Auto-Save Bozza su localStorage
  useEffect(() => {
    setSaveStatus('saving');
    clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(workout));
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeStr);
        setSaveStatus('saved');
      } catch (e) {
        console.warn('Errore auto-salvataggio bozza', e);
        setSaveStatus('unsaved');
      }
    }, 600);

    return () => clearTimeout(autoSaveTimer.current);
  }, [workout]);

  // Gestione Giornate
  const currentDay = workout.days[activeDayIndex] || workout.days[0];

  const handleAddDay = () => {
    const newDay = createEmptyDay(workout.days.length + 1);
    setWorkout((prev) => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
    setActiveDayIndex(workout.days.length);
  };

  const handleRemoveDay = (index) => {
    if (workout.days.length <= 1) {
      alert('La scheda deve contenere almeno una giornata.');
      return;
    }
    const dayToDelete = workout.days[index];
    if (dayToDelete.exercises.length > 0) {
      const confirm = window.confirm(`Sei sicuro di voler eliminare "${dayToDelete.title}" con ${dayToDelete.exercises.length} esercizi?`);
      if (!confirm) return;
    }

    const updated = workout.days.filter((_, i) => i !== index);
    setWorkout((prev) => ({ ...prev, days: updated }));
    setActiveDayIndex(Math.max(0, index - 1));
  };

  const handleUpdateDayTitle = (title) => {
    setWorkout((prev) => {
      const days = [...prev.days];
      days[activeDayIndex] = { ...days[activeDayIndex], title };
      return { ...prev, days };
    });
  };

  // Gestione Esercizi
  const handleAddExerciseFromDb = (formattedExercise) => {
    setWorkout((prev) => {
      const days = [...prev.days];
      const day = days[activeDayIndex];
      days[activeDayIndex] = {
        ...day,
        exercises: [...day.exercises, formattedExercise]
      };
      return { ...prev, days };
    });
    setExpandedExerciseId(formattedExercise.id);
  };

  const handleAddManualExercise = () => {
    const manualEx = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      sets: '3',
      reps: '10',
      weight: '',
      rest: '90"',
      notes: '',
      gifUrl: '',
      description: '',
      isCustom: true
    };
    setWorkout((prev) => {
      const days = [...prev.days];
      const day = days[activeDayIndex];
      days[activeDayIndex] = {
        ...day,
        exercises: [...day.exercises, manualEx]
      };
      return { ...prev, days };
    });
    setExpandedExerciseId(manualEx.id);
  };

  const handleUpdateExercise = (exerciseId, field, value) => {
    setWorkout((prev) => {
      const days = [...prev.days];
      const day = days[activeDayIndex];
      const exercises = day.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return { ...ex, [field]: value };
        }
        return ex;
      });
      days[activeDayIndex] = { ...day, exercises };
      return { ...prev, days };
    });
  };

  const handleRemoveExercise = (exerciseId) => {
    setWorkout((prev) => {
      const days = [...prev.days];
      const day = days[activeDayIndex];
      const exercises = day.exercises.filter((ex) => ex.id !== exerciseId);
      days[activeDayIndex] = { ...day, exercises };
      return { ...prev, days };
    });
  };

  const handleMoveExercise = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentDay.exercises.length) return;

    setWorkout((prev) => {
      const days = [...prev.days];
      const day = days[activeDayIndex];
      const exercises = [...day.exercises];
      const [moved] = exercises.splice(index, 1);
      exercises.splice(newIndex, 0, moved);
      days[activeDayIndex] = { ...day, exercises };
      return { ...prev, days };
    });
  };

  // Salvataggio Finale Scheda su Supabase Cloud + Cache Locale
  const handleSaveWorkout = async () => {
    if (!workout.title.trim()) {
      alert('Inserisci un titolo per la scheda.');
      return;
    }

    try {
      setIsSavingCloud(true);
      const saved = await saveWorkout(workout);
      setWorkout(saved);
      // Pulisce la bozza locale per evitare residui
      localStorage.removeItem(DRAFT_KEY);
      setSaveSuccessModal(true);
    } catch (e) {
      console.error(e);
      alert('Errore durante il salvataggio sul cloud. Controlla la connessione.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Duplica Scheda: "Usa come Template" (genera nuovo nanoid per un altro cliente)
  const handleDuplicateWorkout = async () => {
    const newId = nanoid(10);
    const duplicated = {
      ...workout,
      id: newId,
      clientName: '',
      date: getTodayString()
    };
    try {
      setIsSavingCloud(true);
      const saved = await saveWorkout(duplicated);
      setWorkout(saved);
      navigate(`/edit/${saved.id}`, { replace: true });
      setSaveSuccessModal(true);
    } catch (e) {
      console.error(e);
      alert('Errore durante la duplicazione.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleResetDraft = () => {
    const ok = window.confirm('Vuoi cancellare la bozza corrente e ricominciare da zero?');
    if (!ok) return;
    localStorage.removeItem(DRAFT_KEY);
    setWorkout({
      id: `wk_${nanoid(10)}`,
      title: 'Nuovo Protocollo',
      ptName: '',
      clientName: '',
      date: getTodayString(),
      generalNotes: '',
      days: [createEmptyDay(1)]
    });
    setActiveDayIndex(0);
  };

  const totalExercises = workout.days.reduce((acc, d) => acc + d.exercises.length, 0);

  return (
    <div className="gl-page-in max-w-[1100px] mx-auto px-4 pt-4 pb-16 space-y-6">

      {/* Barra Superiore: Navigazione, Titolo & Stato Salvataggio */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="gl-btn !h-8 !px-2.5 !rounded-lg text-dim hover:text-acc font-mono text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('btnBackHome')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-dot font-black text-lg text-fg tracking-wide">{t('editorBadge')}</span>
          </div>
        </div>

        {/* Indicatori di Stato & Pulsanti d'Azione */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-dim flex items-center gap-1.5 mr-2">
            {saveStatus === 'saving' ? (
              <span className="text-warn animate-pulse">Salvataggio bozza...</span>
            ) : saveStatus === 'saved' ? (
              <span className="text-acc flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Bozza salvata {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
              </span>
            ) : (
              <span className="text-dim">Modifiche non salvate</span>
            )}
          </span>

          <button
            type="button"
            onClick={handleResetDraft}
            className="gl-btn !h-8 !px-2.5 !rounded-lg text-dim hover:text-danger font-mono text-[11px] tracking-wider uppercase inline-flex items-center gap-1"
            title="Azzera e ricomincia"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Azzera</span>
          </button>

          <button
            type="button"
            onClick={handleSaveWorkout}
            className="gl-btn-primary !h-8 !px-4 !rounded-lg !text-[11px]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t('btnSaveWorkout')}</span>
          </button>
        </div>
      </div>

      {/* SEZIONE 1: INTESTAZIONE PROTOCOLLO */}
      <section className="gl-panel p-5 sm:p-6 space-y-4 gl-rise">
        <div className="flex items-center gap-2 border-b border-sline/70 pb-3">
          <FileText className="w-4 h-4 text-acc" />
          <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg uppercase">
            1. Intestazione & Dati Protocollo
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Titolo Scheda */}
          <div className="sm:col-span-2">
            <label className="gl-label">Titolo Scheda / Protocollo *</label>
            <input
              type="text"
              required
              placeholder="es. Ipertrofia Push-Pull-Legs Mesociclo 1"
              value={workout.title}
              onChange={(e) => setWorkout({ ...workout, title: e.target.value })}
              className="gl-input font-medium"
            />
          </div>

          {/* Nome PT */}
          <div>
            <label className="gl-label">Nome Personal Trainer</label>
            <input
              type="text"
              placeholder="es. Marco Verdi"
              value={workout.ptName}
              onChange={(e) => setWorkout({ ...workout, ptName: e.target.value })}
              className="gl-input"
            />
          </div>

          {/* Nome Cliente */}
          <div>
            <label className="gl-label">Nome Cliente / Atleta</label>
            <input
              type="text"
              placeholder="es. Andrea Neri"
              value={workout.clientName}
              onChange={(e) => setWorkout({ ...workout, clientName: e.target.value })}
              className="gl-input"
            />
          </div>

          {/* Data Scheda */}
          <div>
            <label className="gl-label">Data Creazione / Revisione</label>
            <input
              type="date"
              value={workout.date}
              onChange={(e) => setWorkout({ ...workout, date: e.target.value })}
              className="gl-input font-mono !text-xs"
            />
          </div>

          {/* Note Generali Protocollo */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="gl-label">Note Generali (Riscaldamento, Idratazione, Scarico)</label>
            <textarea
              rows={2}
              placeholder="Raccomandazioni per l'atleta, minuti di warm-up prima delle sedute o note sul RPE..."
              value={workout.generalNotes}
              onChange={(e) => setWorkout({ ...workout, generalNotes: e.target.value })}
              className="gl-input"
            />
          </div>

        </div>
      </section>

      {/* SEZIONE 2: GESTIONE SPLIT GIORNATE */}
      <section className="gl-panel p-5 sm:p-6 space-y-4 gl-rise">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sline/70 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-acc" />
            <h2 className="font-dot font-extrabold text-[16px] tracking-wide text-fg uppercase">
              2. Struttura Giornate ({workout.days.length} Split)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-dim">
            Totale Esercizi nella Scheda: <strong className="text-acc">{totalExercises}</strong>
          </span>
        </div>

        {/* Tab Giornate */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {workout.days.map((day, idx) => {
            const isActive = idx === activeDayIndex;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveDayIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all whitespace-nowrap ${isActive
                  ? 'border-acc bg-acc/15 text-acc font-bold shadow-[0_0_15px_-4px_var(--glow)]'
                  : 'border-sline bg-bg2 text-dim hover:text-fg hover:border-line2'
                  }`}
              >
                <span>{`Giorno ${idx + 1}`}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9.5px] ${isActive ? 'bg-acc/20 text-acc' : 'bg-bg text-dim'}`}>
                  {day.exercises.length}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleAddDay}
            className="gl-btn !h-[33px] !px-3 !rounded-lg text-acc border-acc/40 hover:border-acc font-mono text-xs whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi Giorno</span>
          </button>
        </div>

        {/* Intestazione Seduta Attiva */}
        <div className="p-4 rounded-xl border border-sline bg-bg2/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-1">
            <label className="gl-label">Titolo della Seduta Corrente</label>
            <input
              type="text"
              value={currentDay.title}
              onChange={(e) => handleUpdateDayTitle(e.target.value)}
              placeholder="es. Giorno A - Push (Petto, Spalle, Tricipiti)"
              className="gl-input font-bold text-fg font-mono !text-sm"
            />
          </div>

          <div className="flex items-center gap-2 sm:self-end">
            <button
              type="button"
              onClick={() => handleRemoveDay(activeDayIndex)}
              className="gl-btn !h-10 !px-3 !rounded-lg text-dim hover:text-danger hover:border-danger/50 text-xs font-mono inline-flex items-center gap-1.5"
              title="Elimina questa giornata"
            >
              <Trash2 className="w-4 h-4 text-danger/80" />
              <span>Elimina Giorno</span>
            </button>
          </div>
        </div>

        {/* BARRA AZIONI: AGGIUNGI ESERCIZIO */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-dot font-bold text-xs uppercase text-dim">Esercizi ({currentDay.exercises.length})</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddManualExercise}
              className="gl-btn !h-8 !px-3 !rounded-lg text-dim hover:text-fg font-mono text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-acc" />
              <span>+ Nuovo Esercizio Manuale</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="gl-btn-primary !h-8 !px-3.5 !rounded-lg !text-xs inline-flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cerca nel Database Esercizi</span>
            </button>
          </div>
        </div>

        {/* LISTA ESERCIZI DELLA GIORNATA */}
        <div className="space-y-3 pt-2">
          {currentDay.exercises.length === 0 ? (
            <div className="px-6 py-12 text-center border border-dashed border-sline rounded-xl bg-bg/40 space-y-3">
              <Dumbbell className="w-8 h-8 mx-auto text-dim opacity-40 -rotate-45" />
              <p className="font-dot font-extrabold text-[15px] text-fg tracking-wide">
                Nessun esercizio presente in questa giornata.
              </p>
              <p className="text-xs text-dim max-w-md mx-auto">
                Usa <strong>"Cerca nel Database Esercizi"</strong> per selezionare tra oltre 1300 movimenti con animazioni, oppure clicca su <strong>"+ Nuovo Esercizio Manuale"</strong> per inserire una riga libera.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="gl-btn-primary !h-8 !px-4 !text-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Apri Database</span>
                </button>
              </div>
            </div>
          ) : (
            currentDay.exercises.map((ex, index) => {
              const isExpanded = expandedExerciseId === ex.id;

              return (
                <div
                  key={ex.id}
                  className="gl-exercise-card rounded-xl overflow-hidden"
                >
                  {/* Riga Principale Esercizio: Header con Titolo, Thumbnail e Azioni */}
                  <div className="p-3 sm:p-3.5 bg-acc/[0.10] border-b border-line flex items-center justify-between gap-3">

                    {/* Sinistra: #, Thumbnail Statica, Nome Esercizio e Meta */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold text-acc w-6 text-center shrink-0">
                        #{index + 1}
                      </span>

                      {/* Thumbnail statica se disponibile */}
                      {ex.imageUrl || ex.gifUrl ? (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-sline bg-bg2 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                          <img
                            src={ex.imageUrl || ex.gifUrl}
                            alt={ex.name}
                            className="w-full h-full object-contain rounded"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-sline/70 bg-bg2/80 shrink-0 flex items-center justify-center text-dim/60">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                      )}

                      {/* Nome Esercizio: Input prominente e leggibile al 100% */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          required
                          value={ex.name}
                          onChange={(e) => handleUpdateExercise(ex.id, 'name', e.target.value)}
                          placeholder="Nome Esercizio (es. Panca Piana Bilanciere)"
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-sline focus:border-acc font-dot font-extrabold text-[14px] sm:text-[15px] text-fg focus:outline-none py-0.5 px-1 transition-colors"
                        />
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {ex.target && (
                            <span className="text-[10px] font-mono text-acc/80 uppercase">
                              {translateTarget(ex.target, lang)}
                            </span>
                          )}
                          {ex.equipment && (
                            <span className="text-[10px] font-mono text-dim uppercase">
                              · {translateEquipment(ex.equipment, lang)}
                            </span>
                          )}
                          {ex.gifUrl && (
                            <span className="gl-tag !text-[8.5px] !py-0.2 !px-1.5 shrink-0">
                              GIF
                            </span>
                          )}
                          {ex.isCustom && (
                            <span className="gl-tag !text-[8.5px] !py-0.2 !px-1.5 shrink-0" style={{ '--fc': 'rgb(var(--c-info))' }}>
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Destra: Frecce Ordine, Dettaglio & Rimuovi */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveExercise(index, 'up')}
                        className="p-1.5 rounded-lg text-dim hover:text-fg hover:bg-sline/40 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                        title="Sposta Su"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === currentDay.exercises.length - 1}
                        onClick={() => handleMoveExercise(index, 'down')}
                        className="p-1.5 rounded-lg text-dim hover:text-fg hover:bg-sline/40 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                        title="Sposta Giù"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                        className={`gl-btn !h-7 !px-2.5 !text-[11px] gap-1 ${isExpanded ? '!border-acc !text-acc' : ''}`}
                        title="Dettagli e Note"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isExpanded ? 'Chiudi' : 'Dettagli'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-1.5 rounded-lg text-dim hover:text-danger hover:bg-danger/10 transition-colors ml-0.5"
                        title="Rimuovi Esercizio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Riga Parametri Tecnici: Telemetria Serie, Reps, Peso, Recupero */}
                  <div className="p-3 sm:px-4 sm:py-2.5 bg-bg2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 font-mono">
                    <div>
                      <span className="block text-[9.5px] text-dim uppercase tracking-wider mb-1">SERIE</span>
                      <input
                        type="text"
                        value={ex.sets}
                        onChange={(e) => handleUpdateExercise(ex.id, 'sets', e.target.value)}
                        placeholder="4"
                        className="gl-param-input !text-xs font-bold"
                      />
                    </div>

                    <div>
                      <span className="block text-[9.5px] text-dim uppercase tracking-wider mb-1">REPS</span>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleUpdateExercise(ex.id, 'reps', e.target.value)}
                        placeholder="8-10"
                        className="gl-param-input !text-xs"
                      />
                    </div>

                    <div>
                      <span className="block text-[9.5px] text-dim uppercase tracking-wider mb-1">PESO / CARICO</span>
                      <input
                        type="text"
                        value={ex.weight}
                        onChange={(e) => handleUpdateExercise(ex.id, 'weight', e.target.value)}
                        placeholder="70 kg"
                        className="gl-param-input !text-xs"
                      />
                    </div>

                    <div>
                      <span className="block text-[9.5px] text-dim uppercase tracking-wider mb-1">RECUPERO</span>
                      <input
                        type="text"
                        value={ex.rest}
                        onChange={(e) => handleUpdateExercise(ex.id, 'rest', e.target.value)}
                        placeholder="90&quot;"
                        className="gl-param-input !text-xs"
                      />
                    </div>
                  </div>

                  {/* Sezione Espandibile: Note PT, Descrizione & Gestione GIF */}
                  {isExpanded && (
                    <div className="p-4 bg-bg/80 border-t border-sline/70 space-y-4 gl-page-in">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        {/* Sinistra: Note PT & Descrizione */}
                        <div className="md:col-span-8 space-y-3">
                          <div>
                            <label className="gl-label">Note Specifiche del PT per l'Esercizio</label>
                            <input
                              type="text"
                              value={ex.notes || ''}
                              onChange={(e) => handleUpdateExercise(ex.id, 'notes', e.target.value)}
                              placeholder="es. Fermo al petto 1s, focus su allungamento gran pettorale, discesa in 3s..."
                              className="gl-input font-sans text-xs"
                            />
                          </div>

                          <div>
                            <label className="gl-label">Descrizione / Istruzioni Tecniche di Esecuzione</label>
                            <textarea
                              rows={3}
                              value={ex.description || ''}
                              onChange={(e) => handleUpdateExercise(ex.id, 'description', e.target.value)}
                              placeholder="Descrivi la corretta postura e la traiettoria di movimento..."
                              className="gl-input font-sans text-xs"
                            />
                          </div>
                        </div>

                        {/* Destra: Gestione GIF e Media */}
                        <div className="md:col-span-4 space-y-2.5">
                          <label className="gl-label">Media / GIF Animata</label>

                          {ex.gifUrl ? (
                            <div className="space-y-2">
                              <div className="relative w-full h-[130px] rounded-lg border border-sline bg-bg2 overflow-hidden flex items-center justify-center p-1">
                                <img
                                  src={ex.gifUrl}
                                  alt={ex.name}
                                  className="w-full h-full object-contain rounded"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-mono text-dim">
                                <span>{ex.gifUrl.includes('hasaneyldrm') ? '© Gym visual' : 'Custom URL'}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateExercise(ex.id, 'gifUrl', '')}
                                  className="text-danger hover:underline"
                                >
                                  Rimuovi GIF
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg border border-dashed border-sline text-center space-y-2 bg-bg2/40">
                              <ImageIcon className="w-5 h-5 mx-auto text-dim opacity-40" />
                              <p className="text-[11px] text-dim">Nessuna GIF o immagine associata.</p>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <LinkIcon className="w-3 h-3 text-dim" />
                              <span className="text-[10px] font-mono text-dim uppercase">URL GIF Custom</span>
                            </div>
                            <input
                              type="text"
                              value={ex.gifUrl || ''}
                              onChange={(e) => handleUpdateExercise(ex.id, 'gifUrl', e.target.value)}
                              placeholder="Incolla link diretto (https://...gif)"
                              className="gl-input !h-8 !px-2.5 font-mono !text-[11px]"
                            />
                          </div>

                        </div>

                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </section>

      {/* Pulsante Salvataggio Inferiore */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-xs font-mono text-dim">
          ID Scheda: <strong className="text-acc">{workout.id}</strong>
        </span>
        <button
          type="button"
          onClick={handleSaveWorkout}
          className="gl-btn-primary"
        >
          <Save className="w-4 h-4" />
          <span>{t('btnSaveWorkout')}</span>
        </button>
      </div>

      {/* Modal Ricerca Esercizi */}
      <ExerciseSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExercise={handleAddExerciseFromDb}
      />

      {/* Modal Successo Salvataggio (Portal Centrato a Tutto Schermo) */}
      <Modal
        isOpen={saveSuccessModal}
        onClose={() => setSaveSuccessModal(false)}
        variant="center"
        maxWidth="max-w-md"
        title={t('saveSuccessTitle')}
        subtitle={t('saveSuccessDesc')}
        icon={<Check className="w-6 h-6 stroke-[2.5]" />}
      >
        <div className="space-y-4">
          {/* Link Box diretto da copiare */}
          <div className="p-3 rounded-xl border border-acc/40 bg-bg2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-dim">
              <span>LINK PRIVATO DEL CLIENTE:</span>
              <span className="text-acc font-bold">SOLA LETTURA</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/w/${workout.id}`}
                className="gl-input !h-9 font-mono text-xs text-acc selection:bg-acc/30 flex-1 truncate"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => {
                  const fullUrl = `${window.location.origin}/w/${workout.id}`;
                  navigator.clipboard.writeText(fullUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="gl-btn !h-9 !px-3 !text-xs font-mono font-bold shrink-0 hover:!border-acc hover:!text-acc"
                title="Copia link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-acc" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <p className="text-[10px] font-mono text-dim/90 bg-bg/60 p-2 rounded-lg border border-sline/50 leading-relaxed">
              🔒 <strong>Nota:</strong> {t('warningPersonalLink')}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-sline bg-bg2/60 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-dim">
              <span>TITOLO:</span>
              <span className="text-fg font-bold truncate max-w-[200px]">{workout.title}</span>
            </div>
            <div className="flex justify-between text-dim">
              <span>ID UNIVOCO:</span>
              <span className="text-acc font-bold">{workout.id}</span>
            </div>
            <div className="flex justify-between text-dim">
              <span>DESTINATARIO:</span>
              <span className="text-fg">{workout.clientName || 'Atleta'}</span>
            </div>
            <div className="flex justify-between text-dim">
              <span>ESERCIZI:</span>
              <span className="text-acc font-bold">{totalExercises}</span>
            </div>
          </div>

          {/* Azioni Condivisione & Navigazione */}
          <div className="space-y-2 pt-2">
            {/* Tasto Primario WhatsApp */}
            <button
              type="button"
              onClick={() => {
                const title = workout.title || 'Scheda di Allenamento';
                const pt = workout.ptName ? ` preparata da ${workout.ptName}` : '';
                const client = workout.clientName ? `Ciao ${workout.clientName}! ` : '';
                const fullUrl = `${window.location.origin}/w/${workout.id}`;
                const text = encodeURIComponent(
                  `${client}Ecco la tua nuova scheda di allenamento "${title}"${pt}:\n${fullUrl}\n\n🔒 Nota: questo link è strettamente personale, conservalo e non condividerlo con altri per evitare modifiche ai tuoi dati di allenamento.`
                );
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="gl-btn-primary w-full justify-center !h-10 text-xs font-mono font-bold gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Condividi su WhatsApp</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/w/${workout.id}`, { state: { fromPt: true } })}
                className="gl-btn flex-1 justify-center text-xs !h-9 font-mono"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('btnViewAsClient')}</span>
              </button>
              <button
                type="button"
                onClick={() => setSaveSuccessModal(false)}
                className="gl-btn flex-1 justify-center text-xs !h-9 font-mono"
              >
                {t('btnContinueEditing')}
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}

