
(async () => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat("no-NO",{style:"currency",currency:"NOK",minimumFractionDigits:0,maximumFractionDigits:2}).format(n || 0);
  const params = new URLSearchParams(location.search);
  const sku = params.get("sku");
  if (!sku) return;

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Kunne ikke laste ${path}`);
    return res.json();
  }

  try {
    const skuIndex = await loadJson("data/sku-index.json");
    const file = skuIndex[sku];
    if (!file) {
      $("productRoot").innerHTML = `<div class="card product-box"><h1>Produkt ikke funnet</h1><p class="muted">Vi fant ikke varen du ba om.</p></div>`;
      return;
    }
    const products = await loadJson(`data/${file}`);
    const product = products.find(p => p.sku === sku);
    if (!product) {
      $("productRoot").innerHTML = `<div class="card product-box"><h1>Produkt ikke funnet</h1><p class="muted">Vi fant ikke varen du ba om.</p></div>`;
      return;
    }

    const price = window.TherwattPricing.priceInclVat(product);
    const requestOnly = window.TherwattPricing.isRequestOnly(product);
    document.title = `${product.name} – Therwatt`;
    $("productRoot").innerHTML = `
      <div class="product-wrap">
        <div class="hero-card product-box">
          <div class="product-media" style="aspect-ratio:1/1"><img src="assets/images/no-image.jpg" alt="${product.name}" /></div>
        </div>
        <div class="hero-card product-box">
          <div class="badge">${product.area_name}</div>
          <h1>${product.name}</h1>
          <p class="lead" style="font-size:18px;max-width:none">${product.description}</p>
          <div class="price">${fmt(price)}</div>
          <div class="small">Bruttopris + mva${window.TherwattPricing.getDiscount(product) ? " med rabatt" : ""}</div>
          <div class="actions" style="margin-top:18px">
            ${requestOnly ? `<a class="btn ghost" href="#request">Be om tilbud</a>` : `<button class="btn" id="buyBtn" type="button">Legg i handlekurv</button>`}
            <a class="btn secondary" href="butikk.html">Tilbake til butikk</a>
          </div>
          <div class="section" style="padding:24px 0 0">
            <h2 style="font-size:24px">Produktinformasjon</h2>
            <div class="kv"><div class="muted">Varenummer</div><div>${product.sku}</div></div>
            <div class="kv"><div class="muted">Forretningsområde</div><div>${product.area_name}</div></div>
            <div class="kv"><div class="muted">Varegruppe</div><div>${product.group_name}</div></div>
            <div class="kv"><div class="muted">Enhet</div><div>${product.unit || "-"}</div></div>
            <div class="kv"><div class="muted">Bruttopris eks. mva</div><div>${fmt(product.gross_price)}</div></div>
          </div>
        </div>
      </div>
      <div class="hero-card product-box request-box" id="request">
        <h2 style="margin-top:0">Be om tilbud</h2>
        <p class="subtitle">Bruk dette skjemaet for større varer, prosjektpriser eller hvis du vil ha hjelp til riktig løsning.</p>
        <form name="tilbud" method="POST" data-netlify="true" action="takke.html">
          <input type="hidden" name="form-name" value="tilbud" />
          <input type="hidden" name="product" value="${product.sku} – ${product.name}" />
          <div class="grid cols-2">
            <div><label>Navn</label><input class="input" name="name" required></div>
            <div><label>E-post</label><input class="input" name="email" type="email" required></div>
            <div><label>Telefon</label><input class="input" name="phone"></div>
            <div><label>Firma</label><input class="input" name="company"></div>
          </div>
          <div style="margin-top:12px"><label>Melding</label><textarea name="message" placeholder="Beskriv prosjektet eller ønsket ditt"></textarea></div>
          <div class="actions" style="margin-top:14px"><button class="btn" type="submit">Send forespørsel</button></div>
        </form>
      </div>`;
    const buy = $("buyBtn");
    if (buy) buy.addEventListener("click", () => {
      let cart = [];
      try { cart = JSON.parse(localStorage.getItem("therwatt_cart_v8") || "[]"); } catch {}
      const idx = cart.findIndex(i => i.sku === product.sku);
      if (idx >= 0) cart[idx].qty += 1;
      else cart.push({ sku: product.sku, name: product.name, unit: product.unit, price, qty: 1 });
      localStorage.setItem("therwatt_cart_v8", JSON.stringify(cart));
      alert("Produkt lagt i handlekurven.");
    });
  } catch (error) {
    $("productRoot").innerHTML = `<div class="card product-box"><h1>Kunne ikke laste produktet</h1><p class="muted">${error.message}</p></div>`;
  }
})();
