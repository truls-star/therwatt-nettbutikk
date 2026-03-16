import type { Product } from '../../types/catalog';

const normalize = (value: string | undefined) => (value || '').trim().toLowerCase();

const scoreProduct = (product: Product, queryRaw: string): number => {
  const query = normalize(queryRaw);
  if (!query) return 0;

  const productNumber = normalize(product.productNumber);
  const nobb = normalize(product.nobbNumber);
  const title = normalize(product.name);
  const brand = normalize(product.brand);
  const keywords = product.keywords.map(normalize);

  if (productNumber === query) return 1000;
  if (nobb === query) return 900;
  if (title === query) return 800;
  if (title.includes(query)) return 600;
  if (brand.includes(query)) return 500;
  if (keywords.some((keyword) => keyword.includes(query))) return 400;
  if (productNumber.includes(query)) return 300;
  return 0;
};

export const searchProducts = <T extends Product>(products: T[], query: string): T[] => {
  const withScore = products
    .map((product) => ({ product, score: scoreProduct(product, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

  return withScore.map(({ product }) => product);
};
