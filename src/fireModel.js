// fireModel.js — FIRE projection engine
// Pure logic, no UI. Feed it a config, get a year-by-year array back.
// All dollar inputs are in TODAY'S dollars unless a field says "nominal".
// Distilled from the planning conversation: account buckets, Roth-ladder
// access, MFJ tax conversion, house carry (cash or mortgage), ACA->Medicare
// health, staggered college, Social Security, and inflation.
//
// project() also accepts an optional per-year sequence of returns/inflation
// (second arg) so the simulation layer can run historical backtests and
// Monte Carlo without duplicating the math. With no sequence it uses the
// constant nominalReturn / inflation and is identical to the original engine.

export const DEFAULTS = {
  // --- timeline ---
  currentAge: 32,
  retireAge: 45,          // age you STOP earning (income -> 0)
  endAge: 90,

  // --- market assumptions (also the Monte Carlo means) ---
  nominalReturn: 0.09,    // 0.085, 0.09 ... (real return = (1+nom)/(1+infl)-1)
  inflation: 0.04,        // 0.035, 0.03 ...

  // --- starting balances (today $) — consolidated by tax treatment ---
  taxable: 1_730_000,     // brokerage + cash + misc — accessible anytime
  roth: 765_000,          // ALL Roth (IRA + 401k), total balance
  rothContrib: 131_000,   // of that Roth, the CONTRIBUTIONS — withdrawable anytime.
                          // The rest (earnings) is locked until 59.5, like a 401k.
  pretax: 436_000,        // ALL pre-tax / traditional (401k + IRA) — locked till 59.5, OR Roth-ladder from retireAge+5
  hsa: 45_000,            // medical / age 65 (modeled with the locked bucket)

  // --- income while "working" (age < retireAge), TAKE-HOME today $ ---
  // For a salary, run takeHome(grossSalary) to get this number.
  incomeToday: 0,

  // --- spending, today $, OUTSIDE housing ---
  lifestyle: 100_000,     // non-housing, non-health living
  healthWorking: 8_000,   // employer plan while earning
  healthPre65: 19_000,    // ACA, retired, before Medicare
  healthMedicare: 12_000, // 65+

  // --- housing ---
  buyHome: true,          // false = rent the whole way (no purchase, no mortgage)
  housePrice: 900_000,
  buyAge: 33,
  financed: true,         // true = mortgage; false = pay cash
  downPct: 0.30,
  mortgageRate: 0.065,
  mortgageYears: 30,
  propTaxRate: 0.0125,    // CA Prop 13: this base grows 2%/yr, not with inflation
  maintRate: 0.01,        // 1% of value / yr
  insRate: 0.004,         // ~0.4% of value / yr
  rentBeforeBuying: 36_000, // also the rent every year if buyHome is false

  // --- kids / college ---
  numKids: 1,
  collegePerKidPerYear: 100_000,   // ~40k for state school
  firstKidCollegeAge: 51,          // YOUR age when first kid starts college
  kidSpacingYears: 2,

  // --- social security ---
  ssAnnual: 0,            // today $, household; use a haircut if you stop early
  ssStartAge: 67,

  // --- mechanics ---
  useRothLadder: true,    // pre-tax bucket accessible 5 yrs after you retire
  // (Retirement taxes are no longer a flat knob — they're computed per
  //  withdrawal: taxable/Roth treated as tax-light, pre-tax taxed at ordinary
  //  MFJ + CA rates. See project().)

  // --- Monte Carlo controls (used by the sim layer; project() ignores them) ---
  returnVol: 0.18,        // annual std dev of nominal return
  inflVol: 0.015,         // annual std dev of inflation
  trials: 1000,           // number of random paths
};

// ---- MFJ take-home (2025/26 brackets). Convert a gross salary -> today $ income ----
function bracketTax(ti, brackets) {
  let t = 0;
  for (let i = 0; i < brackets.length; i++) {
    const lo = brackets[i][0];
    const hi = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (ti > lo) t += (Math.min(ti, hi) - lo) * brackets[i][1];
  }
  return t;
}
const FED = [[0,.10],[23850,.12],[96950,.22],[206700,.24],[394600,.32],[501050,.35],[751600,.37]];
const CA  = [[0,.01],[20839,.02],[49371,.04],[77918,.06],[108162,.08],[136700,.093],[698271,.103],[837922,.113],[1396542,.123]];
export function takeHome(gross) {
  const fica = Math.min(gross, 176100) * 0.062 + gross * 0.0145 + Math.max(0, gross - 250000) * 0.009;
  return gross - (bracketTax(Math.max(0, gross - 30000), FED) + bracketTax(Math.max(0, gross - 11080), CA) + fica);
}
function mortgageAnnual(principal, rate, years) {
  const r = rate / 12, n = years * 12;
  return (principal * r / (1 - Math.pow(1 + r, -n))) * 12;
}

