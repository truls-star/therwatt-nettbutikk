/* ===== Therwatt Global Cart Module ===== */
/* Loaded on every page — provides cart state, mini-cart, toast, badge */
(function () {
  "use strict";
  var CART_KEY = "therwatt_cart_v8";

  var fmt = function (n) {
    return new Intl.NumberFormat("no-NO", {
      style: "currency", currency: "NOK",
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(n || 0);
  };

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  /* ---- Cart state ---- */
  function cartLoad() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; }
  }
  function cartSave(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateBadge();
    renderMiniCart();
  }
  function cartCount() {
    return cartLoad().reduce(function (s, i) { return s + (i.qty || 0); }, 0);
  }
  function cartTotal(cart) {
    return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }
  function addToCart(product) {
    var cart = cartLoad();
    var idx = cart.findIndex(function (i) { return i.sku === product.sku; });
    var price = window.TherwattPricing ? window.TherwattPricing.priceInclVat(product) : product.price;
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ sku: product.sku, name: product.name, unit: product.unit, price: price, qty: 1, brand: product.brand || "" });
    cartSave(cart);
    showToast(product.name);
    return cart;
  }
  function addToCartSimple(item) {
    var cart = cartLoad();
    var idx = cart.findIndex(function (i) { return i.sku === item.sku; });
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ sku: item.sku, name: item.name, unit: item.unit || "", price: item.price, qty: 1, brand: item.brand || "" });
    cartSave(cart);
    showToast(item.name);
    return cart;
  }
  function changeQty(sku, delta) {
    var cart = cartLoad();
    var idx = cart.findIndex(function (i) { return i.sku === sku; });
    if (idx >= 0) {
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      cartSave(cart);
    }
    return cartLoad();
  }
  function setQty(sku, qty) {
    var cart = cartLoad();
    var idx = cart.findIndex(function (i) { return i.sku === sku; });
    if (idx >= 0) {
      if (qty <= 0) cart.splice(idx, 1);
      else cart[idx].qty = qty;
      cartSave(cart);
    }
    return cartLoad();
  }
  function removeItem(sku) {
    var cart = cartLoad().filter(function (i) { return i.sku !== sku; });
    cartSave(cart);
    return cart;
  }
  function clearCart() {
    localStorage.setItem(CART_KEY, "[]");
    updateBadge();
    renderMiniCart();
  }

  /* ---- Toast notification ---- */
  function showToast(productName) {
    var container = document.getElementById("cartToast");
    if (!container) {
      container = document.createElement("div");
      container.id = "cartToast";
      container.className = "cart-toast";
      document.body.appendChild(container);
    }
    container.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>' +
      "<span><strong>" + escapeHtml(productName) + "</strong> lagt i handlekurv</span>" +
      '<a href="handlekurv.html" class="cart-toast-link">Se handlekurv</a>';
    container.classList.add("visible");
    clearTimeout(container._t);
    container._t = setTimeout(function () { container.classList.remove("visible"); }, 4000);
  }

  /* ---- Badge ---- */
  function updateBadge() {
    var count = cartCount();
    document.querySelectorAll(".cart-badge-count").forEach(function (el) {
      el.textContent = String(count);
      el.style.display = count > 0 ? "" : "none";
    });
  }

  /* ---- Inject header cart button ---- */
  function injectCartButton() {
    var navBar = document.querySelector(".nav");
    if (!navBar) return;

    // Remove old butikk.html cart button if present
    var old = document.getElementById("openCart");
    if (old) old.remove();

    var btn = document.createElement("a");
    btn.href = "handlekurv.html";
    btn.className = "cart-header-btn";
    btn.id = "globalCartBtn";
    btn.setAttribute("aria-label", "Handlekurv");
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
        '<path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>' +
      '</svg>' +
      '<span class="cart-badge-count" style="display:none">0</span>';
    // Append to nav bar (not inside menu) so it stays visible on mobile
    navBar.appendChild(btn);

    // Mini-cart container
    var mc = document.createElement("div");
    mc.className = "mini-cart";
    mc.id = "miniCart";
    mc.innerHTML =
      '<div class="mini-cart-header">' +
        '<h3>Handlekurv</h3>' +
        '<button class="mini-cart-close" id="miniCartClose" aria-label="Lukk">&times;</button>' +
      '</div>' +
      '<div class="mini-cart-items" id="miniCartItems"></div>' +
      '<div class="mini-cart-footer" id="miniCartFooter"></div>';
    document.body.appendChild(mc);

    // Events
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      mc.classList.toggle("open");
      if (mc.classList.contains("open")) renderMiniCart();
    });
    document.getElementById("miniCartClose").addEventListener("click", function () {
      mc.classList.remove("open");
    });
    document.addEventListener("click", function (e) {
      if (mc.classList.contains("open") && !mc.contains(e.target) && !btn.contains(e.target)) {
        mc.classList.remove("open");
      }
    });
  }

  /* ---- Mini-cart rendering ---- */
  function renderMiniCart() {
    var itemsEl = document.getElementById("miniCartItems");
    var footerEl = document.getElementById("miniCartFooter");
    if (!itemsEl || !footerEl) return;

    var cart = cartLoad();
    if (!cart.length) {
      itemsEl.innerHTML = '<p class="mini-cart-empty">Handlekurven er tom</p>';
      footerEl.innerHTML =
        '<div class="mini-cart-actions">' +
          '<a class="btn" href="butikk.html" style="width:100%">Gå til nettbutikk</a>' +
        '</div>';
      return;
    }

    itemsEl.innerHTML = cart.map(function (item) {
      return '<div class="mini-cart-item">' +
        '<div class="mini-cart-item-info">' +
          '<div class="mini-cart-item-name">' + escapeHtml(item.name) + '</div>' +
          '<div class="mini-cart-item-meta">' + item.qty + ' &times; ' + fmt(item.price) + '</div>' +
        '</div>' +
        '<div class="mini-cart-item-right">' +
          '<div class="mini-cart-item-total">' + fmt(item.price * item.qty) + '</div>' +
          '<button class="mini-cart-item-remove" data-mc-remove="' + escapeHtml(item.sku) + '" aria-label="Fjern">&times;</button>' +
        '</div>' +
      '</div>';
    }).join("");

    footerEl.innerHTML =
      '<div class="mini-cart-total">' +
        '<span>Sum inkl. mva</span>' +
        '<strong>' + fmt(cartTotal(cart)) + '</strong>' +
      '</div>' +
      '<div class="mini-cart-actions">' +
        '<a class="btn secondary" href="handlekurv.html" style="flex:1">Se handlekurv</a>' +
        '<a class="btn success" href="kasse.html" style="flex:1">Gå til kassen</a>' +
      '</div>';

    itemsEl.querySelectorAll("[data-mc-remove]").forEach(function (b) {
      b.addEventListener("click", function () { removeItem(b.dataset.mcRemove); });
    });
  }

  /* ---- Init ---- */
  document.addEventListener("DOMContentLoaded", function () {
    injectCartButton();
    updateBadge();
  });

  /* ---- Public API ---- */
  window.TherwattCart = {
    load: cartLoad,
    save: cartSave,
    add: addToCart,
    addSimple: addToCartSimple,
    changeQty: changeQty,
    setQty: setQty,
    removeItem: removeItem,
    clearCart: clearCart,
    count: cartCount,
    total: cartTotal,
    updateBadge: updateBadge,
    renderMiniCart: renderMiniCart,
    showToast: showToast,
    fmt: fmt,
    escapeHtml: escapeHtml
  };
})();
