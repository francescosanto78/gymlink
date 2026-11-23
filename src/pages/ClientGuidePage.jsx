import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, Eye, Timer, CalendarDays, ChevronDown, StickyNote,
  TrendingUp, LayoutList, Download, ShieldCheck, Scale, ArrowLeft, Play, Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CONTENT = {
  it: {
    title: 'Come usare la tua scheda',
    intro: 'Tutte le indicazioni per seguire al meglio il tuo allenamento, registrare i carichi e monitorare i progressi direttamente dallo smartphone.',
    steps: [
      { icon: CalendarDays, t: 'Scegli la giornata', d: 'In alto trovi i tab (Giorno A, B, C…). Tocca quello di oggi, oppure usa i pulsanti "Giorno Prec./Succ." in fondo alla pagina.' },
      { icon: Play, t: 'Allenamento Guidato step-by-step', d: 'Tocca "▶ Allenamento Guidato" e scegli la giornata: segui un esercizio alla volta con barra di avanzamento sulle singole serie, timer zoomato (con Pausa, Salta recupero e Modifica peso) e frasi motivazionali. Se il telefono va in standby o si blocca, alla riapertura ti chiede automaticamente di riprendere da dove avevi lasciato.' },
      { icon: LayoutList, t: 'Vista Elenco o Dettagli', d: 'Puoi alternare tra la vista compatta ad "Elenco" (ideale se conosci già la scheda, per leggere al volo serie/reps e avviare il recupero) e la vista "Dettagli" con parametri completi.' },
      { icon: Layers, t: 'Serie differenziate (Piramidali)', d: 'Se il tuo PT ha impostato serie con carichi o ripetizioni differenti (es. piramidali), in modalità Dettagli vedrai una riga dedicata per ogni serie (S1..S5) con il proprio peso modificabile e timer singolo.' },
      { icon: TrendingUp, t: 'Aggiorna i tuoi carichi (Peso)', d: 'Quando aumenti il carico su un esercizio o su una singola serie, tocca il peso per aggiornarlo. Se modifichi il carico più volte nella stessa giornata, il sistema conserva automaticamente l\'ultimo valore finale.' },
      { icon: Scale, t: 'Grafico di progressione & Trendline', d: 'Tocca l\'icona del grafico accanto al carico per vedere l\'andamento dei tuoi pesi negli ultimi 3 mesi (~12 settimane), con la linea di tendenza, il filtro per singola serie nei piramidali e le frecce trimestrali.' },
      { icon: Timer, t: 'Timer di recupero con 1 tocco', d: 'Tocca il riquadro "Recupero" o l\'icona del play per avviare il countdown tra una serie e l\'altra. Funziona sia nella vista estesa che nella vista compatta.' },
      { icon: Eye, t: 'Animazioni biomeccaniche & Istruzioni', d: 'Tocca l\'immagine dell\'esercizio o "Animazione" per vedere la GIF del movimento e leggere le indicazioni biomeccaniche.' },
      { icon: StickyNote, t: 'Note tecniche del PT', d: 'Sotto ogni esercizio trovi le indicazioni speciali del tuo trainer: tempi di esecuzione, ripetizioni in riserva (RIR), impostazione scapolare o sensazioni.' },
      { icon: CheckCircle2, t: 'Smarca singole serie ed esercizi', d: 'Anche fuori dall\'Allenamento Guidato puoi spuntare manualmente ogni singola serie (i bottoni S1, S2…) oppure l\'intero esercizio. Quando completi tutte le serie l\'esercizio si spunta da solo e il progresso della giornata resta memorizzato sul dispositivo.' },
      { icon: Download, t: 'Progressioni globali & Scarica dati', d: 'In cima alla scheda trovi il pulsante "📊 Progressioni & Scarica Dati" per visualizzare tutte le variazioni di peso e scaricare un file Excel CSV (con colonne dedicate Serie 1..Serie 5) oppure copiare il report per il tuo PT o per un\'AI.' },
      { icon: ShieldCheck, t: 'Riservatezza del tuo link', d: 'Il link della scheda è strettamente personale e non richiede login: conservalo nei tuoi preferiti e non condividerlo pubblicamente per evitare modifiche accidentali ai tuoi dati di allenamento.' }
    ]
  },
  en: {
    title: 'How to use your routine',
    intro: 'Everything you need to follow your workout, track weights, and inspect your progress directly from your smartphone.',
    steps: [
      { icon: CalendarDays, t: 'Pick the workout day', d: 'Tabs at the top (Day A, B, C…). Tap today\'s routine, or use the "Prev Day" / "Next Day" buttons at the bottom.' },
      { icon: Play, t: 'Guided Workout step-by-step', d: 'Tap "▶ Guided Workout" and pick your day: focus on one exercise at a time with a set-weighted progress bar, zoomed timer (Pause, Skip rest, and live Weight edit), and encouraging messages. If your phone locks or resets, reopening asks to resume right where you left off.' },
      { icon: LayoutList, t: 'List vs Details view mode', d: 'Switch between compact "List" view (perfect for quick reading and 1-tap rest countdowns) and extended "Details" view.' },
      { icon: Layers, t: 'Per-set rows (Pyramids & variable sets)', d: 'If your trainer programmed varying reps or weights per set (pyramids), Details mode shows 1 clean row per set (S1..S5) with editable weights and individual rest buttons.' },
      { icon: TrendingUp, t: 'Update your weights', d: 'Whenever you increase your load on an exercise or individual set, tap the weight to log the new load. Multiple edits on the same day automatically consolidate into that day\'s latest values.' },
      { icon: Scale, t: 'Progression chart & Trendline', d: 'Tap the chart icon next to the weight to inspect your 3-month (~12 weeks) progression window with a linear trendline, per-set filter pills, and quarterly navigation.' },
      { icon: Timer, t: '1-tap rest countdown timer', d: 'Tap the "Rest" box or the play icon to start the rest timer between sets, with acoustic alert upon completion.' },
      { icon: Eye, t: 'Biomechanical GIFs & Instructions', d: 'Tap the exercise thumbnail or "Animation" to inspect verified execution GIFs and step-by-step biomechanical cues.' },
      { icon: StickyNote, t: 'Trainer notes', d: 'Under each exercise, check personal guidelines from your trainer regarding tempo, RIR/RPE, posture, and execution cues.' },
      { icon: CheckCircle2, t: 'Check off sets & exercises manually', d: 'Even outside Guided Workout mode, you can manually tap S1, S2… pills to check off individual sets or the exercise badge. Completing all sets auto-checks the exercise, and daily progress stays saved on your device.' },
      { icon: Download, t: 'Global progress & Export data', d: 'Tap "📊 Progressions & Export Data" at the top to inspect all weight adjustments and export a clean CSV with Set 1..Set 5 columns or copy an AI-ready table.' },
      { icon: ShieldCheck, t: 'Privacy & Link security', d: 'Your routine link is strictly personal with zero sign-up friction: bookmark it and keep it private to avoid unwanted modifications.' }
    ]
  },
  es: {
    title: 'Cómo usar tu rutina',
    intro: 'Todas las pautas para seguir tu entrenamiento, registrar cargas y supervisar tu progreso desde tu móvil.',
    steps: [
      { icon: CalendarDays, t: 'Elige el día', d: 'Arriba verás las pestañas (Día A, B, C…). Toca la de hoy o usa los botones "Día Ant." / "Día Sig." al final de la página.' },
      { icon: Play, t: 'Entrenamiento Guiado paso a paso', d: 'Pulsa "▶ Entrenamiento Guiado" y elige el día: enfócate en un ejercicio a la vez con barra de progreso por serie, temporizador ampliado (Pausa, Saltar descanso y edición rápida de peso) y frases motivadoras. Si el móvil se bloquea, al volver te preguntará si deseas continuar donde lo dejaste.' },
      { icon: LayoutList, t: 'Vista Lista o Detalles', d: 'Alterna entre la vista compacta "Lista" (para leer series/reps al vuelo e iniciar descanso con 1 toque) y la vista "Detalles" con biomecánica completa.' },
      { icon: Layers, t: 'Series diferenciadas (Pirámides)', d: 'Si tu entrenador programó series con repeticiones o cargas distintas, en Detalles verás una fila por serie (S1..S5) con peso editable y temporizador individual.' },
      { icon: TrendingUp, t: 'Actualiza tus cargas (Peso)', d: 'Cuando subas de peso en un ejercicio o serie, toca la carga para anotar el nuevo valor. Varias modificaciones en el mismo día se consolidan automáticamente.' },
      { icon: Scale, t: 'Gráfico de progresión y tendencia', d: 'Toca el icono de gráfico junto a la carga para ver tu evolución en los últimos 3 meses (~12 semanas), con línea de tendencia y filtro por serie.' },
      { icon: Timer, t: 'Temporizador de descanso', d: 'Toca el recuadro "Descanso" o el icono de reproducción para iniciar la cuenta atrás entre series con aviso sonoro.' },
      { icon: Eye, t: 'Animaciones biomecánicas', d: 'Toca la imagen o "Animación" para ver el GIF del ejercicio y leer las instrucciones biomecánicas de ejecución.' },
      { icon: StickyNote, t: 'Notas del entrenador', d: 'Bajo cada ejercicio encontrarás recomendaciones de tu preparador: tempo, descansos, respiración y pautas técnicas.' },
      { icon: CheckCircle2, t: 'Marca series y ejercicios manualmente', d: 'También fuera del Entrenamiento Guiado puedes marcar manualmente cada serie (S1, S2…) o el ejercicio completo. Al completar todas las series el ejercicio se marca solo y el avance del día queda guardado en tu dispositivo.' },
      { icon: Download, t: 'Progresiones globales y exportar', d: 'Arriba encontrarás "📊 Progresiones & Descargar Datos" para descargar un CSV para Excel (con columnas Serie 1..Serie 5) o copiar el reporte para tu entrenador o IA.' },
      { icon: ShieldCheck, t: 'Seguridad y privacidad del enlace', d: 'Tu enlace es estrictamente personal: guárdalo en favoritos y no lo compartas públicamente para evitar alteraciones accidentales en tus cargas.' }
    ]
  }
};

