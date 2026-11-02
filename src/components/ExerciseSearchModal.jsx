import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Loader2, Dumbbell, Eye, Plus, Check, Globe, Layers, Filter, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchExercises,
  searchExercises,
  getExerciseMediaUrl,
  getExerciseImageUrl,
  getExerciseDescription,
  translateTarget,
  translateEquipment
} from '../services/exerciseService';
import Modal from './Modal';

export default function ExerciseSearchModal({ isOpen, onClose, onSelectExercise }) {
  const { lang: globalLang } = useLanguage();
  const [modalLang, setModalLang] = useState(globalLang || 'it');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtri categorici contemporanei
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [previewExercise, setPreviewExercise] = useState(null);

  // Paginazione progressiva per fluidità a 60fps
  const [visibleCount, setVisibleCount] = useState(60);

  // Allinea lingua modale a quella globale se cambia
  useEffect(() => {
    setModalLang(globalLang);
  }, [globalLang]);

  // Carica il dataset all'apertura se non in cache
  useEffect(() => {
    if (isOpen && exercises.length === 0) {
      setLoading(true);
      fetchExercises()
        .then((data) => {
          setExercises(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, exercises.length]);

  // Reset del contatore visibile quando cambiano i filtri o la query
  useEffect(() => {
    setVisibleCount(60);
  }, [searchQuery, selectedMuscle, selectedEquipment]);

  // Macro-Zone e Target Muscolari
  const muscleFilters = useMemo(() => [
    { id: 'all', label: modalLang === 'it' ? 'Tutti i Muscoli' : modalLang === 'es' ? 'Todos los Músculos' : 'All Muscles' },
    { id: 'chest', label: modalLang === 'it' ? 'Petto' : modalLang === 'es' ? 'Pecho' : 'Chest' },
    { id: 'back', label: modalLang === 'it' ? 'Dorso / Schiena' : modalLang === 'es' ? 'Espalda' : 'Back' },
    { id: 'shoulders', label: modalLang === 'it' ? 'Spalle' : modalLang === 'es' ? 'Hombros' : 'Shoulders' },
    { id: 'biceps', label: modalLang === 'it' ? 'Bicipiti' : modalLang === 'es' ? 'Bíceps' : 'Biceps' },
    { id: 'triceps', label: modalLang === 'it' ? 'Tricipiti' : modalLang === 'es' ? 'Tríceps' : 'Triceps' },
    { id: 'upper legs', label: modalLang === 'it' ? 'Gambe (Quadricipiti)' : modalLang === 'es' ? 'Piernas (Cuádriceps)' : 'Upper Legs' },
    { id: 'glutes', label: modalLang === 'it' ? 'Glutei / Femorali' : modalLang === 'es' ? 'Glúteos / Femorales' : 'Glutes' },
    { id: 'waist', label: modalLang === 'it' ? 'Addome / Core' : modalLang === 'es' ? 'Abdomen' : 'Abs / Waist' },
    { id: 'lower legs', label: modalLang === 'it' ? 'Polpacci' : modalLang === 'es' ? 'Gemelos' : 'Calves' },
    { id: 'cardio', label: 'Cardio' }
  ], [modalLang]);

  // Filtri Attrezzatura
  const equipmentFilters = useMemo(() => [
    { id: 'all', label: modalLang === 'it' ? 'Tutti gli Attrezzi' : modalLang === 'es' ? 'Cualquier Equipo' : 'All Equipment' },
    { id: 'barbell', label: modalLang === 'it' ? 'Bilanciere' : modalLang === 'es' ? 'Barra' : 'Barbell' },
    { id: 'dumbbell', label: modalLang === 'it' ? 'Manubri' : modalLang === 'es' ? 'Mancuernas' : 'Dumbbell' },
    { id: 'cable', label: modalLang === 'it' ? 'Cavi' : modalLang === 'es' ? 'Poleas' : 'Cable' },
    { id: 'body weight', label: modalLang === 'it' ? 'Corpo Libero' : modalLang === 'es' ? 'Peso Corporal' : 'Bodyweight' },
    { id: 'machine', label: modalLang === 'it' ? 'Macchinari / Smith' : modalLang === 'es' ? 'Máquinas' : 'Machines' },
    { id: 'band', label: modalLang === 'it' ? 'Elastici' : modalLang === 'es' ? 'Bandas' : 'Resistance Bands' },
    { id: 'kettlebell', label: 'Kettlebell' }
  ], [modalLang]);

  // Filtraggio avanzato multi-criterio (senza limiti arbitrari!)
  const filteredResults = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];

    let list = exercises;

    // Filtro per muscolo
    if (selectedMuscle !== 'all') {
      list = list.filter((ex) => {
        const bp = (ex.body_part || '').toLowerCase();
        const tg = (ex.target || '').toLowerCase();
        const mg = (ex.muscle_group || '').toLowerCase();
        if (selectedMuscle === 'chest') return bp === 'chest' || tg === 'pectorals';
        if (selectedMuscle === 'back') return bp === 'back' || tg === 'lats' || tg === 'upper back';
        if (selectedMuscle === 'shoulders') return bp === 'shoulders' || tg === 'delts';
        if (selectedMuscle === 'biceps') return tg === 'biceps' || mg === 'biceps';
        if (selectedMuscle === 'triceps') return tg === 'triceps' || mg === 'triceps';
        if (selectedMuscle === 'glutes') return tg === 'glutes' || tg === 'hamstrings';
        if (selectedMuscle === 'upper legs') return bp === 'upper legs' || tg === 'quads' || tg === 'hamstrings';
        if (selectedMuscle === 'lower legs') return bp === 'lower legs' || tg === 'calves';
        if (selectedMuscle === 'waist') return bp === 'waist' || tg === 'abs';
        if (selectedMuscle === 'cardio') return bp === 'cardio' || tg === 'cardiovascular system';
        return bp === selectedMuscle || tg === selectedMuscle;
      });
    }

    // Filtro per attrezzatura
    if (selectedEquipment !== 'all') {
      list = list.filter((ex) => {
        const eq = (ex.equipment || '').toLowerCase();
        if (selectedEquipment === 'machine') {
          return eq.includes('machine') || eq.includes('smith') || eq.includes('leverage');
        }
        if (selectedEquipment === 'band') {
          return eq.includes('band');
        }
        return eq === selectedEquipment;
      });
    }

    // Ricerca testuale con sinonimi (senza troncamento forzato a 45)
    return searchExercises(list, searchQuery, modalLang, null);
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment, modalLang]);

  const displayedResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

  const handleSelect = (exercise) => {
    const formatted = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      exerciseDbId: exercise.id,
      name: exercise.name,
      sets: '3',
      reps: '10',
      weight: '',
      rest: '90"',
      notes: '',
      gifUrl: getExerciseMediaUrl(exercise.gif_url),
      imageUrl: getExerciseImageUrl(exercise.image),
      description: getExerciseDescription(exercise, modalLang),
      target: translateTarget(exercise.target, modalLang),
      equipment: translateEquipment(exercise.equipment, modalLang),
      isCustom: false
    };
    onSelectExercise(formatted);
    onClose();
    setSearchQuery('');
    setPreviewExercise(null);
  };

  const handleResetFilters = () => {
    setSelectedMuscle('all');
    setSelectedEquipment('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedMuscle !== 'all' || selectedEquipment !== 'all' || searchQuery.trim() !== '';

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-5xl"
      variant="anchored"
      customScroll={true}
      icon={<Dumbbell className="w-4 h-4" />}
      title="DATABASE ESERCIZI"
      subtitle="1300+ Esercizi con immagini e video biomeccanici"
      closeLabel="Chiudi"
    >
      <div className="flex flex-col h-full overflow-hidden">

        {/* PARTE SUPERIORE FISSA (NON SCORRE MAI VIA) */}
        <div className="shrink-0 space-y-2 pb-2.5 border-b border-sline/70">

          {/* Riga 1: Barra di Ricerca & Selettore Lingua Modale */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim group-focus-within:text-acc transition-colors pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Cerca esercizio (es. panca, squat, petto, curl)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="gl-input !pl-9 font-mono !text-xs !h-8 sm:!h-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-fg p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selettore Lingua Modale */}
            <div className="flex items-center bg-bg2 border border-sline rounded-lg p-0.5 shrink-0">
              <Globe className="w-3 h-3 text-dim ml-1.5 mr-1" />
              {['it', 'en', 'es'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setModalLang(l)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold uppercase transition-all ${modalLang === l
                      ? 'bg-acc text-ink'
                      : 'text-dim hover:text-fg'
                    }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Riga 2: Filtri Zona Muscolare (Compatto con Label integrata) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] sm:text-[11px] font-mono scrollbar-none">
            <span className="text-acc font-bold uppercase shrink-0 text-[10px] flex items-center gap-1 mr-0.5">
              <Filter className="w-2.5 h-2.5" />
              <span>Muscolo:</span>
            </span>
            {muscleFilters.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedMuscle(cat.id)}
                className={`px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border whitespace-nowrap transition-colors ${selectedMuscle === cat.id
                    ? 'border-acc bg-acc/15 text-acc font-bold shadow-[0_0_12px_-4px_var(--glow)]'
                    : 'border-sline bg-bg2 text-dim hover:text-fg hover:border-line2'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Riga 3: Filtri Attrezzatura (Compatto con Label integrata) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] sm:text-[11px] font-mono scrollbar-none">
            <span className="text-info font-bold uppercase shrink-0 text-[10px] flex items-center gap-1 mr-0.5">
              <Layers className="w-2.5 h-2.5" />
              <span>Attrezzo:</span>
            </span>
            {equipmentFilters.map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => setSelectedEquipment(eq.id)}
                className={`px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border whitespace-nowrap transition-colors ${selectedEquipment === eq.id
                    ? 'border-info bg-info/15 text-info font-bold shadow-[0_0_12px_-4px_rgba(56,189,248,0.3)]'
                    : 'border-sline bg-bg2 text-dim hover:text-fg hover:border-line2'
                  }`}
              >
                {eq.label}
              </button>
            ))}
          </div>

          {/* Riga 4: Barra di Stato & Contatore */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono pt-0.5">
            <span className="text-dim">
              Trovati <strong className="text-acc">{filteredResults.length}</strong> esercizi disponibili
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[10px] sm:text-[11px] text-danger hover:underline inline-flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Resetta Filtri</span>
              </button>
            )}
          </div>

        </div>

        {/* LISTA RISULTATI (L'UNICO ELEMENTO CHE SCORRE) */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pt-2.5 pb-8">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-7 h-7 mx-auto animate-spin text-acc" />
              <p className="text-xs font-mono text-dim">Caricamento 1300+ esercizi dal database...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Dumbbell className="w-7 h-7 mx-auto text-dim opacity-40 -rotate-45" />
              <p className="text-xs font-mono text-fg">Nessun esercizio trovato per questi criteri.</p>
              <p className="text-[11px] text-dim max-w-sm mx-auto">
                Prova a combinare muscolo/attrezzo diversamente, oppure inserisci un esercizio personalizzato con il pulsante <strong>"+ Nuovo Esercizio Manuale"</strong> nell'editor.
              </p>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="gl-btn !h-8 !px-3 !text-xs !text-acc !border-acc/40"
                  >
                    Resetta Filtri
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {displayedResults.map((ex) => {
                const staticImgUrl = getExerciseImageUrl(ex.image);
                const gifUrl = getExerciseMediaUrl(ex.gif_url);
                const isPreviewing = previewExercise?.id === ex.id;
                const targetName = translateTarget(ex.target, modalLang);
                const equipName = translateEquipment(ex.equipment, modalLang);

                return (
                  <div
                    key={ex.id}
                    className="rounded-xl border border-sline bg-bg2/90 hover:border-acc/50 transition-all overflow-hidden"
                  >
                    <div className="p-2 sm:p-3 flex items-center justify-between gap-2.5 sm:gap-3">

                      {/* 1. Miniatura Statica Leggera (Dimensione fissa blindata su mobile e desktop) */}
                      <div
                        onClick={() => setPreviewExercise(isPreviewing ? null : ex)}
                        className="w-12 h-12 sm:w-14 sm:h-14 min-w-[48px] sm:min-w-[56px] max-w-[48px] sm:max-w-[56px] min-h-[48px] sm:min-h-[56px] max-h-[48px] sm:max-h-[56px] rounded-lg border border-sline bg-bg shrink-0 overflow-hidden cursor-pointer hover:border-acc transition-colors p-0.5 flex items-center justify-center relative group"
                        title="Clicca per ingrandire animazione"
                      >
                        {staticImgUrl ? (
                          <img
                            src={staticImgUrl}
                            alt={ex.name}
                            className="w-full h-full object-contain rounded"
                            loading="lazy"
                          />
                        ) : (
                          <Dumbbell className="w-4 h-4 text-dim opacity-40" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                          <Eye className="w-3.5 h-3.5 text-acc" />
                        </div>
                      </div>

                      {/* 2. Dettagli Esercizio */}
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm font-bold text-fg capitalize truncate block max-w-full">
                            {ex.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {targetName && (
                            <span className="gl-tag !text-[8px] sm:!text-[8.5px] !py-0.2 !px-1.5" style={{ '--fc': 'rgb(var(--c-acc))' }}>
                              {targetName}
                            </span>
                          )}
                          {equipName && (
                            <span className="gl-tag !text-[8px] sm:!text-[8.5px] !py-0.2 !px-1.5" style={{ '--fc': 'rgb(var(--c-info))' }}>
                              {equipName}
                            </span>
                          )}
                        </div>

                        <p className="hidden sm:block text-[11px] text-dim line-clamp-1 mt-0.5">
                          {getExerciseDescription(ex, modalLang)}
                        </p>
                      </div>

                      {/* 3. Azioni Rapide */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {gifUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewExercise(isPreviewing ? null : ex)}
                            className={`gl-btn !h-7 sm:!h-8 !px-2 !text-[11px] !font-mono gap-1 ${isPreviewing ? '!border-acc !text-acc' : 'text-dim hover:text-fg'
                              }`}
                            title="Anteprima GIF"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">GIF</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelect(ex)}
                          className="gl-btn-primary !h-7 sm:!h-8 !px-2.5 sm:!px-3.5 !text-[11px] sm:!text-xs font-mono gap-1"
                        >
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Aggiungi</span>
                        </button>
                      </div>
                    </div>

                    {/* Preview Espansa con GIF e Spiegazione Biomeccanica */}
                    {isPreviewing && (
                      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-bg/85 border-t border-sline/70 flex flex-col md:flex-row items-center gap-3 sm:gap-4 gl-page-in">
                        {gifUrl && (
                          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg border border-sline bg-bg2 overflow-hidden flex items-center justify-center p-1 shrink-0">
                            <img
                              src={gifUrl}
                              alt={ex.name}
                              className="w-full h-full object-contain rounded"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5 text-xs text-center md:text-left">
                          <span className="text-[10px] font-mono uppercase text-dim block">Istruzioni Biomeccaniche</span>
                          <p className="text-fg/90 leading-relaxed font-sans text-xs">
                            {getExerciseDescription(ex, modalLang) || 'Nessuna istruzione aggiuntiva disponibile.'}
                          </p>
                          <div className="flex items-center justify-center md:justify-start gap-3 text-[10.5px] font-mono text-dim pt-1 border-t border-sline/50">
                            <span>Target: <strong className="text-acc">{targetName}</strong></span>
                            <span>Attrezzo: <strong className="text-info">{equipName}</strong></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pulsante Carica Altri Esercizi */}
              {filteredResults.length > visibleCount && (
                <div className="pt-2 pb-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 60)}
                    className="gl-btn !h-9 !px-6 text-xs font-mono !border-acc/40 hover:!border-acc hover:!bg-acc/10 text-acc transition-all"
                  >
                    Mostra altri 60 esercizi ({displayedResults.length} di {filteredResults.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </Modal>
  );
}
