// fireModel.js — FIRE projection engine
// Pure logic, no UI. Feed it a config, get a year-by-year array back.
// All dollar inputs are in TODAY'S dollars unless a field says "nominal".
// Distilled from the planning conversations: account buckets, Roth-ladder
// access, capital-gains gross-up on taxable withdrawals (fed LTCG stacking +
// CA + NIIT, single until marriage then MFJ), staged spending (solo ->
// married -> family), house carry with equity tracking, ACA->Medicare health,
// staggered college, Social Security, and inflation.
//
// project() also accepts an optional per-year sequence of returns/inflation
// (second arg) so the simulation layer can run historical backtests and
// Monte Carlo without duplicating the math. With no sequence it uses the
// constant nominalReturn / inflation.

export const DEFAULTS = {
  // --- timeline ---
  currentAge: 32,
  retireAge: 45,          // age you STOP earning (income -> 0)
  endAge: 90,
  willMarry: true,        // false = single (solo lifestyle, single brackets) forever
  marriageAge: 35,        // single -> MFJ brackets; married spending + 3BR rent start

  // --- market assumptions (also the Monte Carlo means) ---
  nominalReturn: 0.09,    // 0.085, 0.09 ... (real return = (1+nom)/(1+infl)-1)
  inflation: 0.04,        // 0.035, 0.03 ...

  // --- starting balances (today $) — consolidated by tax treatment ---
  taxable: 1_858_000,     // brokerage + cash + misc — accessible anytime, LTCG on withdrawal
  roth: 826_000,          // ALL Roth (IRA + 401k), total balance
  rothContrib: 289_000,   // of that Roth, the CONTRIBUTIONS — withdrawable anytime.
                          // The rest (earnings) is locked until 59.5, like a 401k.
  pretax: 468_000,        // ALL pre-tax / traditional (401k + IRA) — locked till 59.5, OR Roth-ladder from retireAge+5
  hsa: 45_000,            // medical / age 65 (modeled with the locked bucket)

  // --- income while "working" (age < retireAge), TAKE-HOME today $ ---
  // For a salary, run takeHome(grossSalary) to get this number.
  incomeToday: 100_000,

  // --- spending, today $, OUTSIDE housing — additive per person ---
  lifestyleSolo: 36_000,      // your baseline ($3k/mo)
  lifestylePerSpouse: 24_000, // added from marriageAge (+$2k/mo)
  lifestylePerKid: 24_000,    // added per kid from that kid's arrival (+$2k/mo each)

  // --- health, today $/yr, PER PERSON — stacked ON TOP of lifestyle ---
  // (the staged lifestyle numbers above exclude insurance). Adults step
  // through employer plan -> ACA -> Medicare with your working status / age;
  // each kid costs healthPerKid while on your plan.
  healthYouWorking: 3_000,
  healthYouPre65: 8_000,      // ACA, retired, before Medicare
  healthYouMedicare: 6_000,   // 65+
  healthSpouseWorking: 3_000,
  healthSpousePre65: 8_000,
  healthSpouseMedicare: 6_000,
  healthPerKid: 5_000,
  kidCoveredToAge: 26,        // kid's age when they leave your plan

  // --- taxes on withdrawals / liquidation ---
  taxableGainPct: 1.0,    // share of every taxable-account withdrawal that is
                          // long-term capital GAIN (1.0 = the whole balance is
                          // gain — the conservative "tax everything" rule)
  pretaxHaircut: 0.30,    // liquidation haircut on pre-tax (ordinary fed+CA approx)

  // --- housing ---
  buyHome: false,         // false = rent the whole way (no purchase, no mortgage)
  rentSolo: 32_400,       // 2BR while single ($2,700/mo today $)
  rentFamily: 43_200,     // 3BR once married ($3,600/mo today $)
  housePrice: 950_000,    // today $; drifts at homeAppreciation until you buy
  homeAppreciation: 0.04, // house value growth (base case = inflation)
  buyAge: 35,
  financed: true,         // true = mortgage; false = pay cash
  downPct: 0.20,
  mortgageRate: 0.065,
  mortgageYears: 30,
  propTaxRate: 0.012,     // CA Prop 13: assessed base grows 2%/yr, not with inflation
  maintRate: 0.01,        // 1% of purchase price / yr, inflation-adjusted
  insRate: 0.002,         // ~0.2% of purchase price / yr (~$2k on $950k)
  closeCostPct: 0.02,     // buy-side closing costs
  sellCostPct: 0.06,      // sale costs at liquidation
  homeGainExclusion: 500_000, // Sec-121 MFJ exclusion on home gains

  // --- kids / college ---
  numKids: 1,
  collegePerKidPerYear: 100_000,   // ~40k for state school
  kidAtAge: 36,                    // YOUR age when the first kid arrives (spend bump)
  firstKidCollegeAge: 54,          // YOUR age when first kid starts college
  kidSpacingYears: 2,

  // --- social security ---
  ssAnnual: 0,            // today $, household; use a haircut if you stop early
  ssStartAge: 67,

  // --- mechanics ---
  useRothLadder: true,    // pre-tax bucket accessible 5 yrs after you retire

  // --- Monte Carlo controls (used by the sim layer; project() ignores them) ---
  returnVol: 0.17,        // annual std dev of nominal return
  inflVol: 0.015,         // annual std dev of inflation
  trials: 1000,           // number of random paths
};

