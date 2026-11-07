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

// Mappatura bidirezionale per normalizzare target muscolari inseriti in qualsiasi lingua
const CANONICAL_TARGET_MAP = {
  // Pectorals
  'pectorals': 'pectorals', 'pettorali': 'pectorals', 'petto': 'pectorals', 'chest': 'pectorals', 'pectorales': 'pectorals',
  // Lats
  'lats': 'lats', 'gran dorsale': 'lats', 'dorsali': 'lats', 'dorso': 'lats', 'dorsales': 'lats', 'espalda': 'lats',
  // Upper back
  'upper_back': 'upper_back', 'upper back': 'upper_back', 'dorso alto': 'upper_back', 'schiena alta': 'upper_back', 'espalda alta': 'upper_back', 'romboidi': 'upper_back', 'dorso e romboidi': 'upper_back',
  // Delts
  'delts': 'delts', 'deltoidi': 'delts', 'deltoidi (spalle)': 'delts', 'spalle': 'delts', 'shoulders': 'delts', 'hombros': 'delts', 'deltoides': 'delts', 'deltoides (hombros)': 'delts',
  // Biceps
  'biceps': 'biceps', 'bicipiti': 'biceps', 'bíceps': 'biceps',
  // Triceps
  'triceps': 'triceps', 'tricipiti': 'triceps', 'tríceps': 'triceps',
  // Quads
  'quads': 'quads', 'quadricipiti': 'quads', 'cuádriceps': 'quads', 'quadricipiti e glutei': 'quads',
  // Hamstrings
  'hamstrings': 'hamstrings', 'femorali': 'hamstrings', 'femorali / ischiocrurali': 'hamstrings', 'isquiotibiales': 'hamstrings', 'ischiocrurali': 'hamstrings',
  // Glutes
  'glutes': 'glutes', 'glutei': 'glutes', 'gluteos': 'glutes', 'glúteos': 'glutes',
  // Calves
  'calves': 'calves', 'polpacci': 'calves', 'gemelos': 'calves', 'gemelos / pantorrillas': 'calves', 'pantorrillas': 'calves',
  // Abs
  'abs': 'abs', 'addome': 'abs', 'addominali': 'abs', 'abdomen': 'abs', 'core': 'abs', 'waist': 'abs',
  // Forearms
  'forearms': 'forearms', 'avambracci': 'forearms', 'antebrazos': 'forearms',
  // Spine / Lower back
  'spine': 'spine', 'lombari': 'spine', 'lombari / erettori': 'spine', 'lower back': 'spine', 'lumbares': 'spine',
  // Traps
  'traps': 'traps', 'trapezi': 'traps', 'trapecios': 'traps',
  // Cardio
  'cardiovascular_system': 'cardiovascular_system', 'cardio': 'cardiovascular_system', 'cardiovascular system': 'cardiovascular_system'
};

// Mappatura bidirezionale per normalizzare attrezzature
const CANONICAL_EQUIPMENT_MAP = {
  'barbell': 'barbell', 'bilanciere': 'barbell', 'barra': 'barbell',
  'dumbbell': 'dumbbell', 'manubri': 'dumbbell', 'manubrio': 'dumbbell', 'mancuernas': 'dumbbell', 'mancuerna': 'dumbbell',
  'cable': 'cable', 'cavi': 'cable', 'cavo': 'cable', 'poleas': 'cable', 'polea': 'cable', 'poleas / cables': 'cable',
  'body weight': 'body weight', 'bodyweight': 'body weight', 'corpo libero': 'body weight', 'peso corporal': 'body weight',
  'smith machine': 'smith machine', 'multipower': 'smith machine', 'máquina smith': 'smith machine',
  'leverage machine': 'leverage machine', 'macchinario': 'leverage machine', 'machine': 'leverage machine', 'máquina': 'leverage machine', 'máquina de palancas': 'leverage machine',
  'band': 'band', 'resistance band': 'band', 'elastico': 'band', 'banda elástica': 'banda', 'banda': 'band',
  'kettlebell': 'kettlebell', 'pesa rusa': 'kettlebell', 'pesa rusa (kettlebell)': 'kettlebell',
  'ez barbell': 'ez barbell', 'bilanciere sagomato': 'ez barbell', 'barra z': 'ez barbell'
};

