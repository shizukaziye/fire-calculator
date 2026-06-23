// Small formatting helpers shared across the UI.

export const fmtUSD = (n) => {
  const r = Math.round(n);
  return r < 0
    ? '-$' + Math.abs(r).toLocaleString()
    : '$' + r.toLocaleString();
};

// Compact currency for chart axis ticks: $1.2M, $640k, -$50k
export const fmtUSDcompact = (n) => {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}k`;
  return `${sign}$${Math.round(a)}`;
};

export const fmtPct = (decimal, dp = 2) => `${(decimal * 100).toFixed(dp)}%`;
