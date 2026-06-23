import { fmtUSD } from '../format';

const COLS = [
  { key: 'age', label: 'Age', align: 'left' },
  { key: 'status', label: 'Status', align: 'left' },
  { key: 'income', label: 'Income', align: 'right' },
  { key: 'spend', label: 'Spend', align: 'right' },
  { key: 'housing', label: 'Housing', align: 'right' },
  { key: 'accessible', label: 'Accessible', align: 'right' },
  { key: 'locked', label: 'Locked (avail)', align: 'right' },
  { key: 'netWorthNominal', label: 'Net worth (nom.)', align: 'right' },
  { key: 'netWorthToday', label: "Net worth (today $)", align: 'right' },
];

export default function ProjectionTable({ rows }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">
        Year-by-year projection
      </h2>
      <div className="max-h-[440px] overflow-auto rounded border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400">
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`whitespace-nowrap border-b border-slate-700 px-3 py-2 font-medium ${
                    c.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.age}
                className={
                  r.depleted
                    ? 'bg-red-950/70 text-red-200'
                    : 'odd:bg-slate-900/30 hover:bg-slate-800/40'
                }
              >
                <td className="px-3 py-1.5 tabular-nums">{r.age}</td>
                <td className="px-3 py-1.5">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[11px] ${
                      r.working
                        ? 'bg-sky-500/15 text-sky-300'
                        : 'bg-slate-600/30 text-slate-300'
                    }`}
                  >
                    {r.working ? 'working' : 'retired'}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.income)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.spend)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.housing)}</td>
                <td
                  className={`px-3 py-1.5 text-right tabular-nums ${
                    r.accessible < 0 && !r.depleted ? 'text-amber-300' : ''
                  }`}
                >
                  {fmtUSD(r.accessible)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.locked)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.netWorthNominal)}</td>
                <td className="px-3 py-1.5 text-right font-medium tabular-nums">{fmtUSD(r.netWorthToday)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Rows where the accessible bucket runs negative are highlighted in red
        (the plan is depleting). “Locked (avail)” is the locked bucket once it
        becomes reachable (Roth ladder / age&nbsp;59.5).
      </p>
    </section>
  );
}
