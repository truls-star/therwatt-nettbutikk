export type PricingConfig = {
  customerShareOfSupplierDiscount: number;
  vatRate: number;
};

export const pricingConfig: PricingConfig = {
  customerShareOfSupplierDiscount: 0.1,
  vatRate: 0.25
};
