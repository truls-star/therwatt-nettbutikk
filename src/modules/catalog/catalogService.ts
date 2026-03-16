import type { CatalogIndex, PricingRecord, Product } from '../../types/catalog';

export type ProductWithPricing = Product & {
  pricing?: PricingRecord;
};

type CatalogPayload = {
  products: Product[];
  pricing: PricingRecord[];
  index: CatalogIndex;
};

let cache: CatalogPayload | null = null;

const loadCatalog = async (): Promise<CatalogPayload> => {
  if (cache) return cache;

  const [productsResponse, pricingResponse, indexResponse] = await Promise.all([
    fetch('/catalog/products_normalized.json'),
    fetch('/catalog/pricing_data.json'),
    fetch('/catalog/catalog_index.json')
  ]);

  if (!productsResponse.ok || !pricingResponse.ok || !indexResponse.ok) {
    throw new Error('Kunne ikke laste produktkatalogen.');
  }

  const [products, pricing, index] = await Promise.all([
    productsResponse.json() as Promise<Product[]>,
    pricingResponse.json() as Promise<PricingRecord[]>,
    indexResponse.json() as Promise<CatalogIndex>
  ]);

  cache = { products, pricing, index };
  return cache;
};

export const getCatalogIndex = async () => (await loadCatalog()).index;

export const getAllProducts = async (): Promise<ProductWithPricing[]> => {
  const { products, pricing } = await loadCatalog();
  const pricingMap = new Map<string, PricingRecord>(pricing.map((item) => [item.productNumber, item]));
  return products.map((product) => ({ ...product, pricing: pricingMap.get(product.productNumber) }));
};

export const getProductByProductNumber = async (productNumber: string): Promise<ProductWithPricing | undefined> => {
  const { products, pricing } = await loadCatalog();
  const product = products.find((item) => item.productNumber === productNumber);
  if (!product) return undefined;

  const pricingRecord = pricing.find((item) => item.productNumber === product.productNumber);
  return { ...product, pricing: pricingRecord };
};
