
(async () => {
  const PAGE_SIZE = 24;
  let allProducts = [];
  let filtered = [];
  let currentPage = 1;
  let areaFilter = "";
  let groupFilter = "";
  let query = "";
  let meta = null;
  let loadedCategories = {};

  const $ = (id) => document.getElementById(id);
  const C = window.TherwattCart;
  const fmt = C.fmt;

  /* Compact-key → full-key mapping (matches build-listing.js) */
  const KEY_EXPAND = {
    s: "sku", n: "name", p: "gross_price", u: "unit",
    gn: "group_name", gc: "group_code", an: "area_name",
    b: "brand", nb: "nobb_number", mc: "dahl_main_category",
    sc: "dahl_sub_category", ssc: "dahl_sub_sub_category", i: "image_url"
  };

  function expand(compact) {
    const full = {};
    for (const k in compact) {
      full[KEY_EXPAND[k] || k] = compact[k];
    }
    return full;
  }

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

  function showLoading(message) {
    var el = $("resultsText");
    if (el) el.textContent = message || "Laster produkter...";
  }

  async function loadCategoryProducts(slug) {
    if (loadedCategories[slug]) return loadedCategories[slug];
    var data = await loadJson("Data/listing/" + slug + ".json");
    var products = data.map(expand);
    loadedCategories[slug] = products;
    return products;
  }

  async function loadProducts() {
    showLoading("Laster produktkategorier...");
    meta = await loadJson("Data/listing/meta.json");

    // Handle hash-based area filter
    var hash = decodeURIComponent(location.hash.replace("#", ""));
    if (hash && hash !== "alle") {
      var matchCat = meta.categories.find(function(c) { return c.name === hash; });
      if (matchCat) areaFilter = hash;
    }

    renderAreaNav();

    // Load products for selected category or all
    await loadCurrentProducts();
  }

  async function loadCurrentProducts() {
    if (areaFilter) {
      var cat = meta.categories.find(function(c) { return c.name === areaFilter; });
      if (cat) {
        showLoading("Laster " + cat.name + "...");
        allProducts = await loadCategoryProducts(cat.slug);
      }
    } else {
      // Load all categories progressively
      showLoading("Laster alle produkter...");
      allProducts = [];
      for (var i = 0; i < meta.categories.length; i++) {
        var cat = meta.categories[i];
        showLoading("Laster " + cat.name + " (" + (i + 1) + "/" + meta.categories.length + ")...");
        var products = await loadCategoryProducts(cat.slug);
        allProducts = allProducts.concat(products);
        // Show partial results as they load
        filtered = applyFilterLogic(allProducts);
        renderProducts();
      }
    }

    filtered = applyFilterLogic(allProducts);
    renderGroupList();
    renderProducts();
  }

  function areas() {
    if (!meta) return [];
    return meta.categories.map(function(c) { return c.name; }).sort(function(a, b) { return a.localeCompare(b, "no"); });
  }

  function groupsForArea(area) {
    if (!meta) return [];
    if (area) {
      var cat = meta.categories.find(function(c) { return c.name === area; });
      if (cat) return cat.subcategories.map(function(s) { return s.name; });
      return [];
    }
    // All groups from loaded products
    return [...new Set(allProducts.map(function(p) { return p.dahl_sub_category || p.group_name; }))].filter(Boolean).sort(function(a, b) { return a.localeCompare(b, "no"); });
  }

  function renderAreaNav() {
    var el = $("areaNav");
    if (!el) return;
    var items = ["Alle"].concat(areas());
    el.innerHTML = items.map(function(name) {
      var active = ((name === "Alle" && !areaFilter) || name === areaFilter) ? "active" : "";
      var href = name === "Alle" ? "#alle" : "#" + encodeURIComponent(name);
      return '<a class="' + active + '" href="' + href + '" data-area="' + (name === "Alle" ? "" : escapeHtml(name)) + '">' + escapeHtml(name) + "</a>";
    }).join("");
    el.querySelectorAll("[data-area]").forEach(function(a) {
      a.addEventListener("click", function(e) {
        e.preventDefault();
        var newArea = a.dataset.area;
        if (newArea !== areaFilter) {
          areaFilter = newArea;
          groupFilter = "";
          currentPage = 1;
          renderAreaNav();
          loadCurrentProducts().catch(function(err) {
            console.error("Failed to load products:", err);
            showLoading("Kunne ikke laste produkter. Prøv igjen.");
          });
        }
      });
    });
  }

  function renderGroupList() {
    var el = $("groupList");
    if (!el) return;
    var groups = groupsForArea(areaFilter);
    el.innerHTML = groups.map(function(g) {
      var count = allProducts.filter(function(p) { return (!areaFilter || (p.dahl_main_category || p.area_name) === areaFilter) && (p.dahl_sub_category || p.group_name) === g; }).length;
      var active = groupFilter === g ? "active" : "";
      return '<div class="filter-item ' + active + '" data-group="' + escapeHtml(g) + '"><span>' + escapeHtml(g) + "</span><span class='small'>" + count + "</span></div>";
    }).join("");
    el.querySelectorAll("[data-group]").forEach(function(item) {
      item.addEventListener("click", function() {
        groupFilter = item.dataset.group === groupFilter ? "" : item.dataset.group;
        currentPage = 1;
        renderGroupList();
        filtered = applyFilterLogic(allProducts);
        renderProducts();
      });
    });
  }

  function applyFilterLogic(products) {
    return products.filter(function(p) {
      if (areaFilter && (p.dahl_main_category || p.area_name) !== areaFilter) return false;
      if (groupFilter && (p.dahl_sub_category || p.group_name) !== groupFilter) return false;
      if (query) {
        var hay = (p.sku + " " + p.name + " " + (p.dahl_main_category || p.area_name) + " " + (p.dahl_sub_category || p.group_name) + " " + (p.dahl_sub_sub_category || "") + " " + (p.brand || "")).toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }

  function applyFilters() {
    filtered = applyFilterLogic(allProducts);
    renderProducts();
  }

  function getProductImage(p, width) {
    var url = p.image_url || (p.images && p.images.length > 0 ? p.images[0] : null);
    if (!url) return "Assets/Images/no-image.jpg";
    if (width && url.includes("bluestonepim.com")) return url + "?w=" + width;
    return url;
  }

  function renderProducts() {
    var grid = $("productGrid");
    if (!grid) return;
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    var start = (currentPage - 1) * PAGE_SIZE;
    var items = filtered.slice(start, start + PAGE_SIZE);
    $("resultsText").textContent = filtered.length.toLocaleString("no-NO") + " produkter" + (areaFilter ? " i " + areaFilter : "") + (groupFilter ? " \u203A " + groupFilter : "");

    grid.innerHTML = items.map(function(p) {
      var price = window.TherwattPricing.priceInclVat(p);
      var requestOnly = window.TherwattPricing.isRequestOnly(p);
      var brand = p.brand || "";
      var imgSrc = getProductImage(p, 400);

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

    grid.querySelectorAll("[data-add]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var p = allProducts.find(function(x) { return x.sku === btn.dataset.add; });
        if (p) {
          C.add(p);
          btn.textContent = "Lagt til!";
          btn.style.background = "var(--success)";
          setTimeout(function() { btn.textContent = "Legg i kurv"; btn.style.background = ""; }, 1200);
        }
      });
    });
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    $("pageInfo").textContent = "Side " + currentPage + " av " + totalPages;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= totalPages;
  }

  document.addEventListener("DOMContentLoaded", async function() {
    $("searchInput").addEventListener("input", function(e) { query = e.target.value.trim().toLowerCase(); currentPage = 1; applyFilters(); });
    $("clearFilters").addEventListener("click", function() {
      areaFilter = ""; groupFilter = ""; query = ""; $("searchInput").value = "";
      renderAreaNav();
      loadCurrentProducts().catch(function(err) {
        console.error("Failed to load products:", err);
        showLoading("Kunne ikke laste produkter. Prøv igjen.");
      });
    });
    $("prevPage").addEventListener("click", function() { currentPage -= 1; renderProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    $("nextPage").addEventListener("click", function() { currentPage += 1; renderProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); });

    try {
      await loadProducts();
    } catch (err) {
      console.error("Failed to load products:", err);
      var grid = $("productGrid");
      if (grid) {
        grid.innerHTML = '<div class="hero-card" style="padding:40px;text-align:center">' +
          '<h2 style="margin-top:0">Kunne ikke laste produkter</h2>' +
          '<p class="muted">' + escapeHtml(err.message) + '</p>' +
          '<div class="actions" style="justify-content:center;margin-top:16px">' +
            '<button class="btn" onclick="location.reload()">Prøv igjen</button>' +
          '</div></div>';
      }
    }
  });
})();