// ---- Brackets (2026, MFJ; single = MFJ edges x 0.5) --------------------------
function bracketTax(ti, brackets) {
  let t = 0;
  for (let i = 0; i < brackets.length; i++) {
    const lo = brackets[i][0];
    const hi = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (ti > lo) t += (Math.min(ti, hi) - lo) * brackets[i][1];
  }
  return t;
}
// Filing-status scaling: single brackets are the MFJ edges halved, which is
// algebraically s * tax_MFJ(income / s) with s = 0.5.
const scaledBracketTax = (ti, brackets, s) => (ti <= 0 ? 0 : s * bracketTax(ti / s, brackets));

const FED = [[0,.10],[23850,.12],[96950,.22],[206700,.24],[394600,.32],[501050,.35],[751600,.37]];
const CA  = [[0,.01],[20839,.02],[49371,.04],[77918,.06],[108162,.08],[136700,.093],[698271,.103],[837922,.113],[1396542,.123]];
const LTCG = [[0, 0], [98_700, 0.15], [613_700, 0.20]]; // federal LTCG stacking, MFJ
const STD_FED_MFJ = 32_200;
const STD_CA_MFJ = 11_080;
const NIIT = { mfj: 250_000, single: 200_000, rate: 0.038 };
const CG_LIQ_RATE = 0.243; // 15% fed LTCG + 9.3% CA — flat haircut used for liquidation NW

export function takeHome(gross) {
  const fica = Math.min(gross, 176100) * 0.062 + gross * 0.0145 + Math.max(0, gross - 250000) * 0.009;
  return gross - (bracketTax(Math.max(0, gross - 30000), FED) + bracketTax(Math.max(0, gross - 11080), CA) + fica);
}

// Tax on `realGain` TODAY'S dollars of pure long-term capital gain in a year
// with no other income: federal LTCG brackets stack from $0 after the standard
// deduction, CA taxes gains as ordinary income, plus NIIT. Brackets and
// deductions are inflation-indexed, so they're constant in real terms — but
// the NIIT thresholds are NOT indexed (statute), so in real terms they shrink
// by the cumulative inflation factor.
export function capGainsTax(realGain, single, infl = 1) {
  if (realGain <= 0) return 0;
  const s = single ? 0.5 : 1;
  const fed = scaledBracketTax(realGain - STD_FED_MFJ * s, LTCG, s);
  const ca = scaledBracketTax(realGain - STD_CA_MFJ * s, CA, s);
  const niitThr = (single ? NIIT.single : NIIT.mfj) / infl;
  const niit = NIIT.rate * Math.max(0, realGain - niitThr);
  return fed + ca + niit;
}

