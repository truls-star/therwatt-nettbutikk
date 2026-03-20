// ═══════════════════════════════════════════════════════════
// Product Store – Loads and provides product data
// ═══════════════════════════════════════════════════════════

let productData = null;

export async function loadProducts() {
  if (productData) return productData;
  const res = await fetch('/products.json');
  productData = await res.json();
  return productData;
}

export function getProducts() {
  return productData?.products || [];
}

export function getMeta() {
  return productData?.meta || {};
}

export function getCategories() {
  return productData?.meta?.categories || [];
}

export function getSuppliers() {
  return productData?.meta?.suppliers || [];
}

export function getProductBySlug(slug) {
  return getProducts().find(p => p.slug === slug);
}

export function getProductsByCat(category) {
  if (!category) return getProducts();
  return getProducts().filter(p => p.category === category);
}

export function searchProducts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return getProducts();
  return getProducts().filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
}

export function formatPrice(nok) {
  if (!nok) return null;
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(nok);
}
