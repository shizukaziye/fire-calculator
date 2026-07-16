// Sanity checks against the Jul-14 planning session / FIRE_plan_year_by_year sheet.
// Run: node scripts/sanity.mjs
import { capGainsTax, project, survives } from '../src/fireModel.js';
import { simulateMonteCarlo } from '../src/sim.js';

const pct = (x) => (x * 100).toFixed(1) + '%';
const k = (x) => '$' + Math.round(x / 1000) + 'k';

// Chat-parity overrides: the Jul-14 chat folded health insurance into the
// $3k/5k/7k lifestyle numbers (current DEFAULTS break health out per person),
// and its housing was the Bay "2,000 sqft cheap tier" (current DEFAULTS are
// the LA-average preset). Pin both so we compare like for like.
const NOHEALTH = {
  healthYouWorking: 0, healthYouPre65: 0, healthYouMedicare: 0,
  healthSpouseWorking: 0, healthSpousePre65: 0, healthSpouseMedicare: 0,
  healthPerKid: 0,
  housePrice: 950_000, rentFamily: 43_200, rentSolo: 32_400,
};

// 1) $150k MFJ pure-LTCG withdrawal -> ~6% effective (chat: ~$9.8k on $153k)
for (const g of [150_000, 153_000]) {
  const t = capGainsTax(g, false, 1);
  console.log(`LTCG tax on ${k(g)} MFJ: ${k(t)} (${pct(t / g)})  [expect ~6%]`);
}

// 2) ~$491k gross lump (retire-today buy year) -> ~$101k, 20.6% MFJ
const lump = capGainsTax(491_000, false, 1);
console.log(`LTCG tax on $491k MFJ lump: ${k(lump)} (${pct(lump / 491_000)})  [expect ~$101k / 20.6%]`);

// 3) single vs MFJ on the same lump (sheet: MFJ ~17%, single ~21% on the buy@35 down payment)
for (const s of [false, true]) {
  const t = capGainsTax(365_000, s, 1);
  console.log(`LTCG tax on $365k ${s ? 'single' : 'MFJ'}: ${k(t)} (${pct(t / 365_000)})`);
}

// 4) Defaults ($100k income to 45): rent vs buy@35 after-tax NW milestones
//    (sheet, real 2026$: 45 -> $4.97M/$4.86M; 65 -> $8.78M/$7.90M; 90 -> $23.6M/$19.7M)
const rent = project({ ...NOHEALTH, buyHome: false });
const buy = project({ ...NOHEALTH, buyHome: true });
const at = (rows, age) => rows.find((r) => r.age === age);
console.log('\nage  rentAT(real)  buyAT(real)');
for (const age of [33, 35, 45, 54, 65, 90]) {
  const r = at(rent, age), b = at(buy, age);
  console.log(`${age}   ${k(r.afterTaxToday)}   ${k(b.afterTaxToday)}`);
}
const be = rent.find((r, i) => r.age > 35 && buy[i].afterTaxToday >= r.afterTaxToday);
console.log('breakeven at 9% growth:', be ? 'age ' + be.age : 'NEVER  [expect NEVER]');

// 5) 6% growth: crossing exists but it's a knife edge (paths within ~2% for decades)
const rent6 = project({ ...NOHEALTH, buyHome: false, nominalReturn: 0.06 });
const buy6 = project({ ...NOHEALTH, buyHome: true, nominalReturn: 0.06 });
const be6 = rent6.find((r, i) => r.age > 35 && buy6[i].afterTaxToday >= r.afterTaxToday);
console.log('breakeven at 6% growth:', be6 ? 'age ' + be6.age : 'NEVER');

// 6) Retire today: rent survives deterministically, buy@35 also survives
//    under staged spending (chat: "income floor is $0 across the board")
console.log('\nretire-today rent survives:', survives({ ...NOHEALTH, buyHome: false, incomeToday: 0 }), '[expect true]');
console.log('retire-today buy@35 survives:', survives({ ...NOHEALTH, buyHome: true, incomeToday: 0 }), '[expect true]');

// 7) Buy-year tax spike shows up in the buy path (down payment gross-up)
const buyYear = at(buy, 35);
console.log(`buy-year (35) tax paid: ${k(buyYear.taxPaid)} gross w/d: ${k(buyYear.grossWd)}`);

// 8) Monte Carlo (lognormal returns, median path = deterministic)
//    chat baseline: retire-now 63% rent / 56% buy@35; $100k->45: 80% / 76%
const mr = simulateMonteCarlo({ ...NOHEALTH, buyHome: false, incomeToday: 0, trials: 1500 });
const mb = simulateMonteCarlo({ ...NOHEALTH, buyHome: true, incomeToday: 0, trials: 1500 });
console.log(`\nMC retire-today: rent ${Math.round(mr.successRate * 100)}% / buy@35 ${Math.round(mb.successRate * 100)}%  [chat: 63% / 56%]`);
const mri = simulateMonteCarlo({ ...NOHEALTH, buyHome: false, trials: 1500 });
const mbi = simulateMonteCarlo({ ...NOHEALTH, buyHome: true, trials: 1500 });
console.log(`MC $100k->45:    rent ${Math.round(mri.successRate * 100)}% / buy@35 ${Math.round(mbi.successRate * 100)}%  [chat: 80% / 76%]`);

// 9) Current DEFAULTS (per-person health ON TOP of lifestyle) — the live plan
const dr = simulateMonteCarlo({ buyHome: false, incomeToday: 0, trials: 1500 });
const dri = simulateMonteCarlo({ buyHome: false, trials: 1500 });
console.log(`\nWith per-person health (current defaults):`);
console.log(`  retire-today rent survives: ${survives({ buyHome: false, incomeToday: 0 })}`);
console.log(`  MC rent: retire-today ${Math.round(dr.successRate * 100)}% / $100k->45 ${Math.round(dri.successRate * 100)}%`);

// 10) Historical backtest must start at 1928; solver targets are 90/90
const { simulateHistorical, MIN_SALARY_TARGET } = await import('../src/sim.js');
const hist = simulateHistorical({ buyHome: false, incomeToday: 0 });
console.log(`\nhistorical: ${hist.trials} sequences, data ${hist.dataRange}, first start ${hist.startYears[0]} [expect 1928], last start ${hist.startYears[hist.startYears.length - 1]}`);
console.log('solver targets:', JSON.stringify(MIN_SALARY_TARGET), '[expect 0.9 / 0.9]');
console.log(`historical retire-today rent success: ${Math.round(hist.successRate * 100)}%`);

// 11) MC annual return draws are positively skewed (lognormal, median = 9%).
//     Analytic lognormal skew at sigma=0.17 is ~+0.52; check a big sample.
{
  const mu = Math.log(1.09), sig = 0.17;
  let n = 200000, s1 = 0, s2 = 0, s3 = 0;
  const draws = [];
  for (let i = 0; i < n; i++) {
    const u = Math.random(), v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u || 1e-12)) * Math.cos(2 * Math.PI * v);
    draws.push(Math.exp(mu + sig * z) - 1);
  }
  const mean = draws.reduce((a, b) => a + b) / n;
  const m2 = draws.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const m3 = draws.reduce((a, b) => a + (b - mean) ** 3, 0) / n;
  const skew = m3 / m2 ** 1.5;
  const med = draws.sort((a, b) => a - b)[n / 2];
  console.log(`MC return draws: median ${(med * 100).toFixed(2)}% [expect ~9], mean ${(mean * 100).toFixed(2)}% [> median], skew ${skew.toFixed(2)} [expect ~+0.5]`);
}
