/**
 * Product matcher utility for Therwatt webshop
 *
 * Prepared for later phases where products from different sources
 * (price files, catalogs, websites) need to be matched together.
 *
 * Matching priority:
 * 1. Exact product_number match
 * 2. nobb_number match
 * 3. EAN match
 * 4. supplier_product_id match
 * 5. Exact title match (last resort)
 *
 * In Phase 1 this is not actively used against external sources,
 * but the structure and functions are ready.
 */

/**
 * @typedef {Object} MatchResult
 * @property {string} matchType - Type of match found
 * @property {number} confidence - Confidence score (0-1)
 * @property {Object} sourceProduct - The source product
 * @property {Object} targetProduct - The matched target product
 */

/**
 * Try to find a match for a source product in a list of target products
 * @param {Object} sourceProduct - Product to match (must have match_keys)
 * @param {Array<Object>} targetProducts - Products to match against
 * @returns {MatchResult|null} Match result or null if no match found
 */
export function findMatch(sourceProduct, targetProducts) {
  const sourceKeys = sourceProduct.match_keys || {};

  // Priority 1: Exact product_number
  if (sourceKeys.product_number) {
    const match = targetProducts.find(
      (t) => t.match_keys?.product_number === sourceKeys.product_number
    );
    if (match) {
      return {
        matchType: 'product_number',
        confidence: 1.0,
        sourceProduct,
        targetProduct: match,
      };
    }
  }

  // Priority 2: nobb_number
  if (sourceKeys.nobb_number) {
    const match = targetProducts.find(
      (t) => t.match_keys?.nobb_number && t.match_keys.nobb_number === sourceKeys.nobb_number
    );
    if (match) {
      return {
        matchType: 'nobb_number',
        confidence: 0.95,
        sourceProduct,
        targetProduct: match,
      };
    }
  }

  // Priority 3: EAN
  if (sourceKeys.ean) {
    const match = targetProducts.find(
      (t) => t.match_keys?.ean && t.match_keys.ean === sourceKeys.ean
    );
    if (match) {
      return {
        matchType: 'ean',
        confidence: 0.95,
        sourceProduct,
        targetProduct: match,
      };
    }
  }

  // Priority 4: supplier_product_id
  if (sourceProduct.supplier_product_id) {
    const match = targetProducts.find(
      (t) => t.supplier_product_id === sourceProduct.supplier_product_id
    );
    if (match) {
      return {
        matchType: 'supplier_product_id',
        confidence: 0.85,
        sourceProduct,
        targetProduct: match,
      };
    }
  }

  // Priority 5: Exact normalized title match
  if (sourceKeys.normalized_title) {
    const match = targetProducts.find(
      (t) => t.match_keys?.normalized_title && t.match_keys.normalized_title === sourceKeys.normalized_title
    );
    if (match) {
      return {
        matchType: 'title_exact',
        confidence: 0.6,
        sourceProduct,
        targetProduct: match,
      };
    }
  }

  return null;
}

/**
 * Merge two product records, with source taking priority for pricing
 * and target taking priority for content (name, description, images, category)
 * @param {Object} priceSource - Product with pricing data (from price file)
 * @param {Object} contentSource - Product with content data (from catalog/website)
 * @returns {Object} Merged product
 */
export function mergeProducts(priceSource, contentSource) {
  return {
    ...contentSource,
    // Pricing always from price source
    gross_price: priceSource.gross_price,
    gross_price_ex_vat: priceSource.gross_price_ex_vat,
    discount_percent: priceSource.discount_percent,
    customer_discount_percent: priceSource.customer_discount_percent,
    price_ex_vat: priceSource.price_ex_vat,
    price: priceSource.price,
    price_inc_vat: priceSource.price_inc_vat,
    vat_rate: priceSource.vat_rate,
    // Keep content from content source
    title: contentSource.title || priceSource.title,
    description: contentSource.description || priceSource.description,
    image: contentSource.image || priceSource.image,
    images: contentSource.images?.length ? contentSource.images : priceSource.images,
    category: contentSource.category || priceSource.category,
    // Preserve slug from content source to avoid breaking URLs
    slug: contentSource.slug || priceSource.slug,
    // Track sources
    source_type: 'merged',
    match_keys: {
      ...priceSource.match_keys,
      ...contentSource.match_keys,
    },
  };
}

/**
 * Match and merge products from a price source with a content source
 * @param {Array<Object>} priceProducts - Products from price file
 * @param {Array<Object>} contentProducts - Products from catalog/website
 * @returns {{ merged: Array<Object>, unmatched: Array<Object> }}
 */
export function matchAndMerge(priceProducts, contentProducts) {
  const merged = [];
  const unmatched = [];

  for (const priceProduct of priceProducts) {
    const match = findMatch(priceProduct, contentProducts);
    if (match) {
      merged.push(mergeProducts(priceProduct, match.targetProduct));
    } else {
      unmatched.push(priceProduct);
    }
  }

  return { merged, unmatched };
}
