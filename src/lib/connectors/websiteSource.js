/**
 * Website source connector (stub for future phases)
 *
 * Will be used to fetch product data from supplier websites.
 * In Phase 1 this is a placeholder module.
 */

/**
 * Fetch product data from a supplier website
 * @param {Object} options - Website source options
 * @param {string} options.supplier - Supplier identifier
 * @param {string} options.url - Product URL
 * @returns {Promise<Object|null>} Product data or null
 */
export async function fetchWebsiteProduct(options = {}) {
  // Stub: will be implemented in a later phase
  return null;
}

/**
 * Fetch multiple products from a supplier website
 * @param {Object} options - Website source options
 * @param {string} options.supplier - Supplier identifier
 * @param {string} options.categoryUrl - Category page URL
 * @returns {Promise<Array<Object>>} Array of raw product data
 */
export async function fetchWebsiteProducts(options = {}) {
  // Stub: will be implemented in a later phase
  return [];
}

/**
 * Check if a website source is available
 * @param {string} supplier - Supplier identifier
 * @returns {Promise<boolean>}
 */
export async function isWebsiteAvailable(supplier) {
  // Stub: no website sources connected in Phase 1
  return false;
}
