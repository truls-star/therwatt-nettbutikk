(() => {
  const PRODUCTS_URL = 'assets/products.json';
  const PAGE_SIZE = 24;
  const VAT = 1.25;
  const DEFAULT_DISCOUNT = 0.10;
  const DISCOUNTS = {
    'VVS': 0.10,
    'Verktøy': 0.10,
    'Vann- og miljøteknikk': 0.10,
    'Industri': 0.10,
    standard: 0.10,
  };

  let allProducts = [];
  let filtered = [];
  let page = 1;
  let selectedArea = '';
  let selectedCategory = '';
  let search = '';

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);
  const safe = (s) => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function discountFor(product) {
    return DISCOUNTS[product.business_area] ?? DISCOUNTS.standard ?? DEFAULT_DISCOUNT;
  }

  function priceInclVat(product) {
    return product.gross_price * (1 - discountFor(product)) * VAT;
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem('therwatt_cart_v3') || '[]'); } catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem('therwatt_cart_v3', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const count = loadCart().reduce((sum, item) => sum + item.qty, 0);
    if ($('cartCount')) $('cartCount').textContent = String(count);
    if ($('cartCountFab')) $('cartCountFab').textContent = String(count);
  }

  function addToCart(product) {
    const cart = loadCart();
    const idx = cart.findIndex(item => item.sku === product.sku);
    const price = priceInclVat(product);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ sku: product.sku, name: product.name, unit: product.unit, price, qty: 1 });
    saveCart(cart);
    renderCart();
  }

  function changeQty(sku, delta) {
    const cart = loadCart();
    const idx = cart.findIndex(item => item.sku === sku);
    if (idx === -1) return;
    cart[idx].qty = Math.max(0, cart[idx].qty + delta);
    const next = cart.filter(i => i.qty > 0);
    saveCart(next);
    renderCart();
  }

  function emptyCart() {
    saveCart([]);
    renderCart();
  }

  function cartTotal(cart) {
    return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  }

  function buildAreaList() {
    const counts = new Map();
    allProducts.forEach(p => counts.set(p.business_area, (counts.get(p.business_area) || 0) + 1));
    const sorted = [...counts.entries()].sort((a,b) => a[0].localeCompare(b[0], 'nb'));
    $('areaList').innerHTML = sorted.map(([area, count]) => `
      <button class="filter-btn ${selectedArea === area ? 'active' : ''}" type="button" data-area="${safe(area)}">
        <span>${safe(area)}</span><small>${count}</small>
      </button>`).join('');
    $('areaList').querySelectorAll('[data-area]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-area');
        selectedArea = selectedArea === value ? '' : value;
        selectedCategory = '';
        page = 1;
        applyFilters();
      });
    });
  }

  function buildCategoryList() {
    const source = selectedArea ? allProducts.filter(p => p.business_area === selectedArea) : allProducts;
    const counts = new Map();
    source.forEach(p => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    const sorted = [...counts.entries()].sort((a,b) => a[0].localeCompare(b[0], 'nb'));
    $('categoryList').innerHTML = sorted.map(([cat, count]) => `
      <button class="filter-btn ${selectedCategory === cat ? 'active' : ''}" type="button" data-category="${safe(cat)}">
        <span>${safe(cat)}</span><small>${count}</small>
      </button>`).join('');
    $('categoryList').querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-category');
        selectedCategory = selectedCategory === value ? '' : value;
        page = 1;
        applyFilters();
      });
    });
  }

  function renderChips() {
    const chips = [];
    if (selectedArea) chips.push(`<span class="chip">Område: ${safe(selectedArea)}</span>`);
    if (selectedCategory) chips.push(`<span class="chip">Gruppe: ${safe(selectedCategory)}</span>`);
    if (search) chips.push(`<span class="chip">Søk: ${safe(search)}</span>`);
    $('activeChips').innerHTML = chips.join('');
  }

  function applyFilters() {
    filtered = allProducts.filter(p => {
      if (selectedArea && p.business_area !== selectedArea) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (search) {
        const hay = `${p.sku} ${p.name} ${p.category} ${p.business_area}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    }).sort((a,b) => {
      return a.business_area.localeCompare(b.business_area, 'nb') || a.category.localeCompare(b.category, 'nb') || a.name.localeCompare(b.name, 'nb');
    });
    buildAreaList();
    buildCategoryList();
    renderChips();
    renderProducts();
  }

  function renderProducts() {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(Math.max(page, 1), totalPages);
    const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    $('resultMeta').textContent = `${filtered.length.toLocaleString('nb-NO')} produkter` + (selectedArea ? ` i ${selectedArea}` : '');
    $('pageInfo').textContent = `Side ${page} av ${totalPages}`;
    $('prevPage').disabled = page <= 1;
    $('nextPage').disabled = page >= totalPages;

    $('productList').innerHTML = items.map(p => {
      const price = priceInclVat(p);
      return `
        <article class="product-card">
          <div class="product-media"><img loading="lazy" src="/api/nobb-image?sku=${encodeURIComponent(p.sku)}" alt="${safe(p.name)}" onerror="this.onerror=null;this.src='assets/images/no-image.jpg'" /></div>
          <div class="product-body">
            <div class="product-meta">${safe(p.business_area)} · ${safe(p.category)}</div>
            <div class="product-title">${safe(p.name)}</div>
            <div class="product-meta">Varenr: <strong>${safe(p.sku)}</strong> · Enhet: ${safe(p.unit)}</div>
            <div class="price-wrap">
              <div>
                <div class="price-main">${fmt(price)}</div>
                <div class="price-note">inkl. mva · rabatt ${Math.round(discountFor(p) * 100)} %</div>
              </div>
            </div>
            <div class="product-actions">
              <button class="btn secondary" type="button" data-quick="${safe(p.sku)}">Se gruppe</button>
              <button class="btn primary" type="button" data-add="${safe(p.sku)}">Legg i kurv</button>
            </div>
          </div>
        </article>`;
    }).join('');

    $('productList').querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-add');
        const product = allProducts.find(p => p.sku === sku);
        if (product) addToCart(product);
      });
    });

    $('productList').querySelectorAll('[data-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-quick');
        const product = allProducts.find(p => p.sku === sku);
        if (!product) return;
        selectedArea = product.business_area;
        selectedCategory = product.category;
        page = 1;
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function renderCart() {
    const cart = loadCart();
    const total = cartTotal(cart);
    $('cartItems').innerHTML = cart.length ? cart.map(item => `
      <div class="drawer-card">
        <div class="cart-line">
          <div>
            <strong>${safe(item.name)}</strong><br>
            <span class="muted">${safe(item.sku)} · ${safe(item.unit)}</span>
          </div>
          <div><strong>${fmt(item.qty * item.price)}</strong></div>
        </div>
        <div class="qty-row">
          <button class="btn secondary" type="button" data-dec="${safe(item.sku)}">−</button>
          <span>${item.qty}</span>
          <button class="btn secondary" type="button" data-inc="${safe(item.sku)}">+</button>
        </div>
      </div>`).join('') : '<div class="empty">Handlekurven er tom.</div>';
    $('cartTotal').textContent = fmt(total);
    $('cartItems').querySelectorAll('[data-dec]').forEach(btn => btn.addEventListener('click', () => changeQty(btn.getAttribute('data-dec'), -1)));
    $('cartItems').querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', () => changeQty(btn.getAttribute('data-inc'), +1)));
  }

  async function checkout() {
    const items = loadCart();
    if (!items.length) {
      alert('Handlekurven er tom.');
      return;
    }
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: {
            name: $('customerName').value,
            email: $('customerEmail').value,
            phone: $('customerPhone').value,
            note: $('customerNote').value,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout kunne ikke startes');
      location.href = data.url;
    } catch (err) {
      alert(err.message || 'Noe gikk galt ved opprettelse av betaling.');
    }
  }

  function initParams() {
    const params = new URLSearchParams(location.search);
    selectedArea = params.get('area') || '';
    selectedCategory = params.get('category') || '';
  }

  async function init() {
    initParams();
    updateCartCount();
    try {
      const res = await fetch(PRODUCTS_URL, { cache: 'no-store' });
      allProducts = await res.json();
      search = $('searchInput').value || '';
      applyFilters();
    } catch (err) {
      $('resultMeta').textContent = 'Kunne ikke laste produkter.';
      console.error(err);
    }

    $('searchInput').addEventListener('input', (e) => {
      search = e.target.value.trim();
      page = 1;
      applyFilters();
    });
    $('clearFilters').addEventListener('click', () => {
      search = '';
      selectedArea = '';
      selectedCategory = '';
      $('searchInput').value = '';
      page = 1;
      applyFilters();
    });
    $('prevPage').addEventListener('click', () => { page--; renderProducts(); });
    $('nextPage').addEventListener('click', () => { page++; renderProducts(); });

    const open = () => { $('cartDrawer').style.display = 'block'; renderCart(); };
    const close = () => { $('cartDrawer').style.display = 'none'; };
    $('openCart').addEventListener('click', open);
    $('cartFab').addEventListener('click', open);
    $('closeCart').addEventListener('click', close);
    $('cartDrawer').addEventListener('click', (e) => { if (e.target.id === 'cartDrawer') close(); });
    $('emptyCart').addEventListener('click', emptyCart);
    $('stripeCheckout').addEventListener('click', checkout);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
