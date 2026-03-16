export type PricingConfig = {
  defaultGroupDiscountPercent: number;
  groupDiscountPercent: Record<string, number>;
  vatRate: number;
};

export const pricingConfig: PricingConfig = {
  defaultGroupDiscountPercent: 0,
  groupDiscountPercent: {},
  vatRate: 0.25
};

export const getGroupDiscountPercent = (groupCode?: string, category?: string): number => {
  const normalizedGroupCode = String(groupCode || '').trim().toUpperCase();
  const normalizedCategory = String(category || '').trim().toUpperCase();

  if (normalizedGroupCode && normalizedGroupCode in pricingConfig.groupDiscountPercent) {
    return pricingConfig.groupDiscountPercent[normalizedGroupCode];
  }

  if (normalizedCategory && normalizedCategory in pricingConfig.groupDiscountPercent) {
    return pricingConfig.groupDiscountPercent[normalizedCategory];
  }

  return pricingConfig.defaultGroupDiscountPercent;
};
