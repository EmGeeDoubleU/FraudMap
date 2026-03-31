export function formatCurrency(value, opts = {}) {
  const { compact = true, decimals } = opts;
  if (value == null) return '—';

  const abs = Math.abs(value);

  if (compact) {
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(decimals ?? 1)}T`;
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(decimals ?? 1)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(decimals ?? 1)}M`;
    if (abs >= 1e3) return `$${(value / 1e3).toFixed(decimals ?? 0)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(value);
}

export function formatNumber(value, opts = {}) {
  const { compact = false } = opts;
  if (value == null) return '—';

  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  }

  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value, decimals = 0) {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatCompact(value) {
  return formatNumber(value, { compact: true });
}

export function formatMultiplier(value) {
  if (value == null) return '—';
  return `${value.toFixed(1)}×`;
}

export function formatChange(value) {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
}
