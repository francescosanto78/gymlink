/** @type {import('tailwindcss').Config} */
// I colori puntano alle variabili CSS definite in src/index.css (triplette RGB),
// così la palette si cambia in un unico punto e funzionano i modificatori di opacità (es. bg-acc/10).
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        bg2: v('bg2'),
        card: v('card'),
        surf: v('surf'),
        surf2: v('surf2'),
        line: v('line'),
        line2: v('line2'),
        sline: v('sline'),
        fg: v('fg'),
        dim: v('dim'),
        acc: v('acc'),
        acc2: v('acc2'),
        ink: v('ink'),
        warn: v('warn'),
        info: v('info'),
        danger: v('danger'),
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
        // Font dot-matrix usato da FMDB per titoli e statistiche
        dot: ['Doto', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
