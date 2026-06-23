import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtUSD, fmtUSDcompact } from '../format';

function Toggle({ todayDollars, onToggle }) {
  const base =
    'px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md';
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`${base} ${
          !todayDollars
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
        }`}
      >
        Nominal $
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`${base} ${
          todayDollars
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
        }`}
      >
        Today&apos;s $
      </button>
    </div>
  );
}

export default function NetWorthChart({ rows, todayDollars, onToggle }) {
  const dataKey = todayDollars ? 'netWorthToday' : 'netWorthNominal';
  const label = todayDollars ? "Net worth (today's $)" : 'Net worth (nominal)';

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Net worth vs age</h2>
        <Toggle todayDollars={todayDollars} onToggle={onToggle} />
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="age"
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
            tickMargin={6}
            minTickGap={16}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
            width={64}
            tickFormatter={fmtUSDcompact}
          />
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
          <Tooltip
            formatter={(v) => [fmtUSD(v), label]}
            labelFormatter={(l) => `Age ${l}`}
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: '#34d399' }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
