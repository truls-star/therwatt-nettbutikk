// ═══════════════════════════════════════════════════════════
// Therwatt – Main Application
// ═══════════════════════════════════════════════════════════

import { route, resolve, navigate } from './router.js';
import { loadProducts, getProducts, getCategories, getProductBySlug, formatPrice, searchProducts } from './store.js';
import { addToCart, getCartItems, getCartTotal, getCartCount, removeFromCart, updateQuantity, clearCart, showToast } from './cart.js';
import { icons } from './icons.js';

const app = document.getElementById('app');
const PRODUCTS_PER_PAGE = 24;

// ─── Escape HTML ─────────────────────────────────────────
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ─── Navigation ──────────────────────────────────────────
function renderNav(activePath) {
  const count = getCartCount();
  return `
    <nav class="nav" id="main-nav">
      <div class="nav-inner">
        <a href="/" class="nav-logo" data-link>ther<span>watt</span></a>
        <ul class="nav-links" id="nav-links">
          <li><a href="/" data-link class="${activePath === '/' ? 'active' : ''}">Hjem</a></li>
          <li><a href="/kalkulator" data-link class="${activePath === '/kalkulator' ? 'active' : ''}">Kalkulator</a></li>
          <li><a href="/butikk" data-link class="${activePath === '/butikk' ? 'active' : ''}">Butikk</a></li>
          <li>
            <a href="/handlekurv" data-link class="nav-cart ${activePath === '/handlekurv' ? 'active' : ''}">
              ${icons.cart}
              <span class="nav-cart-badge ${count > 0 ? 'visible' : ''}" id="cart-badge">${count}</span>
            </a>
          </li>
        </ul>
        <button class="nav-mobile-toggle" id="nav-toggle" aria-label="Meny">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;
}

function setupNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  // Scroll effect
  const nav = document.getElementById('main-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

// ─── Footer ──────────────────────────────────────────────
function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <h3>ther<span>watt</span></h3>
            <p>Varmepumper, vannbåren varme og profesjonelt VVS-verktøy. Kvalitetsprodukter fra europeiske produsenter.</p>
          </div>
          <div class="footer-col">
            <h4>Sider</h4>
            <ul>
              <li><a href="/" data-link>Hjem</a></li>
              <li><a href="/kalkulator" data-link>Varmepumpekalkulator</a></li>
              <li><a href="/vannbaren-kalkulator" data-link>Gulvvarmekalkulator</a></li>
              <li><a href="/butikk" data-link>Nettbutikk</a></li>
              <li><a href="/handlekurv" data-link>Handlekurv</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Kontakt</h4>
            <ul>
              <li>Ta kontakt for mer informasjon</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} Therwatt. Alle priser er inkl. 25% mva.
        </div>
      </div>
    </footer>
  `;
}

