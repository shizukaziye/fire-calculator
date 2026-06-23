// A single labelled stat tile, shared by the fixed-mode and simulation summaries.
export default function Stat({ label, value, sub, tone }) {
  const valueTone =
    tone === 'pos'
      ? 'text-emerald-400'
      : tone === 'neg'
        ? 'text-red-400'
        : tone === 'warn'
          ? 'text-amber-300'
          : 'text-slate-100';
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
