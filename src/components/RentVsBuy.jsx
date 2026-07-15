import { useMemo } from 'react';
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
import { project } from '../fireModel';
import { fmtUSD, fmtUSDcompact } from '../format';
import Stat from './Stat';

function CmpTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const row = (name, val, color) => (
    <div className="flex justify-between gap-6">
      <span style={{ color }}>{name}</span>
      <span className="tabular-nums text-slate-100">{fmtUSD(val)}</span>
    </div>
  );
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs">
      <div className="mb-1 font-medium text-slate-200">Age {label}</div>
      {row('Rent', d.rent, '#38bdf8')}
      {row('Buy', d.buy, '#f59e0b')}
      {row('Rent − Buy', d.rent - d.buy, '#94a3b8')}
    </div>
  );
}

// Side-by-side after-tax liquidation net worth for the same plan renting
// forever vs buying at buyAge. Both paths share every other input.
export default function RentVsBuy({ config, dollars }) {
  const { data, breakeven, endGap, buyAge } = useMemo(() => {
    const rent = project({ ...config, buyHome: false });
    const buy = project({ ...config, buyHome: true });
    const key = dollars === 'today' ? 'afterTaxToday' : 'afterTaxNominal';
    const rows = rent.map((r, i) => ({ age: r.age, rent: r[key], buy: buy[i][key] }));
    let be = null;
    for (const d of rows) {
      if (d.age > config.buyAge && d.buy >= d.rent) { be = d.age; break; }
    }
    const last = rows[rows.length - 1];
    return { data: rows, breakeven: be, endGap: last.rent - last.buy, buyAge: config.buyAge };
  }, [config, dollars]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">
        Rent vs buy — after-tax net worth ({dollars === 'today' ? "today's $" : 'nominal $'})
      </h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Stat
          label={`Breakeven (buy at ${buyAge})`}
          value={breakeven ? `Age ${breakeven}` : 'Never'}
          sub={
            breakeven
              ? 'First year buying pulls ahead of renting'
              : 'Buying never catches the rent path at these assumptions'
          }
          tone={breakeven ? 'pos' : undefined}
        />
        <Stat
          label={`Rent-path lead at ${config.endAge}`}
          value={fmtUSD(endGap)}
          sub={endGap >= 0 ? 'Renting ends ahead by this much' : 'Buying ends ahead by this much'}
          tone={endGap >= 0 ? 'pos' : 'neg'}
        />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="age" stroke="#94a3b8" tick={{ fontSize: 12 }} tickMargin={6} minTickGap={16} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} width={64} tickFormatter={fmtUSDcompact} />
          <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
          <ReferenceLine
            x={buyAge}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'buy', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }}
          />
          <Tooltip content={<CmpTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="rent" name="Rent forever" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="buy" name={`Buy at ${buyAge}`} stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-500">
        Both lines are liquidation value: taxable less the cap-gains haircut,
        pre-tax less its haircut, and (buy path) home equity net of selling
        costs and gains tax above the Sec-121 exclusion. The buy year eats the
        down payment <em>plus</em> the cap-gains tax on the lump-sum withdrawal
        that funds it — that tax is why the orange line drops at purchase.
      </p>
    </section>
  );
}
