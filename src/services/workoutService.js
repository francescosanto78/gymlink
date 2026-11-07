import { supabase, isSupabaseConfigured } from './supabase';
import { nanoid } from 'nanoid';

const RECENT_KEY = 'gymlink_recent_workouts';
const DRAFT_KEY = 'gymlink_draft';

/**
 * Salva una scheda (Cloud Supabase + cache locale del dispositivo).
 * Se è una nuova scheda e non ha un id valido da 10 caratteri, genera un nanoid(10).
 */
export async function saveWorkout(workoutData) {
  let id = workoutData.id;
  // Se non ha id o è un id di demo/provvisorio, genera un id crittografico nanoid(10)
  if (!id || id === 'demo-protocol' || id.length < 8) {
    id = nanoid(10);
  }

  const payload = {
    ...workoutData,
    id,
    date: workoutData.date || new Date().toISOString().split('T')[0]
  };

  // 1. Salvataggio su Supabase se configurato
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('workouts').upsert({
      id: payload.id,
      data: payload,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Errore salvataggio Supabase:', error);
      throw error;
    }
  }

  // 2. Aggiorna sempre la cache locale dei recenti sul dispositivo PT
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    let list = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(list)) list = [];

    const existingIdx = list.findIndex((w) => w?.id === payload.id);
    if (existingIdx >= 0) {
      list[existingIdx] = payload;
    } else {
      list.unshift(payload);
    }
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Errore cache locale recenti:', e);
  }

  return payload;
}

/**
 * Carica una scheda dato il suo ID (prima controlla Supabase, poi fallback su cache locale o bozza).
 */
export async function getWorkoutById(id) {
  if (!id) return null;

  // 1. Prova da Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data?.data) {
        return {
          ...data.data,
          viewsCount: data.views_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (e) {
      console.warn('Errore caricamento Supabase, provo locale:', e);
    }
  }

  // 2. Fallback: controlla cache locale del dispositivo
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        const found = list.find((w) => w?.id === id);
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn(e);
  }

  // 3. Fallback: controlla bozza corrente
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed?.id === id) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }

  return null;
}

/**
 * Incrementa atomicamente le visualizzazioni su Supabase con protezione anti-refresh per sessione.
 */
export async function trackWorkoutView(id) {
  if (!id || !isSupabaseConfigured || !supabase) return;

  const viewKey = `gl_viewed_${id}`;
  if (sessionStorage.getItem(viewKey)) return;

  try {
    sessionStorage.setItem(viewKey, '1');
    await supabase.rpc('increment_workout_view', { workout_id: id });
  } catch (e) {
    console.warn('Errore tracciamento visualizzazione:', e);
  }
}

/**
 * Aggiorna il carico di un esercizio salvando il nuovo punto nello storico pesi (weightHistory).
 * Operazione sicura sia per l'atleta che per il PT.
 * @param {string} workoutId - ID della scheda
 * @param {string} exerciseId - ID univoco dell'esercizio da aggiornare
 * @param {string} newWeightStr - Nuovo valore inserito (es. "75 kg" o "75")
 * @returns {Promise<{ success: boolean, updatedWorkout?: any }>}
 */
