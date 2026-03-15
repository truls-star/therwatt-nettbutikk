
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
  const fmt = (n) => new Intl.NumberFormat("no-NO", {
    style: "currency", currency: "NOK",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(n || 0);

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Kunne ikke laste " + path);
    return res.json();
  }

  async function loadProducts() {
    catalog = await loadJson("Data/catalog.json");
    const files = catalog.map((entry) => "Data/" + entry.file);
    const payloads = await Promise.all(files.map(loadJson));
    allProducts = payloads.flat();
    filtered = allProducts;

    // Handle hash-based area filter
    const hash = decodeURIComponent(location.hash.replace("#", ""));
    if (hash && hash !== "alle") {
      const match = allProducts.find(p => (p.dahl_main_category || p.area_name) === hash);
      if (match) areaFilter = hash;
    }

    renderAreaNav();
    renderGroupList();
    applyFilters();
  }

  function cartLoad() {
    try { return JSON.parse(localStorage.getItem("therwatt_cart_v8") || "[]"); } catch { return []; }
  }
  function cartSave(cart) {
    localStorage.setItem("therwatt_cart_v8", JSON.stringify(cart));
    updateCartBadge();
  }
  function updateCartBadge() {
    const count = cartLoad().reduce((s, i) => s + (i.qty || 0), 0);
    const el = $("cartCount");
    if (el) el.textContent = String(count);
  }
  function addToCart(product) {
    const cart = cartLoad();
    const idx = cart.findIndex(i => i.sku === product.sku);
    const price = window.TherwattPricing.priceInclVat(product);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ sku: product.sku, name: product.name, unit: product.unit, price, qty: 1, brand: product.brand || "" });
    cartSave(cart);
    renderCart();
    var drawer = $("cartDrawer");
    if (drawer) drawer.classList.add("open");
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
  function cartTotal(cart) { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

  function areas() {
    return [...new Set(allProducts.map(p => p.dahl_main_category || p.area_name))].filter(Boolean).sort((a, b) => a.localeCompare(b, "no"));
  }
  function groupsForArea(area) {
    return [...new Set(allProducts.filter(p => !area || (p.dahl_main_category || p.area_name) === area).map(p => p.dahl_sub_category || p.group_name))].filter(Boolean).sort((a, b) => a.localeCompare(b, "no"));
  }

  function renderAreaNav() {
    const el = $("areaNav");
    if (!el) return;
    const items = ["Alle", ...areas()];
    el.innerHTML = items.map(name => {
      const active = ((name === "Alle" && !areaFilter) || name === areaFilter) ? "active" : "";
      const href = name === "Alle" ? "#alle" : "#" + encodeURIComponent(name);
      return '<a class="' + active + '" href="' + href + '" data-area="' + (name === "Alle" ? "" : escapeHtml(name)) + '">' + escapeHtml(name) + "</a>";
    }).join("");
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
      const count = allProducts.filter(p => (!areaFilter || (p.dahl_main_category || p.area_name) === areaFilter) && (p.dahl_sub_category || p.group_name) === g).length;
      const active = groupFilter === g ? "active" : "";
      return '<div class="filter-item ' + active + '" data-group="' + escapeHtml(g) + '"><span>' + escapeHtml(g) + "</span><span class='small'>" + count + "</span></div>";
    }).join("");
    el.querySelectorAll("[data-group]").forEach(item => item.addEventListener("click", () => {
      groupFilter = item.dataset.group === groupFilter ? "" : item.dataset.group;
      currentPage = 1;
      renderGroupList();
      applyFilters();
    }));
  }

  function applyFilters() {
    filtered = allProducts.filter(p => {
      if (areaFilter && (p.dahl_main_category || p.area_name) !== areaFilter) return false;
      if (groupFilter && (p.dahl_sub_category || p.group_name) !== groupFilter) return false;
      if (query) {
        const hay = (p.sku + " " + p.name + " " + (p.dahl_main_category || p.area_name) + " " + (p.dahl_sub_category || p.group_name) + " " + (p.dahl_sub_sub_category || "") + " " + (p.brand || "")).toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    renderProducts();
  }

  function getProductImage(p, width) {
    var url = p.image_url || (p.images && p.images.length > 0 ? p.images[0] : null);
    if (!url) return "Assets/Images/no-image.jpg";
    if (width && url.includes("bluestonepim.com")) return url + "?w=" + width;
    return url;
  }

  function renderProducts() {
    const grid = $("productGrid");
    if (!grid) return;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    $("resultsText").textContent = filtered.length.toLocaleString("no-NO") + " produkter" + (areaFilter ? " i " + areaFilter : "") + (groupFilter ? " \u203A " + groupFilter : "");

    grid.innerHTML = items.map(p => {
      const price = window.TherwattPricing.priceInclVat(p);
      const requestOnly = window.TherwattPricing.isRequestOnly(p);
      const brand = p.brand || "";
      const imgSrc = getProductImage(p, 400);

      return '<article class="product-card">' +
        '<a class="product-media" href="produkt.html?sku=' + encodeURIComponent(p.sku) + '">' +
          '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(p.name) + '" loading="lazy" onerror="this.src=\'Assets/Images/no-image.jpg\'" />' +
        "</a>" +
        '<div class="product-info">' +
          (brand ? '<div class="product-brand">' + escapeHtml(brand) + "</div>" : "") +
          "<h3><a href='produkt.html?sku=" + encodeURIComponent(p.sku) + "'>" + escapeHtml(p.name) + "</a></h3>" +
          '<div class="product-meta">Varenr: ' + escapeHtml(p.sku) + (p.nobb_number ? " &middot; NOBB: " + escapeHtml(p.nobb_number) : "") + "</div>" +
          '<div class="price-row">' +
            '<span class="price">' + fmt(price) + "</span>" +
            (window.TherwattPricing.getDiscount(p) ? '<span class="price-label">med rabatt</span>' : '<span class="price-label">inkl. mva</span>') +
          "</div>" +
        "</div>" +
        '<div class="product-actions">' +
          (requestOnly
            ? '<a class="btn ghost" href="produkt.html?sku=' + encodeURIComponent(p.sku) + '#request">Be om tilbud</a>'
            : '<button class="btn" type="button" data-add="' + escapeHtml(p.sku) + '">Legg i kurv</button>') +
          '<a class="btn secondary" href="produkt.html?sku=' + encodeURIComponent(p.sku) + '">Se produkt</a>' +
        "</div>" +
      "</article>";
    }).join("");

    grid.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", () => {
      const p = allProducts.find(x => x.sku === btn.dataset.add);
      if (p) addToCart(p);
    }));
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    $("pageInfo").textContent = "Side " + currentPage + " av " + totalPages;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= totalPages;
  }

  function renderCart() {
    const drawer = $("cartDrawer");
    if (!drawer) return;
    const cart = cartLoad();
    const itemsEl = $("cartItems");
    if (!cart.length) {
      itemsEl.innerHTML = '<p class="muted" style="text-align:center;padding:20px 0">Handlekurven er tom.</p>';
    } else {
      itemsEl.innerHTML = cart.map(item =>
        '<div class="cart-item">' +
          '<div class="cart-row"><strong style="font-size:14px">' + escapeHtml(item.name) + "</strong><strong>" + fmt(item.price * item.qty) + "</strong></div>" +
          '<div class="small" style="margin-top:4px">Varenr: ' + escapeHtml(item.sku) + " &middot; " + escapeHtml(item.unit || "-") + "</div>" +
          '<div class="cart-row" style="margin-top:8px">' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<button class="btn ghost" type="button" data-dec="' + escapeHtml(item.sku) + '" style="padding:4px 10px">&minus;</button>' +
              '<span style="font-weight:600">' + item.qty + "</span>" +
              '<button class="btn ghost" type="button" data-inc="' + escapeHtml(item.sku) + '" style="padding:4px 10px">+</button>' +
            "</div>" +
            '<span class="small">' + fmt(item.price) + " per stk</span>" +
          "</div>" +
        "</div>"
      ).join("");
    }
    $("cartTotal").textContent = fmt(cartTotal(cart));
    var payload = $("orderPayload");
    if (payload) payload.value = JSON.stringify({ items: cart, total: cartTotal(cart), currency: "NOK" });
    itemsEl.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    itemsEl.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
  }

  async function startCheckout() {
    const cart = cartLoad();
    if (!cart.length) return;
    var btn = $("checkoutBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Behandler..."; }
    try {
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart })
      });
      const data = await res.json();
      if (data.url) location.href = data.url;
      else alert(data.error || "Kunne ikke starte betaling.");
    } catch (err) {
      alert("Feil ved betaling: " + err.message);
    }
    if (btn) { btn.disabled = false; btn.textContent = "Gå til betaling"; }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    updateCartBadge();
    $("searchInput").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); currentPage = 1; applyFilters(); });
    $("clearFilters").addEventListener("click", () => { areaFilter = ""; groupFilter = ""; query = ""; $("searchInput").value = ""; renderAreaNav(); renderGroupList(); applyFilters(); });
    $("prevPage").addEventListener("click", () => { currentPage -= 1; renderProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("nextPage").addEventListener("click", () => { currentPage += 1; renderProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("openCart").addEventListener("click", (e) => { e.preventDefault(); $("cartDrawer").classList.add("open"); renderCart(); });
    $("closeCart").addEventListener("click", () => { $("cartDrawer").classList.remove("open"); });
    $("cartDrawer").addEventListener("click", (e) => { if (e.target.id === "cartDrawer") $("cartDrawer").classList.remove("open"); });
    $("checkoutBtn").addEventListener("click", startCheckout);
    await loadProducts();
  });
})();
