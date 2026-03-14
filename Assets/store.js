
(() => {
  const PRODUCTS_URL = 'assets/products.json';
  const META_URL = 'assets/meta.json';
  const PAGE_SIZE = 24;
  const $ = (id) => document.getElementById(id);

  let PRODUCTS = [];
  let META = {areas: []};
  let FILTERED = [];
  let PAGE = 1;
  let CART = loadCart();

  function fmtCurrency(v) {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(v || 0);
  }

  function getDiscount(product) {
    const cfg = window.TH_CONFIG || {};
    const productMap = cfg.productDiscounts || {};
    const groupMap = cfg.groupDiscounts || {};
    if (productMap[product.sku] != null) return Number(productMap[product.sku]) || 0;
    if (groupMap[product.group] != null) return Number(groupMap[product.group]) || 0;
    return Number(cfg.defaultGroupDiscount || 0);
  }

  function getPriceInclVat(product) {
    const cfg = window.TH_CONFIG || {};
    const vat = 1 + Number(cfg.vatRate || 0.25);
    const discount = getDiscount(product);
    return Number(product.gross_price || 0) * (1 - discount) * vat;
  }

  function isQuoteOnly(product) {
    const cfg = window.TH_CONFIG || {};
    const groups = cfg.quoteGroups || [];
    if (groups.includes(product.group)) return true;
    return getPriceInclVat(product) >= Number(cfg.quoteThresholdInclVat || 25000);
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem('therwatt_cart_v8') || '[]'); } catch { return []; }
  }
  function saveCart() {
    localStorage.setItem('therwatt_cart_v8', JSON.stringify(CART));
    updateCartBadge();
  }
  function updateCartBadge() {
    const badge = $('cartCount');
    if (badge) badge.textContent = String(CART.reduce((s, x) => s + x.qty, 0));
  }

  function addToCart(product) {
    const idx = CART.findIndex(x => x.sku === product.sku);
    const line = { sku: product.sku, name: product.name, group: product.group, unit: product.unit, price: getPriceInclVat(product), qty: 1 };
    if (idx >= 0) CART[idx].qty += 1; else CART.push(line);
    saveCart();
    renderCart();
  }

  function changeQty(sku, delta) {
    const idx = CART.findIndex(x => x.sku === sku);
    if (idx >= 0) {
      CART[idx].qty = Math.max(0, CART[idx].qty + delta);
      CART = CART.filter(x => x.qty > 0);
      saveCart();
      renderCart();
    }
  }

  function cartSum() {
    return CART.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getParams() {
    const params = new URLSearchParams(location.search);
    return {
      q: params.get('q') || '',
      area: params.get('area') || '',
      group: params.get('group') || '',
      page: Number(params.get('page') || 1)
    };
  }

  function setParams(next) {
    const current = getParams();
    const merged = { ...current, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set('q', merged.q);
    if (merged.area) params.set('area', merged.area);
    if (merged.group) params.set('group', merged.group);
    if (merged.page && merged.page > 1) params.set('page', merged.page);
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  }

  function filterProducts() {
    const params = getParams();
    PAGE = params.page || 1;
    FILTERED = PRODUCTS.filter(p => {
      const q = params.q.toLowerCase().trim();
      const matchesQ = !q || `${p.sku} ${p.name} ${p.group} ${p.business_area}`.toLowerCase().includes(q);
      const matchesArea = !params.area || p.business_area === params.area;
      const matchesGroup = !params.group || p.group === params.group;
      return matchesQ && matchesArea && matchesGroup;
    });
  }

  function buildSidebar() {
    const areaWrap = $('areaNav');
    const groupWrap = $('groupNav');
    if (areaWrap) {
      const currentArea = getParams().area;
      areaWrap.innerHTML = META.areas.map(area => {
        const active = currentArea === area.name ? 'active-chip' : '';
        return `<a class="filter-chip ${active}" href="butikk.html?area=${encodeURIComponent(area.name)}">${area.name}</a>`;
      }).join('');
    }
    if (groupWrap) {
      const current = getParams();
      const relevantAreas = current.area ? META.areas.filter(a => a.name === current.area) : META.areas;
      const groups = [...new Set(relevantAreas.flatMap(a => a.groups.map(g => g.name)))].sort((a,b)=>a.localeCompare(b,'nb'));
      groupWrap.innerHTML = groups.map(name => {
        const active = current.group === name ? 'active-list' : '';
        const hrefParams = new URLSearchParams();
        if (current.area) hrefParams.set('area', current.area);
        hrefParams.set('group', name);
        return `<a class="sidebar-link ${active}" href="butikk.html?${hrefParams.toString()}">${name}</a>`;
      }).join('');
    }
  }

  function renderProducts() {
    const list = $('productGrid');
    const empty = $('emptyState');
    if (!list) return;
    filterProducts();
    buildSidebar();

    const totalPages = Math.max(1, Math.ceil(FILTERED.length / PAGE_SIZE));
    PAGE = Math.min(Math.max(PAGE, 1), totalPages);
    const start = (PAGE - 1) * PAGE_SIZE;
    const items = FILTERED.slice(start, start + PAGE_SIZE);

    $('resultCount').textContent = `${FILTERED.length.toLocaleString('nb-NO')} produkter`;
    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      list.innerHTML = items.map(product => {
        const price = getPriceInclVat(product);
        const quoteOnly = isQuoteOnly(product);
        const discount = getDiscount(product);
        return `
          <article class="product-card">
            <a class="product-image" href="produkt.html?sku=${encodeURIComponent(product.sku)}">
              <img src="${product.image || '/assets/images/no-image.jpg'}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='/assets/images/no-image.jpg'">
            </a>
            <div class="product-meta-top">${product.business_area} / ${product.group}</div>
            <h3><a href="produkt.html?sku=${encodeURIComponent(product.sku)}">${escapeHtml(product.name)}</a></h3>
            <p class="product-desc">${escapeHtml(product.description_short || '')}</p>
            <div class="product-specs">Varenr: ${product.sku} · Enhet: ${product.unit}</div>
            <div class="product-price-row">
              <div>
                <div class="product-price">${fmtCurrency(price)}</div>
                <div class="price-note">Bruttopris + mva${discount ? ` · Rabatt ${Math.round(discount*100)}%` : ''}</div>
              </div>
              ${quoteOnly
                ? `<button class="btn secondary quote-btn" data-sku="${product.sku}">Be om tilbud</button>`
                : `<button class="btn add-btn" data-sku="${product.sku}">Legg i kurv</button>`
              }
            </div>
          </article>
        `;
      }).join('');
    }

    $('pageInfo').textContent = `Side ${PAGE} av ${totalPages}`;
    $('prevPage').disabled = PAGE <= 1;
    $('nextPage').disabled = PAGE >= totalPages;

    document.querySelectorAll('.add-btn').forEach(btn => btn.addEventListener('click', () => {
      const product = PRODUCTS.find(p => p.sku === btn.dataset.sku);
      if (product) addToCart(product);
    }));
    document.querySelectorAll('.quote-btn').forEach(btn => btn.addEventListener('click', () => openQuote(PRODUCTS.find(p => p.sku === btn.dataset.sku))));
  }

  function renderFeatured() {
    const areas = $('featuredAreas');
    const groups = $('featuredGroups');
    if (areas) {
      areas.innerHTML = META.areas.map(area => `
        <a class="category-tile" href="butikk.html?area=${encodeURIComponent(area.name)}">
          <div class="tile-kicker">Forretningsområde</div>
          <div class="tile-title">${area.name}</div>
          <div class="tile-copy">${area.groups.length} varegrupper</div>
        </a>
      `).join('');
    }
    if (groups) {
      const topGroups = Object.entries(PRODUCTS.reduce((acc,p)=>{acc[p.group]=(acc[p.group]||0)+1;return acc;},{}))
        .sort((a,b)=>b[1]-a[1]).slice(0,8);
      groups.innerHTML = topGroups.map(([group,count]) => `
        <a class="mini-tile" href="butikk.html?group=${encodeURIComponent(group)}">
          <span>${group}</span>
          <small>${count.toLocaleString('nb-NO')} produkter</small>
        </a>
      `).join('');
    }
  }

  function renderCart() {
    const wrap = $('cartItems');
    if (!wrap) return;
    if (!CART.length) {
      wrap.innerHTML = '<p class="muted">Handlekurven er tom.</p>';
    } else {
      wrap.innerHTML = CART.map(item => `
        <div class="cart-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="muted">${item.sku} · ${item.unit}</div>
          </div>
          <div class="cart-controls">
            <button type="button" class="qty-btn" data-dec="${item.sku}">−</button>
            <span>${item.qty}</span>
            <button type="button" class="qty-btn" data-inc="${item.sku}">+</button>
          </div>
          <div class="cart-line">${fmtCurrency(item.price * item.qty)}</div>
        </div>
      `).join('');
    }
    $('cartTotal').textContent = fmtCurrency(cartSum());
    const payload = { items: CART, currency: 'NOK', total: cartSum() };
    if ($('checkoutPayload')) $('checkoutPayload').value = JSON.stringify(payload);
    document.querySelectorAll('[data-dec]').forEach(b => b.onclick = ()=>changeQty(b.dataset.dec, -1));
    document.querySelectorAll('[data-inc]').forEach(b => b.onclick = ()=>changeQty(b.dataset.inc, +1));
  }

  function openCart() {
    $('cartDrawer').hidden = false;
    renderCart();
  }
  function closeCart() {
    $('cartDrawer').hidden = true;
  }

  function openQuote(product) {
    if (!product) return;
    $('quoteModal').hidden = false;
    $('quoteSku').value = product.sku;
    $('quoteProduct').value = product.name;
    $('quoteSummary').textContent = `${product.name} · ${product.sku}`;
  }
  function closeQuote() {
    $('quoteModal').hidden = true;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  async function startCheckout() {
    if (!CART.length) return;
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: CART })
    });
    const data = await res.json();
    if (data.url) {
      location.href = data.url;
    } else {
      alert(data.error || 'Klarte ikke å starte betaling.');
    }
  }

  async function loadData() {
    const [productsRes, metaRes] = await Promise.all([fetch(PRODUCTS_URL), fetch(META_URL)]);
    PRODUCTS = await productsRes.json();
    META = await metaRes.json();
  }

  function initStorePage() {
    const q = $('q');
    const params = getParams();
    if (q) q.value = params.q;

    q?.addEventListener('input', () => {
      setParams({ q: q.value, page: 1 });
      renderProducts();
    });

    $('resetFilters')?.addEventListener('click', () => {
      history.replaceState({}, '', 'butikk.html');
      if (q) q.value = '';
      renderProducts();
    });

    $('prevPage')?.addEventListener('click', () => {
      setParams({ page: Math.max(1, PAGE - 1) });
      renderProducts();
    });

    $('nextPage')?.addEventListener('click', () => {
      setParams({ page: PAGE + 1 });
      renderProducts();
    });

    $('openCart')?.addEventListener('click', openCart);
    $('closeCart')?.addEventListener('click', closeCart);
    $('cartDrawer')?.addEventListener('click', (e) => { if (e.target.id === 'cartDrawer') closeCart(); });
    $('checkoutButton')?.addEventListener('click', startCheckout);
    $('quoteClose')?.addEventListener('click', closeQuote);
    $('quoteModal')?.addEventListener('click', (e) => { if (e.target.id === 'quoteModal') closeQuote(); });

    renderProducts();
    renderCart();
  }

  function initProductPage() {
    const params = new URLSearchParams(location.search);
    const sku = params.get('sku');
    const product = PRODUCTS.find(p => p.sku === sku);
    const wrap = $('productPage');
    if (!wrap || !product) {
      if (wrap) wrap.innerHTML = '<div class="container"><p>Fant ikke produktet.</p></div>';
      return;
    }
    const price = getPriceInclVat(product);
    const quoteOnly = isQuoteOnly(product);
    wrap.innerHTML = `
      <div class="container product-layout">
        <div class="product-detail-image">
          <img src="${product.image || '/assets/images/no-image.jpg'}" alt="${escapeHtml(product.name)}" onerror="this.src='/assets/images/no-image.jpg'">
        </div>
        <div class="product-detail-copy">
          <div class="breadcrumb"><a href="butikk.html">Butikk</a> / <a href="butikk.html?area=${encodeURIComponent(product.business_area)}">${product.business_area}</a> / <a href="butikk.html?group=${encodeURIComponent(product.group)}">${product.group}</a></div>
          <div class="product-meta-top">${product.business_area} / ${product.group}</div>
          <h1>${escapeHtml(product.name)}</h1>
          <p class="lead-small">${escapeHtml(product.description_short)}</p>
          <div class="detail-price">${fmtCurrency(price)}</div>
          <div class="price-note">Pris beregnet fra bruttopris + mva${getDiscount(product) ? ` · Rabatt ${Math.round(getDiscount(product)*100)}%` : ''}</div>
          <div class="detail-actions">
            ${quoteOnly
              ? `<button class="btn secondary" id="detailQuote">Be om tilbud</button>`
              : `<button class="btn" id="detailAdd">Legg i kurv</button>`}
            <button class="btn ghost" id="detailCart">Åpne handlekurv</button>
          </div>
          <div class="detail-specs">
            <div><span>Varenr</span><strong>${product.sku}</strong></div>
            <div><span>Enhet</span><strong>${product.unit}</strong></div>
            <div><span>Varegruppe</span><strong>${product.group}</strong></div>
            <div><span>Forretningsområde</span><strong>${product.business_area}</strong></div>
            <div><span>Fra dato</span><strong>${product.from_date || '-'}</strong></div>
          </div>
        </div>
      </div>
      <div class="container detail-panels">
        <section class="panel">
          <h2>Produktbeskrivelse</h2>
          ${product.description_long.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        </section>
        <section class="panel">
          <h2>Kjøp eller forespørsel</h2>
          <p>Standardvarer kan legges direkte i handlekurven. Større tekniske produkter håndteres ofte via tilbud for å sikre riktig dimensjonering, levering og tilbehør.</p>
        </section>
      </div>
    `;
    $('detailAdd')?.addEventListener('click', () => addToCart(product));
    $('detailCart')?.addEventListener('click', openCart);
    $('detailQuote')?.addEventListener('click', () => openQuote(product));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    updateCartBadge();
    await loadData();
    if ($('featuredAreas') || $('featuredGroups')) renderFeatured();
    if ($('productGrid')) initStorePage();
    if ($('productPage')) initProductPage();
  });
})();
