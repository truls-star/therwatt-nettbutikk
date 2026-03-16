/**
 * Netlify Function: Products API
 *
 * Reads products from the CSV file, parses, normalizes,
 * calculates prices, and returns as JSON.
 *
 * Supports query parameters:
 * - category: filter by category
 * - limit: max products to return (default: all)
 * - offset: pagination offset (default: 0)
 */

import { readCSVFile } from '../../src/lib/connectors/csvSource.js';
import { parseCSV } from '../../src/lib/parsers/csvParser.js';
import { normalizeProducts } from '../../src/lib/services/productNormalizer.js';

let cachedProducts = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadAndProcessProducts() {
  const now = Date.now();
  if (cachedProducts && (now - cacheTime) < CACHE_TTL) {
    return cachedProducts;
  }

  const csvContent = readCSVFile();
  const { rows, errors } = parseCSV(csvContent);

  if (rows.length === 0) {
    throw new Error(`No valid products found. Parse errors: ${errors.join('; ')}`);
  }

  const products = normalizeProducts(rows);

  // Build category index
  const categoryMap = new Map();
  for (const product of products) {
    const cat = product.category;
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { id: product.category_slug || cat, name: cat, count: 0 });
    }
    categoryMap.get(cat).count++;
  }

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => b.count - a.count);

  cachedProducts = { products, categories, parseErrors: errors.length };
  cacheTime = now;
  return cachedProducts;
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '0', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const { products, categories, parseErrors } = loadAndProcessProducts();

    let filtered = products;

    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(
        (p) => p.category_slug === categoryFilter || p.category === categoryFilter
      );
    }

    // Pagination
    const total = filtered.length;
    if (offset > 0) {
      filtered = filtered.slice(offset);
    }
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total,
        count: filtered.length,
        offset,
        categories,
        parseErrors,
        products: filtered,
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
        error: error instanceof Error ? error.message : 'Ukjent feil ved lasting av produkter',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
