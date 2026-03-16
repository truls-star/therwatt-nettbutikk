/**
 * CSV source connector for Therwatt webshop
 *
 * Reads the price CSV file and returns raw data.
 * In Phase 1, this reads the uploaded CSV file from the data directory.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Read CSV content from the data directory
 * @param {string} [filename='prisfil.csv'] - CSV filename
 * @returns {string} Raw CSV content
 */
export function readCSVFile(filename = 'prisfil.csv') {
  const csvPath = resolve('data', filename);
  return readFileSync(csvPath, 'utf-8');
}