// ─── Home Page ───────────────────────────────────────────
function renderHome() {
  app.innerHTML = `
    ${renderNav('/')}
    <main class="main">
      <section class="hero">
        <div class="hero-grid"></div>
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">${icons.tool} Varmepumper, gulvvarme og VVS-verktøy</div>
            <h1>Komplett leverandør innen <span class="accent">varme og VVS</span></h1>
            <p>Vi leverer varmepumper, vannbåren varme og profesjonelt verktøy til fagfolk i hele Norge. Kvalitetsprodukter fra europeiske produsenter med lang erfaring.</p>
          </div>
        </div>
      </section>

      <section class="showcase section">
        <div class="container">
          <div class="section-header">
            <h2>Våre fagområder</h2>
            <p>Vi dekker hele verdikjeden innen oppvarming og VVS-installasjon</p>
          </div>
          <div class="showcase-grid stagger">
            <div class="showcase-card fade-in-up">
              <div class="showcase-image">
                <img src="/images/varmepumpe.jpg" alt="Varmepumpe for bolig og næring" loading="lazy">
              </div>
              <h3>Varmepumper</h3>
              <p>Luft-vann og væske-vann varmepumper for effektiv oppvarming av boliger og næringsbygg.</p>
              <a href="/kalkulator" class="btn btn-primary btn-sm showcase-btn" data-link>Beregn varmepumpe</a>
            </div>
            <div class="showcase-card fade-in-up">
              <div class="showcase-image">
                <img src="/images/gulvvarme.png" alt="Vannbåren gulvvarme med rør og isolasjon" loading="lazy">
              </div>
              <h3>Vannbåren varme</h3>
              <p>Komplette gulvvarmesystemer med isolasjon, rør og styring for jevn og behagelig varme.</p>
              <a href="/vannbaren-kalkulator" class="btn btn-outline btn-sm showcase-btn" data-link>Beregn gulvvarme</a>
            </div>
            <div class="showcase-card fade-in-up">
              <div class="showcase-image">
                <img src="/images/verktoy.jpg" alt="Profesjonelt rørbøyeverktøy" loading="lazy">
              </div>
              <h3>Verktøy og installasjon</h3>
              <p>Profesjonelt verktøy for rørlegging, pressing og vedlikehold av VVS-anlegg.</p>
              <a href="/butikk" class="btn btn-primary btn-sm showcase-btn" data-link>Se produkter</a>
            </div>
          </div>
        </div>
      </section>

      <section class="features section">
        <div class="container">
          <div class="section-header">
            <h2>Hvorfor velge oss</h2>
            <p>Kvalitetsprodukter fra anerkjente europeiske produsenter</p>
          </div>
          <div class="features-grid stagger">
            <div class="feature-card fade-in-up">
              <div class="feature-icon">${icons.calculator}</div>
              <h3>Varmepumpekalkulator</h3>
              <p>Beregn riktig varmepumpe basert på boligens areal, byggeår og oppvarmingstype. Få et skreddersydd estimat.</p>
            </div>
            <div class="feature-card fade-in-up">
              <div class="feature-icon">${icons.store}</div>
              <h3>Nettbutikk</h3>
              <p>Bredt utvalg av profesjonelt verktøy for rørlegging, HVAC og VVS. Alle priser er inkl. mva.</p>
            </div>
            <div class="feature-card fade-in-up">
              <div class="feature-icon">${icons.package}</div>
              <h3>Europeisk kvalitet</h3>
              <p>Vi fører produkter fra anerkjente europeiske produsenter med lang erfaring innen VVS og oppvarming.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  window.scrollTo(0, 0);
}

// ─── Calculator Page ─────────────────────────────────────
function renderCalculator() {
  app.innerHTML = `
    ${renderNav('/kalkulator')}
    <main class="main">
      <div class="calculator-page">
        <div class="container">
          <div class="calculator-hero">
            <h1>Varmepumpekalkulator</h1>
            <p>Fyll inn opplysninger om boligen din for å få en beregning av anbefalt varmepumpe.</p>
          </div>

          <div class="calculator-card">
            <div class="calculator-progress">
              <div class="calculator-progress-step active" id="prog-1"></div>
              <div class="calculator-progress-step" id="prog-2"></div>
              <div class="calculator-progress-step" id="prog-3"></div>
            </div>

            <div id="calc-step-1" class="calculator-step">
              <h2>Boliginformasjon</h2>
              <p>Oppgi grunnleggende informasjon om boligen.</p>

              <div class="form-group">
                <label class="form-label" for="calc-areal">Boligareal (m²)</label>
                <input type="number" id="calc-areal" class="form-input" min="20" max="500" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="calc-byggear">Byggeår</label>
                  <select id="calc-byggear" class="form-select" required>
                    <option value="">Velg byggeår</option>
                    <option value="pre1960">Før 1960</option>
                    <option value="1960-1980">1960–1980</option>
                    <option value="1980-2000">1980–2000</option>
                    <option value="2000-2010">2000–2010</option>
                    <option value="post2010">Etter 2010</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="calc-type">Oppvarmingstype</label>
                  <select id="calc-type" class="form-select" required>
                    <option value="">Velg type</option>
                    <option value="electric">Elektrisk</option>
                    <option value="oil">Olje</option>
                    <option value="district">Fjernvarme</option>
                    <option value="wood">Ved/pellets</option>
                    <option value="gas">Gass</option>
                  </select>
                </div>
              </div>

              <button class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)" id="calc-next-1">Neste steg</button>
            </div>

            <div id="calc-step-2" class="calculator-step" style="display:none">
              <h2>Kontaktinformasjon</h2>
              <p>Vi trenger kontaktinformasjonen din for å sende deg beregningen.</p>

              <form id="calc-form" name="leads" method="POST" data-netlify="true" netlify-honeypot="bot-field">
                <input type="hidden" name="form-name" value="leads">
                <p style="display:none"><input name="bot-field"></p>
                <input type="hidden" name="boligareal" id="form-areal">
                <input type="hidden" name="byggear" id="form-byggear">
                <input type="hidden" name="oppvarmingstype" id="form-type">

                <div class="form-group">
                  <label class="form-label" for="calc-navn">Navn</label>
                  <input type="text" id="calc-navn" name="navn" class="form-input" required>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="calc-epost">E-post</label>
                    <input type="email" id="calc-epost" name="epost" class="form-input" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="calc-telefon">Telefon</label>
                    <input type="tel" id="calc-telefon" name="telefon" class="form-input" required>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="calc-melding">Eventuell melding</label>
                  <textarea id="calc-melding" name="melding" class="form-textarea" rows="3"></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)">Send og se resultat</button>
              </form>
            </div>

            <div id="calc-step-3" class="calculator-step" style="display:none">
              <div class="success-state" style="padding:0">
                <div class="success-icon">${icons.check}</div>
                <h2>Takk for din henvendelse!</h2>
                <p>Vi har mottatt informasjonen din og tar kontakt med deg.</p>
              </div>

              <div class="calc-results" id="calc-results"></div>

              <div style="text-align:center;margin-top:var(--space-6)">
                <a href="/butikk" class="btn btn-primary btn-lg" data-link>Se våre produkter</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  window.scrollTo(0, 0);
  setupCalculator();
}

