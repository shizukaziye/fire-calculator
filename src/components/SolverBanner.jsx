import { takeHome } from '../fireModel';
import { fmtUSD } from '../format';

const targetLabel = (mode, sim) => {
  if (mode === 'historical')
    return `so ≥90% of the ${sim ? sim.trials + ' ' : ''}historical sequences (1928–2025 data) survive`;
  if (mode === 'montecarlo') return 'so ≥90% of Monte Carlo paths survive';
  return 'so the projection never runs out';
};

export default function SolverBanner({ minGross, mode, sim, onApply }) {
  let content;

  if (minGross === 0) {
    content = (
      <div>
        <p className="text-sm font-medium text-emerald-300">
          Survives with $0 earned income
        </p>
        <p className="text-xs text-slate-400">
          Your starting portfolio alone carries the plan {targetLabel(mode, sim)}.
        </p>
      </div>
    );
  } else if (!Number.isFinite(minGross)) {
    content = (
      <div>
        <p className="text-sm font-medium text-amber-300">
          No salary alone can make this survive
        </p>
        <p className="text-xs text-slate-400">
          Even $3M/yr can&apos;t reach the target {targetLabel(mode, sim)} — cut
          spending, shorten the timeline, or check that you still have working
          years before retirement.
        </p>
      </div>
    );
  } else {
    const net = Math.round(takeHome(minGross));
    content = (
      <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Minimum gross salary to not run out
          </p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-300">
            {fmtUSD(minGross)}
            <span className="text-sm font-normal text-slate-400">/yr</span>
          </p>
          <p className="text-xs text-slate-400">
            ≈ {fmtUSD(net)} take-home · {targetLabel(mode, sim)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApply(net)}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Use this income
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-4">
      <span className="text-xl" aria-hidden>
        💡
      </span>
      {content}
    </div>
  );
}