// Effective ordinary-income tax rate (federal + CA, no FICA) on a pre-tax /
// Traditional withdrawal of `realAmount` TODAY'S dollars. Brackets stay in real
// terms (deductions applied to the real amount) so there's no fake bracket-creep
// decades out. Used to gross up retirement withdrawals from the pre-tax bucket.
function retOrdinaryRate(realAmount, single) {
  if (realAmount <= 0) return 0;
  const s = single ? 0.5 : 1;
  const tax =
    scaledBracketTax(realAmount - 30000 * s, FED, s) +
    scaledBracketTax(realAmount - 11080 * s, CA, s);
  return Math.min(0.6, tax / realAmount);
}

/**
 * Run the year-by-year projection.
 * @param {object} cfg  config overrides on top of DEFAULTS
 * @param {object} [seq] optional per-year sequences for simulation:
 *        { returns: number[], inflations: number[] } indexed by year offset
 *        (0 = currentAge). When omitted, the constant nominalReturn / inflation
 *        are used and the output is identical to the deterministic engine.
 * @returns {Array<{age,working,stage,income,spend,housing,taxPaid,grossWd,
 *                   usable,unusable,homeEquity,netWorthNominal,netWorthToday,
 *                   afterTaxNominal,afterTaxToday,infl,depleted}>}
 *   usable   = money you can spend now (taxable + Roth contributions, plus
 *              pre-tax + Roth earnings + HSA once unlocked)
 *   unusable = retirement money still locked until the Roth ladder / age 59.5
 *   afterTax = liquidation net worth: taxable less the cap-gains haircut,
 *              pre-tax less pretaxHaircut, home equity net of selling costs
 *              and gains tax above the Sec-121 exclusion
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
  //   taxable  — usable now; withdrawals grossed up for LTCG (fed+CA+NIIT)
  //   rothC    — Roth CONTRIBUTIONS — usable now, tax-free
  //   rothEarn — Roth EARNINGS — tax-free, locked until 59.5
  //   pretax   — Traditional — ordinary income tax; unlocks at ladderAge
  //   hsa      — medical — tax-free; unlocks at ladderAge
  let taxable = c.taxable;
  let rothC = Math.min(c.rothContrib, c.roth);
  let rothEarn = c.roth - rothC;
  let pretax = c.pretax;
  let hsa = c.hsa;

  const buying = !!c.buyHome;
  let homeValue = 0;
  let purchasePrice = 0; // nominal at buy — Prop-13 assessed base + cost basis
  let loan = 0;
  let monthlyPay = 0;

  // Cumulative inflation factor (only used when an inflation sequence is given;
  // the constant path keeps Math.pow so its numbers are byte-for-byte unchanged).
  let inflFactor = 1;

  const rows = [];
  for (let age = c.currentAge; age <= c.endAge; age++) {
    const yr = age - c.currentAge;
    const ret = returns && returns[yr] != null ? returns[yr] : c.nominalReturn;
    const inflRate = inflations && inflations[yr] != null ? inflations[yr] : c.inflation;
    const infl = inflations ? inflFactor : Math.pow(1 + c.inflation, yr);

    taxable *= 1 + ret;
    rothC *= 1 + ret;
    rothEarn *= 1 + ret;
    pretax *= 1 + ret;
    hsa *= 1 + ret;
    if (homeValue > 0) homeValue *= 1 + c.homeAppreciation;

    const married = c.willMarry && age >= c.marriageAge;
    const single = !married; // filing status
    let kidsBorn = 0;
    for (let i = 0; i < c.numKids; i++) {
      if (age >= c.kidAtAge + i * c.kidSpacingYears) kidsBorn++;
    }
    const stage = kidsBorn > 0 ? 'family' : married ? 'married' : 'solo';
    const working = age < c.retireAge;
    const pretaxOpen = age >= ladderAge;  // pre-tax: Roth ladder (retire+5) or 59.5
    const rothOpen = age >= 59.5;         // Roth earnings: always 59.5
    const hsaOpen = age >= ladderAge;

    // housing (nominal): P&I on a live loan balance + Prop-13 tax + maint + ins.
    // Before buying (or if buyHome is false) you rent — 2BR solo, 3BR married.
    let housing;
    if (buying && age >= c.buyAge) {
      housing = 0;
      if (age === c.buyAge) {
        // the market price drifted at homeAppreciation between now and the buy
        purchasePrice = c.housePrice * Math.pow(1 + c.homeAppreciation, yr);
        homeValue = purchasePrice;
        if (c.financed) {
          loan = (1 - c.downPct) * purchasePrice;
          const r = c.mortgageRate / 12;
          monthlyPay = (loan * r) / (1 - Math.pow(1 + r, -c.mortgageYears * 12));
        }
        housing += (c.financed ? c.downPct : 1) * purchasePrice + c.closeCostPct * purchasePrice;
      }
      let mortPaid = 0;
      for (let m = 0; m < 12 && loan > 0; m++) {
        const interest = (loan * c.mortgageRate) / 12;
        const pay = Math.min(monthlyPay, loan + interest);
        loan = Math.max(0, loan + interest - pay);
        mortPaid += pay;
      }
      housing +=
        mortPaid +
        purchasePrice * c.propTaxRate * Math.pow(1.02, age - c.buyAge) +
        c.housePrice * (c.maintRate + c.insRate) * infl;
    } else {
      housing = (stage === 'solo' ? c.rentSolo : c.rentFamily) * infl;
    }

    const lifestyle =
      c.lifestyleSolo + (married ? c.lifestylePerSpouse : 0) + kidsBorn * c.lifestylePerKid;

    // health: per person — you (+ spouse once married) step employer -> ACA ->
    // Medicare; each kid costs healthPerKid from birth until kidCoveredToAge.
    const stageRate = (w, aca, med) => (working ? w : age < 65 ? aca : med);
    let kidsCovered = 0;
    for (let i = 0; i < c.numKids; i++) {
      const born = c.kidAtAge + i * c.kidSpacingYears;
      if (age >= born && age - born < c.kidCoveredToAge) kidsCovered++;
    }
    const health =
      (stageRate(c.healthYouWorking, c.healthYouPre65, c.healthYouMedicare) +
        (married
          ? stageRate(c.healthSpouseWorking, c.healthSpousePre65, c.healthSpouseMedicare)
          : 0) +
        kidsCovered * c.healthPerKid) *
      infl;
    const spend = lifestyle * infl + housing + health + collegeAt(age) * infl;
    const income = (working ? c.incomeToday : 0) * infl;
    const ss = age >= c.ssStartAge ? c.ssAnnual * infl : 0;

    let taxPaid = 0; // nominal tax paid on this year's withdrawals
    let grossWd = 0; // nominal gross pulled from all buckets

    const net = income + ss - spend;
    if (net >= 0) {
      taxable += net;                    // surplus parks in taxable
    } else {
      let need = -net;                   // nominal, after-tax dollars still required
      // 1) taxable — grossed up so after-LTCG proceeds cover the need.
      //    Fixed point W = need + tax(W * gainPct), solved in real dollars.
      if (need > 1 && taxable > 0) {
        const g = c.taxableGainPct;
        const realNeed = need / infl;
        let realGross = realNeed;
        for (let i = 0; i < 5; i++) realGross = realNeed + capGainsTax(realGross * g, single, infl);
        const gross = realGross * infl;
        if (gross <= taxable) {
          taxable -= gross;
          taxPaid += gross - need;
          grossWd += gross;
          need = 0;
        } else {
          const realBal = taxable / infl;
          const tax = capGainsTax(realBal * g, single, infl) * infl;
          grossWd += taxable;
          taxPaid += tax;
          need -= taxable - tax;
          taxable = 0;
        }
      }
      // 2) Roth contributions — tax-free, anytime
      if (need > 1 && rothC > 0) {
        const f = Math.min(rothC, need);
        rothC -= f; need -= f; grossWd += f;
      }
      // 3) Roth earnings — tax-free, once they unlock at 59.5
      if (need > 1 && rothOpen && rothEarn > 0) {
        const f = Math.min(rothEarn, need);
        rothEarn -= f; need -= f; grossWd += f;
      }
      // 4) pre-tax / Traditional — taxed at ordinary rates, once unlocked.
      //    Gross up the withdrawal so its after-tax proceeds cover the need.
      if (need > 1 && pretaxOpen && pretax > 0) {
        const realNeed = need / infl;
        let realGross = realNeed;
        for (let i = 0; i < 5; i++) realGross = realNeed / (1 - retOrdinaryRate(realGross, single));
        const gross = realGross * infl;
        if (gross <= pretax) {
          pretax -= gross; taxPaid += gross - need; grossWd += gross; need = 0;
        } else {
          const delivered = pretax * (1 - retOrdinaryRate(pretax / infl, single));
          taxPaid += pretax - delivered; grossWd += pretax;
          need -= delivered; pretax = 0;
        }
      }
      // 5) HSA — tax-free (medical), once unlocked
      if (need > 1 && hsaOpen && hsa > 0) {
        const f = Math.min(hsa, need);
        hsa -= f; need -= f; grossWd += f;
      }
      // 6) anything still unmet drives the taxable bucket negative -> "depleted"
      if (need > 1) taxable -= need;
    }

    const unusable =                       // retirement money you can't touch yet
      (pretaxOpen ? 0 : pretax) + (rothOpen ? 0 : rothEarn) + (hsaOpen ? 0 : hsa);
    const usable =
      taxable + rothC + (pretaxOpen ? pretax : 0) + (rothOpen ? rothEarn : 0) + (hsaOpen ? hsa : 0);

    // Home equity — raw, and net of selling costs + gains tax above the
    // Sec-121 exclusion (what you'd actually clear if you sold this year).
    let homeEquity = 0;
    let homeEquityNet = 0;
    if (homeValue > 0) {
      homeEquity = homeValue - loan;
      const proceeds = homeValue * (1 - c.sellCostPct);
      const taxableHomeGain = Math.max(0, proceeds - purchasePrice - c.homeGainExclusion);
      homeEquityNet = proceeds - loan - taxableHomeGain * CG_LIQ_RATE;
    }

    const netWorth = taxable + rothC + rothEarn + pretax + hsa + homeEquity;
    // After-tax liquidation NW: the cap-gains haircut applies only to the gain
    // share of the taxable balance; pre-tax takes the ordinary haircut.
    const liqHaircut = c.taxableGainPct * CG_LIQ_RATE;
    const afterTax =
      (taxable > 0 ? taxable * (1 - liqHaircut) : taxable) +
      rothC + rothEarn + hsa +
      pretax * (1 - c.pretaxHaircut) +
      homeEquityNet;

    rows.push({
      age,
      working,
      stage,
      income: Math.round(income),
      spend: Math.round(spend),
      housing: Math.round(housing),
      taxPaid: Math.round(taxPaid),
      grossWd: Math.round(grossWd),
      usable: Math.round(usable),
      unusable: Math.round(unusable),
      homeEquity: Math.round(homeEquity),
      netWorthNominal: Math.round(netWorth),
      netWorthToday: Math.round(netWorth / infl),
      afterTaxNominal: Math.round(afterTax),
      afterTaxToday: Math.round(afterTax / infl),
      infl,
      depleted: taxable < -1,
    });

    inflFactor *= 1 + inflRate;          // advance cumulative inflation for next year
  }
  return rows;
}

/** True if the plan reaches endAge without the accessible money going negative. */
export function survives(cfg = {}, seq) {
  return !project(cfg, seq).some((r) => r.depleted);
}

// Solvers are trivial to build on top of survives() with a binary search, e.g.
// "lowest incomeToday that survives" or "largest housePrice that survives" —
// bisect the field between a lo/hi and test survives({...cfg, [field]: mid}).
