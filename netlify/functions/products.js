/**
 * Netlify Function: Products API
 *
 * Reads products from the CSV file, parses, normalizes,
 * calculates prices, and returns as JSON.
 *
 * Supports query parameters:
 * - category: filter by category
 * - supplier: filter by supplier
 * - price_status: filter by price status ('active' or 'mangler pris')
 * - search: search in title and product_number
 * - limit: max products to return (default: all)
 * - offset: pagination offset (default: 0)
 */

import { readCSVFile } from '../../src/lib/connectors/csvSource.js';
import { parseCSV } from '../../src/lib/parsers/csvParser.js';
import { normalizeProducts } from '../../src/lib/services/productNormalizer.js';

let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function loadAndProcessProducts() {
  const now = Date.now();
  if (cachedData && (now - cacheTime) < CACHE_TTL) {
    return cachedData;
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

  // Build supplier index
  const supplierMap = new Map();
  for (const product of products) {
    const s = product.supplier;
    if (!supplierMap.has(s)) {
      supplierMap.set(s, { id: s, name: s, count: 0 });
    }
    supplierMap.get(s).count++;
  }
  const suppliers = Array.from(supplierMap.values())
    .sort((a, b) => b.count - a.count);

  // Build main_category hierarchy
  const mainCategoryMap = new Map();
  for (const product of products) {
    const mc = product.main_category || 'Produkter';
    if (!mainCategoryMap.has(mc)) {
      mainCategoryMap.set(mc, { name: mc, sub_categories: new Map() });
    }
    const subCat = product.sub_category || product.category || 'Annet';
    const mcEntry = mainCategoryMap.get(mc);
    if (!mcEntry.sub_categories.has(subCat)) {
      mcEntry.sub_categories.set(subCat, { name: subCat, product_groups: new Set() });
    }
    if (product.product_group) {
      mcEntry.sub_categories.get(subCat).product_groups.add(product.product_group);
    }
  }
  const categoryHierarchy = Array.from(mainCategoryMap.entries()).map(([name, mc]) => ({
    name,
    sub_categories: Array.from(mc.sub_categories.entries()).map(([scName, sc]) => ({
      name: scName,
      product_groups: Array.from(sc.product_groups),
    })),
  }));

  cachedData = { products, categories, suppliers, categoryHierarchy, parseErrors: errors.length };
  cacheTime = now;
  return cachedData;
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get('category');
    const supplierFilter = url.searchParams.get('supplier');
    const priceStatusFilter = url.searchParams.get('price_status');
    const searchQuery = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '0', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const { products, categories, suppliers, categoryHierarchy, parseErrors } = loadAndProcessProducts();

    let filtered = products;

    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(
        (p) => p.category_slug === categoryFilter || p.category === categoryFilter
      );
    }

    // Filter by supplier
    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter((p) => p.supplier === supplierFilter);
    }

    // Filter by price status
    if (priceStatusFilter && priceStatusFilter !== 'all') {
      filtered = filtered.filter((p) => p.price_status === priceStatusFilter);
    }

    // Search
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.product_number.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
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
        suppliers,
        categoryHierarchy,
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
