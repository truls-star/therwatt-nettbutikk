/**
 * Build script: Processes product catalogs and price files from multiple suppliers.
 * Merges data into a single products.json for the frontend.
 *
 * To add a new supplier:
 * 1. Add catalog/price CSV to src/data/suppliers/<supplier>/
 * 2. Create a loader in src/data/suppliers/<supplier>/loader.js
 * 3. Register in SUPPLIERS array below
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUT_DIR = path.join(ROOT, 'public');

// ─── Configuration ───────────────────────────────────────────
const EUR_TO_NOK = 11.5;
const VAT_RATE = 0.25;

// ─── Category mapping by SKU prefix ─────────────────────────
const MGF_PREFIX_CATEGORIES = {
  '209': 'Fjærer',
  '210': 'Tilbehør borekroner',
  '221': 'Diverse verktøy',
  '241': 'Pressfitting-verktøy',
  '272': 'Manometre og vakuummålere',
  '280': 'Ekspanderverktøy',
  '281': 'Rørbøyere',
  '295': 'Fjærer',
  '300': 'Slanger og tilbehør',
  '302': 'HVAC/R-verktøy',
  '305': 'Slanger og tilbehør',
  '306': 'Slanger og tilbehør',
  '320': 'HVAC/R-verktøy',
  '322': 'HVAC/R-verktøy',
  '323': 'HVAC/R-verktøy',
  '324': 'HVAC/R-verktøy',
  '330': 'HVAC/R-verktøy',
  '430': 'HVAC/R-verktøy',
  '640': 'HVAC/R-verktøy',
  '650': 'HVAC/R-verktøy',
  '730': 'HVAC/R-verktøy',
  '750': 'Rørkuttere',
  '757': 'Rørkuttere',
  '790': 'Trykkprøvepumper',
  '791': 'HVAC/R-verktøy',
  '793': 'HVAC/R-verktøy',
  '810': 'Pressfitting-verktøy',
  '816': 'Varmesystemer',
  '823': 'Pressfitting-verktøy',
  '900': 'Elektroverktøy',
  '902': 'Rørbøyere',
  '903': 'Rørbøyere',
  '904': 'Trykkprøvepumper',
  '905': 'Trykkprøvepumper',
  '906': 'Trykkprøvepumper',
  '907': 'Sveiseverktøy',
  '908': 'Videoinspeksjon',
  '910': 'Håndverktøy',
  '915': 'Varmesystemer',
  '916': 'Rørbøyere',
  '918': 'Varmesystemer',
  '920': 'Håndverktøy',
  '921': 'Håndverktøy',
  '922': 'Håndverktøy',
  '923': 'Håndverktøy',
  '925': 'Håndverktøy',
  '926': 'Sveiseverktøy',
  '930': 'HVAC/R-verktøy',
  '931': 'HVAC/R-verktøy',
  '932': 'HVAC/R-verktøy',
  '934': 'Spylepumper',
  '938': 'Sveiseverktøy',
  '939': 'Kjemikalier og væsker',
  '960': 'Tilbehør',
  '970': 'Avløpsrensing',
};

// ─── CSV Parser ──────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
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
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ─── Slug generator ──────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// ─── Price calculation ───────────────────────────────────────
function calculateNOK(eurExVat) {
  const eur = parseFloat(eurExVat);
  if (isNaN(eur) || eur <= 0) return null;
  return Math.round(eur * EUR_TO_NOK * (1 + VAT_RATE));
}

// ─── MGF Tools Loader ────────────────────────────────────────
function loadMGFTools() {
  const csvPath = path.join(DATA_DIR, 'suppliers', 'mgf-tools', 'prices.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('MGF Tools price file not found:', csvPath);
    return [];
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);

  return rows.map(row => {
    const sku = row.sku || '';
    const prefix = sku.substring(0, 3);
    const category = MGF_PREFIX_CATEGORIES[prefix] || 'Diverse verktøy';
    const priceNOK = calculateNOK(row.price_ex_vat);
    const slug = slugify(`${sku}-${row.name || ''}`);

    return {
      sku,
      name: row.name || '',
      slug,
      supplier: 'MGF Tools',
      category,
      price_eur: parseFloat(row.price_ex_vat) || null,
      price_nok: priceNOK,
      package: row.package || '',
      description: '',
      specs: {},
      images: []
    };
  }).filter(p => p.sku && p.name);
}

// ─── Main build ──────────────────────────────────────────────
function build() {
  console.log('Building product data...');
  console.log(`Exchange rate: 1 EUR = ${EUR_TO_NOK} NOK`);
  console.log(`VAT rate: ${VAT_RATE * 100}%`);

  // Load all suppliers
  const allProducts = [];

  // MGF Tools
  const mgfProducts = loadMGFTools();
  console.log(`MGF Tools: ${mgfProducts.length} products loaded`);
  allProducts.push(...mgfProducts);

  // Ensure unique slugs
  const slugCounts = {};
  allProducts.forEach(p => {
    if (slugCounts[p.slug]) {
      slugCounts[p.slug]++;
      p.slug = `${p.slug}-${slugCounts[p.slug]}`;
    } else {
      slugCounts[p.slug] = 1;
    }
  });

  // Collect categories and suppliers
  const categories = [...new Set(allProducts.map(p => p.category))].sort();
  const suppliers = [...new Set(allProducts.map(p => p.supplier))].sort();

  const output = {
    meta: {
      eurToNok: EUR_TO_NOK,
      vatRate: VAT_RATE,
      generatedAt: new Date().toISOString(),
      totalProducts: allProducts.length,
      categories,
      suppliers
    },
    products: allProducts
  };

  // Write output
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'products.json'),
    JSON.stringify(output)
  );

  console.log(`\nOutput: ${allProducts.length} products`);
  console.log(`Categories: ${categories.join(', ')}`);
  console.log(`Suppliers: ${suppliers.join(', ')}`);
  console.log('Build complete.');
}

build();
