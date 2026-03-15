
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
  const C = window.TherwattCart;
  const fmt = C.fmt;

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
      if (p) {
        C.add(p);
        // Brief visual feedback on button
        btn.textContent = "Lagt til!";
        btn.style.background = "var(--success)";
        setTimeout(() => { btn.textContent = "Legg i kurv"; btn.style.background = ""; }, 1200);
      }
    }));
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    $("pageInfo").textContent = "Side " + currentPage + " av " + totalPages;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= totalPages;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("searchInput").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); currentPage = 1; applyFilters(); });
    $("clearFilters").addEventListener("click", () => { areaFilter = ""; groupFilter = ""; query = ""; $("searchInput").value = ""; renderAreaNav(); renderGroupList(); applyFilters(); });
    $("prevPage").addEventListener("click", () => { currentPage -= 1; renderProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("nextPage").addEventListener("click", () => { currentPage += 1; renderProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    await loadProducts();
  });
})();
