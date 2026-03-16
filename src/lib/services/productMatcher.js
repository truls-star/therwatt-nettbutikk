/**
 * Product matcher utility for Therwatt webshop
 *
 * Matches products from different sources (price files, catalogs, websites)
 * using indexed lookups for performance.
 *
 * Matching priority:
 * 1. Exact product_number match
 * 2. nobb_number match
 * 3. EAN match
 * 4. supplier_product_id match
 * 5. Exact normalized_title match (last resort)
 *
 * Merge rules:
 * - Price file controls pricing
 * - Catalog/website controls content (name, description, images, category)
 */

/**
 * Build fast lookup indexes from a list of products
 * @param {Array<Object>} products - Products to index
 * @returns {Object} Indexes keyed by match field
 */
export function buildMatchIndex(products) {
  const byProductNumber = new Map();
  const byNobbNumber = new Map();
  const byEan = new Map();
  const bySupplierId = new Map();
  const byNormalizedTitle = new Map();

  for (const product of products) {
    const keys = product.match_keys || {};

    if (keys.product_number) {
      byProductNumber.set(keys.product_number, product);
    }
    if (keys.nobb_number) {
      byNobbNumber.set(keys.nobb_number, product);
    }
    if (keys.ean) {
      byEan.set(keys.ean, product);
    }
    if (keys.supplier_product_id || product.supplier_product_id) {
      bySupplierId.set(keys.supplier_product_id || product.supplier_product_id, product);
    }
    if (keys.normalized_title) {
      byNormalizedTitle.set(keys.normalized_title, product);
    }
  }

  return { byProductNumber, byNobbNumber, byEan, bySupplierId, byNormalizedTitle };
}

/**
 * Try to find a match for a source product using indexed lookups
 * @param {Object} sourceProduct - Product to match (must have match_keys)
 * @param {Object} index - Pre-built index from buildMatchIndex
 * @returns {MatchResult|null} Match result or null if no match found
 */
export function findMatchIndexed(sourceProduct, index) {
  const keys = sourceProduct.match_keys || {};

  if (keys.product_number && index.byProductNumber.has(keys.product_number)) {
    return {
      matchType: 'product_number',
      confidence: 1.0,
      sourceProduct,
      targetProduct: index.byProductNumber.get(keys.product_number),
    };
  }

  if (keys.nobb_number && index.byNobbNumber.has(keys.nobb_number)) {
    return {
      matchType: 'nobb_number',
      confidence: 0.95,
      sourceProduct,
      targetProduct: index.byNobbNumber.get(keys.nobb_number),
    };
  }

  if (keys.ean && index.byEan.has(keys.ean)) {
    return {
      matchType: 'ean',
      confidence: 0.95,
      sourceProduct,
      targetProduct: index.byEan.get(keys.ean),
    };
  }

  const suppId = keys.supplier_product_id || sourceProduct.supplier_product_id;
  if (suppId && index.bySupplierId.has(suppId)) {
    return {
      matchType: 'supplier_product_id',
      confidence: 0.85,
      sourceProduct,
      targetProduct: index.bySupplierId.get(suppId),
    };
  }

  if (keys.normalized_title && index.byNormalizedTitle.has(keys.normalized_title)) {
    return {
      matchType: 'title_exact',
      confidence: 0.6,
      sourceProduct,
      targetProduct: index.byNormalizedTitle.get(keys.normalized_title),
    };
  }

  return null;
}

/**
 * Try to find a match for a source product in a list of target products
 * @param {Object} sourceProduct - Product to match (must have match_keys)
 * @param {Array<Object>} targetProducts - Products to match against
 * @returns {MatchResult|null}
 */
export function findMatch(sourceProduct, targetProducts) {
  const index = buildMatchIndex(targetProducts);
  return findMatchIndexed(sourceProduct, index);
}

/**
 * Merge two product records, with source taking priority for pricing
 * and target taking priority for content
 * @param {Object} priceSource - Product with pricing data (from price file)
 * @param {Object} contentSource - Product with content data (from catalog/website)
 * @returns {Object} Merged product
 */
export function mergeProducts(priceSource, contentSource) {
  return {
    ...contentSource,
    gross_price: priceSource.gross_price,
    gross_price_ex_vat: priceSource.gross_price_ex_vat,
    discount_percent: priceSource.discount_percent,
    customer_discount_percent: priceSource.customer_discount_percent,
    price_ex_vat: priceSource.price_ex_vat,
    price: priceSource.price,
    price_inc_vat: priceSource.price_inc_vat,
    vat_rate: priceSource.vat_rate,
    price_status: priceSource.price_status || 'active',
    title: contentSource.title || priceSource.title,
    description: contentSource.description || priceSource.description,
    short_description: contentSource.short_description || priceSource.short_description,
    image: contentSource.image || priceSource.image,
    images: contentSource.images?.length ? contentSource.images : priceSource.images,
    category: contentSource.category || priceSource.category,
    main_category: contentSource.main_category || priceSource.main_category,
    sub_category: contentSource.sub_category || priceSource.sub_category,
    product_group: contentSource.product_group || priceSource.product_group,
    specifications: Object.keys(contentSource.specifications || {}).length
      ? contentSource.specifications
      : priceSource.specifications,
    slug: contentSource.slug || priceSource.slug,
    source_type: 'merged',
    match_keys: {
      ...priceSource.match_keys,
      ...contentSource.match_keys,
    },
  };
}

/**
 * Match and merge products from a price source with a content source.
 * Uses indexed lookups for performance.
 * @param {Array<Object>} priceProducts - Products from price file
 * @param {Array<Object>} contentProducts - Products from catalog/website
 * @returns {{ merged: Array<Object>, unmatchedPrice: Array<Object>, unmatchedContent: Array<Object> }}
 */
export function matchAndMerge(priceProducts, contentProducts) {
  const contentIndex = buildMatchIndex(contentProducts);
  const matchedContentIds = new Set();
  const merged = [];
  const unmatchedPrice = [];

  for (const priceProduct of priceProducts) {
    const match = findMatchIndexed(priceProduct, contentIndex);
    if (match) {
      merged.push(mergeProducts(priceProduct, match.targetProduct));
      matchedContentIds.add(match.targetProduct.product_number);
    } else {
      unmatchedPrice.push(priceProduct);
    }
  }

  const unmatchedContent = contentProducts.filter(
    (p) => !matchedContentIds.has(p.product_number)
  );

  return { merged, unmatchedPrice, unmatchedContent };
}
