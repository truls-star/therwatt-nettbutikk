/**
 * build-listing.js
 *
 * Generates compact product-listing files for the shop page.
 * Reads the full product JSON files and outputs:
 *   - Data/listing/meta.json   – category info, counts, subcategories
 *   - Data/listing/<slug>.json – compact products per dahl_main_category
 *
 * Compact keys keep transfer size small (~1.4 MB gzipped for all 26k products).
 *
 * Key mapping:
 *   s  = sku,  n = name,  p = gross_price,  u = unit,
 *   gn = group_name,  gc = group_code,  an = area_name,
 *   b  = brand,  nb = nobb_number,
 *   mc = dahl_main_category,  sc = dahl_sub_category,
 *   ssc = dahl_sub_sub_category,  i = image_url
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "Data");
const LISTING_DIR = path.join(DATA_DIR, "listing");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");

const LISTING_FIELDS = [
  "sku", "name", "gross_price", "unit", "group_name", "group_code",
  "area_name", "brand", "nobb_number", "dahl_main_category",
  "dahl_sub_category", "dahl_sub_sub_category", "image_url"
];

const KEY_MAP = {
  sku: "s", name: "n", gross_price: "p", unit: "u",
  group_name: "gn", group_code: "gc", area_name: "an",
  brand: "b", nobb_number: "nb", dahl_main_category: "mc",
  dahl_sub_category: "sc", dahl_sub_sub_category: "ssc", image_url: "i"
};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[æ]/g, "ae").replace(/[ø]/g, "o").replace(/[å]/g, "a")
    .replace(/&/g, "og")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function compact(product) {
  const obj = {};
  for (const field of LISTING_FIELDS) {
    const val = product[field];
    if (val !== null && val !== undefined && val !== "") {
      obj[KEY_MAP[field]] = val;
    }
  }
  return obj;
}

// ---- Main ----
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));

// Load all products
let all = [];
for (const entry of catalog) {
  const filePath = path.join(DATA_DIR, entry.file);
  const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  all = all.concat(products);
}
console.log(`Loaded ${all.length} products from ${catalog.length} files`);

// Group by dahl_main_category
const byCategory = {};
for (const p of all) {
  const cat = p.dahl_main_category || p.area_name || "Ukjent";
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(p);
}

// Ensure output directory
fs.mkdirSync(LISTING_DIR, { recursive: true });

// Build meta.json
const meta = {
  total: all.length,
  categories: []
};

for (const [catName, products] of Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0], "no"))) {
  const slug = slugify(catName);

  // Subcategories with counts
  const subCounts = {};
  for (const p of products) {
    const sub = p.dahl_sub_category || p.group_name;
    if (sub) subCounts[sub] = (subCounts[sub] || 0) + 1;
  }
  const subcategories = Object.entries(subCounts)
    .sort((a, b) => a[0].localeCompare(b[0], "no"))
    .map(([name, count]) => ({ name, count }));

  meta.categories.push({
    name: catName,
    slug,
    count: products.length,
    subcategories
  });

  // Write per-category compact file
  const compactProducts = products.map(compact);
  const outPath = path.join(LISTING_DIR, slug + ".json");
  fs.writeFileSync(outPath, JSON.stringify(compactProducts));
  console.log(`  ${catName}: ${products.length} products → ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
}

fs.writeFileSync(path.join(LISTING_DIR, "meta.json"), JSON.stringify(meta));
console.log(`\nWrote meta.json with ${meta.categories.length} categories`);
console.log("Done.");
