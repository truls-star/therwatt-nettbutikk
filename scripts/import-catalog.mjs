import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';

const repoRoot = process.cwd();
const excelFile = fs
  .readdirSync(repoRoot)
  .find((file) => file.toLowerCase().endsWith('.xlsx') && file.includes('BDExcel'));

if (!excelFile) {
  console.error('Fant ingen Excel-prisfil i prosjektroten.');
  process.exit(1);
}

const dahlPath = path.join(repoRoot, 'data/raw/dahl_enrichment.json');
const dahlRecords = fs.existsSync(dahlPath) ? JSON.parse(fs.readFileSync(dahlPath, 'utf8')) : [];

const normalize = (value) => String(value || '').trim().toLowerCase();
const valueFrom = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return '';
};

const calculateProductPricing = ({ grossPrice, supplierDiscountPercent }) => {
  const customerDiscountPercent = supplierDiscountPercent * 0.1;
  const customerPriceExVat = Number((grossPrice * (1 - customerDiscountPercent / 100)).toFixed(2));
  const finalPriceIncVat = Number((customerPriceExVat * 1.25).toFixed(2));
  return { customerDiscountPercent: Number(customerDiscountPercent.toFixed(2)), customerPriceExVat, finalPriceIncVat };
};

const tokenize = (value) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 2);

const overlapScore = (a, b) => {
  const t1 = new Set(tokenize(a));
  const t2 = new Set(tokenize(b));
  if (!t1.size || !t2.size) return 0;
  let shared = 0;
  for (const token of t1) {
    if (t2.has(token)) shared += 1;
  }
  return shared / Math.max(t1.size, t2.size);
};

const findEnrichment = (row) => {
  const productNumber = normalize(row.productNumber);
  const nobb = normalize(row.nobbNumber);

  const byProductNumber = dahlRecords.find((record) => normalize(record.productNumber) === productNumber);
  if (byProductNumber) return byProductNumber;

  if (nobb) {
    const byNobb = dahlRecords.find((record) => normalize(record.nobbNumber) === nobb);
    if (byNobb) return byNobb;
  }

  let best;
  let bestScore = 0;
  for (const record of dahlRecords) {
    const score = overlapScore(row.name, record.name);
    if (score > bestScore) {
      best = record;
      bestScore = score;
    }
  }

  if (bestScore >= 0.6) return best;
  return undefined;
};

const workbook = xlsx.readFile(path.join(repoRoot, excelFile));
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

const products = [];
const pricing = [];
const categories = new Map();
const brands = new Map();

for (const row of rows) {
  const productNumber = String(row.Varenr || '').trim();
  if (!productNumber) continue;

  const name = String(row.Varetekst || '').trim();
  const grossPrice = Number(valueFrom(row, ['Bruttopris']) || 0);
  const supplierDiscountPercent = Number(valueFrom(row, ['Rabatt i %']) || 0);

  const pricingResult = calculateProductPricing({
    grossPrice,
    supplierDiscountPercent
  });

  const productBase = {
    id: productNumber,
    productNumber,
    name,
    brand: String(row.Varegruppe || '').trim() || 'Therwatt',
    supplier: String(valueFrom(row, ['Forretningsområde beskrivelse', 'Forretningsomrade beskrivelse']) || '').trim() || 'Therwatt',
    nobbNumber: String(valueFrom(row, ['NOBB', 'Nobb']) || '').trim() || undefined,
    unit: String(row.Enhet || '').trim() || undefined,
    groupCode: String(row.Varegruppe || '').trim() || undefined,
    category: String(row['Varegruppe beskrivelse'] || 'Uklassifisert').trim(),
    businessArea: String(valueFrom(row, ['Forretningsområde beskrivelse', 'Forretningsomrade beskrivelse']) || '').trim() || undefined,
    keywords: tokenize(`${name} ${row.Varegruppe || ''} ${row['Varegruppe beskrivelse'] || ''}`)
  };

  const enrichment = findEnrichment(productBase);
  const product = {
    ...productBase,
    description: enrichment?.description || undefined,
    technicalSpecs: enrichment?.technicalSpecs || undefined,
    imageUrl: enrichment?.imageUrl || undefined,
    keywords: [...new Set([...(productBase.keywords || []), ...tokenize(enrichment?.keywords?.join(' ') || '')])]
  };

  products.push(product);
  pricing.push({
    productNumber,
    grossPrice,
    supplierDiscountPercent,
    customerDiscountPercent: pricingResult.customerDiscountPercent,
    customerPriceExVat: pricingResult.customerPriceExVat,
    finalPriceIncVat: pricingResult.finalPriceIncVat,
    currency: 'NOK',
    sourceDate: row['Fra dato'] || undefined
  });

  categories.set(product.category, (categories.get(product.category) || 0) + 1);
  brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
}

const outputDir = path.join(repoRoot, 'public/catalog');
fs.mkdirSync(outputDir, { recursive: true });

const sortedProducts = products.sort((a, b) => a.name.localeCompare(b.name));
const sortedPricing = pricing.sort((a, b) => a.productNumber.localeCompare(b.productNumber));

const index = {
  categories: [...categories.entries()]
    .map(([name, productCount]) => ({ id: name, name, productCount }))
    .sort((a, b) => b.productCount - a.productCount),
  brands: [...brands.entries()]
    .map(([name, productCount]) => ({ name, productCount }))
    .sort((a, b) => b.productCount - a.productCount)
};

fs.writeFileSync(path.join(outputDir, 'products_normalized.json'), JSON.stringify(sortedProducts, null, 2));
fs.writeFileSync(path.join(outputDir, 'pricing_data.json'), JSON.stringify(sortedPricing, null, 2));
fs.writeFileSync(path.join(outputDir, 'catalog_index.json'), JSON.stringify(index, null, 2));

console.log(`Import fullfort. Produkter: ${sortedProducts.length}, priser: ${sortedPricing.length}`);
