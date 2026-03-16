/**
 * Product normalizer for Therwatt webshop
 *
 * Maps raw data from any source (CSV, catalog, website) to the common product model.
 * Supports products with and without price.
 * Applies fallback values and generates match_keys.
 */

import { calculatePrice } from './priceCalculator.js';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%230d182c">' +
  '<rect width="400" height="300"/>' +
  '<text x="200" y="150" text-anchor="middle" fill="%23555" font-family="sans-serif" font-size="20">THERWATT</text>' +
  '</svg>'
);

/**
 * Generate a URL-safe slug from text
 */
export function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ä/g, 'a')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize a title for matching purposes
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9æøå]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a single raw row into the common product model.
 * Works for CSV rows, catalog data, and website data.
 * @param {Object} rawRow - Parsed row from any source
 * @returns {Object} Normalized product
 */
export function normalizeProduct(rawRow) {
  const productNumber = String(rawRow.product_number || '').trim();
  const title = rawRow.title && rawRow.title.trim() ? rawRow.title.trim() : `Produkt ${productNumber}`;
  const category = rawRow.product_group_description && rawRow.product_group_description.trim()
    ? rawRow.product_group_description.trim()
    : rawRow.category || 'Produkter';
  const mainCategory = rawRow.business_area_description && rawRow.business_area_description.trim()
    ? rawRow.business_area_description.trim()
    : rawRow.main_category || '';
  const subCategory = rawRow.sub_category || '';
  const productGroup = rawRow.product_group || '';

  const slug = rawRow.slug && rawRow.slug.trim()
    ? rawRow.slug.trim()
    : generateSlug(title);

  // Calculate pricing - support products without price
  const grossPrice = Number(rawRow.gross_price) || 0;
  const discountPercent = Number(rawRow.discount_percent) || 0;
  const hasPrice = grossPrice > 0;
  const pricing = hasPrice
    ? calculatePrice(grossPrice, discountPercent)
    : {
        gross_price_ex_vat: 0,
        customer_discount_percent: 0,
        price_ex_vat: 0,
        price_inc_vat: 0,
        price: 0,
        vat_rate: 0.25,
      };

  const priceStatus = hasPrice ? 'active' : 'mangler pris';

  const matchKeys = {
    product_number: productNumber,
    nobb_number: rawRow.nobb_number || null,
    ean: rawRow.ean || null,
    supplier_product_id: rawRow.supplier_product_id || productNumber,
    normalized_title: normalizeTitle(title),
  };

  const supplier = rawRow.supplier || 'Dahl';

  return {
    // Identification
    supplier,
    supplier_product_id: rawRow.supplier_product_id || productNumber,
    product_number: productNumber,
    nobb_number: rawRow.nobb_number || null,
    ean: rawRow.ean || null,
    slug,

    // Content
    title,
    description: rawRow.description || 'Produktbeskrivelse kommer',
    short_description: rawRow.short_description || '',
    brand: rawRow.brand || '',

    // Categorization
    main_category: mainCategory,
    sub_category: subCategory,
    product_group: productGroup,
    category,
    category_slug: rawRow.group_slug || generateSlug(category),

    // Media
    image: rawRow.image || PLACEHOLDER_IMAGE,
    images: rawRow.images || [],
    documents: rawRow.documents || [],
    specifications: rawRow.specifications || {},

    // Pricing
    gross_price: grossPrice,
    gross_price_ex_vat: pricing.gross_price_ex_vat,
    discount_percent: discountPercent,
    customer_discount_percent: pricing.customer_discount_percent,
    price_ex_vat: pricing.price_ex_vat,
    price: pricing.price,
    price_inc_vat: pricing.price_inc_vat,
    vat_rate: pricing.vat_rate,

    // Status
    price_status: priceStatus,
    stock_status: rawRow.stock_status || 'unknown',
    unit: rawRow.unit || '',

    // Source tracking
    source_type: rawRow.source_type || 'csv',
    source_url: rawRow.source_url || null,
    valid_from: rawRow.valid_from || null,

    // Matching
    match_keys: matchKeys,
  };
}

/**
 * Normalize an array of raw rows from any source
 * @param {Array<Object>} rawRows - Parsed rows
 * @returns {Array<Object>} Normalized products
 */
export function normalizeProducts(rawRows) {
  return rawRows.map(normalizeProduct);
}
