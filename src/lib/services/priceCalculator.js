/**
 * Price calculator for Therwatt webshop
 *
 * Pricing logic:
 * - gross_price from CSV is bruttopris EX. MVA
 * - customer_discount is determined by discount_percent tiers
 * - price_ex_vat = gross_price * (1 - customer_discount)
 * - price_inc_vat = price_ex_vat * 1.25
 */

const VAT_RATE = 0.25;

/**
 * Discount tiers: if discount_percent > threshold, apply customer_discount
 * Always use the highest matching rule.
 */
const DISCOUNT_TIERS = [
  { threshold: 50, customerDiscount: 0.10 },
  { threshold: 40, customerDiscount: 0.08 },
  { threshold: 30, customerDiscount: 0.06 },
  { threshold: 20, customerDiscount: 0.04 },
  { threshold: 10, customerDiscount: 0.02 },
];

/**
 * Determine customer discount based on supplier discount percent
 * @param {number} discountPercent - The supplier discount percentage
 * @returns {number} Customer discount as a decimal (e.g., 0.10 for 10%)
 */
export function getCustomerDiscount(discountPercent) {
  for (const tier of DISCOUNT_TIERS) {
    if (discountPercent > tier.threshold) {
      return tier.customerDiscount;
    }
  }
  return 0;
}

/**
 * Calculate all prices for a product
 * @param {number} grossPrice - Gross price ex. VAT from CSV
 * @param {number} discountPercent - Supplier discount percentage
 * @returns {{ customer_discount_percent: number, price_ex_vat: number, price_inc_vat: number, price: number, vat_rate: number, gross_price_ex_vat: number }}
 */
export function calculatePrice(grossPrice, discountPercent) {
  const customerDiscount = getCustomerDiscount(discountPercent);
  const priceExVat = grossPrice * (1 - customerDiscount);
  const priceIncVat = priceExVat * (1 + VAT_RATE);

  return {
    gross_price_ex_vat: round2(grossPrice),
    customer_discount_percent: round2(customerDiscount * 100),
    price_ex_vat: round2(priceExVat),
    price_inc_vat: round2(priceIncVat),
    price: round2(priceIncVat),
    vat_rate: VAT_RATE,
  };
}

/**
 * Round to 2 decimal places
 */
function round2(value) {
  return Math.round(value * 100) / 100;
}
