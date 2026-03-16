import { getGroupDiscountPercent, pricingConfig } from '../../config/pricing';

type PricingInput = {
  grossPrice: number;
  groupCode?: string;
  category?: string;
};

export type PricingOutput = {
  groupDiscountPercent: number;
  customerPriceExVat: number;
  finalPriceIncVat: number;
};

const roundPrice = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateProductPricing = ({ grossPrice, groupCode, category }: PricingInput): PricingOutput => {
  const groupDiscountPercent = getGroupDiscountPercent(groupCode, category);
  const discountDecimal = Math.max(0, groupDiscountPercent / 100);
  const customerPriceExVat = roundPrice(grossPrice * (1 - discountDecimal));
  const finalPriceIncVat = roundPrice(customerPriceExVat * (1 + pricingConfig.vatRate));

  return {
    groupDiscountPercent: roundPrice(groupDiscountPercent),
    customerPriceExVat,
    finalPriceIncVat
  };
};
