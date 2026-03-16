/**
 * Shipping calculator for Therwatt webshop
 *
 * Rules (Phase 1):
 * - Order value < 1000 kr incl. VAT: 99 kr shipping
 * - Order value 1000-2999 kr incl. VAT: 149 kr shipping
 * - Order value >= 3000 kr incl. VAT: free shipping
 *
 * Designed to be easily extended for heavy items, long items,
 * or supplier-specific shipping in later phases.
 */

const SHIPPING_RULES = [
  { maxOrderValue: 999.99, shippingCost: 99 },
  { maxOrderValue: 2999.99, shippingCost: 149 },
  { maxOrderValue: Infinity, shippingCost: 0 },
];

/**
 * Calculate shipping cost based on cart subtotal (incl. VAT)
 * @param {number} subtotalIncVat - Cart subtotal including VAT
 * @returns {{ shipping: number, freeShippingThreshold: number, isFreeShipping: boolean }}
 */
export function calculateShipping(subtotalIncVat) {
  for (const rule of SHIPPING_RULES) {
    if (subtotalIncVat <= rule.maxOrderValue) {
      return {
        shipping: rule.shippingCost,
        freeShippingThreshold: 3000,
        isFreeShipping: rule.shippingCost === 0,
      };
    }
  }

  return {
    shipping: 0,
    freeShippingThreshold: 3000,
    isFreeShipping: true,
  };
}

/**
 * Calculate full cart totals
 * @param {number} subtotalIncVat - Cart subtotal including VAT
 * @returns {{ subtotal: number, shipping: number, total: number, isFreeShipping: boolean, freeShippingThreshold: number }}
 */
export function calculateCartTotals(subtotalIncVat) {
  const { shipping, freeShippingThreshold, isFreeShipping } = calculateShipping(subtotalIncVat);

  return {
    subtotal: Math.round(subtotalIncVat * 100) / 100,
    shipping,
    total: Math.round((subtotalIncVat + shipping) * 100) / 100,
    isFreeShipping,
    freeShippingThreshold,
  };
}
