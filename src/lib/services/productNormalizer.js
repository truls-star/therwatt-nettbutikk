/**
 * Product normalizer for Therwatt webshop
 *
 * Maps raw CSV data to the common product model.
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
 * - lowercase
 * - spaces become hyphens
 * - æ=ae, ø=o, å=a
 * - remove special characters
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
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9æøå]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a single raw CSV row into the common product model
 * @param {Object} rawRow - Parsed CSV row
 * @returns {Object} Normalized product
 */
export function normalizeProduct(rawRow) {
  const productNumber = String(rawRow.product_number || '').trim();
  const title = rawRow.title && rawRow.title.trim() ? rawRow.title.trim() : `Produkt ${productNumber}`;
  const category = rawRow.product_group_description && rawRow.product_group_description.trim()
    ? rawRow.product_group_description.trim()
    : 'Produkter';
  const mainCategory = rawRow.business_area_description && rawRow.business_area_description.trim()
    ? rawRow.business_area_description.trim()
    : '';

  // Use provided slug or generate one
  const slug = rawRow.slug && rawRow.slug.trim()
    ? rawRow.slug.trim()
    : generateSlug(title);

  // Calculate pricing
  const grossPrice = Number(rawRow.gross_price) || 0;
  const discountPercent = Number(rawRow.discount_percent) || 0;
  const pricing = calculatePrice(grossPrice, discountPercent);

  // Build match_keys for future matching
  const matchKeys = {
    product_number: productNumber,
    nobb_number: null,
    ean: null,
    normalized_title: normalizeTitle(title),
  };

  return {
    // Identification
    supplier: 'Therwatt',
    supplier_product_id: productNumber,
    product_number: productNumber,
    nobb_number: null,
    ean: null,
    slug,

    // Content
    title,
    description: 'Produktbeskrivelse kommer',
    short_description: '',
    brand: '',

    // Categorization
    main_category: mainCategory,
    sub_category: '',
    product_group: rawRow.product_group || '',
    category,
    category_slug: rawRow.group_slug || generateSlug(category),

    // Media
    image: PLACEHOLDER_IMAGE,
    images: [],
    documents: [],
    specifications: {},

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
    price_status: 'active',
    stock_status: 'unknown',
    unit: rawRow.unit || '',

    // Source tracking
    source_type: 'csv',
    source_url: null,
    valid_from: rawRow.valid_from || null,

    // Matching
    match_keys: matchKeys,
  };
}

/**
 * Normalize an array of raw CSV rows
 * @param {Array<Object>} rawRows - Parsed CSV rows
 * @returns {Array<Object>} Normalized products
 */
export function normalizeProducts(rawRows) {
  return rawRows.map(normalizeProduct);
}
