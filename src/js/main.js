// ═══════════════════════════════════════════════════════════
// Therwatt – Main Application
// ═══════════════════════════════════════════════════════════

import { route, resolve } from './router.js';
import { icons } from './icons.js';
import { showToast } from './cart.js';

const app = document.getElementById('app');

// ─── Escape HTML ─────────────────────────────────────────
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ─── Navigation ──────────────────────────────────────────
function renderNav(activePath) {
  return `
    <nav class="nav" id="main-nav">
      <div class="nav-inner">
        <a href="/" class="nav-logo" data-link>ther<span>watt</span></a>
        <ul class="nav-links" id="nav-links">
          <li><a href="/" data-link class="${activePath === '/' ? 'active' : ''}">Hjem</a></li>
          <li><a href="/kalkulator" data-link class="${activePath === '/kalkulator' ? 'active' : ''}">Kalkulator</a></li>
          <li><a href="/vannbaren-kalkulator" data-link class="${activePath === '/vannbaren-kalkulator' ? 'active' : ''}">Gulvvarme</a></li>
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
            <p>Varmepumper og vannbåren varme. Kvalitetsprodukter fra europeiske produsenter.</p>
          </div>
          <div class="footer-col">
            <h4>Sider</h4>
            <ul>
              <li><a href="/" data-link>Hjem</a></li>
              <li><a href="/kalkulator" data-link>Varmepumpekalkulator</a></li>
              <li><a href="/vannbaren-kalkulator" data-link>Gulvvarmekalkulator</a></li>
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
          &copy; ${new Date().getFullYear()} Therwatt. Alle rettigheter reservert.
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
      <section class="promo-film">
        <div class="promo-film-bg"></div>
        <div class="promo-film-particles">
          <div class="promo-particle"></div>
          <div class="promo-particle"></div>
          <div class="promo-particle"></div>
          <div class="promo-particle"></div>
          <div class="promo-particle"></div>
          <div class="promo-particle"></div>
        </div>
        <div class="promo-film-content">
          <div class="promo-film-overline">Spesialister innen oppvarming</div>
          <h1 class="promo-film-title">
            <span class="promo-line"><span>Eksperter på</span></span>
            <span class="promo-line"><span><span class="accent">varmepumper</span> og</span></span>
            <span class="promo-line"><span><span class="accent">vannbåren varme</span></span></span>
          </h1>
          <div class="promo-film-divider"></div>
          <p class="promo-film-desc">Therwatt leverer komplette varmeløsninger for boliger og næringsbygg i hele Norge. Vi er spesialister på luft-vann og væske-vann varmepumper, samt vannbåren gulvvarme med europeiske kvalitetsprodukter. Med vår dype fagkompetanse innen VVS og oppvarming hjelper vi deg med å finne den mest energieffektive løsningen – fra rådgivning og beregning til ferdig installert anlegg. Bruk vår kalkulator for å finne riktig varmepumpe for din bolig.</p>
          <div class="promo-film-stats">
            <div class="promo-stat">
              <div class="promo-stat-value">100%</div>
              <div class="promo-stat-label">Fagkompetanse</div>
            </div>
            <div class="promo-stat">
              <div class="promo-stat-value">EU</div>
              <div class="promo-stat-label">Kvalitetsprodukter</div>
            </div>
            <div class="promo-stat">
              <div class="promo-stat-value">Hele Norge</div>
              <div class="promo-stat-label">Leveranse</div>
            </div>
          </div>
          <div class="promo-film-cta">
            <a href="/kalkulator" class="btn btn-primary btn-lg" data-link>Beregn varmepumpe</a>
            <button class="btn btn-outline btn-lg" id="contact-btn">Kontakt oss</button>
          </div>
        </div>
      </section>

      <!-- Contact Modal -->
      <div class="contact-modal-overlay" id="contact-modal" style="display:none">
        <div class="contact-modal">
          <button class="contact-modal-close" id="contact-modal-close">&times;</button>
          <h2>Kontakt oss</h2>
          <p class="contact-modal-desc">Ta gjerne kontakt med oss for spørsmål om varmepumper og varmeløsninger.</p>

          <div class="contact-info-cards">
            <a href="mailto:post@therwatt.no" class="contact-info-card">
              <div class="contact-info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div class="contact-info-text">
                <span class="contact-info-label">E-post</span>
                <span class="contact-info-value">post@therwatt.no</span>
              </div>
            </a>
            <a href="tel:+4790280156" class="contact-info-card">
              <div class="contact-info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div class="contact-info-text">
                <span class="contact-info-label">Telefon</span>
                <span class="contact-info-value">902 80 156</span>
              </div>
            </a>
          </div>

          <div class="contact-form-divider"><span>eller send oss en melding</span></div>

          <form id="contact-form" name="kontakt" method="POST" data-netlify="true" netlify-honeypot="bot-field">
            <input type="hidden" name="form-name" value="kontakt">
            <p style="display:none"><input name="bot-field"></p>

            <div class="form-group">
              <label class="form-label" for="contact-navn">Navn</label>
              <input type="text" id="contact-navn" name="navn" class="form-input" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="contact-epost">E-post</label>
                <input type="email" id="contact-epost" name="epost" class="form-input" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="contact-telefon">Telefon</label>
                <input type="tel" id="contact-telefon" name="telefon" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="contact-melding">Melding</label>
              <textarea id="contact-melding" name="melding" class="form-textarea" rows="4" required></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)" id="contact-submit">Send melding</button>
          </form>

          <div id="contact-success" class="contact-success" style="display:none">
            <div class="success-icon">${icons.check}</div>
            <h3>Takk for din henvendelse!</h3>
            <p>Vi tar kontakt med deg så snart som mulig.</p>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
  setupNav();
  setupContactModal();
  window.scrollTo(0, 0);
}

// ─── Contact Modal ──────────────────────────────────────
function setupContactModal() {
  const btn = document.getElementById('contact-btn');
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('contact-modal-close');
  const form = document.getElementById('contact-form');
  const successEl = document.getElementById('contact-success');

  btn.addEventListener('click', () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('contact-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sender...';

    const formData = new FormData(form);
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });
    } catch {
      // Show success even if network fails
    }

    form.style.display = 'none';
    successEl.style.display = 'block';
  });
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
    const result = calculateHeatPump(areal, byggear);

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
          <div class="value">${result.savingsKwh.toLocaleString('nb-NO')} kWh/år</div>
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

function calculateHeatPump(areal, byggear) {
  // Energy factor based on build year (kWh/m²)
  const energyFactors = {
    'pre1960': 200,
    '1960-1980': 170,
    '1980-2000': 140,
    '2000-2010': 110,
    'post2010': 80
  };

  const energyNeed = areal * (energyFactors[byggear] || 140);
  // COP of heat pump (typical)
  const cop = 3.5;
  const heatPumpEnergy = energyNeed / cop;
  const savingsKwh = Math.round(energyNeed - heatPumpEnergy);

  // Required kW (peak load)
  const kw = Math.round((energyNeed / 2000) * 10) / 10;

  // Pump type recommendation
  let pumpType;
  if (areal < 80) pumpType = 'Luft-luft';
  else if (areal < 200) pumpType = 'Luft-vann';
  else pumpType = 'Væske-vann';

  return { kw: Math.max(3, Math.min(20, kw)), savingsKwh: Math.max(0, savingsKwh), type: pumpType };
}



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

// ─── Init ────────────────────────────────────────────────
function init() {
  resolve();
}

init();