function setupCalculator() {
  const nextBtn = document.getElementById('calc-next-1');
  const form = document.getElementById('calc-form');

  nextBtn.addEventListener('click', () => {
    const areal = document.getElementById('calc-areal').value;
    const byggear = document.getElementById('calc-byggear').value;
    const type = document.getElementById('calc-type').value;

    if (!areal || !byggear || !type) {
      showToast('Vennligst fyll inn alle felt');
      return;
    }

    // Store values in hidden fields
    document.getElementById('form-areal').value = areal;
    document.getElementById('form-byggear').value = byggear;
    document.getElementById('form-type').value = type;

    document.getElementById('calc-step-1').style.display = 'none';
    document.getElementById('calc-step-2').style.display = 'block';
    document.getElementById('prog-2').classList.add('active');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const areal = parseFloat(document.getElementById('form-areal').value);
    const byggear = document.getElementById('form-byggear').value;
    const type = document.getElementById('form-type').value;

    // Submit to Netlify
    const formData = new FormData(form);
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
    } catch {
      // Continue showing results even if submission fails
    }

    // Calculate results
    const result = calculateHeatPump(areal, byggear, type);

    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('calc-step-3').style.display = 'block';
    document.getElementById('prog-3').classList.add('active');

    document.getElementById('calc-results').innerHTML = `
      <h3>Din beregning</h3>
      <div class="calc-result-grid">
        <div class="calc-result-item">
          <div class="label">Anbefalt effekt</div>
          <div class="value">${result.kw} kW</div>
        </div>
        <div class="calc-result-item">
          <div class="label">Estimert besparelse</div>
          <div class="value">${formatPrice(result.savings)}/år</div>
        </div>
        <div class="calc-result-item">
          <div class="label">Boligareal</div>
          <div class="value">${areal} m²</div>
        </div>
        <div class="calc-result-item">
          <div class="label">Pumpe-type</div>
          <div class="value">${result.type}</div>
        </div>
      </div>
    `;
  });
}

function calculateHeatPump(areal, byggear, heatingType) {
  // Energy factor based on build year (kWh/m²)
  const energyFactors = {
    'pre1960': 200,
    '1960-1980': 170,
    '1980-2000': 140,
    '2000-2010': 110,
    'post2010': 80
  };

  // Cost per kWh for different heating types (NOK)
  const costFactors = {
    'electric': 1.5,
    'oil': 1.2,
    'district': 0.9,
    'wood': 0.7,
    'gas': 1.1
  };

  const energyNeed = areal * (energyFactors[byggear] || 140);
  const currentCost = energyNeed * (costFactors[heatingType] || 1.2);

  // COP of heat pump (typical)
  const cop = 3.5;
  const heatPumpCost = (energyNeed / cop) * 1.5;
  const savings = Math.round(currentCost - heatPumpCost);

  // Required kW (peak load)
  const kw = Math.round((energyNeed / 2000) * 10) / 10;

  // Pump type recommendation
  let pumpType;
  if (areal < 80) pumpType = 'Luft-luft';
  else if (areal < 200) pumpType = 'Luft-vann';
  else pumpType = 'Væske-vann';

  return { kw: Math.max(3, Math.min(20, kw)), savings: Math.max(0, savings), type: pumpType };
}

// ─── Shop Page ───────────────────────────────────────────
let shopState = {
  category: '',
  search: '',
  sort: 'name',
  page: 1
};

