// Historical annual US data for sequence-of-returns backtesting, 1928–2025.
//
// Stocks: S&P 500 total annual return (includes dividends).
//   Source: NYU Stern / Aswath Damodaran,
//   pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html
// Inflation: US annual-average CPI inflation rate.
//   Source: usinflationcalculator.com historical inflation table.
//
// Values below are PERCENTS, aligned index-for-index by year starting at
// HIST_FIRST_YEAR. The loader divides by 100 to get decimals.

export const HIST_FIRST_YEAR = 1928;

// S&P 500 total return % per year, 1928 → 2025 (98 values).
const STOCK_PCT = [
  43.81, -8.30, -25.12, -43.84, -8.64, 49.98, -1.19, 46.74, 31.94, -35.34,
  29.28, -1.10, -10.67, -12.77, 19.17, 25.06, 19.03, 35.82, -8.43, 5.20,
  5.70, 18.30, 30.81, 23.68, 18.15, -1.21, 52.56, 32.60, 7.44, -10.46,
  43.72, 12.06, 0.34, 26.64, -8.81, 22.61, 16.42, 12.40, -9.97, 23.80,
  10.81, -8.24, 3.56, 14.22, 18.76, -14.31, -25.90, 37.00, 23.83, -6.98,
  6.51, 18.52, 31.74, -4.70, 20.42, 22.34, 6.15, 31.24, 18.49, 5.81,
  16.54, 31.48, -3.06, 30.23, 7.49, 9.97, 1.33, 37.20, 22.68, 33.10,
  28.34, 20.89, -9.03, -11.85, -21.97, 28.36, 10.74, 4.83, 15.61, 5.48,
  -36.55, 25.94, 14.82, 2.10, 15.89, 32.15, 13.52, 1.38, 11.77, 21.61,
  -4.23, 31.21, 18.02, 28.47, -18.04, 26.06, 24.88, 17.78,
];

// US annual-average CPI inflation % per year, 1928 → 2025 (98 values).
const INFLATION_PCT = [
  -1.7, 0.0, -2.3, -9.0, -9.9, -5.1, 3.1, 2.2, 1.5, 3.6,
  -2.1, -1.4, 0.7, 5.0, 10.9, 6.1, 1.7, 2.3, 8.3, 14.4,
  8.1, -1.2, 1.3, 7.9, 1.9, 0.8, 0.7, -0.4, 1.5, 3.3,
  2.8, 0.7, 1.7, 1.0, 1.0, 1.3, 1.3, 1.6, 2.9, 3.1,
  4.2, 5.5, 5.7, 4.4, 3.2, 6.2, 11.0, 9.1, 5.8, 6.5,
  7.6, 11.3, 13.5, 10.3, 6.2, 3.2, 4.3, 3.6, 1.9, 3.6,
  4.1, 4.8, 5.4, 4.2, 3.0, 3.0, 2.6, 2.8, 3.0, 2.3,
  1.6, 2.2, 3.4, 2.8, 1.6, 2.3, 2.7, 3.4, 3.2, 2.8,
  3.8, -0.4, 1.6, 3.2, 2.1, 1.5, 1.6, 0.1, 1.3, 2.1,
  2.4, 1.8, 1.2, 4.7, 8.0, 4.1, 2.9, 2.6,
];

export const HISTORICAL = {
  firstYear: HIST_FIRST_YEAR,
  lastYear: HIST_FIRST_YEAR + STOCK_PCT.length - 1,
  years: STOCK_PCT.map((_, i) => HIST_FIRST_YEAR + i),
  stock: STOCK_PCT.map((p) => p / 100),
  inflation: INFLATION_PCT.map((p) => p / 100),
};