// Effective ordinary-income tax rate (MFJ federal + CA, no FICA) on a pre-tax /
// Traditional withdrawal of `realAmount` TODAY'S dollars. Brackets stay in real
// terms (deductions applied to the real amount) so there's no fake bracket-creep
// decades out. Used to gross up retirement withdrawals from the pre-tax bucket.
function retOrdinaryRate(realAmount) {
  if (realAmount <= 0) return 0;
  const tax =
    bracketTax(Math.max(0, realAmount - 30000), FED) +
    bracketTax(Math.max(0, realAmount - 11080), CA);
  return Math.min(0.6, tax / realAmount);
}

/**
 * Run the year-by-year projection.
 * @param {object} cfg  config overrides on top of DEFAULTS
 * @param {object} [seq] optional per-year sequences for simulation:
 *        { returns: number[], inflations: number[] } indexed by year offset
 *        (0 = currentAge). When omitted, the constant nominalReturn / inflation
 *        are used and the output is identical to the deterministic engine.
 * @returns {Array<{age,working,income,spend,housing,usable,unusable,
 *                   netWorthNominal,netWorthToday,infl,depleted}>}
 *   usable   = money you can spend now (taxable+Roth, plus pre-tax+HSA once unlocked)
 *   unusable = pre-tax+HSA still locked until the Roth ladder / age 59.5
 *   infl     = cumulative inflation factor (divide a nominal value by it for today's $)
 */
