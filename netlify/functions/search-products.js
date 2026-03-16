/**
 * Netlify Function: Search Products
 *
 * Simple search endpoint for products.
 * Searches title and product_number.
 * Supports filters for category, supplier, and price status.
 *
 * Query parameters:
 * - q: search query (searches title and product_number)
 * - category: filter by category slug
 * - supplier: filter by supplier name
 * - price_status: filter by 'active' or 'mangler pris'
 * - limit: max results (default: 50)
 * - offset: pagination offset (default: 0)
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

/**
 * Simple scoring: exact product_number match scores highest,
 * then title starts-with, then title includes.
 */
function scoreMatch(product, query) {
  const q = query.toLowerCase();
  const pn = product.product_number.toLowerCase();
  const title = product.title.toLowerCase();

  if (pn === q) return 100;
  if (pn.startsWith(q)) return 80;
  if (pn.includes(q)) return 60;
  if (title.startsWith(q)) return 50;
  if (title.includes(q)) return 30;
  return 0;
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const categoryFilter = url.searchParams.get('category');
    const supplierFilter = url.searchParams.get('supplier');
    const priceStatusFilter = url.searchParams.get('price_status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const products = getAllProducts();
    let results = products;

    // Apply filters
    if (categoryFilter && categoryFilter !== 'all') {
      results = results.filter(
        (p) => p.category_slug === categoryFilter || p.category === categoryFilter
      );
    }

    if (supplierFilter && supplierFilter !== 'all') {
      results = results.filter((p) => p.supplier === supplierFilter);
    }

    if (priceStatusFilter && priceStatusFilter !== 'all') {
      results = results.filter((p) => p.price_status === priceStatusFilter);
    }

    // Apply search with scoring
    if (query.trim()) {
      results = results
        .map((p) => ({ product: p, score: scoreMatch(p, query.trim()) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.product);
    }

    const total = results.length;
    results = results.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        total,
        count: results.length,
        offset,
        products: results,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil ved søk',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
