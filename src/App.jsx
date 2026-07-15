import { useMemo, useState } from 'react';
import { DEFAULTS, project, survives } from './fireModel';
import { minGrossToNotRunOut, simulateHistorical, simulateMonteCarlo } from './sim';
import InputPanel from './components/InputPanel';
import NetWorthChart from './components/NetWorthChart';
import ProjectionTable from './components/ProjectionTable';
import RentVsBuy from './components/RentVsBuy';
import SummaryCard from './components/SummaryCard';
import SimChart from './components/SimChart';
import SimSummary from './components/SimSummary';
import SimTable from './components/SimTable';
import SolverBanner from './components/SolverBanner';

const MODES = [
  { id: 'fixed', label: 'Fixed return' },
  { id: 'historical', label: 'Historical' },
  { id: 'montecarlo', label: 'Monte Carlo' },
];

function ModeTabs({ mode, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === m.id
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState(() => ({ ...DEFAULTS }));
  const [mode, setMode] = useState('fixed');
  const [dollars, setDollars] = useState('today'); // 'today' | 'nominal'

  const setField = (key, value) => setConfig((c) => ({ ...c, [key]: value }));
  const reset = () => setConfig({ ...DEFAULTS });

  // Recompute live on every input change.
  const rows = useMemo(() => project(config), [config]);
  const ok = useMemo(() => survives(config), [config]);
  const sim = useMemo(() => {
    if (mode === 'historical') return simulateHistorical(config);
    if (mode === 'montecarlo') return simulateMonteCarlo(config);
    return null;
  }, [config, mode]);
  const minGross = useMemo(() => minGrossToNotRunOut(config, mode), [config, mode]);

  const badge =
    mode === 'fixed'
      ? { text: ok ? 'Plan survives' : 'Plan runs out', good: ok }
      : {
          text: `${Math.round(sim.successRate * 100)}% success`,
          good: sim.successRate >= 0.9,
          warn: sim.successRate >= 0.75 && sim.successRate < 0.9,
        };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
        <div>
          <h1 className="text-lg font-semibold">FIRE Calculator</h1>
          <p className="text-xs text-slate-400">
            Year-by-year projection — buckets, cap-gains withdrawals, Roth ladder, rent vs buy, college, SS &amp; inflation
          </p>
        </div>
        <ModeTabs mode={mode} onChange={setMode} />
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            badge.good
              ? 'bg-emerald-500/15 text-emerald-300'
              : badge.warn
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-red-500/15 text-red-300'
          }`}
        >
          {badge.text}
        </span>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <InputPanel config={config} setField={setField} onReset={reset} mode={mode} />
        <main className="flex-1 space-y-5 overflow-y-auto p-5">
          <SolverBanner
            minGross={minGross}
            mode={mode}
            sim={sim}
            onApply={(net) => setField('incomeToday', net)}
          />
          {mode === 'fixed' ? (
            <>
              <SummaryCard rows={rows} survives={ok} config={config} />
              <NetWorthChart rows={rows} dollars={dollars} onToggle={setDollars} />
              <RentVsBuy config={config} dollars={dollars} />
              <ProjectionTable rows={rows} dollars={dollars} />
            </>
          ) : (
            <>
              <SimSummary sim={sim} config={config} mode={mode} />
              <SimChart sim={sim} mode={mode} />
              <SimTable sim={sim} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
