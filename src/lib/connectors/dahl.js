/**
 * Dahl supplier connector
 *
 * Dahl uses:
 * - prisfil (CSV) as primary price source
 * - optional enrichment data from dahl.no for product info
 *
 * In Phase 2, this connector defines the structure.
 * Full catalog/website integration comes later.
 */

export const SUPPLIER_ID = 'dahl';
export const SUPPLIER_NAME = 'Dahl';

/**
 * Connector configuration for Dahl
 */
export const config = {
  id: SUPPLIER_ID,
  name: SUPPLIER_NAME,
  sources: {
    priceFile: { enabled: true, type: 'csv', path: 'data/prisfil.csv' },
    catalog: { enabled: false, type: 'api', url: null },
    website: { enabled: false, type: 'scrape', url: 'https://www.dahl.no' },
  },
  matching: {
    primaryKey: 'product_number',
    fallbackKeys: ['nobb_number', 'ean'],
  },
};

/**
 * Normalize a raw product row for Dahl
 * Adds supplier-specific defaults and mappings
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
 * Get available source types for Dahl
 * @returns {string[]} List of enabled source types
 */
export function getEnabledSources() {
  return Object.entries(config.sources)
    .filter(([, src]) => src.enabled)
    .map(([key]) => key);
}
