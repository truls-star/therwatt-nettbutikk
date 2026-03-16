import { pricingConfig } from '../../config/pricing';

type PricingInput = {
  grossPrice: number;
  supplierDiscountPercent: number;
};

export type PricingOutput = {
  customerDiscountPercent: number;
  customerPriceExVat: number;
  finalPriceIncVat: number;
};

const roundPrice = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateProductPricing = ({ grossPrice, supplierDiscountPercent }: PricingInput): PricingOutput => {
  const customerDiscountPercent = supplierDiscountPercent * pricingConfig.customerShareOfSupplierDiscount;
  const discountDecimal = Math.max(0, customerDiscountPercent / 100);
  const customerPriceExVat = roundPrice(grossPrice * (1 - discountDecimal));
  const finalPriceIncVat = roundPrice(customerPriceExVat * (1 + pricingConfig.vatRate));

  return {
    customerDiscountPercent: roundPrice(customerDiscountPercent),
    customerPriceExVat,
    finalPriceIncVat
  };
};
