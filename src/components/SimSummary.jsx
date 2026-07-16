import { fmtUSD } from '../format';
import Stat from './Stat';

export default function SimSummary({ sim, config, mode }) {
  const rate = sim.successRate;
  const rateTone = rate >= 0.9 ? 'pos' : rate >= 0.75 ? 'warn' : 'neg';

  const sub =
    mode === 'historical'
      ? `${sim.trials} rolling ${sim.horizon}-yr sequences (${sim.dataRange} data, starts ${sim.startYears[0]}–${sim.startYears[sim.startYears.length - 1]}) · aim ≥90%`
      : `${sim.trials.toLocaleString()} random ${sim.horizon}-yr paths, log-normal (right-skewed) returns · aim ≥90%`;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat
        label="Success rate"
        value={`${Math.round(rate * 100)}%`}
        sub={sub}
        tone={rateTone}
      />
      <Stat
        label={`Median net worth at ${config.endAge} (today's $)`}
        value={fmtUSD(sim.finalMedian)}
        sub={`90th pct: ${fmtUSD(sim.finalP90)}`}
        tone={sim.finalMedian >= 0 ? 'pos' : 'neg'}
      />
      <Stat
        label={`10th percentile at ${config.endAge} (today's $)`}
        value={fmtUSD(sim.finalP10)}
        sub={`Worst case: ${fmtUSD(sim.finalWorst)}`}
        tone={sim.finalP10 >= 0 ? 'pos' : 'neg'}
      />
    </div>
  );
}
