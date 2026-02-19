const PRODUCTS_URL = "assets/products.json";
const PAGE_SIZE = 24;

let allProducts = [];
let filtered = [];
let page = 1;

let discount = 0.20;
let stripePublishableKey = null;

const $ = (id) => document.getElementById(id);

function fmt(n) {
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("no-NO", { maximumFractionDigits: 2 }).format(n);
}

function priceFromBrutto(bruttopris) {
  if (!Number.isFinite(bruttopris)) return null;
  return Number((bruttopris * (1 - discount)).toFixed(2));
}

function loadCart() {
  try { return JSON.parse(localStorage.getItem("cart_v1") || "[]"); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
  updateCartBadge();
}
function cartCount(cart) {
  return cart.reduce((sum, i) => sum + (i.qty || 0), 0);
}
function cartSum(cart) {
  return cart.reduce((sum, i) => sum + (i.qty || 0) * (i.price || 0), 0);
}
function updateCartBadge() {
  const cart = loadCart();
  $("cartCount").textContent = String(cartCount(cart));
}

function addToCart(p) {
  const cart = loadCart();
  const idx = cart.findIndex(x => x.sku === p.sku);
  const unitPrice = priceFromBrutto(p.bruttopris);
  if (unitPrice == null) return;

  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ sku: p.sku, name: p.name, unit: p.unit, price: unitPrice, qty: 1 });

  saveCart(cart);
}

function setQty(sku, qty) {
  const cart = loadCart();
  const idx = cart.findIndex(x => x.sku === sku);
  if (idx < 0) return;
  cart[idx].qty = Math.max(0, qty);
  const next = cart.filter(x => x.qty > 0);
  saveCart(next);
  renderCart();
}

function emptyCart() {
  localStorage.removeItem("cart_v1");
  updateCartBadge();
  renderCart();
}

function uniqueSorted(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a,b)=>a.localeCompare(b, "no"));
}

function applyFilters() {
  const q = ($("q").value || "").trim().toLowerCase();
  const cat = $("cat").value || "";

  filtered = allProducts.filter(p => {
    const okCat = !cat || p.category === cat;
    if (!okCat) return false;

    if (!q) return true;
    const hay = `${p.sku} ${p.name}`.toLowerCase();
    return hay.includes(q);
  });

  page = 1;
  renderList();
}

function renderList() {
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(page, totalPages);

  $("pageNo").textContent = String(page);
  $("pageTotal").textContent = String(totalPages);

  $("prev").disabled = page <= 1;
  $("next").disabled = page >= totalPages;

  const start = (page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  $("status").textContent = `Viser ${items.length} av ${filtered.length} produkter`;

  const html = items.map(p => {
    const price = priceFromBrutto(p.bruttopris);
    return `
    <div class="card">
      <img class="prod" id="img-${p.sku}" src="assets/images/no-image.svg" alt="" loading="lazy" />
      <h3 style="margin:10px 0 6px;">${p.name}</h3>
      <p class="note" style="margin:0 0 10px;">
        Varenr: <b>${p.sku}</b> · Enhet: <b>${p.unit || "-"}</b><br/>
        Gruppe: ${p.category || "-"}
      </p>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="font-weight:900;">${price != null ? fmt(price) : "-"} kr</div>
        <button class="btn" type="button" data-add="${p.sku}">Legg i kurv</button>
      </div>
    </div>`;
  }).join("");

  $("list").innerHTML = html;

  // add-to-cart handlers
  document.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const sku = btn.getAttribute("data-add");
      const p = allProducts.find(x => x.sku === sku);
      if (p) addToCart(p);
    });
  });

  // load images via function (best effort)
  items.forEach(async (p) => {
    const img = document.getElementById(`img-${p.sku}`);
    if (!img) return;
    try {
      const res = await fetch(`/api/nobb-image?sku=${encodeURIComponent(p.sku)}`);
      const data = await res.json();
      if (data?.image) img.src = data.image;
      img.onerror = () => { img.src = "assets/images/no-image.svg"; };
    } catch {
      // keep placeholder
    }
  });
}

