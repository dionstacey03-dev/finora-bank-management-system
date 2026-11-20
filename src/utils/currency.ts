export const DEFAULT_CURRENCY_CODE = 'LKR' as const;
export const DEFAULT_CURRENCY_SYMBOL = 'Rs.' as const;
export const DEFAULT_LOCALE = 'en-LK' as const;

const lkrCurrencyFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: 'currency',
  currency: DEFAULT_CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const lkrCompactNumberFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: 'currency',
  currency: DEFAULT_CURRENCY_CODE,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats a numeric value in Sri Lankan Rupees (LKR) using `Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' })`
 * normalized to the consistent `Rs. 125,000.00` display convention.
 */
export const formatCurrency = (amount: number): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const isNegative = safeAmount < 0;
  const absAmount = Math.abs(safeAmount);

  const parts = lkrCurrencyFormatter.formatToParts(absAmount);
  const numericPortion = parts
    .filter((p) => p.type !== 'currency' && p.type !== 'literal')
    .map((p) => p.value)
    .join('');

  return `${isNegative ? '-' : ''}${DEFAULT_CURRENCY_SYMBOL} ${numericPortion}`;
};

/**
 * Formats whole-unit LKR values for chart reference axis lines (e.g., `Rs. 500,000`).
 */
export const formatCompactCurrency = (amount: number): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const isNegative = safeAmount < 0;
  const absAmount = Math.abs(safeAmount);

  const parts = lkrCompactNumberFormatter.formatToParts(absAmount);
  const numericPortion = parts
    .filter((p) => p.type !== 'currency' && p.type !== 'literal')
    .map((p) => p.value)
    .join('');

  return `${isNegative ? '-' : ''}${DEFAULT_CURRENCY_SYMBOL} ${numericPortion}`;
};
