# FIRE Calculator

A single-page financial-independence / early-retirement planner. Tweak every
assumption on the left and watch a year-by-year projection recompute live, in
three modes:

- **Fixed return** — one deterministic path at your assumed nominal return and
  inflation. Net-worth line (nominal or today's $ toggle), a year-by-year table
  with depleted years flagged, and a survives / net-worth / real-return summary.
- **Historical** — replays the **actual** S&P 500 total return + US CPI for
  every possible 1928–2025 start year (sequence-of-returns backtest) and reports
  the success rate and net-worth percentile bands.
- **Monte Carlo** — draws each year's return and inflation from a normal
  distribution centred on your assumptions (volatility is adjustable), runs N
  paths, and reports the same success rate + percentile bands. Uses a fixed seed
  so results are stable while you drag sliders.

The model covers consolidated account buckets (taxable, Roth, pre-tax, HSA),
Roth-ladder access, an optional financed-or-cash home purchase, staggered
college, ACA→Medicare health costs, Social Security, and inflation.

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

> Educational tool, not financial advice. Tax tables are a rough MFJ/CA
> approximation and the engine makes simplifying assumptions throughout.
