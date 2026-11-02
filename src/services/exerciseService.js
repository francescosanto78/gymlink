/**
 * Service per la gestione, caching e ricerca multilingua del dataset esercizi
 * Dataset: hasaneyldrm/exercises-dataset (MIT)
 * Media: Gym Visual (gymvisual.com)
 */

const DATASET_URL = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json';
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main';

let cachedExercises = null;

// Mappatura sinonimi e termini da italiano/spagnolo a parole chiave del dataset
const FITNESS_SYNONYMS = {
  panca: ['bench', 'chest press', 'press'],
  petto: ['chest', 'pectoral', 'bench', 'fly'],
  pettorali: ['chest', 'pectoral', 'bench', 'fly'],
  croci: ['fly', 'flyes', 'crossover'],
  trazioni: ['pull-up', 'chin-up', 'lat pulldown', 'pulldown'],
  dorsali: ['lat', 'back', 'row', 'pulldown'],
  dorso: ['back', 'lats', 'row'],
  schiena: ['back', 'lats', 'spine'],
  rematore: ['row', 'seated row'],
  spalle: ['shoulder', 'delt', 'press', 'lateral raise'],
  deltoidi: ['delt', 'shoulder'],
  alzate: ['lateral raise', 'front raise', 'raise'],
  bicipiti: ['bicep', 'curl'],
  braccia: ['arm', 'bicep', 'tricep', 'forearm'],
  tricipiti: ['tricep', 'extension', 'dip', 'pushdown'],
  french: ['french press', 'skull crusher', 'tricep extension'],
  squat: ['squat'],
  gambe: ['leg', 'quad', 'hamstring', 'calf', 'squat', 'lunge'],
  quadricipiti: ['quad', 'leg extension', 'squat'],
  femorali: ['hamstring', 'leg curl', 'deadlift'],
  stacco: ['deadlift', 'romanian'],
  affondi: ['lunge', 'step-up'],
  polpacci: ['calf', 'calves', 'raise'],
  glutei: ['glute', 'hip thrust', 'kickback'],
  addome: ['ab', 'abs', 'crunch', 'sit-up', 'plank', 'waist'],
  addominali: ['ab', 'abs', 'crunch', 'sit-up', 'plank', 'waist'],
  core: ['abs', 'plank', 'waist', 'torso'],
  dip: ['dip', 'chest dip'],
  cardio: ['cardio', 'run', 'bike', 'rower', 'skierg', 'jump'],
  // Spagnolo
  pecho: ['chest', 'bench', 'pectoral'],
  espalda: ['back', 'lats', 'row'],
  hombros: ['shoulder', 'delt'],
  piernas: ['leg', 'quad', 'hamstring', 'squat'],
  brazos: ['arm', 'bicep', 'tricep'],
  biceps: ['bicep', 'curl'],
  triceps: ['tricep', 'extension'],
  pantorrillas: ['calf', 'calves'],
  gemelos: ['calf', 'calves'],
  peso: ['deadlift', 'romanian', 'barbell']
};

// Dizionario traduzioni muscoli target
export const TARGET_TRANSLATIONS = {
  it: {
    abs: 'Addominali',
    biceps: 'Bicipiti',
    triceps: 'Tricipiti',
    pectorals: 'Pettorali',
    delts: 'Deltoidi (Spalle)',
    lats: 'Gran Dorsale',
    upper_back: 'Dorso Alto',
    quads: 'Quadricipiti',
    hamstrings: 'Femorali / Ischiocrurali',
    glutes: 'Glutei',
    calves: 'Polpacci',
    forearms: 'Avambracci',
    spine: 'Lombari / Erettori',
    traps: 'Trapezi',
    cardiovascular_system: 'Cardio'
  },
  es: {
    abs: 'Abdomen',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    pectorals: 'Pectorales',
    delts: 'Deltoides (Hombros)',
    lats: 'Dorsales',
    upper_back: 'Espalda Alta',
    quads: 'Cuádriceps',
    hamstrings: 'Isquiotibiales',
    glutes: 'Glúteos',
    calves: 'Gemelos / Pantorrillas',
    forearms: 'Antebrazos',
    spine: 'Lumbares',
    traps: 'Trapecios',
    cardiovascular_system: 'Cardio'
  },
  en: {
    abs: 'Abs',
    biceps: 'Biceps',
    triceps: 'Triceps',
    pectorals: 'Chest',
    delts: 'Shoulders',
    lats: 'Lats',
    upper_back: 'Upper Back',
    quads: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    forearms: 'Forearms',
    spine: 'Lower Back',
    traps: 'Traps',
    cardiovascular_system: 'Cardio'
  }
};

