#!/usr/bin/env node
/**
 * enrich-data.js
 *
 * Reads all product JSON files, enriches each product with:
 *   - brand:       extracted from group_name and/or product name
 *   - nobb_number: placeholder (null)
 *   - category:    cleaner title-case version of group_name
 *   - description: improved, natural-sounding Norwegian text
 *
 * Then writes the enriched data back and regenerates sku-index.json.
 *
 * Usage:  node scripts/enrich-data.js
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(__dirname, '..', 'Data');

const PRODUCT_FILES = [
  'products-vvs.json',
  'products-industri.json',
  'products-vann-og-milj-teknikk.json',
  'products-verkt-y.json',
];

// Known brands in order from longest to shortest so multi-word names match first.
// Each entry: [canonical display name, regex-safe matching pattern (case-insensitive)]
const KNOWN_BRANDS = [
  ['Armaturjonsson', '\\barmaturjonsson\\b'],
  ['Villeroy & Boch', '\\bvilleroy\\b|\\bv&b\\b|\\bv\\+b\\b'],
  ['Hans Grohe',     '\\bhans\\s*grohe\\b|\\bhansgrohe\\b'],
  ['Snickers Workwear', '\\bsnickers\\s*workwear\\b'],
  ['Gustavsberg',    '\\bgustavsberg\\b'],
  ['Rockwool',       '\\brockwool\\b'],
  ['Milwaukee',      '\\bmilwaukee\\b'],
  ['Snickers',       '\\bsnickers\\b'],
  ['Duravit',        '\\bduravit\\b'],
  ['Alterna',        '\\balterna\\b'],
  ['Nilfisk',        '\\bnilfisk\\b'],
  ['Geberit',        '\\bgeberit\\b'],
  ['Teekay',         '\\bteekay\\b'],
  ['Altech',         '\\baltech\\b'],
  ['Uponor',         '\\buponor\\b'],
  ['Grohe',          '\\bgrohe\\b'],
  ['Palme',          '\\bpalme\\b'],
  ['Macro',          '\\bmacro\\b'],
  ['Bahco',          '\\bbahco\\b'],
  ['Wavin',          '\\bwavin\\b'],
  ['Isola',          '\\bisola\\b'],
  ['Noha',           '\\bnoha\\b'],
  ['Olfa',           '\\bolfa\\b'],
  ['Oras',           '\\boras\\b'],
  ['Roca',           '\\broca\\b'],
  ['Roth',           '\\broth\\b'],
  ['Dline',          '\\bdline\\b|\\bd-line\\b|\\bd line\\b'],
  ['Fima',           '\\bfima\\b'],
  ['Hüppe',          '\\bh[uü]ppe\\b'],
  ['FMM',            '\\bfmm\\b'],
  ['OSO',            '\\boso\\b'],
  ['ACO',            '\\baco\\b'],
  ['LK',             '\\blk\\b'],
  ['PB',             '\\bpb\\b'],
  ['GB',             '\\bgb\\b'],
  ['Fein',           '\\bfein\\b'],
  ['Porsgrund',      '\\bporsgrund\\b'],
];

// ---------------------------------------------------------------------------
// Brand extraction from group_name
// ---------------------------------------------------------------------------

/**
 * Many group_names follow the pattern "CATEGORY BRANDNAME", e.g.
 *   "SANITÆRARMATUR ORAS"  -> brand Oras
 *   "BADE-/VASKEROMSMØBLER ALTERNA" -> brand Alterna
 *   "RØR-I-RØR/MULTILAYER UPONOR"  -> brand Uponor
 *
 * This map is built from the actual group_names we found in the data.
 */