function openCart() {
  $("cartDrawer").style.display = "block";
  renderCart();
}
function closeCart() {
  $("cartDrawer").style.display = "none";
}

function renderCart() {
  const cart = loadCart();
  if (!cart.length) {
    $("cartItems").innerHTML = `<div class="note">Handlekurven er tom.</div>`;
  } else {
    $("cartItems").innerHTML = cart.map(i => `
      <div class="card" style="margin:10px 0;">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div style="font-weight:900;">${i.name}</div>
          <div style="color:var(--muted); white-space:nowrap;">${fmt(i.price)} kr</div>
        </div>
        <div class="note">Varenr: ${i.sku} · Enhet: ${i.unit || "-"}</div>

        <div style="display:flex; gap:10px; align-items:center; margin-top:10px; flex-wrap:wrap;">
          <button class="btn secondary" type="button" data-dec="${i.sku}">–</button>
          <div style="font-weight:900;">Antall: ${i.qty}</div>
          <button class="btn secondary" type="button" data-inc="${i.sku}">+</button>
          <div style="margin-left:auto; font-weight:900;">Linjesum: ${fmt(i.qty * i.price)} kr</div>
        </div>
      </div>
    `).join("");

    document.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => {
      const sku = b.getAttribute("data-dec");
      const cart = loadCart();
      const item = cart.find(x => x.sku === sku);
      if (item) setQty(sku, item.qty - 1);
    }));
    document.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => {
      const sku = b.getAttribute("data-inc");
      const cart = loadCart();
      const item = cart.find(x => x.sku === sku);
      if (item) setQty(sku, item.qty + 1);
    }));
  }

  $("cartSum").textContent = fmt(cartSum(cart));
}

async function checkout() {
  const cart = loadCart();
  if (!cart.length) return;

  if (!stripePublishableKey) {
    alert("Stripe er ikke konfigurert ennå.");
    return;
  }

  const customerEmail = ($("customerEmail").value || "").trim();
  const customerNote = ($("customerNote").value || "").trim();

  const res = await fetch("/api/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart, customerEmail, customerNote })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data?.error || "Kunne ikke starte betaling.");
    return;
  }

  const stripe = Stripe(stripePublishableKey);
  const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
  if (error) alert(error.message);
}

async function initConfig() {
  const res = await fetch("/api/public-config", { cache: "no-store" });
  const data = await res.json();
  if (data?.discount != null) discount = data.discount;
  stripePublishableKey = data?.stripePublishableKey || null;

  const pct = Math.round(discount * 100);
  $("pricingNote").textContent = `Pris beregnes fra bruttopris med fast rabatt: ${pct}% (endres i Netlify Function).`;
}

async function init() {
  updateCartBadge();

  $("openCart").addEventListener("click", openCart);
  $("closeCart").addEventListener("click", closeCart);
  $("cartDrawer").addEventListener("click", (e) => {
    if (e.target === $("cartDrawer")) closeCart();
  });

  $("emptyCart").addEventListener("click", emptyCart);
  $("checkoutBtn").addEventListener("click", checkout);

  $("q").addEventListener("input", () => applyFilters());
  $("cat").addEventListener("change", () => applyFilters());
  $("clear").addEventListener("click", () => {
    $("q").value = "";
    $("cat").value = "";
    applyFilters();
  });

  $("prev").addEventListener("click", () => { page = Math.max(1, page - 1); renderList(); });
  $("next").addEventListener("click", () => { page = page + 1; renderList(); });

  $("status").textContent = "Laster produkter…";

  await initConfig();

  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Klarte ikke å laste products.json");
  allProducts = await res.json();

  // categories
  const cats = uniqueSorted(allProducts.map(p => p.category));
  $("cat").innerHTML = `<option value="">Alle</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join("");

  filtered = allProducts;
  renderList();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch(err => {
    $("status").textContent = "Feil: " + (err?.message || err);
  });
});
