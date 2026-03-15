
(async () => {
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

  const params = new URLSearchParams(location.search);
  const sku = params.get("sku");
  if (!sku) return;

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Kunne ikke laste " + path);
    return res.json();
  }

  function getProductImage(p) {
    if (p.image_url) return p.image_url;
    if (p.images && p.images.length > 0) return p.images[0];
    return "Assets/Images/no-image.jpg";
  }

  try {
    const skuIndex = await loadJson("Data/sku-index.json");
    const file = skuIndex[sku];
    if (!file) {
      $("productRoot").innerHTML = '<div class="hero-card" style="padding:40px;text-align:center"><h1 style="font-size:28px;margin-top:0">Produkt ikke funnet</h1><p class="muted">Vi fant ikke varen du ba om. Prøv å søke i nettbutikken.</p><div class="actions" style="justify-content:center;margin-top:16px"><a class="btn" href="butikk.html">Til nettbutikk</a></div></div>';
      return;
    }
    const products = await loadJson("Data/" + file);
    const product = products.find(p => p.sku === sku);
    if (!product) {
      $("productRoot").innerHTML = '<div class="hero-card" style="padding:40px;text-align:center"><h1 style="font-size:28px;margin-top:0">Produkt ikke funnet</h1><p class="muted">Vi fant ikke varen du ba om.</p><div class="actions" style="justify-content:center;margin-top:16px"><a class="btn" href="butikk.html">Til nettbutikk</a></div></div>';
      return;
    }

    const price = window.TherwattPricing.priceInclVat(product);
    const requestOnly = window.TherwattPricing.isRequestOnly(product);
    const brand = product.brand || "";
    const imgSrc = getProductImage(product);
    const category = product.dahl_sub_sub_category || product.category || product.group_name;
    const mainCat = product.dahl_main_category || product.area_name;
    const subCat = product.dahl_sub_category || '';

    document.title = product.name + " \u2013 Therwatt";

    $("productRoot").innerHTML =
      // Breadcrumb
      '<nav class="product-breadcrumb">' +
        '<a href="index.html">Hjem</a> <span class="muted">/</span> ' +
        '<a href="butikk.html">Nettbutikk</a> <span class="muted">/</span> ' +
        '<a href="butikk.html#' + encodeURIComponent(mainCat) + '">' + escapeHtml(mainCat) + '</a> <span class="muted">/</span> ' +
        (subCat ? '<span class="muted">' + escapeHtml(subCat) + '</span> <span class="muted">/</span> ' : '') +
        '<span class="muted">' + escapeHtml(category) + '</span>' +
      '</nav>' +

      // Product layout
      '<div class="product-wrap">' +
        '<div class="product-gallery">' +
          '<div class="product-media" style="aspect-ratio:1/1;border:none;padding:24px">' +
            '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'Assets/Images/no-image.jpg\'" />' +
          '</div>' +
        '</div>' +
        '<div class="product-detail">' +
          (brand ? '<div class="badge">' + escapeHtml(brand) + '</div>' : '<div class="badge">' + escapeHtml(mainCat) + '</div>') +
          '<h1>' + escapeHtml(product.name) + '</h1>' +
          '<p class="muted" style="font-size:15px;margin:0;line-height:1.7">' + escapeHtml(product.description) + '</p>' +
          '<div style="display:flex;align-items:baseline;gap:12px">' +
            '<span class="price" style="font-size:36px">' + fmt(price) + '</span>' +
            '<span class="price-label" style="font-size:14px">' + (window.TherwattPricing.getDiscount(product) ? "med rabatt, inkl. mva" : "inkl. mva") + '</span>' +
          '</div>' +
          '<div class="actions">' +
            (requestOnly
              ? '<a class="btn ghost" href="#request" style="padding:14px 28px">Be om tilbud</a>'
              : '<button class="btn success" id="buyBtn" type="button" style="padding:14px 28px">Legg i handlekurv</button>') +
            '<a class="btn secondary" href="butikk.html" style="padding:14px 28px">Tilbake til butikk</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Tabs
      '<div class="product-tabs">' +
        '<div class="tab-nav">' +
          '<button class="active" data-tab="info">Produktinformasjon</button>' +
          '<button data-tab="specs">Tekniske data</button>' +
          '<button data-tab="id">Identifikasjon</button>' +
        '</div>' +

        '<div class="tab-content active" id="tab-info">' +
          '<div class="hero-card" style="padding:24px">' +
            '<h3 style="margin-top:0;font-size:18px">Beskrivelse</h3>' +
            '<p style="color:var(--text-secondary);line-height:1.8">' + escapeHtml(product.description) + '</p>' +
            (brand ? '<div class="kv"><div class="muted">Merke</div><div>' + escapeHtml(brand) + '</div></div>' : '') +
            '<div class="kv"><div class="muted">Hovedkategori</div><div>' + escapeHtml(mainCat) + '</div></div>' +
            (subCat ? '<div class="kv"><div class="muted">Underkategori</div><div>' + escapeHtml(subCat) + '</div></div>' : '') +
            '<div class="kv"><div class="muted">Produktgruppe</div><div>' + escapeHtml(category) + '</div></div>' +
            '<div class="kv"><div class="muted">Enhet</div><div>' + escapeHtml(product.unit || "-") + '</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="tab-content" id="tab-specs">' +
          '<div class="hero-card" style="padding:24px">' +
            '<h3 style="margin-top:0;font-size:18px">Tekniske spesifikasjoner</h3>' +
            (brand ? '<div class="kv"><div class="muted">Produsent</div><div>' + escapeHtml(brand) + '</div></div>' : '') +
            '<div class="kv"><div class="muted">Varegruppe (Dahl)</div><div>' + escapeHtml(mainCat + ' \u203A ' + (subCat || '') + ' \u203A ' + category) + '</div></div>' +
            '<div class="kv"><div class="muted">Opprinnelig gruppe</div><div>' + escapeHtml(product.group_name) + '</div></div>' +
            '<div class="kv"><div class="muted">Enhet</div><div>' + escapeHtml(product.unit || "-") + '</div></div>' +
            '<div class="kv"><div class="muted">Pris eks. mva</div><div>' + fmt(product.gross_price) + '</div></div>' +
          '</div>' +
        '</div>' +

        '<div class="tab-content" id="tab-id">' +
          '<div class="hero-card" style="padding:24px">' +
            '<h3 style="margin-top:0;font-size:18px">Produktidentifikasjon</h3>' +
            '<div class="kv"><div class="muted">Varenummer</div><div style="font-weight:700">' + escapeHtml(product.sku) + '</div></div>' +
            (product.nobb_number ? '<div class="kv"><div class="muted">NOBB-nummer</div><div style="font-weight:700">' + escapeHtml(product.nobb_number) + '</div></div>' : '<div class="kv"><div class="muted">NOBB-nummer</div><div class="muted">Ikke tilgjengelig</div></div>') +
            '<div class="kv"><div class="muted">Omr\u00e5dekode</div><div>' + escapeHtml(product.area_code) + '</div></div>' +
            '<div class="kv"><div class="muted">Gruppekode</div><div>' + escapeHtml(product.group_code) + '</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Request form
      '<div class="hero-card request-box" id="request" style="padding:28px">' +
        '<h2 style="margin-top:0;font-size:22px">Be om tilbud</h2>' +
        '<p class="subtitle" style="font-size:14px">For prosjektpriser, mengderabatter eller teknisk r\u00e5dgivning.</p>' +
        '<form name="tilbud" method="POST" data-netlify="true" action="takke.html">' +
          '<input type="hidden" name="form-name" value="tilbud" />' +
          '<input type="hidden" name="product" value="' + escapeHtml(product.sku) + ' \u2013 ' + escapeHtml(product.name) + '" />' +
          '<div class="grid cols-2">' +
            '<div><label>Navn</label><input class="input" name="name" required></div>' +
            '<div><label>E-post</label><input class="input" name="email" type="email" required></div>' +
            '<div><label>Telefon</label><input class="input" name="phone"></div>' +
            '<div><label>Firma</label><input class="input" name="company"></div>' +
          '</div>' +
          '<div style="margin-top:12px"><label>Melding</label><textarea name="message" rows="4" placeholder="Beskriv prosjektet eller \u00f8nsket ditt..."></textarea></div>' +
          '<div class="actions" style="margin-top:16px"><button class="btn" type="submit">Send foresp\u00f8rsel</button></div>' +
        '</form>' +
      '</div>';

    // Tab switching
    document.querySelectorAll(".tab-nav button").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.querySelectorAll(".tab-nav button").forEach(function(b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-content").forEach(function(tc) { tc.classList.remove("active"); });
        btn.classList.add("active");
        var tabEl = document.getElementById("tab-" + btn.dataset.tab);
        if (tabEl) tabEl.classList.add("active");
      });
    });

    // Buy button
    var buy = $("buyBtn");
    if (buy) buy.addEventListener("click", function() {
      var cart = [];
      try { cart = JSON.parse(localStorage.getItem("therwatt_cart_v8") || "[]"); } catch(e) {}
      var idx = cart.findIndex(function(i) { return i.sku === product.sku; });
      if (idx >= 0) cart[idx].qty += 1;
      else cart.push({ sku: product.sku, name: product.name, unit: product.unit, price: price, qty: 1, brand: brand });
      localStorage.setItem("therwatt_cart_v8", JSON.stringify(cart));
      buy.textContent = "Lagt til!";
      buy.style.background = "var(--success)";
      setTimeout(function() { buy.textContent = "Legg i handlekurv"; buy.style.background = ""; }, 1500);
    });

  } catch (error) {
    $("productRoot").innerHTML = '<div class="hero-card" style="padding:40px;text-align:center"><h1 style="font-size:28px;margin-top:0">Kunne ikke laste produktet</h1><p class="muted">' + escapeHtml(error.message) + '</p><div class="actions" style="justify-content:center;margin-top:16px"><a class="btn" href="butikk.html">Til nettbutikk</a></div></div>';
  }
})();