// Dizionario traduzioni titoli per i principali esercizi del fitness
const COMMON_EXERCISE_TRANSLATIONS = {
  'barbell bench press': {
    it: 'Panca Piana con Bilanciere',
    en: 'Barbell Bench Press',
    es: 'Press de Banca con Barra'
  },
  'dumbbell bench press': {
    it: 'Spinte Panca Piana con Manubri',
    en: 'Dumbbell Bench Press',
    es: 'Press de Banca con Mancuernas'
  },
  'incline dumbbell press': {
    it: 'Spinte su Panca Inclinata con Manubri',
    en: 'Incline Dumbbell Press',
    es: 'Press Inclinado con Mancuernas'
  },
  'incline barbell bench press': {
    it: 'Panca Inclinata con Bilanciere',
    en: 'Incline Barbell Bench Press',
    es: 'Press Inclinado con Barra'
  },
  'dumbbell lateral raise': {
    it: 'Alzate Laterali con Manubri',
    en: 'Dumbbell Lateral Raise',
    es: 'Elevaciones Laterales con Mancuernas'
  },
  'cable lateral raise': {
    it: 'Alzate Laterali ai Cavi',
    en: 'Cable Lateral Raise',
    es: 'Elevaciones Laterales en Polea'
  },
  'triceps pushdown': {
    it: 'Pushdown Tricipiti ai Cavi',
    en: 'Triceps Pushdown',
    es: 'Extensión de Tríceps en Polea'
  },
  'cable pushdown': {
    it: 'Pushdown ai Cavi',
    en: 'Cable Pushdown',
    es: 'Extensión en Polea'
  },
  'lat pulldown': {
    it: 'Lat Machine al Petto',
    en: 'Lat Pulldown',
    es: 'Jalón al Pecho en Polea'
  },
  'barbell bent over row': {
    it: 'Rematore con Bilanciere',
    en: 'Barbell Bent Over Row',
    es: 'Remo con Barra Inclinado'
  },
  'dumbbell row': {
    it: 'Rematore con Manubrio',
    en: 'Dumbbell Row',
    es: 'Remo con Mancuerna'
  },
  'seated cable row': {
    it: 'Pulley Basso (Rematore ai Cavi)',
    en: 'Seated Cable Row',
    es: 'Remo en Polea Baja'
  },
  'barbell bicep curl': {
    it: 'Curl Bicipiti con Bilanciere',
    en: 'Barbell Bicep Curl',
    es: 'Curl de Bíceps con Barra'
  },
  'dumbbell bicep curl': {
    it: 'Curl Bicipiti con Manubri',
    en: 'Dumbbell Bicep Curl',
    es: 'Curl de Bíceps con Mancuernas'
  },
  'hammer curl': {
    it: 'Hammer Curl (Presa a Martello)',
    en: 'Hammer Curl',
    es: 'Curl Martillo con Mancuernas'
  },
  'barbell back squat': {
    it: 'Squat con Bilanciere',
    en: 'Barbell Back Squat',
    es: 'Sentadilla con Barra'
  },
  'front squat': {
    it: 'Front Squat con Bilanciere',
    en: 'Front Squat',
    es: 'Sentadilla Frontal'
  },
  'romanian deadlift': {
    it: 'Stacco Rumeno con Bilanciere',
    en: 'Romanian Deadlift',
    es: 'Peso Muerto Rumano con Barra'
  },
  'deadlift': {
    it: 'Stacco da Terra con Bilanciere',
    en: 'Deadlift',
    es: 'Peso Muerto con Barra'
  },
  'standing calf raise': {
    it: 'Calf in Piedi (Polpacci)',
    en: 'Standing Calf Raise',
    es: 'Elevación de Gemelos de Pie'
  },
  'seated calf raise': {
    it: 'Calf da Seduto',
    en: 'Seated Calf Raise',
    es: 'Elevación de Gemelos Sentado'
  },
  'hanging knee raise': {
    it: 'Sollevamento Ginocchia alle Parallele',
    en: 'Hanging Knee Raise',
    es: 'Elevación de Rodillas Colgado'
  },
  'hanging leg raise': {
    it: 'Sollevamento Gambe alla Sbarra',
    en: 'Hanging Leg Raise',
    es: 'Elevación de Piernas Colgado'
  },
  'push-up': {
    it: 'Piegamenti sulle Braccia (Push-up)',
    en: 'Push-up',
    es: 'Flexiones de Brazos (Push-ups)'
  },
  'pull-up': {
    it: 'Trazioni alla Sbarra (Pull-up)',
    en: 'Pull-up',
    es: 'Dominadas'
  },
  'chin-up': {
    it: 'Trazioni Supine (Chin-up)',
    en: 'Chin-up',
    es: 'Dominadas Supinas'
  },
  'leg press': {
    it: 'Leg Press 45°',
    en: 'Leg Press 45°',
    es: 'Prensa de Piernas 45°'
  },
  'leg extension': {
    it: 'Leg Extension',
    en: 'Leg Extension',
    es: 'Extensión de Cuádriceps'
  },
  'seated leg curl': {
    it: 'Leg Curl da Seduto',
    en: 'Seated Leg Curl',
    es: 'Curl Femoral Sentado'
  },
  'lying leg curl': {
    it: 'Leg Curl Sdraiato',
    en: 'Lying Leg Curl',
    es: 'Curl Femoral Tumbado'
  },
  'hip thrust': {
    it: 'Hip Thrust con Bilanciere',
    en: 'Barbell Hip Thrust',
    es: 'Hip Thrust con Barra'
  },
  'plank': {
    it: 'Plank Addominale',
    en: 'Plank',
    es: 'Plancha Abdominal'
  },
  'face pull': {
    it: 'Face Pull ai Cavi',
    en: 'Face Pull',
    es: 'Face Pull en Polea'
  },
  'dips': {
    it: 'Dip alle Parallele',
    en: 'Dips',
    es: 'Fondos en Paralelas'
  },
  'chest dip': {
    it: 'Dip per Pettorali',
    en: 'Chest Dips',
    es: 'Fondos para Pectoral'
  },
  'dumbbell overhead press': {
    it: 'Lento con Manubri',
    en: 'Dumbbell Overhead Press',
    es: 'Press Militar con Mancuernas'
  },
  'military press': {
    it: 'Military Press con Bilanciere',
    en: 'Military Press',
    es: 'Press Militar con Barra'
  },
  'sit-up': {
    it: 'Sit-up Addominali',
    en: 'Sit-up',
    es: 'Sit-up Abdominales'
  },
  '3/4 sit-up': {
    it: '3/4 Sit-up Addominali',
    en: '3/4 Sit-up',
    es: '3/4 Sit-up Abdominales'
  }
};

