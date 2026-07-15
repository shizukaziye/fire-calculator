import { fmtPct, fmtUSD } from '../format';
import Stat from './Stat';

export default function SummaryCard({ rows, survives, config }) {
  const last = rows[rows.length - 1];
  const firstDepleted = rows.find((r) => r.depleted);
  const realReturn = (1 + config.nominalReturn) / (1 + config.inflation) - 1;
  const lifetimeTax = rows.reduce((s, r) => s + r.taxPaid / r.infl, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat
        label={`After-tax net worth at ${config.endAge} (today's $)`}
        value={fmtUSD(last.afterTaxToday)}
        sub={`${fmtUSD(last.netWorthToday)} pre-liquidation`}
        tone={last.afterTaxToday >= 0 ? 'pos' : 'neg'}
      />
      <Stat
        label="Plan survives?"
        value={survives ? 'Yes' : 'No'}
        sub={
          survives
            ? 'Accessible funds never go negative'
            : firstDepleted
              ? `Depletes at age ${firstDepleted.age}`
              : undefined
        }
        tone={survives ? 'pos' : 'neg'}
      />
      <Stat
        label="Lifetime withdrawal tax (today's $)"
        value={fmtUSD(lifetimeTax)}
        sub={`cap gains on ${fmtPct(config.taxableGainPct, 0)} of taxable + pre-tax ordinary`}
      />
      <Stat
        label="Implied real return"
        value={fmtPct(realReturn)}
        sub={`${fmtPct(config.nominalReturn)} nominal − ${fmtPct(config.inflation)} inflation`}
      />
    </div>
  );
}
