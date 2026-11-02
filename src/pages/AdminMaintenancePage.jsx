import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldAlert, Lock, Trash2, RefreshCw, Filter, Search, Calendar, 
  Dumbbell, Eye, CheckCircle2, AlertTriangle, Download, Upload, ArrowUpDown, ChevronRight, X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { deleteWorkout, restoreWorkoutsFromBackup } from '../services/workoutService';

export default function AdminMaintenancePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('gl_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Stato per Ripristino / Importazione da Backup
  const fileInputRef = useRef(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatusMsg, setRestoreStatusMsg] = useState('');

  // Filtri manuali
  const [filterText, setFilterText] = useState('');
  const [filterExerciseOp, setFilterExerciseOp] = useState('all'); // 'all', 'lte_1', 'lte_2', 'gte_5'
  const [filterExerciseCount, setFilterExerciseCount] = useState('');
  const [filterAgeDays, setFilterAgeDays] = useState('all'); // 'all', '15', '30', '90', '180'
  const [filterViews, setFilterViews] = useState('all'); // 'all', 'zero', 'lt_5'

  // Verifica password da env o default
  const handleLogin = (e) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_KEY || 'gymlink_admin_2026';
    if (pinInput.trim() === expected) {
      sessionStorage.setItem('gl_admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('PIN o Chiave di Manutenzione non valida.');
    }
  };

  // Caricamento elenco completo schede da Supabase
  const loadAllWorkouts = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const enriched = data.map((row) => {
          const w = row.data || {};
          let exCount = 0;
          if (Array.isArray(w.days)) {
            w.days.forEach((d) => {
              if (Array.isArray(d?.exercises)) {
                exCount += d.exercises.length;
              }
            });
          }

          const createdDate = new Date(row.created_at || Date.now());
          const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: row.id,
            title: w.title || 'Senza titolo',
            ptName: w.ptName || '—',
            clientName: w.clientName || '—',
            date: w.date || row.created_at?.split('T')[0] || '—',
            createdAt: row.created_at,
            ageInDays,
            daysCount: Array.isArray(w.days) ? w.days.length : 0,
            exerciseCount: exCount,
            viewsCount: row.views_count || 0,
            raw: w
          };
        });
        setWorkouts(enriched);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error('Errore fetch manutenzione:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllWorkouts();
    }
  }, [isAuthenticated]);

  // Applicazione filtri manuali componibili
  const filteredWorkouts = useMemo(() => {
    return workouts.filter((item) => {
      // 1. Filtro testo (cerca in titolo, ID, PT, atleta)
      if (filterText.trim()) {
        const q = filterText.toLowerCase();
        const matches = 
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.ptName.toLowerCase().includes(q) ||
          item.clientName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Filtro esercizi
      if (filterExerciseOp === 'lte_1' && item.exerciseCount > 1) return false;
      if (filterExerciseOp === 'lte_2' && item.exerciseCount > 2) return false;
      if (filterExerciseOp === 'gte_5' && item.exerciseCount < 5) return false;
      if (filterExerciseOp === 'custom' && filterExerciseCount !== '') {
        const num = parseInt(filterExerciseCount, 10);
        if (!isNaN(num) && item.exerciseCount > num) return false;
      }

      // 3. Filtro età (giorni di vita)
      if (filterAgeDays !== 'all') {
        const minDays = parseInt(filterAgeDays, 10);
        if (!isNaN(minDays) && item.ageInDays < minDays) return false;
      }

      // 4. Filtro visualizzazioni
      if (filterViews === 'zero' && item.viewsCount > 0) return false;
      if (filterViews === 'lt_5' && item.viewsCount >= 5) return false;

      return true;
    });
  }, [workouts, filterText, filterExerciseOp, filterExerciseCount, filterAgeDays, filterViews]);

  // Selezione / Deselezione
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredWorkouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWorkouts.map((w) => w.id)));
    }
  };

  // Preset rapidi richiesti dall'utente
  const applyPresetTestCleanup = () => {
    setFilterText('');
    setFilterExerciseOp('lte_1');
    setFilterAgeDays('15');
    setFilterViews('all');
  };

  const applyPresetZombieCleanup = () => {
    setFilterText('');
    setFilterExerciseOp('all');
    setFilterAgeDays('90');
    setFilterViews('zero');
  };

  const resetAllFilters = () => {
    setFilterText('');
    setFilterExerciseOp('all');
    setFilterExerciseCount('');
    setFilterAgeDays('all');
    setFilterViews('all');
  };

  // Eliminazione massiva selezionati
  const handleExecuteDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      for (const id of idsToDelete) {
        await deleteWorkout(id);
      }
      setConfirmModalOpen(false);
      await loadAllWorkouts();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      alert('Si è verificato un errore durante l\'eliminazione.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Scarica Backup Completo JSON
  const handleDownloadBackup = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(workouts.map((w) => w.raw), null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `gymlink_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Gestione Selezione File JSON per Ripristino
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (!Array.isArray(parsed)) {
          alert('Il file selezionato non è un backup valido di GymLink (deve contenere una lista di schede).');
          return;
        }

        // Filtra gli elementi validi che hanno un ID
        const validWorkouts = parsed.filter((w) => w && typeof w === 'object' && w.id);
        if (validWorkouts.length === 0) {
          alert('Nessuna scheda valida trovata nel file di backup.');
          return;
        }

        setPendingRestoreData(validWorkouts);
        setRestoreStatusMsg('');
        setRestoreModalOpen(true);
      } catch (err) {
        console.error('Errore parsing backup JSON:', err);
        alert('Impossibile leggere il file: formato JSON non valido.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Esecuzione Ripristino Massivo su Supabase
  const handleExecuteRestore = async () => {
    if (!pendingRestoreData.length) return;
    setIsRestoring(true);
    setRestoreStatusMsg('');
    try {
      const res = await restoreWorkoutsFromBackup(pendingRestoreData);
      if (res.success) {
        setRestoreStatusMsg(`✅ Ripristino completato con successo: ${res.count} schede inserite/aggiornate.`);
        await loadAllWorkouts();
        setTimeout(() => {
          setRestoreModalOpen(false);
          setPendingRestoreData([]);
        }, 1500);
      } else {
        setRestoreStatusMsg(`❌ Errore durante il ripristino: ${res.error}`);
      }
    } catch (err) {
      setRestoreStatusMsg(`❌ Errore imprevisto: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Schermata di blocco PIN se non autenticato
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="gl-card max-w-sm w-full p-6 space-y-4 gl-rise border-acc/40">
          <div className="w-12 h-12 mx-auto rounded-xl bg-acc/10 border border-acc/30 grid place-items-center text-acc">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-dot font-black text-xl text-fg uppercase">Area Manutenzione</h1>
            <p className="text-xs text-dim font-mono">Accesso riservato all'amministratore</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <input
              type="password"
              placeholder="Inserisci Password o PIN..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="gl-input font-mono text-center tracking-widest text-sm"
              autoFocus
            />
            {pinError && <p className="text-xs text-danger font-mono text-center">{pinError}</p>}
            <button type="submit" className="gl-btn-primary w-full justify-center !h-9 text-xs font-mono font-bold">
              Accedi al Database
            </button>
          </form>
        </div>
      </div>
    );
  }

  const estimatedKb = Math.round(filteredWorkouts.length * 4.2);

  return (
    <div className="gl-page-in max-w-[1200px] mx-auto px-4 pt-4 pb-14 space-y-4">
      {/* Testata Admin */}
      <section className="gl-panel p-5 sm:p-6 gl-rise flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="gl-eyebrow flex items-center gap-2 mb-2 text-acc font-bold">
            <span className="gl-dot pulse" />
            <span>CONSOLE DI MANUTENZIONE & PULIZIA CLOUD</span>
          </div>
          <h1 className="font-dot font-black text-2xl sm:text-3xl text-fg uppercase tracking-wide">
            Database Health & Pruning
          </h1>
          <p className="text-xs text-dim font-mono mt-1">
            Gestione igiene database Supabase, monitoraggio archivi e rimozione schede zombie/test.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={loadAllWorkouts}
            disabled={loading}
            className="gl-btn !h-8 !px-3 text-xs font-mono inline-flex items-center gap-1.5"
            title="Ricarica dati"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="gl-btn !h-8 !px-3 text-xs font-mono inline-flex items-center gap-1.5 text-acc hover:border-acc"
            title="Scarica dump JSON completo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="gl-btn !h-8 !px-3 text-xs font-mono inline-flex items-center gap-1.5 text-acc hover:border-acc"
            title="Ripristina schede da file JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ripristina Backup</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('gl_admin_auth');
              setIsAuthenticated(false);
            }}
            className="gl-btn !h-8 !px-2.5 text-xs font-mono text-dim hover:text-danger"
            title="Esci dalla console"
          >
            Esci
          </button>
        </div>
      </section>

      {/* Preset Rapidi + Filtri Manuali Componibili */}
      <section className="gl-card p-4 sm:p-5 space-y-4 gl-rise border-line">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-sline pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-acc" />
            <h2 className="font-dot font-bold text-sm text-fg uppercase tracking-wide">Filtri & Preset di Pulizia</h2>
          </div>
          {/* Preset 1-Click */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={applyPresetTestCleanup}
              className="gl-btn !h-7 !px-2.5 !text-[11px] font-mono text-warn hover:border-warn"
            >
              ⚡ Preset: Prove/Test (≤1 ex, &gt;15gg)
            </button>
            <button
              type="button"
              onClick={applyPresetZombieCleanup}
              className="gl-btn !h-7 !px-2.5 !text-[11px] font-mono text-danger hover:border-danger"
            >
              💀 Preset: Zombie (&gt;90gg, 0 view)
            </button>
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] font-mono text-dim hover:text-fg underline ml-1"
            >
              Azzera
            </button>
          </div>
        </div>

        {/* Griglia Controlli Manuali */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Testo Cerca */}
          <div>
            <label className="text-[10.5px] text-dim block mb-1">CERCA (TITOLO, PT, ATLETA, ID)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-dim absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="es. test, Marco..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="gl-input !h-8 !pl-8 !text-xs font-mono w-full"
              />
            </div>
          </div>

          {/* Esercizi */}
          <div>
            <label className="text-[10.5px] text-dim block mb-1">NUMERO ESERCIZI</label>
            <select
              value={filterExerciseOp}
              onChange={(e) => setFilterExerciseOp(e.target.value)}
              className="gl-input !h-8 !text-xs font-mono w-full"
            >
              <option value="all">Tutti gli esercizi</option>
              <option value="lte_1">≤ 1 esercizio (Bozze vuote)</option>
              <option value="lte_2">≤ 2 esercizi</option>
              <option value="gte_5">≥ 5 esercizi (Schede piene)</option>
            </select>
          </div>

          {/* Età / Data Creazione */}
          <div>
            <label className="text-[10.5px] text-dim block mb-1">ANZIANITÀ DELLA SCHEDA</label>
            <select
              value={filterAgeDays}
              onChange={(e) => setFilterAgeDays(e.target.value)}
              className="gl-input !h-8 !text-xs font-mono w-full"
            >
              <option value="all">Qualsiasi età</option>
              <option value="15">Più vecchia di 15 giorni</option>
              <option value="30">Più vecchia di 30 giorni (1 mese)</option>
              <option value="90">Più vecchia di 90 giorni (3 mesi)</option>
              <option value="180">Più vecchia di 180 giorni (6 mesi)</option>
            </select>
          </div>

          {/* Visualizzazioni */}
          <div>
            <label className="text-[10.5px] text-dim block mb-1">VISUALIZZAZIONI RICEVUTE</label>
            <select
              value={filterViews}
              onChange={(e) => setFilterViews(e.target.value)}
              className="gl-input !h-8 !text-xs font-mono w-full"
            >
              <option value="all">Qualsiasi visualizzazione</option>
              <option value="zero">= 0 visualizzazioni (Mai aperta)</option>
              <option value="lt_5">&lt; 5 visualizzazioni</option>
            </select>
          </div>
        </div>
      </section>

      {/* Barra Azioni & Contatore Selezione Massiva */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-sline bg-bg2 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-fg select-none">
            <input
              type="checkbox"
              checked={filteredWorkouts.length > 0 && selectedIds.size === filteredWorkouts.length}
              onChange={handleSelectAllFiltered}
              className="w-4 h-4 rounded accent-acc"
            />
            <span>Seleziona visualizzate ({filteredWorkouts.length})</span>
          </label>
          <span className="text-dim">·</span>
          <span className="text-dim">
            Selezionate: <strong className="text-acc">{selectedIds.size}</strong> di {filteredWorkouts.length}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-dim text-[11px]">
              (~{Math.round(selectedIds.size * 4.2)} KB liberati)
            </span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            className="gl-btn !h-8 !px-3.5 !rounded-lg text-danger border-danger/40 hover:border-danger hover:bg-danger/10 font-mono font-bold inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Elimina {selectedIds.size} Schede</span>
          </button>
        )}
      </div>

      {/* Tabella Schede */}
      <section className="gl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-bg/80 text-dim text-[10px] uppercase tracking-[0.14em] border-b border-sline">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">Sel</th>
                <th className="px-3 py-2.5 font-bold">ID</th>
                <th className="px-3 py-2.5 font-bold">Titolo Scheda</th>
                <th className="px-3 py-2.5 font-bold">PT</th>
                <th className="px-3 py-2.5 font-bold">Atleta</th>
                <th className="px-3 py-2.5 font-bold">Data</th>
                <th className="px-3 py-2.5 font-bold text-center">Età</th>
                <th className="px-3 py-2.5 font-bold text-center">Split</th>
                <th className="px-3 py-2.5 font-bold text-center">Esercizi</th>
                <th className="px-3 py-2.5 font-bold text-center">Views</th>
                <th className="px-3 py-2.5 font-bold text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sline/60">
              {filteredWorkouts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-dim font-mono">
                    {loading ? 'Caricamento database...' : 'Nessuna scheda trovata con i filtri correnti.'}
                  </td>
                </tr>
              ) : (
                filteredWorkouts.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-acc/[0.04] transition-colors ${isChecked ? 'bg-acc/[0.06]' : ''}`}>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded accent-acc cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <a
                          href={`/w/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-acc font-bold hover:underline"
                        >
                          {item.id}
                        </a>
                      </td>
                      <td className="px-3 py-2.5 font-sans font-medium text-fg max-w-[200px] truncate" title={item.title}>
                        {item.title}
                      </td>
                      <td className="px-3 py-2.5 text-dim truncate max-w-[120px]">{item.ptName}</td>
                      <td className="px-3 py-2.5 text-acc/90 truncate max-w-[120px]">{item.clientName}</td>
                      <td className="px-3 py-2.5 text-dim">{item.date}</td>
                      <td className="px-3 py-2.5 text-center text-dim">{item.ageInDays}gg</td>
                      <td className="px-3 py-2.5 text-center">{item.daysCount}</td>
                      <td className="px-3 py-2.5 text-center font-bold">
                        <span className={item.exerciseCount <= 1 ? 'text-warn' : 'text-fg'}>
                          {item.exerciseCount}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-info font-bold">{item.viewsCount}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`/w/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-dim hover:text-acc hover:bg-bg"
                            title="Apri scheda"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = window.confirm(`Eliminare definitivamente la scheda "${item.title}" (${item.id})?`);
                              if (!ok) return;
                              await deleteWorkout(item.id);
                              await loadAllWorkouts();
                            }}
                            className="p-1 rounded text-dim hover:text-danger hover:bg-bg"
                            title="Elimina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modale Conferma Eliminazione Massiva */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm gl-modal-backdrop">
          <div className="gl-card gl-modal w-full max-w-md p-6 space-y-4 border-danger/50">
            <div className="w-12 h-12 mx-auto rounded-full bg-danger/10 border border-danger/40 grid place-items-center text-danger">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-dot font-black text-xl text-fg uppercase">Conferma Eliminazione Massiva</h3>
              <p className="text-xs text-dim font-mono">
                Stai per eliminare definitivamente <strong className="text-danger">{selectedIds.size} schede</strong> dal Cloud Supabase.
              </p>
            </div>
            <p className="p-3 rounded-lg border border-line bg-bg2 text-[11px] font-mono text-dim leading-relaxed">
              ⚠️ Questa azione è irreversibile. I link associati smetteranno di funzionare per gli atleti.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="gl-btn-primary flex-1 justify-center !bg-danger !text-white text-xs !h-9 font-mono font-bold"
              >
                {isDeleting ? 'Eliminazione in corso...' : `Sì, Elimina ${selectedIds.size} Schede`}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmModalOpen(false)}
                className="gl-btn flex-1 justify-center text-xs !h-9 font-mono"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Conferma Ripristino / Upload Backup */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm gl-modal-backdrop">
          <div className="gl-card gl-modal w-full max-w-md p-6 space-y-4 border-acc/50">
            <div className="w-12 h-12 mx-auto rounded-full bg-acc/10 border border-acc/40 grid place-items-center text-acc">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-dot font-black text-xl text-fg uppercase">Ripristino da Backup JSON</h3>
              <p className="text-xs text-dim font-mono">
                Trovate <strong className="text-acc">{pendingRestoreData.length} schede</strong> valide nel file.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-line bg-bg2 text-[11px] font-mono text-dim leading-relaxed space-y-2">
              <p>
                🔄 <strong>Modalità Upsert sicuro:</strong> Le schede mancanti verranno ripristinate con il loro ID e i link originali. Quelle già presenti verranno aggiornate con i dati del file di backup.
              </p>
              {restoreStatusMsg && (
                <p className="p-2 rounded bg-bg text-fg border border-line font-bold">
                  {restoreStatusMsg}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleExecuteRestore}
                className="gl-btn-primary flex-1 justify-center text-xs !h-9 font-mono font-bold"
              >
                {isRestoring ? 'Ripristino in corso...' : `Ripristina ${pendingRestoreData.length} Schede`}
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setRestoreModalOpen(false);
                  setPendingRestoreData([]);
                  setRestoreStatusMsg('');
                }}
                className="gl-btn flex-1 justify-center text-xs !h-9 font-mono"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

