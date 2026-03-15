
(async () => {
  const PAGE_SIZE = 24;
  let currentPage = 1;
  let totalPages = 1;
  let totalProducts = 0;
  let areaFilter = "";
  let groupFilter = "";
  let query = "";
  let metaData = null;
  let currentProducts = [];

  const $ = (id) => document.getElementById(id);
  const C = window.TherwattCart;
  const fmt = C.fmt;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  async function apiFetch(params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== "" && v !== undefined && v !== null)
      .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
      .join("&");
    const res = await fetch("/api/products?" + qs);
    if (!res.ok) throw new Error("API-feil: " + res.status);
    return res.json();
  }

  async function loadMeta() {
    metaData = await apiFetch({ meta: "1" });
    // Handle hash-based area filter
    const hash = decodeURIComponent(location.hash.replace("#", ""));
    if (hash && hash !== "alle" && metaData.areas && metaData.areas[hash]) {
      areaFilter = hash;
    }
    renderAreaNav();
    renderGroupList();
  }

  async function loadProducts() {
    try {
      $("resultsText").textContent = "Laster produkter...";
      const data = await apiFetch({
        page: currentPage,
        pageSize: PAGE_SIZE,
        area: areaFilter,
        group: groupFilter,
        q: query
      });
      currentProducts = data.products || [];
      totalProducts = data.totalProducts || 0;
      totalPages = data.totalPages || 1;
      currentPage = data.page || 1;
      renderProducts();
    } catch (err) {
      $("productGrid").innerHTML = '<div style="text-align:center;padding:40px;grid-column:1/-1"><h3>Kunne ikke laste produkter</h3><p class="muted">' + escapeHtml(err.message) + '</p><button class="btn" onclick="location.reload()">Prøv igjen</button></div>';
      $("resultsText").textContent = "Feil ved lasting av produkter";
    }
  }

  function areas() {
    if (!metaData || !metaData.areas) return [];
    return Object.keys(metaData.areas).sort((a, b) => a.localeCompare(b, "no"));
  }

  function groupsForArea(area) {
    if (!metaData || !metaData.areas) return [];
    if (area) {
      var areaData = metaData.areas[area];
      if (!areaData || !areaData.groups) return [];
      return Object.keys(areaData.groups).sort((a, b) => a.localeCompare(b, "no"));
    }
    // All groups across all areas
    var allGroups = {};
    Object.values(metaData.areas).forEach(function (a) {
      if (a.groups) {
        Object.entries(a.groups).forEach(function (entry) {
          allGroups[entry[0]] = (allGroups[entry[0]] || 0) + entry[1];
        });
      }
    });
    return Object.keys(allGroups).sort((a, b) => a.localeCompare(b, "no"));
  }

  function groupCount(group) {
    if (!metaData || !metaData.areas) return 0;
    var count = 0;
    var areasToCheck = areaFilter ? [areaFilter] : Object.keys(metaData.areas);
    areasToCheck.forEach(function (areaKey) {
      var a = metaData.areas[areaKey];
      if (a && a.groups && a.groups[group]) count += a.groups[group];
    });
    return count;
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
      loadProducts();
    }));
  }

  function renderGroupList() {
    const el = $("groupList");
    if (!el) return;
    const groups = groupsForArea(areaFilter);
    el.innerHTML = groups.map(g => {
      const count = groupCount(g);
      const active = groupFilter === g ? "active" : "";
      return '<div class="filter-item ' + active + '" data-group="' + escapeHtml(g) + '"><span>' + escapeHtml(g) + "</span><span class='small'>" + count + "</span></div>";
    }).join("");
    el.querySelectorAll("[data-group]").forEach(item => item.addEventListener("click", () => {
      groupFilter = item.dataset.group === groupFilter ? "" : item.dataset.group;
      currentPage = 1;
      renderGroupList();
      loadProducts();
    }));
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
    $("resultsText").textContent = totalProducts.toLocaleString("no-NO") + " produkter" + (areaFilter ? " i " + areaFilter : "") + (groupFilter ? " \u203A " + groupFilter : "");

    grid.innerHTML = currentProducts.map(p => {
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
      const sku = btn.dataset.add;
      const p = currentProducts.find(x => x.sku === sku);
      if (p) {
        C.add(p);
        btn.textContent = "Lagt til!";
        btn.style.background = "var(--success)";
        setTimeout(() => { btn.textContent = "Legg i kurv"; btn.style.background = ""; }, 1200);
      }
    }));
    renderPager();
  }

  function renderPager() {
    $("pageInfo").textContent = "Side " + currentPage + " av " + totalPages;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= totalPages;
  }

  // Debounce for search input
  let searchTimer = null;

  document.addEventListener("DOMContentLoaded", async () => {
    $("searchInput").addEventListener("input", e => {
      query = e.target.value.trim().toLowerCase();
      currentPage = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadProducts(), 300);
    });
    $("clearFilters").addEventListener("click", () => { areaFilter = ""; groupFilter = ""; query = ""; $("searchInput").value = ""; currentPage = 1; renderAreaNav(); renderGroupList(); loadProducts(); });
    $("prevPage").addEventListener("click", () => { currentPage -= 1; loadProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("nextPage").addEventListener("click", () => { currentPage += 1; loadProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    await loadMeta();
    await loadProducts();
  });
})();