export default function ClientGuidePage() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const c = CONTENT[lang] || CONTENT.it;

  return (
    <div className="gl-page-in max-w-[700px] mx-auto px-4 pt-4 pb-12 space-y-4">
      {/* Barra Superiore: Navigazione & Badge */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="gl-btn !h-8 !px-3 !rounded-lg text-dim hover:text-acc font-mono text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Indietro</span>
        </button>
        <span className="gl-tag" style={{ '--fc': 'rgb(var(--c-acc))' }}>
          {t('clientGuideBadge')}
        </span>
      </div>

      <div className="gl-panel p-6 space-y-2">
        <h1 className="font-dot font-black text-2xl text-fg">{c.title}</h1>
        <p className="text-sm text-dim font-sans">{c.intro}</p>
      </div>
      <ol className="space-y-3">
        {c.steps.map((s, i) => (
          <li key={i} className="gl-card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-acc/10 border border-acc/40 grid place-items-center text-acc shrink-0">
              <s.icon className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-bold text-fg text-sm font-sans">{i + 1}. {s.t}</h2>
              <p className="text-xs text-dim leading-relaxed font-sans">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Link al Manuale PT se a visualizzare la pagina è un preparatore */}
      <div className="pt-4 text-center">
        <Link
          to="/tutorial"
          className="text-xs font-mono text-dim hover:text-acc inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Sei un Personal Trainer?</span>
          <span className="underline font-bold text-fg">Consulta il Manuale Operativo PT ➔</span>
        </Link>
      </div>
    </div>
  );
}

