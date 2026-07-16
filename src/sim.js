// Simulation layer on top of the deterministic project().
// - Historical: roll the actual 1928–2025 return/inflation series through the
//   plan, one sequence per possible start year (sequence-of-returns backtest).
// - Monte Carlo: draw each year's nominal return lognormally around your
//   assumption (median growth = the deterministic 9%-style compounding, so the
//   median MC path matches the fixed-return projection) and inflation from a
//   normal distribution.
//
// Both return the same shape so the UI can render either identically.

import { DEFAULTS, project, survives, takeHome } from './fireModel.js';
import { HISTORICAL } from './historicalData.js';

const survivesRows = (rows) => !rows.some((r) => r.depleted);

// Deterministic PRNG so Monte Carlo results are stable while you drag sliders
// (re-runs with the same inputs produce the same paths).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box–Muller.
function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const pct = (sortedAsc, q) =>
  sortedAsc[Math.min(sortedAsc.length - 1, Math.max(0, Math.round(q * (sortedAsc.length - 1))))];

// Collapse many simulated paths into per-age percentile bands (today's $) and
// summary stats. `paths` is an array of project() row arrays, all the same length.
function summarize(cfg, paths, extra) {
  const c = { ...DEFAULTS, ...cfg };
  const n = paths.length;
  const ages = [];
  for (let a = c.currentAge; a <= c.endAge; a++) ages.push(a);

  const bands = ages.map((age, i) => {
    const vals = paths.map((rows) => rows[i].netWorthToday).sort((x, y) => x - y);
    return {
      age,
      p10: pct(vals, 0.1),
      p25: pct(vals, 0.25),
      p50: pct(vals, 0.5),
      p75: pct(vals, 0.75),
      p90: pct(vals, 0.9),
      // for Recharts' stacked-area band trick (handles negative p10):
      lower: pct(vals, 0.1),
      span: pct(vals, 0.9) - pct(vals, 0.1),
    };
  });

  const finals = paths.map((rows) => rows[rows.length - 1].netWorthToday).sort((x, y) => x - y);
  const survived = paths.filter(survivesRows).length;

  return {
    trials: n,
    successRate: survived / n,
    bands,
    finalMedian: pct(finals, 0.5),
    finalP10: pct(finals, 0.1),
    finalP90: pct(finals, 0.9),
    finalWorst: finals[0],
    finalBest: finals[finals.length - 1],
    ...extra,
  };
}

export function simulateHistorical(cfg = {}) {
  const c = { ...DEFAULTS, ...cfg };
  const years = c.endAge - c.currentAge + 1;
  const paths = [];
  const startYears = [];
  for (let start = 0; start + years <= HISTORICAL.stock.length; start++) {
    paths.push(
      project(c, {
        returns: HISTORICAL.stock.slice(start, start + years),
        inflations: HISTORICAL.inflation.slice(start, start + years),
      })
    );
    startYears.push(HISTORICAL.firstYear + start);
  }
  return summarize(c, paths, {
    horizon: years,
    startYears,
    dataRange: `${HISTORICAL.firstYear}–${HISTORICAL.lastYear}`,
  });
}

export function simulateMonteCarlo(cfg = {}) {
  const c = { ...DEFAULTS, ...cfg };
  const years = c.endAge - c.currentAge + 1;
  const trials = Math.max(1, Math.round(c.trials));
  const rng = mulberry32(0x9e3779b9); // fixed seed → reproducible
  const mu = Math.log(1 + c.nominalReturn); // lognormal: median (1+r) = 1 + nominalReturn
  const paths = [];
  for (let t = 0; t < trials; t++) {
    const returns = new Array(years);
    const inflations = new Array(years);
    for (let y = 0; y < years; y++) {
      returns[y] = Math.exp(mu + c.returnVol * gauss(rng)) - 1;
      inflations[y] = Math.max(-0.1, c.inflation + c.inflVol * gauss(rng));
    }
    paths.push(project(c, { returns, inflations }));
  }
  return summarize(c, paths, { horizon: years });
}

// Success-rate bar the solved salary must clear in each sim mode: 90% for
// both. 100% of random Monte Carlo paths is effectively unreachable (there's
// always a doomsday tail), and demanding every 1928-start historical sequence
// pass makes the single worst start year dictate the answer.
export const MIN_SALARY_TARGET = { historical: 0.9, montecarlo: 0.9 };

// Lowest GROSS salary (today $) whose take-home keeps the plan from running out,
// solved in the current mode's terms:
//   fixed      -> the deterministic projection survives
//   historical -> every 1928–2025 sequence survives (100%)
//   montecarlo -> 95% of paths survive
// Income only matters while working, and survival is monotonic in income, so a
// clean threshold exists. Returns 0 if $0 already survives, or Infinity if no
// salary can fix it (e.g. no working years left). Rounded up to the nearest $1k.
export function minGrossToNotRunOut(cfg = {}, mode = 'fixed') {
  const c = { ...DEFAULTS, ...cfg };

  // Cap the solver's MC trials so the binary search stays snappy; the seed is
  // fixed so the threshold is still stable.
  const solverTrials = Math.min(c.trials, 400);

  const passes = (gross) => {
    const test = { ...c, incomeToday: takeHome(gross) };
    if (mode === 'historical') return simulateHistorical(test).successRate >= MIN_SALARY_TARGET.historical;
    if (mode === 'montecarlo') return simulateMonteCarlo({ ...test, trials: solverTrials }).successRate >= MIN_SALARY_TARGET.montecarlo;
    return survives(test);
  };

  if (passes(0)) return 0;
  const HI = 3_000_000;
  if (!passes(HI)) return Infinity;

  let lo = 0;
  let hi = HI;
  while (hi - lo > 1000) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi / 1000) * 1000;
}
