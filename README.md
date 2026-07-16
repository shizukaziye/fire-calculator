# FIRE Calculator

A single-page financial-independence / early-retirement planner. Tweak every
assumption on the left and watch a year-by-year projection recompute live, in
three modes:

- **Fixed return** — one deterministic path at your assumed nominal return and
  inflation. Net-worth + after-tax liquidation lines (nominal or today's $
  toggle), a rent-vs-buy breakeven comparison, and a year-by-year table with
  per-year withdrawal tax and depleted years flagged.
- **Historical** — replays the **actual** S&P 500 total return + US CPI for
  every possible 1928–2025 start year (sequence-of-returns backtest) and reports
  the success rate and net-worth percentile bands.
- **Monte Carlo** — draws each year's return lognormally around your assumption
  (so the **median** MC path matches the fixed-return projection) and inflation
  from a normal distribution, runs N paths, and reports the same success rate +
  percentile bands. Uses a fixed seed so results are stable while you drag
  sliders.

## What the model covers

- **Account buckets** by tax treatment: taxable, Roth contributions / earnings,
  pre-tax, HSA — with Roth-ladder access rules.
- **Capital-gains withdrawals**: every taxable-account withdrawal is grossed up
  for tax — federal LTCG bracket stacking (0/15/20%) after the standard
  deduction, CA ordinary brackets, and NIIT (whose thresholds are deliberately
  NOT inflation-indexed, per statute). The **"taxable balance that is gain"**
  slider controls how much of each withdrawal is gain (100% = the conservative
  tax-everything rule).
- **Filing status timeline**: single until the marriage age, MFJ after —
  brackets and deductions halve while single, which is what makes a big
  down-payment withdrawal before marriage expensive.
- **Big decisions bar**: the headline choices — current/retire age, stay
  single vs marry (and when), number of kids, rent vs buy (and when), income,
  a master lifestyle knob, and a housing-market preset picker (popular Bay
  Area / Los Angeles / Las Vegas areas, mid-2026 medians; defaults to LA
  average) — sit above the charts; the left panel keeps the granular inputs.
- **Additive household spending**: your base lifestyle + an amount per spouse
  (from the marriage age) + an amount per kid (from each kid's arrival, so it
  scales to any family size), plus staggered college later.
- **Per-person health**, stacked on top of lifestyle: you and spouse each
  step employer plan → ACA → Medicare, each kid costs a set amount until
  they leave your plan (default kid-age 26).
- **Housing, rent vs buy**: staged rent (2BR solo → 3BR married), or a
  financed-or-cash purchase with live loan amortization, Prop-13 property tax,
  maintenance/insurance, closing + selling costs, home appreciation, and the
  Sec-121 gain exclusion. The comparison card shows after-tax net worth for
  both paths and the breakeven age (often "Never" — the down payment's
  cap-gains gross-up plus carry has to beat unlevered compounding).
- **After-tax net worth**: liquidation value — taxable less the cap-gains
  haircut on its gain share, pre-tax less an ordinary-rate haircut, home equity
  net of selling costs and gains tax.
- Social Security and inflation throughout.

`scripts/sanity.mjs` checks the engine against the July 2026 planning-session
baseline (tax on benchmark withdrawals, rent-vs-buy milestones, MC success
rates): `node scripts/sanity.mjs`.

## Stack

React + Vite + Tailwind v4 + Recharts. All projection math lives in
[`src/fireModel.js`](src/fireModel.js) (pure functions); the simulation layer in
[`src/sim.js`](src/sim.js) reuses it with per-year return/inflation sequences.

## Develop

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # production build → dist/
```

## Data sources

- Stocks: S&P 500 annual total return (incl. dividends), NYU Stern / Damodaran.
- Inflation: US annual-average CPI, usinflationcalculator.com.

Both series, 1928–2025, are embedded in
[`src/historicalData.js`](src/historicalData.js).

> Educational tool, not financial advice. Tax tables are a 2026 single/MFJ CA
> approximation and the engine makes simplifying assumptions throughout (no
> mortgage-interest/SALT deduction, no HOA/Mello-Roos, annual smoothing).