/**
 * Risolve e restituisce il nome visualizzato dell'esercizio in base alla lingua
 */
export function getExerciseDisplayName(exerciseOrName, lang = 'it') {
  if (!exerciseOrName) return '';
  const rawName = typeof exerciseOrName === 'string' ? exerciseOrName : exerciseOrName.name || '';
  if (!rawName) return '';

  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Se il nome ha formato bilingue "English Name (Nome Italiano)"
  const bilingualMatch = trimmed.match(/^([^(]+)\(([^)]+)\)$/);
  if (bilingualMatch) {
    const enPart = bilingualMatch[1].trim();
    const itPart = bilingualMatch[2].trim();

    if (lang === 'en') {
      return enPart;
    }
    if (lang === 'it') {
      return itPart;
    }
    if (lang === 'es') {
      const enKey = enPart.toLowerCase();
      if (COMMON_EXERCISE_TRANSLATIONS[enKey]?.es) {
        return COMMON_EXERCISE_TRANSLATIONS[enKey].es;
      }
      for (const [key, trans] of Object.entries(COMMON_EXERCISE_TRANSLATIONS)) {
        if (enKey.includes(key) && trans.es) {
          return trans.es;
        }
      }
      return enPart;
    }
  }

  // 2. Controllo dizionario per corrispondenza esatta o parziale
  for (const [key, trans] of Object.entries(COMMON_EXERCISE_TRANSLATIONS)) {
    if (lower === key || lower.includes(key)) {
      if (trans[lang]) return trans[lang];
    }
  }

  // 3. Fallback: capitalizza le parole
  return trimmed
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Estrae la descrizione / biomeccanica tradotta migliore per la lingua richiesta
 * Supporta:
 * 1. Oggetto instructions multilingua associato all'esercizio
 * 2. Lookup automatico nel dataset (in memoria o in sessionStorage) per ID, media-id, descrizione o nome
 * 3. Fallback alla descrizione esistente
 */
export function getExerciseDescription(exercise, lang = 'it') {
  if (!exercise) return '';

  // 1. Se l'esercizio ha già l'oggetto instructions multilingua
  if (exercise.instructions && typeof exercise.instructions === 'object') {
    if (exercise.instructions[lang]) return exercise.instructions[lang];
    if (lang === 'it' && exercise.instructions['it']) return exercise.instructions['it'];
    if (lang === 'en' && exercise.instructions['en']) return exercise.instructions['en'];
    if (lang === 'es' && exercise.instructions['es']) return exercise.instructions['es'];
  }

  // 2. Tenta la ricerca nel dataset in cache (in memoria o in sessionStorage)
  let dataset = cachedExercises;
  if (!dataset || dataset.length === 0) {
    try {
      const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gymlink_exercises_cache') : null;
      if (stored) {
        dataset = JSON.parse(stored);
        cachedExercises = dataset;
      }
    } catch (e) {
      // ignore
    }
  }

  if (Array.isArray(dataset) && dataset.length > 0) {
    let matchedItem = null;

    // A) Ricerca per ID diretto dell'esercizio
    if (exercise.exerciseId) {
      matchedItem = dataset.find(item => item.id === exercise.exerciseId);
    }

    // B) Ricerca per codice numerico dell'esercizio nell'URL dell'animazione o dell'immagine (es. 0025)
    if (!matchedItem && (exercise.gifUrl || exercise.imageUrl || exercise.id)) {
      const urlStr = `${exercise.gifUrl || ''} ${exercise.imageUrl || ''} ${exercise.id || ''}`;
      const idMatch = urlStr.match(/(?:exercises\/|videos\/|images\/|^|_)(\d{4})(?:[\.\-_]|$)/);
      if (idMatch && idMatch[1]) {
        matchedItem = dataset.find(item => item.id === idMatch[1]);
      }
    }

    // C) Ricerca per corrispondenza esatta delle istruzioni già presenti (trova la scheda originale nel dataset)
    if (!matchedItem && exercise.description) {
      const cleanDesc = exercise.description.trim();
      matchedItem = dataset.find(item => 
        (item.instructions?.it && item.instructions.it.trim() === cleanDesc) ||
        (item.instructions?.en && item.instructions.en.trim() === cleanDesc) ||
        (item.instructions?.es && item.instructions.es.trim() === cleanDesc)
      );
    }

    // D) Ricerca per nome esercizio (normalizzato o con stripping parentesi)
    if (!matchedItem && exercise.name) {
      const cleanName = exercise.name.toLowerCase().trim();
      matchedItem = dataset.find(item => item.name && item.name.toLowerCase() === cleanName);
      if (!matchedItem) {
        const baseName = cleanName.split('(')[0].trim();
        if (baseName.length > 3) {
          matchedItem = dataset.find(item => item.name && item.name.toLowerCase() === baseName);
        }
      }
    }

    if (matchedItem && matchedItem.instructions) {
      if (matchedItem.instructions[lang]) return matchedItem.instructions[lang];
      if (lang === 'en' && matchedItem.instructions['en']) return matchedItem.instructions['en'];
      if (lang === 'es' && matchedItem.instructions['es']) return matchedItem.instructions['es'];
      if (lang === 'it' && matchedItem.instructions['it']) return matchedItem.instructions['it'];
    }
  }

  return exercise.description || '';
}

/**
 * Traduce un muscolo target nella lingua specificata con normalizzazione bidirezionale
 */
export function translateTarget(target, lang = 'it') {
  if (!target) return '';
  const clean = target.toLowerCase().trim().replace(/_/g, ' ');
  const canonicalKey = CANONICAL_TARGET_MAP[clean] || clean.replace(/\s+/g, '_');
  return TARGET_TRANSLATIONS[lang]?.[canonicalKey] || TARGET_TRANSLATIONS['it']?.[canonicalKey] || target;
}

/**
 * Traduce un'attrezzatura nella lingua specificata con normalizzazione bidirezionale
 */
export function translateEquipment(equipment, lang = 'it') {
  if (!equipment) return '';
  const clean = equipment.toLowerCase().trim();
  const canonicalKey = CANONICAL_EQUIPMENT_MAP[clean] || clean;
  return EQUIPMENT_TRANSLATIONS[lang]?.[canonicalKey] || EQUIPMENT_TRANSLATIONS['it']?.[canonicalKey] || equipment;
}
