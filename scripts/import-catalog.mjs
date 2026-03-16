import fs from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';

const VAT_RATE = 0.25;

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
const dahlByProductNumber = new Map(
  dahlRecords
    .filter((record) => record && record.productNumber)
    .map((record) => [String(record.productNumber).trim().toLowerCase(), record])
);

const groupDiscountPath = path.join(repoRoot, 'data/raw/group_discounts.json');
const groupDiscountPercent = fs.existsSync(groupDiscountPath)
  ? JSON.parse(fs.readFileSync(groupDiscountPath, 'utf8'))
  : {};
const defaultGroupDiscountPercent = Number(process.env.DEFAULT_GROUP_DISCOUNT_PERCENT || 0);

const normalize = (value) => String(value || '').trim().toLowerCase();

const valueFrom = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return '';
};

const tokenize = (value) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 2);

const round = (value) => Number((value + Number.EPSILON).toFixed(2));

const getGroupDiscountPercent = ({ groupCode, category }) => {
  const normalizedGroupCode = String(groupCode || '').trim().toUpperCase();
  const normalizedCategory = String(category || '').trim().toUpperCase();

  if (normalizedGroupCode && normalizedGroupCode in groupDiscountPercent) {
    return Number(groupDiscountPercent[normalizedGroupCode]) || 0;
  }

  if (normalizedCategory && normalizedCategory in groupDiscountPercent) {
    return Number(groupDiscountPercent[normalizedCategory]) || 0;
  }

  return defaultGroupDiscountPercent;
};

const calculateProductPricing = ({ grossPrice, groupCode, category }) => {
  const appliedDiscountPercent = getGroupDiscountPercent({ groupCode, category });
  const customerPriceExVat = round(grossPrice * (1 - appliedDiscountPercent / 100));
  const finalPriceIncVat = round(customerPriceExVat * (1 + VAT_RATE));

  return {
    groupDiscountPercent: round(appliedDiscountPercent),
    customerPriceExVat,
    finalPriceIncVat
  };
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
  const groupCode = String(row.Varegruppe || '').trim() || undefined;
  const excelCategory = String(row['Varegruppe beskrivelse'] || '').trim();
  const enrichment = dahlByProductNumber.get(normalize(productNumber));

  const category =
    enrichment?.category || enrichment?.breadcrumb?.at(-1) || excelCategory || 'Uklassifisert';

  const pricingResult = calculateProductPricing({
    grossPrice,
    groupCode,
    category
  });

  const productBase = {
    id: productNumber,
    productNumber,
    name,
    brand: String(row.Varegruppe || '').trim() || 'Therwatt',
    supplier:
      String(valueFrom(row, ['Forretningsområde beskrivelse', 'Forretningsomrade beskrivelse']) || '').trim() ||
      'Therwatt',
    nobbNumber: String(valueFrom(row, ['NOBB', 'Nobb']) || '').trim() || undefined,
    unit: String(row.Enhet || '').trim() || undefined,
    groupCode,
    category,
    businessArea:
      String(valueFrom(row, ['Forretningsområde beskrivelse', 'Forretningsomrade beskrivelse']) || '').trim() ||
      undefined,
    keywords: tokenize(`${name} ${row.Varegruppe || ''} ${excelCategory || ''}`)
  };

  const product = {
    ...productBase,
    description: enrichment?.description || undefined,
    technicalSpecs: enrichment?.technicalSpecs || undefined,
    imageUrl: enrichment?.imageUrl || undefined,
    productUrl: enrichment?.productUrl || undefined,
    dahlCategoryPath: Array.isArray(enrichment?.breadcrumb) ? enrichment.breadcrumb : undefined,
    keywords: [
      ...new Set([...(productBase.keywords || []), ...tokenize(enrichment?.keywords?.join(' ') || '')])
    ]
  };

  products.push(product);
  pricing.push({
    productNumber,
    grossPrice,
    supplierDiscountPercent,
    groupDiscountPercent: pricingResult.groupDiscountPercent,
    customerPriceExVat: pricingResult.customerPriceExVat,
    finalPriceIncVat: pricingResult.finalPriceIncVat,
    currency: 'NOK',
    vatRate: VAT_RATE,
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

console.log(
  `Import fullfort. Produkter: ${sortedProducts.length}, priser: ${sortedPricing.length}, dahl-koblinger: ${dahlByProductNumber.size}`
);
