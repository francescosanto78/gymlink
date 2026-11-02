import React from 'react';
import { CheckCircle2, Eye, Timer, CalendarDays, ChevronDown, StickyNote } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CONTENT = {
  it: {
    title: 'Come usare la tua scheda',
    intro: 'Poche indicazioni per seguire al meglio il tuo allenamento direttamente dal telefono.',
    steps: [
      { icon: CalendarDays, t: 'Scegli la giornata', d: 'In alto trovi i tab (Giorno A, B, C…). Tocca quello di oggi, oppure usa "Giorno Prec./Succ." in fondo alla pagina.' },
      { icon: Eye, t: 'Guarda come si fa', d: 'Tocca l\'immagine o "Animazione" per vedere il movimento animato e le istruzioni di esecuzione.' },
      { icon: StickyNote, t: 'Leggi le note del PT', d: 'Sotto ogni esercizio trovi eventuali indicazioni personalizzate del tuo trainer (tempi, tecnica, sensazioni).' },
      { icon: Timer, t: 'Usa il timer di recupero', d: 'Tocca il riquadro "Recupero" per avviare il conto alla rovescia tra una serie e l\'altra.' },
      { icon: CheckCircle2, t: 'Segna gli esercizi completati', d: 'Tocca il numero a sinistra di ogni esercizio per spuntarlo. Il progresso è mostrato in alto.' },
      { icon: ChevronDown, t: 'Dettagli scheda', d: 'Il riquadro iniziale con note generali si chiude da solo scorrendo; riaprilo con il pulsante "Dettagli".' }
    ]
  },
  en: {
    title: 'How to use your workout',
    intro: 'A few tips to follow your training straight from your phone.',
    steps: [
      { icon: CalendarDays, t: 'Pick the day', d: 'Tabs at the top (Day A, B, C…). Tap today\'s one, or use the Prev/Next buttons at the bottom.' },
      { icon: Eye, t: 'See how it\'s done', d: 'Tap the image or "Animation" to watch the movement and read the instructions.' },
      { icon: StickyNote, t: 'Read your trainer\'s notes', d: 'Under each exercise you may find personal tips (tempo, technique, feeling).' },
      { icon: Timer, t: 'Use the rest timer', d: 'Tap the "Rest" box to start a countdown between sets.' },
      { icon: CheckCircle2, t: 'Mark exercises as done', d: 'Tap the number on the left of an exercise to tick it. Progress is shown at the top.' },
      { icon: ChevronDown, t: 'Workout details', d: 'The top card with general notes collapses as you scroll; reopen it with the "Details" button.' }
    ]
  },
  es: {
    title: 'Cómo usar tu ficha',
    intro: 'Unas indicaciones para seguir tu entrenamiento desde el móvil.',
    steps: [
      { icon: CalendarDays, t: 'Elige el día', d: 'Arriba verás las pestañas (Día A, B, C…). Toca la de hoy o usa los botones Anterior/Siguiente al final.' },
      { icon: Eye, t: 'Mira cómo se hace', d: 'Toca la imagen o "Animación" para ver el movimiento y las instrucciones.' },
      { icon: StickyNote, t: 'Lee las notas del entrenador', d: 'Bajo cada ejercicio puede haber indicaciones personalizadas.' },
      { icon: Timer, t: 'Usa el temporizador', d: 'Toca el cuadro "Descanso" para iniciar la cuenta atrás entre series.' },
      { icon: CheckCircle2, t: 'Marca los ejercicios hechos', d: 'Toca el número a la izquierda para marcarlo. El progreso aparece arriba.' },
      { icon: ChevronDown, t: 'Detalles de la ficha', d: 'La tarjeta inicial se cierra al hacer scroll; ábrela con el botón "Detalles".' }
    ]
  }
};

export default function ClientGuidePage() {
  const { lang } = useLanguage();
  const c = CONTENT[lang] || CONTENT.it;

  return (
    <div className="gl-page-in max-w-[700px] mx-auto px-4 pt-4 pb-12 space-y-4">
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
    </div>
  );
}

