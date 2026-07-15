// Input metadata for every editable config key, grouped into sections.
//
// type:
//   'number'        plain integer/number (ages, counts, years)
//   'dollar'        today-$ amount (shows a $ affix)
//   'dollarMonthly' stored ANNUAL, edited per month
//   'percent'       stored as a decimal (0.08) but edited in whole percents (8)
//   'bool'          on/off toggle
//
// min / max / step are expressed in the UNITS THE USER SEES
// (so a percent field uses 0..15 step 0.1, not 0..0.15).
//
// disabledWhen(cfg) optionally greys out a field based on other inputs.
// onlyInMode marks a whole section as mode-specific.
//
// NOTE: house fields stay editable even when "Buy a home" is off, because the
// rent-vs-buy comparison always models the buy path with them.

const noMortgage = (c) => !c.financed;

export const SECTIONS = [
  {
    id: 'timeline',
    title: 'Timeline',
    fields: [
      { key: 'currentAge', label: 'Current age', type: 'number', min: 18, max: 70, step: 1 },
      { key: 'retireAge', label: 'Retire age (income → 0)', type: 'number', min: 25, max: 80, step: 1 },
      { key: 'marriageAge', label: 'Marriage age (single → MFJ)', type: 'number', min: 18, max: 70, step: 1 },
      { key: 'kidAtAge', label: 'Your age when kid arrives', type: 'number', min: 18, max: 60, step: 1 },
      { key: 'endAge', label: 'Plan through age', type: 'number', min: 70, max: 110, step: 1 },
    ],
  },
  {
    id: 'market',
    title: 'Market assumptions',
    fields: [
      { key: 'nominalReturn', label: 'Nominal return', type: 'percent', min: 0, max: 15, step: 0.1 },
      { key: 'inflation', label: 'Inflation', type: 'percent', min: 0, max: 10, step: 0.1 },
    ],
  },
  {
    id: 'balances',
    title: 'Starting balances (today $)',
    fields: [
      { key: 'taxable', label: 'Taxable / brokerage / cash', type: 'dollar', min: 0, max: 5_000_000, step: 10_000 },
      { key: 'roth', label: 'Roth — total (IRA + 401k)', type: 'dollar', min: 0, max: 3_000_000, step: 5_000 },
      { key: 'rothContrib', label: 'Roth — contributions (usable now)', type: 'dollar', min: 0, max: 3_000_000, step: 5_000 },
      { key: 'pretax', label: 'Pre-tax / traditional (401k + IRA)', type: 'dollar', min: 0, max: 3_000_000, step: 5_000 },
      { key: 'hsa', label: 'HSA', type: 'dollar', min: 0, max: 200_000, step: 1_000 },
    ],
  },
  {
    id: 'taxes',
    title: 'Withdrawal taxes',
    fields: [
      { key: 'taxableGainPct', label: 'Taxable balance that is gain', type: 'percent', min: 0, max: 100, step: 1 },
      { key: 'pretaxHaircut', label: 'Pre-tax liquidation haircut', type: 'percent', min: 0, max: 60, step: 1 },
    ],
  },
  {
    id: 'income',
    title: 'Income while working (take-home, today $)',
    fields: [
      { key: 'incomeToday', label: 'Annual take-home income', type: 'dollar', min: 0, max: 1_000_000, step: 5_000 },
    ],
  },
  {
    id: 'spending',
    title: 'Spending (today $, outside housing)',
    fields: [
      { key: 'lifestyleSolo', label: 'Lifestyle — solo', type: 'dollarMonthly', min: 0, max: 20_000, step: 100 },
      { key: 'lifestyleMarried', label: 'Lifestyle — married', type: 'dollarMonthly', min: 0, max: 20_000, step: 100 },
      { key: 'lifestyleFamily', label: 'Lifestyle — with kid', type: 'dollarMonthly', min: 0, max: 20_000, step: 100 },
      { key: 'healthWorking', label: 'Health — working', type: 'dollar', min: 0, max: 50_000, step: 500 },
      { key: 'healthPre65', label: 'Health — pre-65 (ACA)', type: 'dollar', min: 0, max: 60_000, step: 500 },
      { key: 'healthMedicare', label: 'Health — 65+ (Medicare)', type: 'dollar', min: 0, max: 50_000, step: 500 },
    ],
  },
  {
    id: 'housing',
    title: 'Housing',
    defaultCollapsed: true,
    fields: [
      { key: 'buyHome', label: 'Buy a home (main plan)', type: 'bool' },
      { key: 'rentSolo', label: 'Rent — solo (2BR)', type: 'dollarMonthly', min: 0, max: 12_000, step: 50 },
      { key: 'rentFamily', label: 'Rent — married (3BR)', type: 'dollarMonthly', min: 0, max: 12_000, step: 50 },
      { key: 'housePrice', label: 'House price (today $)', type: 'dollar', min: 0, max: 5_000_000, step: 25_000 },
      { key: 'homeAppreciation', label: 'Home appreciation', type: 'percent', min: 0, max: 10, step: 0.1 },
      { key: 'buyAge', label: 'Buy at age', type: 'number', min: 18, max: 90, step: 1 },
      { key: 'financed', label: 'Finance with a mortgage', type: 'bool' },
      { key: 'downPct', label: 'Down payment', type: 'percent', min: 0, max: 100, step: 1, disabledWhen: noMortgage },
      { key: 'mortgageRate', label: 'Mortgage rate', type: 'percent', min: 0, max: 12, step: 0.1, disabledWhen: noMortgage },
      { key: 'mortgageYears', label: 'Mortgage term (years)', type: 'number', min: 1, max: 40, step: 1, disabledWhen: noMortgage },
      { key: 'propTaxRate', label: 'Property tax rate', type: 'percent', min: 0, max: 3, step: 0.05 },
      { key: 'maintRate', label: 'Maintenance / yr', type: 'percent', min: 0, max: 5, step: 0.1 },
      { key: 'insRate', label: 'Insurance / yr', type: 'percent', min: 0, max: 2, step: 0.05 },
      { key: 'closeCostPct', label: 'Closing costs (buy)', type: 'percent', min: 0, max: 6, step: 0.5 },
      { key: 'sellCostPct', label: 'Selling costs', type: 'percent', min: 0, max: 10, step: 0.5 },
      { key: 'homeGainExclusion', label: 'Home-gain exclusion (Sec 121)', type: 'dollar', min: 0, max: 1_000_000, step: 50_000 },
    ],
  },
  {
    id: 'kids',
    title: 'Kids / college',
    defaultCollapsed: true,
    fields: [
      { key: 'numKids', label: 'Number of kids', type: 'number', min: 0, max: 6, step: 1 },
      { key: 'collegePerKidPerYear', label: 'College / kid / yr', type: 'dollar', min: 0, max: 200_000, step: 5_000 },
      { key: 'firstKidCollegeAge', label: 'Your age at 1st kid college', type: 'number', min: 30, max: 80, step: 1 },
      { key: 'kidSpacingYears', label: 'Years between kids', type: 'number', min: 0, max: 10, step: 1 },
    ],
  },
  {
    id: 'socialsecurity',
    title: 'Social Security',
    defaultCollapsed: true,
    fields: [
      { key: 'ssAnnual', label: 'SS annual (today $, household)', type: 'dollar', min: 0, max: 100_000, step: 1_000 },
      { key: 'ssStartAge', label: 'SS start age', type: 'number', min: 60, max: 75, step: 1 },
    ],
  },
  {
    id: 'mechanics',
    title: 'Mechanics',
    defaultCollapsed: true,
    fields: [
      { key: 'useRothLadder', label: 'Use Roth ladder (pre-tax at retire + 5)', type: 'bool' },
    ],
  },
  {
    id: 'montecarlo',
    title: 'Monte Carlo settings',
    onlyInMode: 'montecarlo',
    defaultCollapsed: true,
    fields: [
      { key: 'returnVol', label: 'Return volatility (σ)', type: 'percent', min: 0, max: 40, step: 0.5 },
      { key: 'inflVol', label: 'Inflation volatility (σ)', type: 'percent', min: 0, max: 10, step: 0.25 },
      { key: 'trials', label: 'Trials', type: 'number', min: 200, max: 5000, step: 100 },
    ],
  },
];
