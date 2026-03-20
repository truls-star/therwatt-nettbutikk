// ═══════════════════════════════════════════════════════════
// Cart Store – Persistent shopping cart using localStorage
// ═══════════════════════════════════════════════════════════

const CART_KEY = 'therwatt_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart-updated'));
}

export function addToCart(product, quantity = 1) {
  const items = getCart();
  const existing = items.find(i => i.sku === product.sku);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price_nok: product.price_nok,
      supplier: product.supplier,
      quantity
    });
  }
  saveCart(items);
  showToast(`${product.name} lagt i handlekurven`);
}

export function removeFromCart(sku) {
  const items = getCart().filter(i => i.sku !== sku);
  saveCart(items);
}

export function updateQuantity(sku, quantity) {
  const items = getCart();
  const item = items.find(i => i.sku === sku);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  saveCart(items);
}

export function getCartItems() {
  return getCart();
}

export function getCartTotal() {
  return getCart().reduce((sum, i) => sum + (i.price_nok || 0) * i.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function clearCart() {
  saveCart([]);
}

// Toast notification
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('visible'), 2500);
}

export { showToast };