export function project(cfg = {}, seq) {
  const c = { ...DEFAULTS, ...cfg };
  const ladderAge = c.useRothLadder ? c.retireAge + 5 : 59.5;
  const returns = seq && seq.returns;
  const inflations = seq && seq.inflations;

  const collegeAt = (age) => {
    let t = 0;
    for (let i = 0; i < c.numKids; i++) {
      const start = c.firstKidCollegeAge + i * c.kidSpacingYears;
      if (age >= start && age < start + 4) t += c.collegePerKidPerYear;
    }
    return t;
  };

  // Buckets, split by access + tax treatment:
  //   spendable = taxable + Roth CONTRIBUTIONS — usable now, withdrawals tax-light
  //   pretax    = Traditional / pre-tax — ordinary income tax; unlocks at ladderAge
  //   rothEarn  = Roth EARNINGS (total Roth − contributions) — tax-free, but locked
  //               until age 59.5 (contributions come out first, earnings last)
  //   hsa       = medical — tax-free; unlocks at ladderAge
  const rothContrib = Math.min(c.rothContrib, c.roth);
  let spendable = c.taxable + rothContrib;
  let pretax = c.pretax;
  let rothEarn = c.roth - rothContrib;
  let hsa = c.hsa;

  const buying = !!c.buyHome;
  const down = buying ? (c.financed ? c.downPct * c.housePrice : c.housePrice) : 0;
  const mortgage = buying && c.financed ? (1 - c.downPct) * c.housePrice : 0;
  const mortPay = buying && c.financed ? mortgageAnnual(mortgage, c.mortgageRate, c.mortgageYears) : 0;
  const payoffAge = c.buyAge + c.mortgageYears;

  // Cumulative inflation factor (only used when an inflation sequence is given;
  // the constant path keeps Math.pow so its numbers are byte-for-byte unchanged).
  let inflFactor = 1;

  const rows = [];
  for (let age = c.currentAge; age <= c.endAge; age++) {
    const yr = age - c.currentAge;
    const ret = returns && returns[yr] != null ? returns[yr] : c.nominalReturn;
    const inflRate = inflations && inflations[yr] != null ? inflations[yr] : c.inflation;
    const infl = inflations ? inflFactor : Math.pow(1 + c.inflation, yr);

    spendable *= 1 + ret;
    pretax *= 1 + ret;
    rothEarn *= 1 + ret;
    hsa *= 1 + ret;

    const working = age < c.retireAge;
    const pretaxOpen = age >= ladderAge;  // pre-tax: Roth ladder (retire+5) or 59.5
    const rothOpen = age >= 59.5;         // Roth earnings: always 59.5
    const hsaOpen = age >= ladderAge;

    // housing (nominal): mortgage P&I (fixed) + Prop-13 tax + maint + ins.
    // If buyHome is false, you rent every year instead.
    let housing;
    if (buying && age >= c.buyAge) {
      const pay = c.financed && age < payoffAge ? mortPay : 0;
      const tax = c.housePrice * c.propTaxRate * Math.pow(1.02, age - c.buyAge);
      const upkeep = c.housePrice * (c.maintRate + c.insRate) * infl;
      const downThisYear = age === c.buyAge ? down : 0;  // cash outlay shows up here
      housing = pay + tax + upkeep + downThisYear;
    } else {
      housing = c.rentBeforeBuying * infl;
    }

    const health = (working ? c.healthWorking : age < 65 ? c.healthPre65 : c.healthMedicare) * infl;
    const spend = c.lifestyle * infl + housing + health + collegeAt(age) * infl;
    const income = (working ? c.incomeToday : 0) * infl;
    const ss = age >= c.ssStartAge ? c.ssAnnual * infl : 0;

    const net = income + ss - spend;
    if (net >= 0) {
      spendable += net;                  // surplus parks in taxable
    } else {
      let need = -net;                   // nominal, after-tax dollars still required
      // 1) taxable + Roth contributions — tax-free
      const fromSpend = Math.min(Math.max(spendable, 0), need);
      spendable -= fromSpend; need -= fromSpend;
      // 2) Roth earnings — tax-free, once they unlock at 59.5
      if (need > 1 && rothOpen && rothEarn > 0) {
        const fromRoth = Math.min(rothEarn, need);
        rothEarn -= fromRoth; need -= fromRoth;
      }
      // 3) pre-tax / Traditional — taxed at ordinary rates, once unlocked.
      //    Gross up the withdrawal so its after-tax proceeds cover the need.
      if (need > 1 && pretaxOpen && pretax > 0) {
        const realNeed = need / infl;
        let realGross = realNeed;
        for (let i = 0; i < 5; i++) realGross = realNeed / (1 - retOrdinaryRate(realGross));
        const gross = realGross * infl;
        if (gross <= pretax) {
          pretax -= gross; need = 0;
        } else {
          const delivered = pretax * (1 - retOrdinaryRate(pretax / infl));
          need -= delivered; pretax = 0;
        }
      }
      // 4) HSA — tax-free (medical), once unlocked
      if (need > 1 && hsaOpen && hsa > 0) {
        const fromHsa = Math.min(hsa, need);
        hsa -= fromHsa; need -= fromHsa;
      }
      // 5) anything still unmet drives the spendable bucket negative -> "depleted"
      if (need > 1) spendable -= need;
    }

    const unusable =                       // retirement money you can't touch yet
      (pretaxOpen ? 0 : pretax) + (rothOpen ? 0 : rothEarn) + (hsaOpen ? 0 : hsa);
    const usable =
      spendable + (pretaxOpen ? pretax : 0) + (rothOpen ? rothEarn : 0) + (hsaOpen ? hsa : 0);
    const netWorth = spendable + pretax + rothEarn + hsa;  // total wealth
    rows.push({
      age,
      working,
      income: Math.round(income),
      spend: Math.round(spend),
      housing: Math.round(housing),
      usable: Math.round(usable),
      unusable: Math.round(unusable),
      netWorthNominal: Math.round(netWorth),
      netWorthToday: Math.round(netWorth / infl),
      infl,
      depleted: spendable < -1,
    });

    inflFactor *= 1 + inflRate;          // advance cumulative inflation for next year
  }
  return rows;
}

/** True if the plan reaches endAge without the spendable bucket going negative. */
export function survives(cfg = {}, seq) {
  return !project(cfg, seq).some((r) => r.depleted);
}

// Solvers are trivial to build on top of survives() with a binary search, e.g.
// "lowest incomeToday that survives" or "largest housePrice that survives" —
// bisect the field between a lo/hi and test survives({...cfg, [field]: mid}).
