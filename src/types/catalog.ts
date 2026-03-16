export type Product = {
  id: string;
  productNumber: string;
  name: string;
  brand: string;
  supplier: string;
  nobbNumber?: string;
  unit?: string;
  groupCode?: string;
  category: string;
  businessArea?: string;
  keywords: string[];
  description?: string;
  technicalSpecs?: Record<string, string>;
  imageUrl?: string;
  productUrl?: string;
  dahlCategoryPath?: string[];
};

export type PricingRecord = {
  productNumber: string;
  grossPrice: number;
  supplierDiscountPercent: number;
  groupDiscountPercent: number;
  customerPriceExVat: number;
  finalPriceIncVat: number;
  currency: 'NOK';
  vatRate: number;
  sourceDate?: string;
};

export type CatalogIndex = {
  categories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
  brands: Array<{
    name: string;
    productCount: number;
  }>;
};
