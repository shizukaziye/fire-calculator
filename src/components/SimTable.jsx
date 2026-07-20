import { fmtUSD } from '../format';

const COLS = [
  { key: 'p10', label: '10th pct' },
  { key: 'p25', label: '25th pct' },
  { key: 'p50', label: 'Median' },
  { key: 'p75', label: '75th pct' },
  { key: 'p90', label: '90th pct' },
];

export default function SimTable({ sim }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">
        Net worth percentiles by age (today&apos;s $)
      </h2>
      <div className="max-h-[440px] overflow-auto rounded border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400">
            <tr>
              <th className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-left font-medium">
                Age
              </th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-right font-medium"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sim.bands.map((b) => {
              const tone =
                b.p50 < 0
                  ? 'bg-red-950/70 text-red-200'
                  : b.p10 < 0
                    ? 'bg-amber-950/50 text-amber-100'
                    : 'odd:bg-slate-900/30 hover:bg-slate-800/40';
              return (
                <tr key={b.age} className={tone}>
                  <td className="px-3 py-1.5 tabular-nums">{b.age}</td>
                  {COLS.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-1.5 text-right tabular-nums ${
                        c.key === 'p50' ? 'font-medium' : ''
                      }`}
                    >
                      {fmtUSD(b[c.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Amber rows: the 10th-percentile path is already below zero by this age.
        Red rows: even the median path is negative. Percentiles are computed
        across all {sim.trials.toLocaleString()} simulated paths.
      </p>
    </section>
  );
}