function renderShop() {
  const products = getProducts();
  const categories = getCategories();

  app.innerHTML = `
    ${renderNav('/butikk')}
    <main class="main">
      <div class="section">
        <div class="container">
          <div class="section-header" style="margin-bottom:var(--space-8)">
            <h2>Nettbutikk</h2>
            <p>Profesjonelt verktøy for VVS, rørlegging og HVAC</p>
          </div>

          <div class="shop-overlay" id="shop-overlay"></div>

          <div class="shop-layout">
            <aside class="shop-sidebar" id="shop-sidebar">
              <div class="search-box">
                ${icons.search}
                <input type="text" id="shop-search" placeholder="Søk etter produkter..." value="${esc(shopState.search)}">
              </div>

              <h3>Kategorier</h3>
              <ul class="category-list" id="category-list">
                <li class="category-item ${!shopState.category ? 'active' : ''}" data-cat="">
                  Alle produkter
                  <span class="category-count">${products.length}</span>
                </li>
                ${categories.map(cat => {
                  const count = products.filter(p => p.category === cat).length;
                  return `
                    <li class="category-item ${shopState.category === cat ? 'active' : ''}" data-cat="${esc(cat)}">
                      ${esc(cat)}
                      <span class="category-count">${count}</span>
                    </li>
                  `;
                }).join('')}
              </ul>
            </aside>

            <div class="shop-main">
              <div class="shop-header">
                <div style="display:flex;align-items:center;gap:var(--space-3)">
                  <button class="btn btn-outline-dark btn-sm mobile-filter-btn" id="mobile-filter-btn">
                    ${icons.filter} Filter
                  </button>
                  <span class="shop-count" id="shop-count"></span>
                </div>
                <select class="sort-dropdown" id="shop-sort">
                  <option value="name" ${shopState.sort === 'name' ? 'selected' : ''}>Navn A–Å</option>
                  <option value="price-asc" ${shopState.sort === 'price-asc' ? 'selected' : ''}>Pris lav–høy</option>
                  <option value="price-desc" ${shopState.sort === 'price-desc' ? 'selected' : ''}>Pris høy–lav</option>
                  <option value="sku" ${shopState.sort === 'sku' ? 'selected' : ''}>Artikkelnummer</option>
                </select>
              </div>

              <div class="products-grid stagger" id="products-grid"></div>
              <div class="pagination" id="pagination"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  window.scrollTo(0, 0);
  setupShop();
  updateProductGrid();
}

function setupShop() {
  // Search
  const searchInput = document.getElementById('shop-search');
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      shopState.search = searchInput.value;
      shopState.page = 1;
      updateProductGrid();
    }, 250);
  });

  // Category
  document.getElementById('category-list').addEventListener('click', (e) => {
    const item = e.target.closest('.category-item');
    if (item) {
      shopState.category = item.dataset.cat;
      shopState.page = 1;
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      updateProductGrid();

      // Close mobile sidebar
      document.getElementById('shop-sidebar').classList.remove('open');
      document.getElementById('shop-overlay').classList.remove('visible');
    }
  });

  // Sort
  document.getElementById('shop-sort').addEventListener('change', (e) => {
    shopState.sort = e.target.value;
    shopState.page = 1;
    updateProductGrid();
  });

  // Mobile filter
  const mobileBtn = document.getElementById('mobile-filter-btn');
  const sidebar = document.getElementById('shop-sidebar');
  const overlay = document.getElementById('shop-overlay');

  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
}

function getFilteredProducts() {
  let products = getProducts();

  // Filter by category
  if (shopState.category) {
    products = products.filter(p => p.category === shopState.category);
  }

  // Search
  if (shopState.search) {
    const q = shopState.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (shopState.sort) {
    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name, 'nb'));
      break;
    case 'price-asc':
      products.sort((a, b) => (a.price_nok || Infinity) - (b.price_nok || Infinity));
      break;
    case 'price-desc':
      products.sort((a, b) => (b.price_nok || 0) - (a.price_nok || 0));
      break;
    case 'sku':
      products.sort((a, b) => a.sku.localeCompare(b.sku));
      break;
  }

  return products;
}

function updateProductGrid() {
  const products = getFilteredProducts();
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  shopState.page = Math.min(shopState.page, Math.max(1, totalPages));
  const start = (shopState.page - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = products.slice(start, start + PRODUCTS_PER_PAGE);

  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('shop-count');
  const pagEl = document.getElementById('pagination');

  countEl.textContent = `${products.length} produkter`;

  if (pageProducts.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <h3>Ingen produkter funnet</h3>
        <p>Prøv å endre søket eller filteret.</p>
      </div>
    `;
    pagEl.innerHTML = '';
    return;
  }

  grid.innerHTML = pageProducts.map(p => `
    <div class="product-card fade-in-up">
      <div class="product-card-body">
        <div class="product-card-category">${esc(p.category)}</div>
        <div class="product-card-name">
          <a href="/produkt/${esc(p.slug)}" data-link>${esc(p.name)}</a>
        </div>
        <div class="product-card-sku">Art.nr: ${esc(p.sku)}</div>
        <div class="product-card-footer">
          ${p.price_nok
            ? `<span class="product-price">${formatPrice(p.price_nok)}</span>`
            : `<span class="product-price-contact">Ta kontakt</span>`
          }
          ${p.price_nok
            ? `<button class="btn-add" data-sku="${esc(p.sku)}">${icons.plus} Legg i kurv</button>`
            : ''
          }
        </div>
      </div>
    </div>
  `).join('');

  // Add to cart handlers
  grid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sku = btn.dataset.sku;
      const product = getProducts().find(p => p.sku === sku);
      if (product) {
        addToCart(product);
        updateCartBadge();
      }
    });
  });

  // Pagination
  if (totalPages > 1) {
    let pagHTML = '';
    pagHTML += `<button ${shopState.page <= 1 ? 'disabled' : ''} data-page="${shopState.page - 1}">${icons.chevronLeft}</button>`;

    const maxButtons = 7;
    let startPage = Math.max(1, shopState.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pagHTML += `<button class="${i === shopState.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    pagHTML += `<button ${shopState.page >= totalPages ? 'disabled' : ''} data-page="${shopState.page + 1}">${icons.chevronRight}</button>`;
    pagEl.innerHTML = pagHTML;

    pagEl.querySelectorAll('button:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        shopState.page = parseInt(btn.dataset.page);
        updateProductGrid();
        window.scrollTo({ top: 200, behavior: 'smooth' });
      });
    });
  } else {
    pagEl.innerHTML = '';
  }
}

// ─── Product Detail Page ─────────────────────────────────
function renderProduct(params) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    app.innerHTML = `
      ${renderNav('')}
      <main class="main">
        <div class="container" style="padding:6rem 1.5rem;text-align:center">
          <h1 style="font-size:2rem;margin-bottom:1rem">Produktet ble ikke funnet</h1>
          <p style="color:#6b7280;margin-bottom:2rem">Beklager, men dette produktet finnes ikke.</p>
          <a href="/butikk" class="btn btn-primary btn-lg" data-link>Tilbake til butikken</a>
        </div>
      </main>
    `;
    setupNav();
    return;
  }

  let detailQuantity = 1;

  app.innerHTML = `
    ${renderNav('')}
    <main class="main">
      <div class="product-detail">
        <div class="container">
          <div class="product-breadcrumb">
            <a href="/" data-link>Hjem</a> ${icons.chevronRight}
            <a href="/butikk" data-link>Butikk</a> ${icons.chevronRight}
            <span>${esc(product.name)}</span>
          </div>

          <div class="product-detail-grid">
            <div class="product-detail-image">
              ${icons.package}
            </div>

            <div class="product-detail-info">
              <div class="product-detail-supplier">${esc(product.supplier)}</div>
              <h1>${esc(product.name)}</h1>
              <div class="product-detail-sku">Art.nr: ${esc(product.sku)}</div>

              ${product.price_nok ? `
                <div class="product-detail-price">${formatPrice(product.price_nok)}</div>
                <div class="product-detail-price-sub">Inkl. 25% mva</div>
              ` : `
                <div class="product-detail-price" style="font-size:var(--font-size-xl);color:var(--color-text-secondary)">Ta kontakt for pris</div>
                <div class="product-detail-price-sub">&nbsp;</div>
              `}

              ${product.price_nok ? `
                <div class="product-detail-actions">
                  <div class="product-detail-quantity">
                    <button id="qty-minus">${icons.minus}</button>
                    <span id="qty-value">${detailQuantity}</span>
                    <button id="qty-plus">${icons.plus}</button>
                  </div>
                  <button class="btn-add-lg" id="detail-add-cart">Legg i handlekurv</button>
                </div>
              ` : ''}

              <div class="product-specs">
                <div class="product-specs-header">Produktinformasjon</div>
                <div class="product-specs-row">
                  <span class="product-specs-label">Artikkelnummer</span>
                  <span class="product-specs-value">${esc(product.sku)}</span>
                </div>
                <div class="product-specs-row">
                  <span class="product-specs-label">Kategori</span>
                  <span class="product-specs-value">${esc(product.category)}</span>
                </div>
                <div class="product-specs-row">
                  <span class="product-specs-label">Leverandør</span>
                  <span class="product-specs-value">${esc(product.supplier)}</span>
                </div>
                ${product.package ? `
                  <div class="product-specs-row">
                    <span class="product-specs-label">Forpakning</span>
                    <span class="product-specs-value">${esc(product.package)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  window.scrollTo(0, 0);

  // Quantity and add to cart
  if (product.price_nok) {
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyVal = document.getElementById('qty-value');
    const addBtn = document.getElementById('detail-add-cart');

    qtyMinus.addEventListener('click', () => {
      detailQuantity = Math.max(1, detailQuantity - 1);
      qtyVal.textContent = detailQuantity;
    });

    qtyPlus.addEventListener('click', () => {
      detailQuantity++;
      qtyVal.textContent = detailQuantity;
    });

    addBtn.addEventListener('click', () => {
      addToCart(product, detailQuantity);
      updateCartBadge();
    });
  }
}

// ─── Cart Page ───────────────────────────────────────────
function renderCart() {
  const items = getCartItems();

  app.innerHTML = `
    ${renderNav('/handlekurv')}
    <main class="main">
      <div class="cart-page">
        <div class="container">
          <h1>Handlekurv</h1>

          ${items.length === 0 ? `
            <div class="cart-empty fade-in">
              <div class="cart-empty-icon">${icons.cart}</div>
              <h2>Handlekurven er tom</h2>
              <p>Du har ikke lagt til noen produkter ennå.</p>
              <a href="/butikk" class="btn btn-primary btn-lg" data-link>Gå til butikken</a>
            </div>
          ` : `
            <div class="cart-layout">
              <div>
                <div class="cart-items" id="cart-items">
                  ${renderCartItems(items)}
                </div>

                <div class="checkout-section" id="checkout-section">
                  <h2>Leveringsinformasjon</h2>
                  <form id="checkout-form" name="bestillinger" method="POST" data-netlify="true" netlify-honeypot="bot-field">
                    <input type="hidden" name="form-name" value="bestillinger">
                    <p style="display:none"><input name="bot-field"></p>
                    <input type="hidden" name="produkter" id="order-products">
                    <input type="hidden" name="totalsum" id="order-total">

                    <div class="form-group">
                      <label class="form-label" for="checkout-navn">Navn *</label>
                      <input type="text" id="checkout-navn" name="navn" class="form-input" required>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label" for="checkout-epost">E-post *</label>
                        <input type="email" id="checkout-epost" name="epost" class="form-input" required>
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="checkout-telefon">Telefon *</label>
                        <input type="tel" id="checkout-telefon" name="telefon" class="form-input" required>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="checkout-adresse">Adresse *</label>
                      <input type="text" id="checkout-adresse" name="adresse" class="form-input" required>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label" for="checkout-postnummer">Postnummer *</label>
                        <input type="text" id="checkout-postnummer" name="postnummer" class="form-input" required>
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="checkout-poststed">Poststed *</label>
                        <input type="text" id="checkout-poststed" name="poststed" class="form-input" required>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="checkout-melding">Melding</label>
                      <textarea id="checkout-melding" name="melding" class="form-textarea" rows="3"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)">Send bestilling</button>
                  </form>
                </div>

                <div id="checkout-success" style="display:none">
                  <div class="checkout-section">
                    <div class="success-state">
                      <div class="success-icon">${icons.check}</div>
                      <h2>Bestillingen er sendt!</h2>
                      <p>Vi har mottatt bestillingen din og tar kontakt angående betaling og levering.</p>
                      <a href="/butikk" class="btn btn-primary btn-lg" data-link>Fortsett å handle</a>
                    </div>
                  </div>
                </div>
              </div>

              <div class="cart-summary" id="cart-summary">
                ${renderCartSummary(items)}
              </div>
            </div>
          `}
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  window.scrollTo(0, 0);

  if (items.length > 0) {
    setupCartHandlers();
    setupCheckout();
  }
}

function renderCartItems(items) {
  return items.map(item => `
    <div class="cart-item" data-sku="${esc(item.sku)}">
      <div class="cart-item-image">${icons.package}</div>
      <div class="cart-item-info">
        <h3><a href="/produkt/${esc(item.slug)}" data-link>${esc(item.name)}</a></h3>
        <p>Art.nr: ${esc(item.sku)} &middot; ${esc(item.supplier)}</p>
      </div>
      <div class="cart-item-quantity">
        <button class="cart-qty-minus" data-sku="${esc(item.sku)}">${icons.minus}</button>
        <span>${item.quantity}</span>
        <button class="cart-qty-plus" data-sku="${esc(item.sku)}">${icons.plus}</button>
      </div>
      <div class="cart-item-price">${item.price_nok ? formatPrice(item.price_nok * item.quantity) : 'Ta kontakt'}</div>
      <button class="cart-item-remove" data-sku="${esc(item.sku)}" title="Fjern">${icons.trash}</button>
    </div>
  `).join('');
}

function renderCartSummary(items) {
  const total = items.reduce((s, i) => s + (i.price_nok || 0) * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return `
    <h2>Oppsummering</h2>
    <div class="cart-summary-row">
      <span>Antall produkter</span>
      <span>${count}</span>
    </div>
    <div class="cart-summary-row">
      <span>Inkl. mva (25%)</span>
      <span>${formatPrice(total)}</span>
    </div>
    <div class="cart-summary-row total">
      <span>Totalsum</span>
      <span>${formatPrice(total)}</span>
    </div>
  `;
}

function setupCartHandlers() {
  const cartEl = document.getElementById('cart-items');
  if (!cartEl) return;

  cartEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const sku = btn.dataset.sku;
    if (!sku) return;

    if (btn.classList.contains('cart-qty-minus')) {
      const items = getCartItems();
      const item = items.find(i => i.sku === sku);
      if (item && item.quantity > 1) {
        updateQuantity(sku, item.quantity - 1);
      } else {
        removeFromCart(sku);
      }
    } else if (btn.classList.contains('cart-qty-plus')) {
      const items = getCartItems();
      const item = items.find(i => i.sku === sku);
      if (item) updateQuantity(sku, item.quantity + 1);
    } else if (btn.classList.contains('cart-item-remove')) {
      removeFromCart(sku);
    }

    // Re-render cart items and summary
    const items = getCartItems();
    if (items.length === 0) {
      renderCart();
      return;
    }
    cartEl.innerHTML = renderCartItems(items);
    document.getElementById('cart-summary').innerHTML = renderCartSummary(items);
    updateCartBadge();
  });
}

function setupCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const items = getCartItems();
    const total = getCartTotal();

    // Prepare order data
    const productList = items.map(i =>
      `${i.name} (${i.sku}) x${i.quantity} = ${i.price_nok ? formatPrice(i.price_nok * i.quantity) : 'Ta kontakt'}`
    ).join('\n');

    document.getElementById('order-products').value = productList;
    document.getElementById('order-total').value = formatPrice(total);

    const formData = new FormData(form);

    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
    } catch {
      // Continue even if submission fails
    }

    // Show success
    document.getElementById('checkout-section').style.display = 'none';
    document.getElementById('cart-items').style.display = 'none';
    document.getElementById('cart-summary').style.display = 'none';
    document.getElementById('checkout-success').style.display = 'block';

    clearCart();
    updateCartBadge();
  });
}

