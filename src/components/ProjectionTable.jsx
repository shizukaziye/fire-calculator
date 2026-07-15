import { fmtUSD } from '../format';

// Each money column is stored nominal; we deflate by the row's inflation factor
// when the view is in today's dollars.
const COLS = [
  { key: 'income', label: 'Income' },
  { key: 'spend', label: 'Spend' },
  { key: 'housing', label: 'Housing' },
  { key: 'taxPaid', label: 'Tax' },
  { key: 'usable', label: 'Usable' },
  { key: 'unusable', label: 'Locked' },
  { key: 'homeEquity', label: 'Home eq' },
];

const STAGE_STYLE = {
  solo: 'bg-violet-500/15 text-violet-300',
  married: 'bg-pink-500/15 text-pink-300',
  family: 'bg-amber-500/15 text-amber-300',
};

export default function ProjectionTable({ rows, dollars }) {
  const today = dollars === 'today';
  const show = (r, v) => (today ? Math.round(v / r.infl) : v);
  const netWorth = (r) => (today ? r.netWorthToday : r.netWorthNominal);
  const afterTax = (r) => (today ? r.afterTaxToday : r.afterTaxNominal);
  const hasHome = rows.some((r) => r.homeEquity > 0);
  const cols = hasHome ? COLS : COLS.filter((c) => c.key !== 'homeEquity');

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Year-by-year projection</h2>
        <span className="text-xs text-slate-500">
          values in {today ? "today's $" : 'nominal $'}
        </span>
      </div>
      <div className="max-h-[440px] overflow-auto rounded border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400">
            <tr>
              <th className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-left font-medium">Age</th>
              <th className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-left font-medium">Status</th>
              {cols.map((c) => (
                <th key={c.key} className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-right font-medium">
                  {c.label}
                </th>
              ))}
              <th className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-right font-medium">Net worth</th>
              <th className="whitespace-nowrap border-b border-slate-700 px-3 py-2 text-right font-medium">After-tax</th>
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
                      r.working ? 'bg-sky-500/15 text-sky-300' : 'bg-slate-600/30 text-slate-300'
                    }`}
                  >
                    {r.working ? 'working' : 'retired'}
                  </span>{' '}
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[11px] ${STAGE_STYLE[r.stage]}`}
                  >
                    {r.stage}
                  </span>
                </td>
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-1.5 text-right tabular-nums ${
                      (c.key === 'unusable' && r.unusable > 0) || c.key === 'taxPaid'
                        ? 'text-slate-400'
                        : ''
                    }`}
                  >
                    {fmtUSD(show(r, r[c.key]))}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right font-medium tabular-nums">{fmtUSD(netWorth(r))}</td>
                <td className="px-3 py-1.5 text-right font-medium tabular-nums text-emerald-300/90">
                  {fmtUSD(afterTax(r))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        <span className="text-slate-400">Tax</span> = tax paid on this year&apos;s
        withdrawals (cap-gains gross-up on taxable, ordinary on pre-tax; filing
        single until marriage, then MFJ). <span className="text-slate-400">Usable</span>{' '}
        = money you can spend now. <span className="text-slate-400">Locked</span> =
        retirement money you can&apos;t touch yet.{' '}
        <span className="text-slate-400">After-tax</span> = liquidation value —
        taxable less the cap-gains haircut, pre-tax less its haircut, home equity
        net of selling costs and the Sec-121 exclusion. Housing in the buy year
        includes the down payment + closing costs. Red rows = the plan has run out.
      </p>
    </section>
  );
}
