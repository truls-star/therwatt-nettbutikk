
(async () => {
  const PAGE_SIZE = 24;
  let allProducts = [];
  let filtered = [];
  let currentPage = 1;
  let areaFilter = "";
  let groupFilter = "";
  let query = "";
  let catalog = [];

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat("no-NO",{style:"currency",currency:"NOK",minimumFractionDigits:0,maximumFractionDigits:2}).format(n || 0);

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Kunne ikke laste ${path}`);
    return res.json();
  }

  async function loadProducts() {
    catalog = await loadJson("data/catalog.json");
    const files = catalog.map((entry) => `data/${entry.file}`);
    const payloads = await Promise.all(files.map(loadJson));
    allProducts = payloads.flat();
    filtered = allProducts;
    renderAreaNav();
    renderGroupList();
    renderProducts();
  }

  function cartLoad() {
    try { return JSON.parse(localStorage.getItem("therwatt_cart_v8") || "[]"); } catch { return []; }
  }
  function cartSave(cart) {
    localStorage.setItem("therwatt_cart_v8", JSON.stringify(cart));
    updateCartBadge();
  }
  function updateCartBadge() {
    const count = cartLoad().reduce((s,i)=>s+(i.qty||0),0);
    const el = $("cartCount");
    if (el) el.textContent = String(count);
  }
  function addToCart(product) {
    const cart = cartLoad();
    const idx = cart.findIndex(i => i.sku === product.sku);
    const price = window.TherwattPricing.priceInclVat(product);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ sku: product.sku, name: product.name, unit: product.unit, price, qty:1 });
    cartSave(cart);
    renderCart();
  }
  function changeQty(sku, delta) {
    const cart = cartLoad();
    const idx = cart.findIndex(i => i.sku === sku);
    if (idx >= 0) {
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      cartSave(cart);
      renderCart();
    }
  }
  function cartTotal(cart) { return cart.reduce((s,i)=>s+i.price*i.qty,0); }

  function areas() {
    return [...new Set(allProducts.map(p => p.area_name))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"no"));
  }
  function groupsForArea(area) {
    return [...new Set(allProducts.filter(p => !area || p.area_name === area).map(p => p.group_name))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"no"));
  }

  function renderAreaNav() {
    const el = $("areaNav");
    if (!el) return;
    const items = ['Alle', ...areas()];
    el.innerHTML = items.map(name => {
      const active = ((name === 'Alle' && !areaFilter) || name === areaFilter) ? 'active' : '';
      const href = name === 'Alle' ? '#alle' : '#' + encodeURIComponent(name);
      return `<a class="${active}" href="${href}" data-area="${name === 'Alle' ? '' : name}">${name}</a>`;
    }).join('');
    el.querySelectorAll("[data-area]").forEach(a => a.addEventListener("click", (e) => {
      e.preventDefault();
      areaFilter = a.dataset.area;
      groupFilter = "";
      currentPage = 1;
      renderAreaNav();
      renderGroupList();
      applyFilters();
    }));
  }

  function renderGroupList() {
    const el = $("groupList");
    if (!el) return;
    const groups = groupsForArea(areaFilter);
    el.innerHTML = groups.map(g => {
      const count = allProducts.filter(p => (!areaFilter || p.area_name===areaFilter) && p.group_name===g).length;
      const active = groupFilter === g ? 'active' : '';
      return `<div class="filter-item ${active}" data-group="${g}"><span>${g}</span><span class="small">${count}</span></div>`;
    }).join('');
    el.querySelectorAll("[data-group]").forEach(item => item.addEventListener("click", () => {
      groupFilter = item.dataset.group === groupFilter ? "" : item.dataset.group;
      currentPage = 1;
      renderGroupList();
      applyFilters();
    }));
  }

  function applyFilters() {
    filtered = allProducts.filter(p => {
      if (areaFilter && p.area_name !== areaFilter) return false;
      if (groupFilter && p.group_name !== groupFilter) return false;
      if (query) {
        const hay = `${p.sku} ${p.name} ${p.group_name} ${p.area_name}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    renderProducts();
  }

  function renderProducts() {
    const grid = $("productGrid");
    if (!grid) return;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(currentPage,1), totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    $("resultsText").textContent = `${filtered.length.toLocaleString("no-NO")} produkter`;
    grid.innerHTML = items.map(p => {
      const price = window.TherwattPricing.priceInclVat(p);
      const requestOnly = window.TherwattPricing.isRequestOnly(p);
      return `
      <article class="product-card">
        <a class="product-media" href="produkt.html?sku=${encodeURIComponent(p.sku)}">
          <img src="assets/images/no-image.jpg" alt="${p.name}" loading="lazy" />
        </a>
        <div class="product-meta">${p.area_name} · ${p.group_name}</div>
        <h3><a href="produkt.html?sku=${encodeURIComponent(p.sku)}">${p.name}</a></h3>
        <div class="product-meta">Varenr: ${p.sku} · Enhet: ${p.unit || '-'}</div>
        <div class="product-desc">${p.description}</div>
        <div class="price">${fmt(price)}</div>
        <div class="small">Bruttopris + mva${window.TherwattPricing.getDiscount(p) ? ' med rabatt' : ''}</div>
        <div class="product-actions">
          ${requestOnly ? `<a class="btn ghost" href="produkt.html?sku=${encodeURIComponent(p.sku)}#request">Be om tilbud</a>` : `<button class="btn" type="button" data-add="${p.sku}">Legg i kurv</button>`}
          <a class="btn secondary" href="produkt.html?sku=${encodeURIComponent(p.sku)}">Se produkt</a>
        </div>
      </article>`;
    }).join('');
    grid.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", () => {
      const p = allProducts.find(x => x.sku === btn.dataset.add);
      if (p) addToCart(p);
    }));
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    $("pageInfo").textContent = `Side ${currentPage} av ${totalPages}`;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= totalPages;
  }

  function renderCart() {
    const drawer = $("cartDrawer");
    if (!drawer) return;
    const cart = cartLoad();
    const itemsEl = $("cartItems");
    if (!cart.length) itemsEl.innerHTML = `<p class="muted">Handlekurven er tom.</p>`;
    else itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-row"><strong>${item.name}</strong><strong>${fmt(item.price * item.qty)}</strong></div>
        <div class="small">Varenr: ${item.sku} · ${item.unit}</div>
        <div class="cart-row" style="margin-top:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn ghost" type="button" data-dec="${item.sku}">−</button>
            <span>${item.qty}</span>
            <button class="btn ghost" type="button" data-inc="${item.sku}">+</button>
          </div>
          <span class="small">${fmt(item.price)} pr stk</span>
        </div>
      </div>`).join('');
    $("cartTotal").textContent = fmt(cartTotal(cart));
    $("orderPayload").value = JSON.stringify({items: cart, total: cartTotal(cart), currency:"NOK"});
    itemsEl.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click",()=>changeQty(b.dataset.dec,-1)));
    itemsEl.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click",()=>changeQty(b.dataset.inc,1)));
  }

  async function startCheckout() {
    const cart = cartLoad();
    if (!cart.length) return;
    const res = await fetch("/.netlify/functions/create-checkout", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({items: cart})
    });
    const data = await res.json();
    if (data.url) location.href = data.url;
    else alert(data.error || "Kunne ikke starte betaling.");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    updateCartBadge();
    $("searchInput").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); currentPage = 1; applyFilters(); });
    $("clearFilters").addEventListener("click", () => { areaFilter=""; groupFilter=""; query=""; $("searchInput").value=""; renderAreaNav(); renderGroupList(); applyFilters(); });
    $("prevPage").addEventListener("click", () => { currentPage -= 1; renderProducts(); });
    $("nextPage").addEventListener("click", () => { currentPage += 1; renderProducts(); });
    $("openCart").addEventListener("click", ()=>{$("cartDrawer").classList.add("open"); renderCart();});
    $("closeCart").addEventListener("click", ()=>{$("cartDrawer").classList.remove("open");});
    $("cartDrawer").addEventListener("click", (e)=>{ if(e.target.id==="cartDrawer") $("cartDrawer").classList.remove("open");});
    $("checkoutBtn").addEventListener("click", startCheckout);
    await loadProducts();
  });
})();
