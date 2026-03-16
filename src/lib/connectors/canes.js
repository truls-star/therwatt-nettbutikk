/**
 * Canes supplier connector
 *
 * Canes will use:
 * - website scraping first (for product info)
 * - prisfil (CSV) later when available
 *
 * In Phase 2, this connector defines the structure.
 * Full integration comes later.
 */

export const SUPPLIER_ID = 'canes';
export const SUPPLIER_NAME = 'Canes';

/**
 * Connector configuration for Canes
 */
export const config = {
  id: SUPPLIER_ID,
  name: SUPPLIER_NAME,
  sources: {
    priceFile: { enabled: false, type: 'csv', path: null },
    catalog: { enabled: false, type: 'api', url: null },
    website: { enabled: false, type: 'scrape', url: 'https://www.canes.no' },
  },
  matching: {
    primaryKey: 'product_number',
    fallbackKeys: ['nobb_number', 'ean', 'normalized_title'],
  },
};

/**
 * Normalize a raw product row for Canes
 * Products from Canes may not have price initially
 * @param {Object} rawRow - Raw data row
 * @returns {Object} Supplier-tagged row
 */
export function tagSupplier(rawRow) {
  return {
    ...rawRow,
    supplier: SUPPLIER_NAME,
    supplier_id: SUPPLIER_ID,
  };
}

/**
 * Get available source types for Canes
 * @returns {string[]} List of enabled source types
 */
export function getEnabledSources() {
  return Object.entries(config.sources)
    .filter(([, src]) => src.enabled)
    .map(([key]) => key);
}