const GROUP_TO_BRAND = {
  'SANITÆRARMATUR ORAS':                        'Oras',
  'SANITÆRARMATUR ALTERNA':                     'Alterna',
  'SANITÆRARMATUR HANS GROHE':                  'Hans Grohe',
  'SANITÆRARMATUR GUSTAVSBERG':                 'Gustavsberg',
  'SANITÆRARMATUR FMM':                         'FMM',
  'SANITÆRARMATUR FIMA':                        'Fima',
  'SANITÆRARMATUR DLINE':                       'Dline',
  'SANITÆRARMATUR DIV.':                        null,
  'BADE-/VASKEROMSMØBLER ALTERNA':              'Alterna',
  'BADE-/VASKEROMSMØBLER ROCA':                 'Roca',
  'BADE-/VASKEROMSMØBLER DIV.':                 null,
  'BADEKAR ALTERNA':                            'Alterna',
  'BADEROMSUTSTYR ALTERNA':                     'Alterna',
  'RUSTFRITT SANITÆRUTSTYR ALTERNA':            'Alterna',
  'DUSJ ALTERNA':                               'Alterna',
  'DUSJ MACRO':                                 'Macro',
  'DUSJ PALME/HUPPE':                           null,  // two brands, resolve from name
  'SERVANTER OG KLOSETTER ALTERNA':             'Alterna',
  'SERVANTER OG KLOSETTER DURAVIT':             'Duravit',
  'SERVANTER OG KLOSETTER GB':                  'Gustavsberg',
  'SERVANTER OG KLOSETTER PB':                  'PB',
  'SERVANTER OG KLOSETTER V&B':                 'Villeroy & Boch',
  'SERVANTER OG KLOSETTER DIV.LEVERANDØRER':    null,
  'SERVANTER OG TOALETTER ROCA':                'Roca',
  'RØR-I-RØR/MULTILAYER UPONOR':               'Uponor',
  'RØR-I-RØR/MULTILAYER ROTH':                  'Roth',
  'RØR-I-RØR/MULTILAYER LK':                    'LK',
  'RØR-I-RØR/MULTILAYER ALTECH':                'Altech',
  'RØR-I-RØR/ MULTILAYER ARMATURJONSSON':       'Armaturjonsson',
  'RØR-I-RØR/MULTILAYER DIVERSE':               null,
  'ALTECH OB':                                  'Altech',
  'PRESSFITTINGS KOBBER':                       null,
  'PRESSFITTINGS GALVANISERT':                  null,
  'PRESSFITTINGS SYREFAST':                     null,
};

/**
 * Try to extract a brand from group_name first, then from product name.
 */