// Dizionario traduzioni attrezzature
export const EQUIPMENT_TRANSLATIONS = {
  it: {
    barbell: 'Bilanciere',
    dumbbell: 'Manubri',
    cable: 'Cavi',
    'body weight': 'Corpo Libero',
    'smith machine': 'Multipower',
    'leverage machine': 'Macchinario',
    band: 'Elastico',
    'resistance band': 'Elastico',
    kettlebell: 'Kettlebell',
    'ez barbell': 'Bilanciere Sagomato'
  },
  es: {
    barbell: 'Barra',
    dumbbell: 'Mancuernas',
    cable: 'Poleas / Cables',
    'body weight': 'Peso Corporal',
    'smith machine': 'Máquina Smith',
    'leverage machine': 'Máquina de Palancas',
    band: 'Banda Elástica',
    'resistance band': 'Banda Elástica',
    kettlebell: 'Pesa Rusa (Kettlebell)',
    'ez barbell': 'Barra Z'
  },
  en: {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    cable: 'Cable',
    'body weight': 'Bodyweight',
    'smith machine': 'Smith Machine',
    'leverage machine': 'Machine',
    band: 'Resistance Band',
    'resistance band': 'Resistance Band',
    kettlebell: 'Kettlebell',
    'ez barbell': 'EZ Bar'
  }
};

export async function fetchExercises() {
  if (cachedExercises && cachedExercises.length > 0) {
    return cachedExercises;
  }

  try {
    const sessionData = sessionStorage.getItem('gymlink_exercises_cache');
    if (sessionData) {
      cachedExercises = JSON.parse(sessionData);
      return cachedExercises;
    }
  } catch (e) {
    console.warn('Impossibile accedere a sessionStorage', e);
  }

  try {
    const response = await fetch(DATASET_URL);
    if (!response.ok) {
      throw new Error(`Errore caricamento dataset: ${response.status}`);
    }
    const data = await response.json();
    cachedExercises = data;

    try {
      sessionStorage.setItem('gymlink_exercises_cache', JSON.stringify(data));
    } catch (e) {
      console.warn('Dataset conservato in memoria React', e);
    }

    return cachedExercises;
  } catch (error) {
    console.error('Errore durante il download del dataset esercizi:', error);
    throw error;
  }
}

/**
 * Ricerca multilingua intelligente:
 * Supporta query in italiano, spagnolo e inglese grazie al dizionario di sinonimi,
 * cerca nei nomi, nelle categorie, nell'attrezzatura e nelle istruzioni.
 */
export function searchExercises(exercises, query, lang = 'it', limit = null) {
  if (!query || !query.trim()) {
    return (limit && limit > 0) ? exercises.slice(0, limit) : exercises;
  }

  const q = query.toLowerCase().trim();
  const searchTokens = [q];

  // Se la parola ha sinonimi fitness mappati, aggiungili ai token di ricerca
  if (FITNESS_SYNONYMS[q]) {
    searchTokens.push(...FITNESS_SYNONYMS[q]);
  } else {
    // Controlla se una sottostringa corrisponde a un sinonimo
    for (const [key, synonyms] of Object.entries(FITNESS_SYNONYMS)) {
      if (q.includes(key)) {
        searchTokens.push(...synonyms);
      }
    }
  }

  const results = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const nameLow = ex.name ? ex.name.toLowerCase() : '';
    const targetLow = ex.target ? ex.target.toLowerCase() : '';
    const categoryLow = ex.category ? ex.category.toLowerCase() : '';
    const bodyPartLow = ex.body_part ? ex.body_part.toLowerCase() : '';
    const equipLow = ex.equipment ? ex.equipment.toLowerCase() : '';
    const instructionsForLang = (ex.instructions?.[lang] || ex.instructions?.['en'] || '').toLowerCase();

    let matched = false;
    let priority = 0;

    for (const token of searchTokens) {
      if (nameLow.includes(token)) {
        matched = true;
        priority = Math.max(priority, 3);
      } else if (targetLow.includes(token) || bodyPartLow.includes(token)) {
        matched = true;
        priority = Math.max(priority, 2);
      } else if (categoryLow.includes(token) || equipLow.includes(token)) {
        matched = true;
        priority = Math.max(priority, 1);
      } else if (instructionsForLang.includes(token)) {
        matched = true;
        priority = Math.max(priority, 1);
      }
    }

    if (matched) {
      results.push({ ...ex, _priority: priority });
      if (limit && results.length >= limit * 3) break;
    }
  }

  results.sort((a, b) => b._priority - a._priority);
  return (limit && limit > 0) ? results.slice(0, limit) : results;
}

/**
 * URL immagine statica leggera (JPG)
 */
export function getExerciseImageUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return `${CDN_BASE}/${relativePath.replace(/^\//, '')}`;
}

/**
 * URL GIF animata completa
 */
export function getExerciseMediaUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  return `${CDN_BASE}/${relativePath.replace(/^\//, '')}`;
}

/**
 * Estrae la descrizione tradotta migliore per la lingua richiesta
 */
export function getExerciseDescription(exercise, lang = 'it') {
  if (!exercise || !exercise.instructions) return '';
  return exercise.instructions[lang] || exercise.instructions['en'] || '';
}

/**
 * Traduce un muscolo target nella lingua specificata
 */
export function translateTarget(target, lang = 'it') {
  if (!target) return '';
  const key = target.toLowerCase().replace(/\s+/g, '_');
  return TARGET_TRANSLATIONS[lang]?.[key] || TARGET_TRANSLATIONS['it']?.[key] || target;
}

/**
 * Traduce un'attrezzatura nella lingua specificata
 */
export function translateEquipment(equipment, lang = 'it') {
  if (!equipment) return '';
  const key = equipment.toLowerCase();
  return EQUIPMENT_TRANSLATIONS[lang]?.[key] || EQUIPMENT_TRANSLATIONS['it']?.[key] || equipment;
}
