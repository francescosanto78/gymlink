import React, { useState, useEffect } from 'react';
import { BarChart3, Database, Eye, Activity, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getGlobalStats } from '../services/workoutService';

export default function StatsPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ totalWorkouts: null, totalViews: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getGlobalStats();
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      } catch (e) {
        console.warn(e);
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const kpis = [
    {
      label: t('statsKpiWorkouts') || 'SCHEDE CREATE',
      value: loading ? '--' : stats.totalWorkouts ?? 0,
      color: 'rgb(var(--c-acc))',
      icon: Activity
    },
    {
      label: t('statsKpiViews') || 'VISUALIZZAZIONI ATLETI',
      value: loading ? '--' : stats.totalViews ?? 0,
      color: 'rgb(var(--c-info))',
      icon: Eye
    },
  ];

  return (
    <div className="gl-page-in max-w-[1100px] mx-auto px-4 pt-4 pb-10 space-y-4">
      <section className="gl-panel px-5 sm:px-7 py-6 gl-rise">
        <div className="gl-eyebrow flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-acc" />
          <span>{t('statsSub') || 'TELEMETRIA PUBBLICA IN TEMPO REALE'}</span>
        </div>
        <h1 className="font-dot font-black text-[clamp(40px,6vw,72px)] leading-[0.95] text-acc [text-shadow:0_0_40px_var(--glow)] m-0">
          {t('navStats') || 'STATISTICHE'}
        </h1>
        <p className="text-xs text-dim font-mono mt-3 max-w-xl">
          Metriche aggregate del database cloud Supabase. Zero tracciamento personale, zero cookie pubblicitari: solo il polso dell'utilizzo reale dell'ecosistema.
        </p>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className="gl-card p-5 gl-rise" style={{ '--fc': k.color, '--d': `${80 + i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <span className="gl-eyebrow" style={{ color: k.color }}>{k.label}</span>
              <k.icon className="w-4 h-4 opacity-70" style={{ color: k.color }} />
            </div>
            <div
              className="font-dot font-black text-[56px] leading-none mt-3"
              style={{ color: k.color, textShadow: `0 0 30px color-mix(in srgb, ${k.color} 35%, transparent)` }}
            >
              {k.value}
            </div>
            <p className="text-[11px] font-mono text-dim mt-3">
              {loading ? 'Interrogazione database in corso...' : 'Dati sincronizzati in tempo reale'}
            </p>
          </div>
        ))}
      </div>

      {/* Riquadro trasparenza architettura */}
      <section className="gl-card gl-rise" style={{ '--d': '220ms' }}>
        <div className="gl-card-head flex items-center gap-2.5">
          <Database className="w-4 h-4 text-acc" />
          <h3 className="font-dot font-extrabold text-[17px] tracking-wide text-fg">ARCHITETTURA BACKEND</h3>
        </div>
        <div className="p-5 space-y-3 text-xs text-dim leading-relaxed font-sans">
          <p>
            Tutti i protocolli di allenamento sono archiviati su database distribuito PostgreSQL protetto tramite Row Level Security (RLS).
            Il conteggio delle visualizzazioni avviene via chiamata RPC atomica (Remote Procedure Call) che previene duplicazioni accidentali dovute al refresh di pagina.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-sline text-[11px] font-mono text-acc">
            <ShieldCheck className="w-4 h-4 text-acc shrink-0" />
            <span>Nessun dato personale o indirizzo email memorizzato nel database.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
