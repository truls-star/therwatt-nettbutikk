/**
 * Catalog source connector (stub for future phases)
 *
 * Will be used to fetch product data from supplier catalogs.
 * In Phase 1 this is a placeholder module.
 */

/**
 * Fetch products from a supplier catalog
 * @param {Object} options - Catalog source options
 * @param {string} options.supplier - Supplier identifier
 * @returns {Promise<Array<Object>>} Array of raw product data
 */
export async function fetchCatalogProducts(options = {}) {
  // Stub: will be implemented in a later phase
  return [];
}

/**
 * Check if a catalog source is available
 * @param {string} supplier - Supplier identifier
 * @returns {Promise<boolean>}
 */
export async function isCatalogAvailable(supplier) {
  // Stub: no catalogs connected in Phase 1
  return false;
}
