import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtUSD, fmtUSDcompact } from '../format';

function BandTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const b = payload[0].payload;
  const row = (name, val) => (
    <div className="flex justify-between gap-6">
      <span className="text-slate-400">{name}</span>
      <span className="tabular-nums text-slate-100">{fmtUSD(val)}</span>
    </div>
  );
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs">
      <div className="mb-1 font-medium text-slate-200">Age {label}</div>
      {row('90th pct', b.p90)}
      {row('75th pct', b.p75)}
      {row('Median', b.p50)}
      {row('25th pct', b.p25)}
      {row('10th pct', b.p10)}
    </div>
  );
}

export default function SimChart({ sim, mode }) {
  // Derive the inner-band (p25–p75) base/span for the stacked-area trick.
  const data = sim.bands.map((b) => ({
    ...b,
    innerLower: b.p25,
    innerSpan: b.p75 - b.p25,
  }));

  const title =
    mode === 'historical'
      ? 'Net worth vs age — historical backtest'
      : 'Net worth vs age — Monte Carlo';

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        <span className="text-xs text-slate-500">today&apos;s $ · shaded = 10–90th &amp; 25–75th pct</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="age" stroke="#94a3b8" tick={{ fontSize: 12 }} tickMargin={6} minTickGap={16} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} width={64} tickFormatter={fmtUSDcompact} />
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
          {/* outer band p10–p90 */}
          <Area dataKey="lower" stackId="outer" stroke="none" fill="none" isAnimationActive={false} />
          <Area dataKey="span" stackId="outer" stroke="none" fill="#34d399" fillOpacity={0.12} isAnimationActive={false} />
          {/* inner band p25–p75 */}
          <Area dataKey="innerLower" stackId="inner" stroke="none" fill="none" isAnimationActive={false} />
          <Area dataKey="innerSpan" stackId="inner" stroke="none" fill="#34d399" fillOpacity={0.22} isAnimationActive={false} />
          {/* median */}
          <Line dataKey="p50" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Tooltip content={<BandTooltip />} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