function extractBrand(product) {
  const gn = product.group_name || '';
  const pn = product.name || '';

  // 1. Direct group_name map (explicit mappings take priority)
  if (gn in GROUP_TO_BRAND) {
    const b = GROUP_TO_BRAND[gn];
    if (b) return b;
    // null means "resolve from name", skip group_name scan and go to name
  } else {
    // 2. Scan group_name for a known brand pattern (only if not in explicit map)
    for (const [canonical, pattern] of KNOWN_BRANDS) {
      const re = new RegExp(pattern, 'i');
      if (re.test(gn)) return canonical;
    }
  }

  // 3. Scan product name for a known brand pattern
  for (const [canonical, pattern] of KNOWN_BRANDS) {
    const re = new RegExp(pattern, 'i');
    if (re.test(pn)) return canonical;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Category cleanup  (group_name -> clean title case)
// ---------------------------------------------------------------------------

/**
 * Turn an all-caps group_name into a readable title-case category.
 * "SANITÆRARMATUR ORAS"  -> "Sanitærarmatur Oras"
 * "DELER FOR DRENS-/ANLEGGS-/OVERVANNSRØR" -> "Deler for Drens-/Anleggs-/Overvannsrør"
 * "BADE-/VASKEROMSMØBLER ALTERNA" -> "Bade-/Vaskeromsmøbler Alterna"
 */
const LOWERCASE_WORDS = new Set([
  'og', 'i', 'for', 'av', 'med', 'til', 'fra', 'innen', 'uten',
  'etc.', 'o.l.', 'div.', 'div',
]);

function cleanCategory(groupName) {
  if (!groupName) return '';

  // Special short codes – just return as-is
  if (/^[0-9A-Z]{2}$/.test(groupName)) return groupName;

  const words = groupName.toLowerCase().split(/\s+/);
  return words.map((w, idx) => {
    // Always capitalise first word
    if (idx === 0) return capitalizeWord(w);
    // Keep small words lowercase (unless it looks like a brand)
    if (LOWERCASE_WORDS.has(w)) return w;
    return capitalizeWord(w);
  }).join(' ');
}

/** Capitalise a word, handling hyphens and slashes inside. */
function capitalizeWord(w) {
  return w.replace(/(^|[/\-(])([a-zA-ZæøåÆØÅéüö])/g, (m, sep, ch) => {
    return sep + ch.toUpperCase();
  });
}

// ---------------------------------------------------------------------------
// Description improvement
// ---------------------------------------------------------------------------

/**
 * The existing descriptions all follow this template:
 *   "<Name> er et produkt i kategorien <group_name lower> innen <area>.
 *    Produktet er hentet fra gjeldende prisfil og er egnet for profesjonell
 *    installasjon, service eller vedlikehold. Selges i enhet: <unit>."
 *
 * We replace them with short, professional descriptions built from product
 * attributes.
 */

const UNIT_MAP = {
  'STK':  'stk',
  'M':    'meter',
  'M2':   'm\u00B2',
  'M3':   'm\u00B3',
  'RUL':  'rull',
  'BK':   'pakke',
  'PK':   'pakke',
  'KG':   'kg',
  'L':    'liter',
  'PAR':  'par',
  'SET':  'sett',
  'SPL':  'spole',
  'BOK':  'boks',
  'BTL':  'bunt',
  'BTK':  'bunt',
  'PS':   'pose',
  'KRT':  'kartong',
  'SK':   'sekk',
  'BNT':  'bunt',
};

function friendlyUnit(raw) {
  if (!raw) return null;
  return UNIT_MAP[raw.toUpperCase()] || raw.toLowerCase();
}

/**
 * Build a new description for a product.
 *
 * Strategy:
 *   - Start with the product name, cleaned up.
 *   - Mention the brand if known.
 *   - Mention the category context.
 *   - Add a unit line.
 */
function improveDescription(product, brand, category) {
  const name = product.name || '';
  const unit = product.unit || '';
  const areaName = product.area_name || '';
  const groupName = product.group_name || '';

  // Build a cleaner version of the product name (remove repeated brand, trim whitespace)
  let cleanName = name.replace(/\s{2,}/g, ' ').trim();

  // Extract dimensional / spec info from the name
  const dimMatch = cleanName.match(/(\d+[Xx×]\d+(\s*[Mm][Mm])?)/);
  const dimension = dimMatch ? dimMatch[1].replace(/x/gi, 'x') : null;

  // Determine the product type from the category
  const catLower = category.toLowerCase();

  // Build description parts
  const parts = [];

  // Primary line: what it is
  let primaryLine = cleanName;
  // Remove trailing brand from name if present (avoid duplication)
  if (brand) {
    const brandEsc = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    primaryLine = primaryLine.replace(new RegExp('\\s+' + brandEsc + '\\s*$', 'i'), '').trim();
    // Also remove brand at end with parenthetical
    primaryLine = primaryLine.replace(new RegExp('\\s+' + brandEsc + '\\s*\\(.*?\\)\\s*$', 'i'), '').trim();
  }
  // Remove trailing (Bd) that appears on many products
  primaryLine = primaryLine.replace(/\s*\(Bd\)\s*$/i, '').trim();

  // Build a human-readable first sentence
  let desc = primaryLine;
  if (brand) {
    desc += ' fra ' + brand + '.';
  } else {
    desc += '.';
  }

  parts.push(desc);

  // Second line: category context
  if (category && !/^[0-9A-Z]{2}$/.test(category)) {
    parts.push('Kategori: ' + category + '.');
  }

  // Third line: selling unit
  const fu = friendlyUnit(unit);
  if (fu) {
    parts.push('Selges per ' + fu + '.');
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

function processFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  console.log(`\nProcessing ${filename}...`);

  const raw = fs.readFileSync(filepath, 'utf8');
  const products = JSON.parse(raw);

  let brandsFound = 0;
  let brandsNotFound = 0;
  const brandCounts = {};

  for (const product of products) {
    // Extract brand
    const brand = extractBrand(product);
    product.brand = brand;

    if (brand) {
      brandsFound++;
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    } else {
      brandsNotFound++;
    }

    // NOBB placeholder
    product.nobb_number = null;

    // Clean category
    const category = cleanCategory(product.group_name);
    product.category = category;

    // Improved description
    product.description = improveDescription(product, brand, category);
  }

  // Write back
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2), 'utf8');

  console.log(`  Total products: ${products.length}`);
  console.log(`  Brands found:   ${brandsFound} (${(brandsFound / products.length * 100).toFixed(1)}%)`);
  console.log(`  No brand:        ${brandsNotFound}`);

  // Top brands
  const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    console.log('  Top brands:');
    sorted.slice(0, 15).forEach(([b, c]) => console.log(`    ${b}: ${c}`));
    if (sorted.length > 15) console.log(`    ... and ${sorted.length - 15} more`);
  }

  return products;
}

function rebuildSkuIndex(allProducts) {
  const skuIndex = {};
  for (const { filename, products } of allProducts) {
    for (const p of products) {
      skuIndex[p.sku] = filename;
    }
  }
  const indexPath = path.join(DATA_DIR, 'sku-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(skuIndex), 'utf8');
  console.log(`\nsku-index.json updated with ${Object.keys(skuIndex).length} entries.`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log('=== Product Data Enrichment ===');
console.log('Data directory:', DATA_DIR);
console.log('');

const allResults = [];
let totalProducts = 0;
let totalBrands = 0;

for (const filename of PRODUCT_FILES) {
  const products = processFile(filename);
  allResults.push({ filename, products });
  totalProducts += products.length;
  totalBrands += products.filter(p => p.brand !== null).length;
}

rebuildSkuIndex(allResults);

console.log('\n=== Summary ===');
console.log(`Total products processed: ${totalProducts}`);
console.log(`Products with brand:      ${totalBrands} (${(totalBrands / totalProducts * 100).toFixed(1)}%)`);
console.log(`Products without brand:   ${totalProducts - totalBrands}`);
console.log('\nDone.');
