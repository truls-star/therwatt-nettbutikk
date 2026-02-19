/*
 * Store logic for Therwatt AS webshop.
 * Loads products from JSON, applies discount, supports search/filter/pagination,
 * manages a localStorage-based cart and integrates with Netlify Forms.
 */

const PRODUCTS_URL = 'assets/products.json';
const PAGE_SIZE = 24;
const DISCOUNT = 0.20; // 20% discount from gross price

let products = [];
let filtered = [];
let currentPage = 1;

const $ = selector => document.querySelector(selector);

// Format number as Norwegian currency (NOK)
function formatPrice(num) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

// Load cart from localStorage
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('therwatt_cart') || '[]');
  } catch {
    return [];
  }
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem('therwatt_cart', JSON.stringify(cart));
  updateCartBadge();
}

// Update cart count in nav
function updateCartBadge() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = String(count);
}

// Add product to cart
function addToCart(prod) {
  const cart = loadCart();
  const idx = cart.findIndex(item => item.sku === prod.sku);
  if (idx >= 0) {
    cart[idx].qty += 1;
  } else {
    cart.push({ sku: prod.sku, name: prod.name, unit: prod.unit, price: prod.price, qty: 1 });
  }
  saveCart(cart);
}

// Change quantity for given SKU
function changeQty(sku, delta) {
  const cart = loadCart();
  const idx = cart.findIndex(item => item.sku === sku);
  if (idx >= 0) {
    cart[idx].qty = Math.max(0, cart[idx].qty + delta);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
    saveCart(cart);
  }
  renderCart();
}

// Empty cart
function emptyCart() {
  localStorage.removeItem('therwatt_cart');
  updateCartBadge();
  renderCart();
}

// Filter products based on search and category
function applyFilters() {
  const q = $('#searchInput').value.toLowerCase().trim();
  const cat = $('#categorySelect').value;
  filtered = products.filter(p => {
    const matchesCat = !cat || p.category === cat;
    const matchesQuery = !q || (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });
  currentPage = 1;
  renderList();
}

// Render product list for current page
function renderList() {
  const listEl = $('#productList');
  if (!listEl) return;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);
  // Render
  listEl.innerHTML = items.map(p => `
    <div class="product-card">
      <h3>${p.name}</h3>
      <p>Varenr: ${p.sku} | ${p.unit} | ${p.category}</p>
      <div class="price">${formatPrice(p.price)}</div>
      <button type="button" data-add="${p.sku}">Legg i kurv</button>
    </div>
  `).join('');
  // Pagination info
  $('#pageInfo').textContent = `Side ${currentPage} av ${totalPages}`;
  $('#prevPage').disabled = currentPage <= 1;
  $('#nextPage').disabled = currentPage >= totalPages;
  // Attach button handlers
  listEl.querySelectorAll('button[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sku = btn.getAttribute('data-add');
      const prod = products.find(x => x.sku === sku);
      if (prod) addToCart(prod);
    });
  });
}

// Render cart in drawer
function renderCart() {
  const drawer = $('#cartDrawer');
  if (!drawer) return;
  const cartItemsContainer = drawer.querySelector('.cart-items');
  const cart = loadCart();
  if (!cartItemsContainer) return;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Handlekurven er tom.</p>';
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="item-title">${item.name}</div>
        <div class="item-price">${formatPrice(item.price)} (${item.unit})</div>
        <div class="qty-controls">
          <button type="button" data-dec="${item.sku}">–</button>
          <span>Antall: ${item.qty}</span>
          <button type="button" data-inc="${item.sku}">+</button>
        </div>
        <div class="item-subtotal">${formatPrice(item.price * item.qty)}</div>
      </div>
    `).join('');
  }
  // Subtotal
  const subtotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  $('#cartSubtotal').textContent = formatPrice(subtotal);
  // Set hidden payload for Netlify form
  const payload = {
    currency: 'NOK',
    discountModel: '20% avslag på bruttopris',
    items: cart,
    subtotal
  };
  $('#orderPayload').value = JSON.stringify(payload);
  // Attach qty buttons
  cartItemsContainer.querySelectorAll('[data-dec]').forEach(btn => {
    btn.addEventListener('click', () => changeQty(btn.getAttribute('data-dec'), -1));
  });
  cartItemsContainer.querySelectorAll('[data-inc]').forEach(btn => {
    btn.addEventListener('click', () => changeQty(btn.getAttribute('data-inc'), 1));
  });
}

// Initialize store page
async function initStore() {
  // Load products
  try {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error('Kunne ikke laste produkter');
    const data = await res.json();
    products = data.map(prod => {
      // Compute price with discount if gross_price provided
      const gross = prod.gross_price || 0;
      const price = gross * (1 - DISCOUNT);
      return { ...prod, price };
    });
    // Build category dropdown
    const cats = [...new Set(products.map(p => p.category))].filter(Boolean).sort();
    const catSelect = $('#categorySelect');
    if (catSelect) {
      catSelect.innerHTML = '<option value="">Alle kategorier</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    filtered = products;
    renderList();
  } catch (err) {
    console.error(err);
    const status = $('#status');
    if (status) status.textContent = 'Feil ved lasting av produkter';
  }
  // Attach listeners
  $('#searchInput').addEventListener('input', applyFilters);
  $('#categorySelect').addEventListener('change', applyFilters);
  $('#clearFilters').addEventListener('click', () => {
    $('#searchInput').value = '';
    $('#categorySelect').value = '';
    applyFilters();
  });
  $('#prevPage').addEventListener('click', () => {
    currentPage = Math.max(1, currentPage - 1);
    renderList();
  });
  $('#nextPage').addEventListener('click', () => {
    currentPage += 1;
    renderList();
  });
  // Cart controls
  $('#openCart').addEventListener('click', () => {
    $('#cartDrawer').style.display = 'block';
    renderCart();
  });
  $('#closeCart').addEventListener('click', () => {
    $('#cartDrawer').style.display = 'none';
  });
  $('#cartDrawer').addEventListener('click', (e) => {
    if (e.target.id === 'cartDrawer') {
      $('#cartDrawer').style.display = 'none';
    }
  });
  $('#emptyCart').addEventListener('click', emptyCart);
  updateCartBadge();
}

// Run init when DOM ready on store page
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('store-page')) {
    initStore();
  }
});