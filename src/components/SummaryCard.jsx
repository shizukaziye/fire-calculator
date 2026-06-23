import { fmtPct, fmtUSD } from '../format';
import Stat from './Stat';

export default function SummaryCard({ rows, survives, config }) {
  const last = rows[rows.length - 1];
  const firstDepleted = rows.find((r) => r.depleted);
  const realReturn = (1 + config.nominalReturn) / (1 + config.inflation) - 1;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat
        label={`Net worth at ${config.endAge} (today's $)`}
        value={fmtUSD(last.netWorthToday)}
        tone={last.netWorthToday >= 0 ? 'pos' : 'neg'}
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
        label="Implied real return"
        value={fmtPct(realReturn)}
        sub={`${fmtPct(config.nominalReturn)} nominal − ${fmtPct(config.inflation)} inflation`}
      />
    </div>
  );
}
