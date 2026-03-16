/**
 * Netlify Function: Product by Slug
 *
 * Returns a single product by its slug or product_number.
 * Also returns related products from the same category.
 *
 * Query parameters:
 * - slug: product slug to look up
 */

import { readCSVFile } from '../../src/lib/connectors/csvSource.js';
import { parseCSV } from '../../src/lib/parsers/csvParser.js';
import { normalizeProducts } from '../../src/lib/services/productNormalizer.js';

let cachedProducts = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function getAllProducts() {
  const now = Date.now();
  if (cachedProducts && (now - cacheTime) < CACHE_TTL) {
    return cachedProducts;
  }

  const csvContent = readCSVFile();
  const { rows } = parseCSV(csvContent);
  cachedProducts = normalizeProducts(rows);
  cacheTime = now;
  return cachedProducts;
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mangler slug-parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const products = getAllProducts();

    // Find by slug or product_number
    const product = products.find(
      (p) => p.slug === slug || p.product_number === slug
    );

    if (!product) {
      return new Response(
        JSON.stringify({ success: false, error: 'Produkt ikke funnet' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find related products from same category (max 6, excluding current)
    const related = products
      .filter((p) => p.product_number !== product.product_number && p.category === product.category)
      .slice(0, 6);

    return new Response(
      JSON.stringify({
        success: true,
        product,
        related,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