export async function updateExerciseWeight(workoutId, exerciseId, newWeightStr) {
  if (!workoutId || !exerciseId) return { success: false };

  // Parse numerico approssimativo del carico per la trendline
  const cleanNumMatch = String(newWeightStr).replace(',', '.').match(/[-+]?\d*\.?\d+/);
  const numericWeight = cleanNumMatch ? parseFloat(cleanNumMatch[0]) : null;
  const todayIso = new Date().toISOString().split('T')[0];

  const currentWorkout = await getWorkoutById(workoutId);
  if (!currentWorkout || !Array.isArray(currentWorkout.days)) {
    return { success: false };
  }

  let found = false;
  const updatedDays = currentWorkout.days.map((day) => {
    if (!Array.isArray(day.exercises)) return day;
    const updatedExercises = day.exercises.map((ex) => {
      if (ex.id === exerciseId) {
        found = true;
        const prevHistory = Array.isArray(ex.weightHistory) ? ex.weightHistory : [];
        
        // Se la cronologia è vuota e l'esercizio aveva già un peso di partenza registrato alla creazione della scheda,
        // inseriamo prima il punto base iniziale (con data creazione scheda o 7 giorni fa se oggi)
        const initialPoints = [];
        if (prevHistory.length === 0 && ex.weight && ex.weight !== 'A sensazione') {
          const initMatch = String(ex.weight).replace(',', '.').match(/[-+]?\d*\.?\d+/);
          const initNum = initMatch ? parseFloat(initMatch[0]) : null;
          const creationDate = currentWorkout.date || todayIso;
          initialPoints.push({
            date: creationDate,
            weight: initNum,
            raw: String(ex.weight).trim(),
            isInitial: true,
            timestamp: new Date(creationDate).getTime() || (Date.now() - 86400000 * 7)
          });
        }

        const newPoint = {
          date: todayIso,
          weight: numericWeight,
          raw: String(newWeightStr).trim(),
          timestamp: Date.now()
        };

        // Regola dello stesso giorno: se esiste già una variazione nella stessa data (todayIso),
        // aggiorna quella variazione mantenendo solo l'ultimo valore del giorno!
        const existingSameDayIdx = prevHistory.findIndex((p) => p.date === todayIso);
        let nextHistory;
        if (existingSameDayIdx >= 0) {
          nextHistory = [...prevHistory];
          nextHistory[existingSameDayIdx] = newPoint;
        } else {
          nextHistory = [...initialPoints, ...prevHistory, newPoint];
        }

        return {
          ...ex,
          weight: String(newWeightStr).trim(),
          weightHistory: nextHistory
        };
      }
      return ex;
    });
    return { ...day, exercises: updatedExercises };
  });

  if (!found) return { success: false };

  const updatedPayload = {
    ...currentWorkout,
    days: updatedDays
  };

  await saveWorkout(updatedPayload);
  return { success: true, updatedWorkout: updatedPayload };
}


/**
 * Elimina una scheda (dal Cloud Supabase e dalla cache locale).
 */
export async function deleteWorkout(id) {
  if (!id) return;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      console.error('Errore eliminazione Supabase:', error);
      throw error;
    }
  }

  try {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        const filtered = list.filter((w) => w?.id !== id);
        localStorage.setItem(RECENT_KEY, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Recupera le statistiche aggregate per la pagina pubblica /stats.
 */
export async function getGlobalStats() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_global_stats');
      if (!error && data) {
        return {
          totalWorkouts: data.total_workouts || 0,
          totalViews: data.total_views || 0
        };
      }
    } catch (e) {
      console.warn('Errore get_global_stats RPC, calcolo via select:', e);
    }

    try {
      const { count } = await supabase.from('workouts').select('*', { count: 'exact', head: true });
      return { totalWorkouts: count || 0, totalViews: 0 };
    } catch (err) {
      console.warn(err);
    }
  }

  // Fallback se Supabase è offline o non ancora popolato
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    const list = stored ? JSON.parse(stored) : [];
    return {
      totalWorkouts: Array.isArray(list) ? list.length : 0,
      totalViews: 0
    };
  } catch {
    return { totalWorkouts: 0, totalViews: 0 };
  }
}

/**
 * Ripristina un array di schede su Supabase (upsert bulk).
 * Se una scheda esiste già, la aggiorna; se non esiste, la inserisce mantenendo il suo ID originale.
 * @param {Array} rawWorkoutsArray - Array di oggetti workout (formato raw esportato dal backup)
 * @returns {Promise<{ success: boolean, count: number, error?: any }>}
 */
export async function restoreWorkoutsFromBackup(rawWorkoutsArray) {
  if (!Array.isArray(rawWorkoutsArray) || rawWorkoutsArray.length === 0) {
    return { success: false, count: 0, error: 'Nessuna scheda valida trovata nel file.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, count: 0, error: 'Database Supabase non configurato o non raggiungibile.' };
  }

  // Prepariamo i record per l'upsert
  const rows = rawWorkoutsArray
    .filter((w) => w && typeof w === 'object' && w.id)
    .map((w) => ({
      id: String(w.id),
      data: w,
      updated_at: new Date().toISOString()
    }));

  if (rows.length === 0) {
    return { success: false, count: 0, error: 'Nessun record valido con campo "id" trovato.' };
  }

  try {
    const { error } = await supabase
      .from('workouts')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Errore ripristino upsert Supabase:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: rows.length };
  } catch (err) {
    console.error('Eccezione durante il ripristino:', err);
    return { success: false, count: 0, error: err.message || 'Errore imprevisto' };
  }
}