// ─── Cart Badge Update ───────────────────────────────────
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }
}

window.addEventListener('cart-updated', updateCartBadge);

// ─── Waterborne Heating Calculator ──────────────────────
let wbRooms = [{ name: 'Rom 1', sqm: '' }];

function renderWaterborneCalculator() {
  app.innerHTML = `
    ${renderNav('/vannbaren-kalkulator')}
    <main class="main">
      <div class="calculator-page">
        <div class="container">
          <div class="calculator-hero">
            <h1>Kalkulator for vannbåren varme</h1>
            <p>Beregn rørmeter, antall kurser og materialforbruk basert på underlag og romstørrelser.</p>
          </div>

          <div class="wb-calc-card">
            <div class="wb-calc-section">
              <h2>Velg type underlag</h2>
              <p>Underlaget bestemmer masseuttak og oppbygging.</p>
              <div class="wb-substrate-options" id="wb-substrate-options">
                <label class="wb-substrate-option active" data-substrate="stoop">
                  <input type="radio" name="wb-substrate" value="stoop" checked>
                  <div class="wb-substrate-content">
                    <strong>Støp</strong>
                    <span>Betongstøp ~65 mm</span>
                    <span class="wb-substrate-mass">~150 kg/m²</span>
                  </div>
                </label>
                <label class="wb-substrate-option" data-substrate="avretting">
                  <input type="radio" name="wb-substrate" value="avretting">
                  <div class="wb-substrate-content">
                    <strong>Avretting</strong>
                    <span>Avrettingsmasse ~50 mm</span>
                    <span class="wb-substrate-mass">~85 kg/m²</span>
                  </div>
                </label>
                <label class="wb-substrate-option" data-substrate="sporplater">
                  <input type="radio" name="wb-substrate" value="sporplater">
                  <div class="wb-substrate-content">
                    <strong>Sporplater</strong>
                    <span>EPS-plater med spor</span>
                    <span class="wb-substrate-mass">~1,4 plater/m²</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="wb-calc-section">
              <h2>Rominformasjon</h2>
              <p>Legg inn rom med areal. Hvert rom beregnes separat for antall kurser.</p>
              <div class="wb-rooms" id="wb-rooms">
                ${wbRooms.map((room, i) => renderWbRoomRow(room, i)).join('')}
              </div>
              <button class="btn btn-outline-dark btn-sm" id="wb-add-room" style="margin-top:var(--space-4)">
                ${icons.plus} Legg til rom
              </button>
            </div>

            <div class="wb-calc-section">
              <button class="btn btn-primary btn-lg" style="width:100%" id="wb-calculate">Beregn</button>
            </div>

            <div id="wb-results" style="display:none"></div>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  window.scrollTo(0, 0);
  setupWaterborneCalculator();
}

function renderWbRoomRow(room, index) {
  return `
    <div class="wb-room-row" data-index="${index}">
      <div class="form-group" style="flex:1;margin-bottom:0">
        <label class="form-label">Romnavn</label>
        <input type="text" class="form-input wb-room-name" value="${esc(room.name)}" placeholder="F.eks. Stue">
      </div>
      <div class="form-group" style="width:120px;margin-bottom:0">
        <label class="form-label">m²</label>
        <input type="number" class="form-input wb-room-sqm" value="${room.sqm}" min="1" max="200" placeholder="m²">
      </div>
      ${wbRooms.length > 1 ? `<button class="wb-room-remove" data-index="${index}" title="Fjern rom">${icons.trash}</button>` : ''}
    </div>
  `;
}

function setupWaterborneCalculator() {
  const substrateOptions = document.getElementById('wb-substrate-options');
  const roomsEl = document.getElementById('wb-rooms');
  const addRoomBtn = document.getElementById('wb-add-room');
  const calcBtn = document.getElementById('wb-calculate');

  substrateOptions.addEventListener('change', (e) => {
    if (e.target.name === 'wb-substrate') {
      substrateOptions.querySelectorAll('.wb-substrate-option').forEach(opt => opt.classList.remove('active'));
      e.target.closest('.wb-substrate-option').classList.add('active');
    }
  });

  function syncRoomsFromDom() {
    const rows = roomsEl.querySelectorAll('.wb-room-row');
    wbRooms = Array.from(rows).map(row => ({
      name: row.querySelector('.wb-room-name').value || 'Rom',
      sqm: row.querySelector('.wb-room-sqm').value
    }));
  }

  addRoomBtn.addEventListener('click', () => {
    syncRoomsFromDom();
    wbRooms.push({ name: `Rom ${wbRooms.length + 1}`, sqm: '' });
    roomsEl.innerHTML = wbRooms.map((room, i) => renderWbRoomRow(room, i)).join('');
  });

  roomsEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.wb-room-remove');
    if (removeBtn) {
      syncRoomsFromDom();
      const idx = parseInt(removeBtn.dataset.index);
      wbRooms.splice(idx, 1);
      roomsEl.innerHTML = wbRooms.map((room, i) => renderWbRoomRow(room, i)).join('');
    }
  });

  calcBtn.addEventListener('click', () => {
    syncRoomsFromDom();
    const substrate = document.querySelector('input[name="wb-substrate"]:checked').value;

    const validRooms = wbRooms.filter(r => r.sqm && parseFloat(r.sqm) > 0);
    if (validRooms.length === 0) {
      showToast('Legg inn minst ett rom med areal');
      return;
    }

    const PIPE_PER_SQM = 5.5;
    const MAX_PIPE_PER_CIRCUIT = 100;

    let totalSqm = 0;
    let totalPipe = 0;
    let totalCircuits = 0;
    const roomResults = [];

    for (const room of validRooms) {
      const sqm = parseFloat(room.sqm);
      const pipe = sqm * PIPE_PER_SQM;
      const circuits = Math.ceil(pipe / MAX_PIPE_PER_CIRCUIT);
      const pipePerCircuit = Math.round((pipe / circuits) * 10) / 10;

      totalSqm += sqm;
      totalPipe += pipe;
      totalCircuits += circuits;

      roomResults.push({
        name: room.name,
        sqm,
        pipe: Math.round(pipe * 10) / 10,
        circuits,
        pipePerCircuit
      });
    }

    let massHTML = '';
    if (substrate === 'stoop') {
      const mass = Math.round(totalSqm * 150);
      massHTML = `
        <div class="wb-result-item">
          <div class="label">Betongstøp (~65 mm)</div>
          <div class="value">${mass.toLocaleString('nb-NO')} kg</div>
        </div>
      `;
    } else if (substrate === 'avretting') {
      const mass = Math.round(totalSqm * 85);
      massHTML = `
        <div class="wb-result-item">
          <div class="label">Avrettingsmasse (~50 mm)</div>
          <div class="value">${mass.toLocaleString('nb-NO')} kg</div>
        </div>
      `;
    } else {
      const plates = Math.ceil(totalSqm * 1.4);
      const heatPlates = Math.ceil(totalSqm * 4);
      massHTML = `
        <div class="wb-result-item">
          <div class="label">EPS sporplater</div>
          <div class="value">${plates} stk</div>
        </div>
        <div class="wb-result-item">
          <div class="label">Varmefordelingsplater</div>
          <div class="value">${heatPlates} stk</div>
        </div>
      `;
    }

    const resultsEl = document.getElementById('wb-results');
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = `
      <div class="wb-calc-section">
        <h2>Resultat</h2>

        <div class="wb-room-results">
          <table class="wb-table">
            <thead>
              <tr>
                <th>Rom</th>
                <th>m²</th>
                <th>Rørmeter</th>
                <th>Kurser</th>
                <th>m/kurs</th>
              </tr>
            </thead>
            <tbody>
              ${roomResults.map(r => `
                <tr>
                  <td>${esc(r.name)}</td>
                  <td>${r.sqm}</td>
                  <td>${r.pipe} m</td>
                  <td>${r.circuits}</td>
                  <td>${r.pipePerCircuit} m</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="wb-summary">
          <h3>Oppsummering</h3>
          <div class="wb-result-grid">
            <div class="wb-result-item">
              <div class="label">Antall rom</div>
              <div class="value">${validRooms.length}</div>
            </div>
            <div class="wb-result-item">
              <div class="label">Totalt areal</div>
              <div class="value">${totalSqm} m²</div>
            </div>
            <div class="wb-result-item">
              <div class="label">Totalt rørmeter</div>
              <div class="value">${Math.round(totalPipe * 10) / 10} m</div>
            </div>
            <div class="wb-result-item">
              <div class="label">Antall kurser totalt</div>
              <div class="value">${totalCircuits}</div>
            </div>
            <div class="wb-result-item">
              <div class="label">Utganger på fordeler</div>
              <div class="value">${totalCircuits} stk</div>
            </div>
            ${massHTML}
          </div>
        </div>

        <div class="wb-info-box">
          <strong>Beregningsgrunnlag:</strong> 5,5 meter rør per m², maks 100 meter per kurs. Rom som krever mer enn 100 m rør deles opp i like kurser. Hver kurs tilsvarer én utgang på fordeleren.
        </div>
      </div>
    `;

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ─── Routes ──────────────────────────────────────────────
route('/', () => { renderHome(); });
route('/kalkulator', () => { renderCalculator(); });
route('/vannbaren-kalkulator', () => { renderWaterborneCalculator(); });
route('/butikk', () => { renderShop(); });
route('/produkt/:slug', ({ params }) => { renderProduct(params); });
route('/handlekurv', () => { renderCart(); });

// ─── Init ────────────────────────────────────────────────
async function init() {
  app.innerHTML = '<div class="loading-spinner" style="min-height:100vh"></div>';
  await loadProducts();
  resolve();
}

init();
