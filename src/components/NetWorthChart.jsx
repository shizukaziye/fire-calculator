import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtUSD, fmtUSDcompact } from '../format';

function DollarToggle({ dollars, onToggle }) {
  const base =
    'px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md';
  const opt = (id, label) => (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className={`${base} ${
        dollars === id
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
      {opt('today', "Today's $")}
      {opt('nominal', 'Nominal $')}
    </div>
  );
}

function NwTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const locked = d.total - d.usable;
  const row = (name, val, color) => (
    <div className="flex justify-between gap-6">
      <span style={{ color }}>{name}</span>
      <span className="tabular-nums text-slate-100">{fmtUSD(val)}</span>
    </div>
  );
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs">
      <div className="mb-1 font-medium text-slate-200">Age {label}</div>
      {row('Net worth', d.total, '#34d399')}
      {row('After-tax', d.afterTax, '#f59e0b')}
      {row('Usable now', d.usable, '#38bdf8')}
      {locked > 0 && row('Locked', locked, '#94a3b8')}
    </div>
  );
}

export default function NetWorthChart({ rows, dollars, onToggle }) {
  const data = rows.map((r) => ({
    age: r.age,
    total: dollars === 'today' ? r.netWorthToday : r.netWorthNominal,
    afterTax: dollars === 'today' ? r.afterTaxToday : r.afterTaxNominal,
    usable: dollars === 'today' ? Math.round(r.usable / r.infl) : r.usable,
  }));

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Net worth vs age</h2>
        <DollarToggle dollars={dollars} onToggle={onToggle} />
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="age" stroke="#94a3b8" tick={{ fontSize: 12 }} tickMargin={6} minTickGap={16} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} width={64} tickFormatter={fmtUSDcompact} />
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
          <Tooltip content={<NwTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="usable"
            name="Usable now"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Net worth (total)"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="afterTax"
            name="After-tax (liquidation)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-500">
        The gap between total and usable is your locked retirement money —
        pre-tax 401k/IRA + Roth earnings + HSA — not spendable until the Roth
        ladder or age 59.5 opens it up. After-tax is what liquidating everything
        would actually net after the cap-gains and pre-tax haircuts.
      </p>
    </section>
  );
}
