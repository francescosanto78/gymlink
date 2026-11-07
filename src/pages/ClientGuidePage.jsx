import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, Eye, Timer, CalendarDays, ChevronDown, StickyNote,
  TrendingUp, LayoutList, Download, ShieldCheck, Scale, ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CONTENT = {
  it: {
    title: 'Come usare la tua scheda',
    intro: 'Tutte le indicazioni per seguire al meglio il tuo allenamento, registrare i carichi e monitorare i progressi direttamente dallo smartphone.',
    steps: [
      { icon: CalendarDays, t: 'Scegli la giornata', d: 'In alto trovi i tab (Giorno A, B, C…). Tocca quello di oggi, oppure usa i pulsanti "Giorno Prec./Succ." in fondo alla pagina.' },
      { icon: LayoutList, t: 'Vista Elenco o Dettagli', d: 'Puoi alternare tra la vista compatta ad "Elenco" (ideale se conosci già la scheda, per leggere al volo serie/reps e avviare il recupero) e la vista "Dettagli" con parametri completi.' },
      { icon: TrendingUp, t: 'Aggiorna i tuoi carichi (Peso)', d: 'Quando aumenti il carico su un esercizio, tocca il riquadro "Carico" per inserire il nuovo peso. Se modifichi il peso più volte nella stessa giornata, il sistema conserva automaticamente l\'ultimo valore.' },
      { icon: Scale, t: 'Grafico di progressione & Trendline', d: 'Tocca l\'icona del grafico accanto al carico per vedere l\'andamento dei tuoi pesi negli ultimi 3 mesi (~12 settimane), con la linea di tendenza e le frecce per consultare i trimestri passati.' },
      { icon: Timer, t: 'Timer di recupero con 1 tocco', d: 'Tocca il riquadro "Recupero" o l\'icona del play per avviare il countdown tra una serie e l\'altra. Funziona sia nella vista estesa che nella vista compatta.' },
      { icon: Eye, t: 'Animazioni biomeccaniche & Istruzioni', d: 'Tocca l\'immagine dell\'esercizio o "Animazione" per vedere la GIF del movimento e leggere le indicazioni biomeccaniche.' },
      { icon: StickyNote, t: 'Note tecniche del PT', d: 'Sotto ogni esercizio trovi le indicazioni speciali del tuo trainer: tempi di esecuzione, ripetizioni in riserva (RIR), impostazione scapolare o sensazioni.' },
      { icon: CheckCircle2, t: 'Segna gli esercizi completati', d: 'Tocca il badge numerico a sinistra di ogni esercizio per spuntarlo man mano che completi le serie. La barra in alto calcola la percentuale di completamento della seduta.' },
      { icon: Download, t: 'Progressioni globali & Scarica dati', d: 'In cima alla scheda trovi il pulsante "📊 Progressioni & Scarica Dati" per visualizzare tutte le variazioni di peso e scaricare un file Excel CSV oppure copiare il report per il tuo PT o per un\'AI.' },
      { icon: ShieldCheck, t: 'Riservatezza del tuo link', d: 'Il link della scheda è strettamente personale e non richiede login: conservalo nei tuoi preferiti e non condividerlo pubblicamente per evitare modifiche accidentali ai tuoi dati di allenamento.' }
    ]
  },
  en: {
    title: 'How to use your routine',
    intro: 'Everything you need to follow your workout, track weights, and inspect your progress directly from your smartphone.',
    steps: [
      { icon: CalendarDays, t: 'Pick the workout day', d: 'Tabs at the top (Day A, B, C…). Tap today\'s routine, or use the "Prev Day" / "Next Day" buttons at the bottom.' },
      { icon: LayoutList, t: 'List vs Details view mode', d: 'Switch between compact "List" view (perfect for quick reading and 1-tap rest countdowns) and extended "Details" view.' },
      { icon: TrendingUp, t: 'Update your weights', d: 'Whenever you increase your load, tap the "Weight" card to log the new weight. Multiple edits on the same day are automatically consolidated into that day\'s latest value.' },
      { icon: Scale, t: 'Progression chart & Trendline', d: 'Tap the chart icon next to the weight to inspect your 3-month (~12 weeks) progression window with an automated trendline and quarterly navigation.' },
      { icon: Timer, t: '1-tap rest countdown timer', d: 'Tap the "Rest" box or the play icon to start the rest timer between sets, with acoustic alert upon completion.' },
      { icon: Eye, t: 'Biomechanical GIFs & Instructions', d: 'Tap the exercise thumbnail or "Animation" to inspect verified execution GIFs and step-by-step biomechanical cues.' },
      { icon: StickyNote, t: 'Trainer notes', d: 'Under each exercise, check personal guidelines from your trainer regarding tempo, RIR/RPE, posture, and execution cues.' },
      { icon: CheckCircle2, t: 'Tick completed exercises', d: 'Tap the badge number on the left of each exercise to check it off. Active session completion is tracked in real-time.' },
      { icon: Download, t: 'Global progress & Export data', d: 'Tap "📊 Progressions & Export Data" at the top to inspect all weight adjustments across all exercises and export a clean CSV or AI-ready table.' },
      { icon: ShieldCheck, t: 'Privacy & Link security', d: 'Your routine link is strictly personal with zero sign-up friction: bookmark it and keep it private to avoid unwanted modifications.' }
    ]
  },
  es: {
    title: 'Cómo usar tu rutina',
    intro: 'Todas las pautas para seguir tu entrenamiento, registrar cargas y supervisar tu progreso desde tu móvil.',
    steps: [
      { icon: CalendarDays, t: 'Elige el día', d: 'Arriba verás las pestañas (Día A, B, C…). Toca la de hoy o usa los botones "Día Ant." / "Día Sig." al final de la página.' },
      { icon: LayoutList, t: 'Vista Lista o Detalles', d: 'Alterna entre la vista compacta "Lista" (para leer series/reps al vuelo e iniciar descanso con 1 toque) y la vista "Detalles" con biomecánica completa.' },
      { icon: TrendingUp, t: 'Actualiza tus cargas (Peso)', d: 'Cuando subas de peso, toca la tarjeta de "Carga" para anotar el nuevo valor. Varias modificaciones en un mismo día se consolidan automáticamente.' },
      { icon: Scale, t: 'Gráfico de progresión y tendencia', d: 'Toca el icono de gráfico junto a la carga para ver tu evolución en los últimos 3 meses (~12 semanas), con línea de tendencia y navegación trimestral.' },
      { icon: Timer, t: 'Temporizador de descanso', d: 'Toca el recuadro "Descanso" o el icono de reproducción para iniciar la cuenta atrás entre series con aviso sonoro.' },
      { icon: Eye, t: 'Animaciones biomecánicas', d: 'Toca la imagen o "Animación" para ver el GIF del ejercicio y leer las instrucciones biomecánicas de ejecución.' },
      { icon: StickyNote, t: 'Notas del entrenador', d: 'Bajo cada ejercicio encontrarás recomendaciones de tu preparador: tempo, descansos, respiración y pautas técnicas.' },
      { icon: CheckCircle2, t: 'Marca los ejercicios completados', d: 'Toca el número a la izquierda de cada ejercicio para marcarlo. El progreso de la sesión se calcula automáticamente en la cabecera.' },
      { icon: Download, t: 'Progresiones globales y exportar', d: 'Arriba encontrarás "📊 Progresiones & Descargar Datos" para ver todos los aumentos y descargar un CSV para Excel o copiar el reporte para tu entrenador o IA.' },
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

