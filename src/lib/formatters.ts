/**
 * Price and text formatters for Therwatt webshop
 */

/**
 * Format price in Norwegian kroner
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format price with decimals
 */
export function formatPriceExact(amount: number): string {
  return amount.toLocaleString('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Safely truncate text to a max length
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength - 1) + '\u2026';
}
