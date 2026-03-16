/**
 * Robust CSV parser with support for:
 * - Semicolon or comma delimiters (auto-detected)
 * - Norwegian number formats (comma as decimal separator)
 * - BOM handling
 * - Empty lines and incomplete rows
 * - Flexible column name mapping
 */

const COLUMN_MAP = {
  // product_number variants
  sku: 'product_number',
  product_number: 'product_number',
  varenummer: 'product_number',
  nobb: 'product_number',
  nobb_number: 'product_number',
  productnumber: 'product_number',

  // title variants
  product_name: 'title',
  title: 'title',
  produktnavn: 'title',
  name: 'title',
  navn: 'title',

  // slug
  product_slug: 'slug',
  slug: 'slug',

  // gross_price variants
  gross_price: 'gross_price',
  grossprice: 'gross_price',
  bruttopris: 'gross_price',
  price: 'gross_price',
  pris: 'gross_price',

  // discount_percent variants
  discount_percent: 'discount_percent',
  discountpercent: 'discount_percent',
  rabatt: 'discount_percent',
  discount: 'discount_percent',
  rabatt_prosent: 'discount_percent',

  // Additional fields we want to capture
  discount_amount: 'discount_amount',
  net_price: 'net_price',
  unit: 'unit',
  enhet: 'unit',
  product_group: 'product_group',
  produktgruppe: 'product_group',
  product_group_description: 'product_group_description',
  group_slug: 'group_slug',
  business_area: 'business_area',
  business_area_description: 'business_area_description',
  valid_from: 'valid_from',
};

/**
 * Remove BOM from start of string
 */
function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Detect delimiter by counting occurrences in the header line
 */
function detectDelimiter(headerLine) {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

/**
 * Parse a number that may use Norwegian format (comma as decimal separator)
 */
function parseNumber(value, delimiter) {
  if (value === undefined || value === null || value === '') return null;

  let cleaned = String(value).trim();

  // If delimiter is semicolon, numbers may use comma as decimal separator
  if (delimiter === ';') {
    // Remove spaces used as thousand separator
    cleaned = cleaned.replace(/\s/g, '');
    // Replace comma with period for decimal
    cleaned = cleaned.replace(',', '.');
  } else {
    // Comma delimiter means period decimal separator
    cleaned = cleaned.replace(/\s/g, '');
  }

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Split a CSV line respecting quoted fields
 */
function splitLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Map raw header names to normalized field names
 */
function mapHeaders(rawHeaders) {
  return rawHeaders.map((header) => {
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    return COLUMN_MAP[normalized] || normalized;
  });
}

/**
 * Parse CSV content into array of objects
 * @param {string} csvContent - Raw CSV string
 * @returns {{ rows: Array<Object>, errors: Array<string>, delimiter: string }}
 */
export function parseCSV(csvContent) {
  const errors = [];
  const cleaned = stripBom(csvContent);
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV file has no data rows'], delimiter: ',' };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = splitLine(lines[0], delimiter);
  const headers = mapHeaders(rawHeaders);

  // Validate that we have at least product_number and gross_price
  const hasProductNumber = headers.includes('product_number');
  const hasGrossPrice = headers.includes('gross_price');

  if (!hasProductNumber) {
    errors.push('CSV missing product_number column (tried: sku, varenummer, nobb, product_number)');
  }
  if (!hasGrossPrice) {
    errors.push('CSV missing gross_price column (tried: gross_price, bruttopris, grossprice, price)');
  }

  if (!hasProductNumber || !hasGrossPrice) {
    return { rows: [], errors, delimiter };
  }

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = splitLine(lines[i], delimiter);

      if (values.length < 2) {
        errors.push(`Row ${i + 1}: too few fields, skipping`);
        continue;
      }

      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] !== undefined ? values[j] : '';
      }

      // Validate required fields
      if (!row.product_number || row.product_number.trim() === '') {
        errors.push(`Row ${i + 1}: missing product_number, skipping`);
        continue;
      }

      const grossPrice = parseNumber(row.gross_price, delimiter);
      if (grossPrice === null || grossPrice <= 0) {
        errors.push(`Row ${i + 1}: invalid gross_price "${row.gross_price}", skipping`);
        continue;
      }

      // Parse numeric fields
      row.gross_price = grossPrice;
      row.discount_percent = parseNumber(row.discount_percent, delimiter) || 0;
      row.discount_amount = parseNumber(row.discount_amount, delimiter) || 0;
      row.net_price = parseNumber(row.net_price, delimiter) || 0;

      rows.push(row);
    } catch (err) {
      errors.push(`Row ${i + 1}: parse error - ${err.message}`);
    }
  }

  return { rows, errors, delimiter };
}
