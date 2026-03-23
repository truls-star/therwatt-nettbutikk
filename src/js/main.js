// ═══════════════════════════════════════════════════════════
// Therwatt – Main Application
// ═══════════════════════════════════════════════════════════

import { route, resolve } from './router.js';
import { icons } from './icons.js';
import { showToast } from './cart.js';

const app = document.getElementById('app');

// ─── SEO: Per-page metadata ─────────────────────────────
const pageSEO = {
  '/': {
    title: 'Therwatt – Varmepumper, vannbåren varme og gulvvarme i Norge | Bergvarme & radiatorer',
    description: 'Therwatt er Norges spesialister på varmepumper, vannbåren varme, gulvvarme, bergvarme og radiatorer. Beregn besparelse med vår kalkulator. Enova-støtte opptil 55 000 kr.',
    canonical: 'https://therwatt.netlify.app/'
  },
  '/kalkulator': {
    title: 'Varmepumpekalkulator – Beregn besparelse med varmepumpe | Therwatt',
    description: 'Beregn hvor mye du kan spare med varmepumpe. Sammenlign luft-vann og bergvarme (væske-vann), se tilbakebetalingstid, Enova-støtte og anbefalt varmepumpe for din bolig.',
    canonical: 'https://therwatt.netlify.app/kalkulator'
  },
  '/vannbaren-kalkulator': {
    title: 'Gulvvarme kalkulator – Beregn vannbåren varme, rørmeter og materialer | Therwatt',
    description: 'Beregn rørmeter, antall kurser og materialforbruk for vannbåren gulvvarme. Velg mellom støp, avretting og sporplater. Kalkulatoren beregner alt du trenger for gulvvarme-installasjon.',
    canonical: 'https://therwatt.netlify.app/vannbaren-kalkulator'
  }
};

function updatePageSEO(path) {
  const seo = pageSEO[path];
  if (!seo) return;
  document.title = seo.title;
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', seo.description);
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', seo.canonical);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', seo.title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', seo.description);
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', seo.canonical);
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', seo.title);
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', seo.description);
}

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
            <p>Spesialister på varmepumper, vannbåren varme, gulvvarme, bergvarme og radiatorer. Europeiske kvalitetsprodukter for boliger og næringsbygg i hele Norge.</p>
          </div>
          <div class="footer-col">
            <h4>Tjenester</h4>
            <ul>
              <li><a href="/kalkulator" data-link>Varmepumpekalkulator</a></li>
              <li><a href="/vannbaren-kalkulator" data-link>Gulvvarme kalkulator</a></li>
              <li><a href="/" data-link>Vannbåren varme</a></li>
              <li><a href="/" data-link>Bergvarme</a></li>
              <li><a href="/" data-link>Radiatorer</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Kontakt</h4>
            <ul>
              <li><a href="mailto:post@therwatt.no">post@therwatt.no</a></li>
              <li><a href="tel:+4790280156">902 80 156</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} Therwatt – Varmepumper, vannbåren varme og gulvvarme i Norge. Alle rettigheter reservert.
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

      <!-- SEO Content Sections -->
      <section class="seo-content" style="padding:var(--space-16) 0;">
        <div class="container">
          <div style="max-width:900px;margin:0 auto;">

            <h2 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--space-6);color:var(--text-primary);">Varmepumper – den smarteste oppvarmingsløsningen</h2>
            <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:var(--space-6);">
              En <strong>varmepumpe</strong> er den mest energieffektive måten å varme opp boligen din på. Ved å hente gratis varme fra luft, jord eller grunnfjell kan du spare 50–70 % på strømregningen. Therwatt tilbyr <strong>luft-vann varmepumper</strong> og <strong>væske-vann varmepumper</strong> (bergvarme) som leverer varme via vannbåren gulvvarme eller radiatorer. Med riktig varmepumpe og et godt dimensjonert vannbårent varmesystem får du optimal komfort og lave driftskostnader.
            </p>

            <h2 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--space-6);color:var(--text-primary);">Vannbåren varme med gulvvarme og radiatorer</h2>
            <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:var(--space-6);">
              <strong>Vannbåren varme</strong> er et system der oppvarmet vann sirkulerer i rør under gulvet (<strong>gulvvarme</strong>) eller gjennom <strong>radiatorer</strong>. Dette gir en jevn og behagelig varmefordeling i hele boligen. Gulvvarme opererer på lavere vanntemperatur enn tradisjonelle radiatorer, noe som gjør det ideelt å kombinere med varmepumpe. Therwatt hjelper deg med å beregne riktig rørmeter, antall kurser og materialforbruk – bruk vår <a href="/vannbaren-kalkulator" data-link style="color:var(--accent);">gulvvarme-kalkulator</a> for nøyaktige beregninger.
            </p>

            <h2 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--space-6);color:var(--text-primary);">Bergvarme – maksimal energieffektivitet</h2>
            <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:var(--space-6);">
              <strong>Bergvarme</strong> (også kalt <strong>jordvarme</strong> eller <strong>grunnvarme</strong>) utnytter den stabile temperaturen i grunnen via en energibrønn. En væske-vann varmepumpe henter varmen fra brønnen og fordeler den gjennom vannbåren gulvvarme eller radiatorer. Med en SCOP-verdi på opptil 5.0 er bergvarme den mest energieffektive oppvarmingsløsningen tilgjengelig. Enova gir støtte på opptil 55 000 kr for bergvarmepumper, noe som gjør investeringen enda mer lønnsom.
            </p>

            <h2 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--space-6);color:var(--text-primary);">Radiatorer for vannbåren varme</h2>
            <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:var(--space-6);">
              <strong>Radiatorer</strong> er et populært valg for distribusjon av vannbåren varme, spesielt ved ettermontasje i eksisterende boliger. Moderne lavtemperatur-radiatorer er designet for å fungere effektivt med varmepumper og gir rask oppvarming av enkeltrom. Therwatt leverer europeiske kvalitetsradiatorer som kombinerer elegant design med høy varmeeffekt. Mange velger å kombinere gulvvarme på bad og oppholdsrom med radiatorer i soverom og entré.
            </p>

            <h2 style="font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--space-6);color:var(--text-primary);">Enova-støtte for varmepumpe</h2>
            <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:var(--space-4);">
              Enova tilbyr betydelig økonomisk støtte for installasjon av energieffektive varmeløsninger. Du kan få opptil <strong>55 000 kr i Enova-støtte</strong> for bergvarmepumpe og opptil 40 000 kr for luft-vann varmepumpe med vannbåren varme. Bruk vår <a href="/kalkulator" data-link style="color:var(--accent);">varmepumpekalkulator</a> for å se nøyaktig hvor mye du kan spare, inkludert tilbakebetalingstid og Enova-støtte for din bolig.
            </p>

          </div>
        </div>
      </section>

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

          <!-- Hero Section -->
          <div class="calculator-hero">
            <div class="calc-hero-badge">Norges mest informative varmepumpekalkulator</div>
            <h1>Hvor mye kan du spare med varmepumpe?</h1>
            <p>Beregn besparelse, tilbakebetalingstid og anbefalt varmepumpe basert på din bolig. Oppdatert med markedsdata for 2026.</p>
          </div>

          <!-- Benefits Bar -->
          <div class="calc-benefits-bar">
            <div class="calc-benefit-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>Spar 50–70 % på oppvarming</span>
            </div>
            <div class="calc-benefit-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Tilbakebetalt på 3–6 år</span>
            </div>
            <div class="calc-benefit-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              <span>Opptil 55 000 kr i Enova-støtte</span>
            </div>
          </div>

          <!-- Calculator Card -->
          <div class="calculator-card">
            <div class="calculator-progress">
              <div class="calculator-progress-step active" id="prog-1">
                <span class="prog-label">1. Bolig</span>
              </div>
              <div class="calculator-progress-step" id="prog-2">
                <span class="prog-label">2. Kontakt</span>
              </div>
              <div class="calculator-progress-step" id="prog-3">
                <span class="prog-label">3. Resultat</span>
              </div>
            </div>

            <!-- Step 1: Building Information -->
            <div id="calc-step-1" class="calculator-step">
              <h2>Om din bolig</h2>
              <p>Jo mer nøyaktig informasjon, desto bedre beregning. Alle felt er påkrevd.</p>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="calc-areal">Boligareal (m²)</label>
                  <input type="number" id="calc-areal" class="form-input" min="20" max="500" placeholder="F.eks. 120" required>
                  <span class="form-hint">Oppvarmet areal</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="calc-boligtype">Boligtype</label>
                  <select id="calc-boligtype" class="form-select" required>
                    <option value="">Velg boligtype</option>
                    <option value="enebolig">Enebolig</option>
                    <option value="rekkehus">Rekkehus</option>
                    <option value="tomannsbolig">Tomannsbolig</option>
                    <option value="leilighet">Leilighet</option>
                  </select>
                </div>
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
                  <span class="form-hint">Påvirker energibehov</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="calc-type">Nåværende oppvarming</label>
                  <select id="calc-type" class="form-select" required>
                    <option value="">Velg type</option>
                    <option value="electric">Panelovner / elektrisk</option>
                    <option value="oil">Oljefyr</option>
                    <option value="district">Fjernvarme</option>
                    <option value="wood">Ved / pellets</option>
                    <option value="gas">Gass</option>
                    <option value="old_hp">Gammel varmepumpe (10+ år)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="calc-strompris">Strømpris (kr/kWh)</label>
                  <input type="number" id="calc-strompris" class="form-input" min="0.5" max="5" step="0.1" value="1.50" required>
                  <span class="form-hint">Inkl. nettleie og avgifter. Snitt 2026: ~1,50 kr</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="calc-etasjer">Antall etasjer</label>
                  <select id="calc-etasjer" class="form-select" required>
                    <option value="1">1 etasje</option>
                    <option value="2" selected>2 etasjer</option>
                    <option value="3">3 etasjer</option>
                  </select>
                </div>
              </div>

              <button class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)" id="calc-next-1">
                Beregn besparelse
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:8px;vertical-align:middle"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            <!-- Step 2: Contact Information -->
            <div id="calc-step-2" class="calculator-step" style="display:none">
              <h2>Få din personlige beregning</h2>
              <p>Fyll inn kontaktinfo under for å se din fullstendige besparelseberegning med anbefalt varmepumpe, tilbakebetalingstid og Enova-støtte.</p>

              <form id="calc-form" name="leads" method="POST" data-netlify="true" netlify-honeypot="bot-field">
                <input type="hidden" name="form-name" value="leads">
                <p style="display:none"><input name="bot-field"></p>
                <input type="hidden" name="boligareal" id="form-areal">
                <input type="hidden" name="byggear" id="form-byggear">
                <input type="hidden" name="oppvarmingstype" id="form-type">

                <div class="form-group">
                  <label class="form-label" for="calc-navn">Navn</label>
                  <input type="text" id="calc-navn" name="navn" class="form-input" placeholder="Ditt fulle navn" required>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="calc-epost">E-post</label>
                    <input type="email" id="calc-epost" name="epost" class="form-input" placeholder="din@epost.no" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="calc-telefon">Telefon</label>
                    <input type="tel" id="calc-telefon" name="telefon" class="form-input" placeholder="Mobilnummer" required>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="calc-melding">Eventuell melding</label>
                  <textarea id="calc-melding" name="melding" class="form-textarea" rows="3" placeholder="F.eks. spesielle ønsker eller spørsmål"></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)">Se full beregning</button>
                <button type="button" class="btn btn-outline btn-sm" style="width:100%;margin-top:var(--space-2)" id="calc-back-1">Tilbake</button>
              </form>
            </div>

            <!-- Step 3: Results -->
            <div id="calc-step-3" class="calculator-step" style="display:none">
              <div class="calc-results-full" id="calc-results"></div>
            </div>
          </div>

          <!-- Info Sections Below Calculator -->
          <div class="calc-info-sections">

            <div class="calc-info-section">
              <div class="calc-info-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <h3>Hva koster en varmepumpe i 2026?</h3>
                <p>En <strong>luft-til-luft</strong> varmepumpe koster 15 000–45 000 kr inkl. montering og gir 30–60 % besparelse. <strong>Luft-til-vann</strong> koster 100 000–170 000 kr og dekker 70–80 % av varmebehovet, inkludert varmtvann. <strong>Bergvarme</strong> (væske-til-vann) koster 150 000–300 000 kr, men gir best ytelse og 20–30 års levetid.</p>
              </div>
            </div>

            <div class="calc-info-section">
              <div class="calc-info-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
              </div>
              <div>
                <h3>Enova-støtte i 2026</h3>
                <p>Enova gir <strong>opptil 40 000 kr</strong> for bergvarme og <strong>opptil 20 000 kr</strong> for luft-til-vann. Kombinerer du med akkumulatortank og energistyring, kan du få <strong>opptil 55 000 kr</strong> i tilskudd. Søknaden må sendes <em>før</em> du starter prosjektet. Luft-til-luft varmepumper får ikke Enova-støtte.</p>
              </div>
            </div>

            <div class="calc-info-section">
              <div class="calc-info-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <h3>Hva er COP og SCOP?</h3>
                <p><strong>COP</strong> (Coefficient of Performance) viser hvor mye varme du får per kWh strøm. En COP på 4 betyr 4 kWh varme for 1 kWh strøm. <strong>SCOP</strong> er gjennomsnittet over hele fyringssesongen – et mer realistisk mål. Velg alltid en varmepumpe med SCOP på minimum 3,5 for norske forhold. Moderne A+++ pumper kan ha SCOP opptil 5,5.</p>
              </div>
            </div>

            <div class="calc-info-section">
              <div class="calc-info-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                <h3>Hvilken type passer for deg?</h3>
                <p><strong>Luft-til-luft:</strong> Best for leiligheter og mindre hus. Enkel og rimelig. <strong>Luft-til-vann:</strong> Ideell for boliger med vannbåren gulvvarme eller radiatorer – varmer også tappevann. <strong>Bergvarme:</strong> Best for store eneboliger med høyt forbruk – jevn effekt hele året, helt støyfri, og lengst levetid.</p>
              </div>
            </div>

          </div>

          <!-- Trust Section -->
          <div class="calc-trust-section">
            <div class="calc-trust-item">
              <div class="calc-trust-number">1 000 000+</div>
              <div class="calc-trust-label">Varmepumper installert i Norge</div>
            </div>
            <div class="calc-trust-item">
              <div class="calc-trust-number">50 %</div>
              <div class="calc-trust-label">Av norske hjem bruker varmepumpe</div>
            </div>
            <div class="calc-trust-item">
              <div class="calc-trust-number">15–20 år</div>
              <div class="calc-trust-label">Forventet levetid ved godt vedlikehold</div>
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
  const backBtn = document.getElementById('calc-back-1');

  nextBtn.addEventListener('click', () => {
    const areal = document.getElementById('calc-areal').value;
    const boligtype = document.getElementById('calc-boligtype').value;
    const byggear = document.getElementById('calc-byggear').value;
    const type = document.getElementById('calc-type').value;
    const strompris = document.getElementById('calc-strompris').value;

    if (!areal || !boligtype || !byggear || !type) {
      showToast('Vennligst fyll inn alle felt');
      return;
    }

    // Store values in hidden fields
    document.getElementById('form-areal').value = areal;
    document.getElementById('form-byggear').value = byggear;
    document.getElementById('form-type').value = type;

    // No preview shown — contact info required before seeing any results

    document.getElementById('calc-step-1').style.display = 'none';
    document.getElementById('calc-step-2').style.display = 'block';
    document.getElementById('prog-2').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  backBtn.addEventListener('click', () => {
    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('calc-step-1').style.display = 'block';
    document.getElementById('prog-2').classList.remove('active');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const areal = parseFloat(document.getElementById('form-areal').value);
    const byggear = document.getElementById('form-byggear').value;
    const type = document.getElementById('form-type').value;
    const strompris = parseFloat(document.getElementById('calc-strompris').value);
    const boligtype = document.getElementById('calc-boligtype').value;
    const etasjer = parseInt(document.getElementById('calc-etasjer').value);

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
    const result = calculateHeatPump(areal, byggear, type, strompris, boligtype, etasjer);

    document.getElementById('calc-step-2').style.display = 'none';
    document.getElementById('calc-step-3').style.display = 'block';
    document.getElementById('prog-3').classList.add('active');

    document.getElementById('calc-results').innerHTML = renderCalcResults(result, areal, strompris);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderCalcResults(r, areal, strompris) {
  // Build comparison bars
  const maxCost = r.currentCostNok;
  const currentPct = 100;
  const hpPct = Math.round((r.heatPumpCostNok / maxCost) * 100);

  // Enova text
  let enovaHTML = '';
  if (r.enovaSupport > 0) {
    enovaHTML = `
      <div class="calc-enova-box">
        <div class="calc-enova-badge">Enova-støtte</div>
        <div class="calc-enova-amount">Opptil ${r.enovaSupport.toLocaleString('nb-NO')} kr</div>
        <div class="calc-enova-desc">${r.enovaDesc}</div>
        <div class="calc-enova-note">Med Enova-støtte synker nettoinvesteringen til <strong>${(r.investmentLow - r.enovaSupport > 0 ? r.investmentLow - r.enovaSupport : 0).toLocaleString('nb-NO')}–${(r.investmentHigh - r.enovaSupport).toLocaleString('nb-NO')} kr</strong></div>
      </div>
    `;
  } else {
    enovaHTML = `
      <div class="calc-enova-box calc-enova-box--info">
        <div class="calc-enova-badge">Info om Enova-støtte</div>
        <div class="calc-enova-desc">Luft-til-luft varmepumper får ikke Enova-støtte, men er allerede en svært lønnsom investering med kort tilbakebetalingstid.</div>
      </div>
    `;
  }

  return `
    <div class="calc-results-header">
      <div class="success-icon">${icons.check}</div>
      <h2>Din varmepumpeberegning</h2>
      <p>Basert på ${areal} m², byggeår ${r.byggearLabel}, ${r.heatingLabel}</p>
    </div>

    <!-- Highlight Card: Annual Savings -->
    <div class="calc-savings-highlight">
      <div class="calc-savings-main">
        <div class="calc-savings-amount">${r.savingsKwh.toLocaleString('nb-NO')} kWh</div>
        <div class="calc-savings-period">estimert årlig besparelse</div>
      </div>
      <div class="calc-savings-detail">
        <span>${r.co2Savings} kg CO₂ reduksjon per år</span>
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="calc-result-grid">
      <div class="calc-result-item calc-result-item--accent">
        <div class="calc-result-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="label">Anbefalt effekt</div>
        <div class="value">${r.kw} kW</div>
      </div>
      <div class="calc-result-item">
        <div class="calc-result-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div class="label">Anbefalt type</div>
        <div class="value">${r.type}</div>
      </div>
      <div class="calc-result-item">
        <div class="calc-result-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div class="label">Tilbakebetalingstid</div>
        <div class="value">${r.paybackYears}</div>
      </div>
      <div class="calc-result-item">
        <div class="calc-result-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="label">Estimert investering</div>
        <div class="value">${r.investmentLabel}</div>
      </div>
    </div>

    <!-- Cost Comparison -->
    <div class="calc-comparison">
      <h3>Sammenligning av årlige oppvarmingskostnader</h3>
      <div class="calc-comparison-bars">
        <div class="calc-bar-row">
          <div class="calc-bar-label">I dag (${r.heatingLabel})</div>
          <div class="calc-bar-track">
            <div class="calc-bar-fill calc-bar-fill--current" style="width:${currentPct}%"></div>
          </div>
          <div class="calc-bar-value">${r.currentCostNok.toLocaleString('nb-NO')} kr/år</div>
        </div>
        <div class="calc-bar-row">
          <div class="calc-bar-label">Med ${r.type}</div>
          <div class="calc-bar-track">
            <div class="calc-bar-fill calc-bar-fill--hp" style="width:${hpPct}%"></div>
          </div>
          <div class="calc-bar-value">${r.heatPumpCostNok.toLocaleString('nb-NO')} kr/år</div>
        </div>
      </div>
    </div>

    <!-- Enova -->
    ${enovaHTML}

    <!-- Lifetime Savings -->
    <div class="calc-lifetime-box">
      <h3>Besparelse over levetiden</h3>
      <div class="calc-lifetime-grid">
        <div class="calc-lifetime-item">
          <div class="calc-lifetime-value">${r.savingsKwh10yr.toLocaleString('nb-NO')} kWh</div>
          <div class="calc-lifetime-label">Over 10 år</div>
        </div>
        <div class="calc-lifetime-item">
          <div class="calc-lifetime-value">${r.savingsKwh15yr.toLocaleString('nb-NO')} kWh</div>
          <div class="calc-lifetime-label">Over 15 år</div>
        </div>
        <div class="calc-lifetime-item calc-lifetime-item--highlight">
          <div class="calc-lifetime-value">${r.savingsKwhLifetime.toLocaleString('nb-NO')} kWh</div>
          <div class="calc-lifetime-label">Over levetiden (${r.lifetime} år)</div>
        </div>
      </div>
      <div class="calc-lifetime-note">Faktisk besparelse avhenger av strømpris og bruksmønster.</div>
    </div>

    <!-- Type Description -->
    <div class="calc-type-info">
      <h3>Hvorfor ${r.type}?</h3>
      <p>${r.typeDescription}</p>
      <ul class="calc-type-features">
        ${r.typeFeatures.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>

    <!-- CTA -->
    <div class="calc-cta-box">
      <h3>Klar for neste steg?</h3>
      <p>Vi hjelper deg med å finne den perfekte varmepumpen for din bolig – fra rådgivning til ferdig installert anlegg.</p>
      <div class="calc-cta-buttons">
        <a href="tel:+4790280156" class="btn btn-primary btn-lg">Ring oss: 902 80 156</a>
        <a href="mailto:post@therwatt.no" class="btn btn-outline btn-lg">Send e-post</a>
      </div>
    </div>
  `;
}

function calculateHeatPump(areal, byggear, heatingType, strompris, boligtype, etasjer) {
  // Energy factors (kWh/m² per year) based on building age - from Norwegian building standards
  const energyFactors = {
    'pre1960': 200,
    '1960-1980': 170,
    '1980-2000': 140,
    '2000-2010': 110,
    'post2010': 80
  };

  const byggearLabels = {
    'pre1960': 'Før 1960',
    '1960-1980': '1960–1980',
    '1980-2000': '1980–2000',
    '2000-2010': '2000–2010',
    'post2010': 'Etter 2010'
  };

  const heatingLabels = {
    'electric': 'Panelovner',
    'oil': 'Oljefyr',
    'district': 'Fjernvarme',
    'wood': 'Ved/pellets',
    'gas': 'Gass',
    'old_hp': 'Gammel varmepumpe'
  };

  // Cost per kWh for existing heating source
  const heatingCostPerKwh = {
    'electric': 1.0,
    'oil': 1.1,
    'district': 0.85,
    'wood': 0.50,
    'gas': 1.2,
    'old_hp': 0.55
  };

  // Adjustment for building type (heat loss through shared walls)
  const boligtypeFactors = {
    'enebolig': 1.0,
    'rekkehus': 0.85,
    'tomannsbolig': 0.90,
    'leilighet': 0.70
  };

  // Base energy need
  const baseFactor = energyFactors[byggear] || 140;
  const boligtypeFactor = boligtypeFactors[boligtype] || 1.0;
  const energyNeed = Math.round(areal * baseFactor * boligtypeFactor);

  // About 58% of total electricity goes to heating (SSB data)
  const heatingShare = 0.58;
  const heatingEnergy = Math.round(energyNeed * heatingShare);

  // Determine pump type and SCOP based on area, building type, and floors
  let pumpType, scop, investmentLow, investmentHigh, lifetime, enovaSupport, enovaDesc;
  let typeDescription, typeFeatures;

  if (areal < 70 || boligtype === 'leilighet') {
    pumpType = 'Luft-til-luft';
    scop = 3.5;
    investmentLow = 15000;
    investmentHigh = 45000;
    lifetime = 15;
    enovaSupport = 0;
    enovaDesc = '';
    typeDescription = 'Luft-til-luft er den mest kostnadseffektive varmepumpen og passer utmerket for din bolig. Den henter varme fra uteluften og leverer den direkte inn i rommet. Enkel installasjon og rask tilbakebetalingstid.';
    typeFeatures = [
      'Rimeligst å installere – rask tilbakebetalingstid',
      'SCOP opptil 5,5 på moderne modeller',
      'Gir også kjøling om sommeren',
      'Enkel installasjon på 1 dag',
      'Reduserer strømforbruk for oppvarming med 30–60 %'
    ];
  } else if (areal < 200 || boligtype === 'rekkehus') {
    pumpType = 'Luft-til-vann';
    scop = 3.0;
    investmentLow = 100000;
    investmentHigh = 170000;
    lifetime = 20;
    enovaSupport = 20000;
    enovaDesc = 'Du kan søke Enova om opptil 20 000 kr i tilskudd for luft-til-vann varmepumpe. Legg til akkumulatortank (+5 000 kr) for totalt 25 000 kr.';
    typeDescription = 'Luft-til-vann er ideell for boliger med vannbåren gulvvarme eller radiatorer. Den varmer både boligen og tappevannet, og dekker typisk 70–80 % av det årlige varmebehovet.';
    typeFeatures = [
      'Varmer hele huset via vannbårent anlegg',
      'Produserer også varmtvann til dusj og tappepunkter',
      'Dekker 70–80 % av årlig varmebehov',
      'Kvalifiserer for Enova-støtte',
      'SCOP 2,5–3,0 under norske forhold'
    ];
  } else {
    pumpType = 'Bergvarme (væske-til-vann)';
    scop = 3.5;
    investmentLow = 200000;
    investmentHigh = 350000;
    lifetime = 25;
    enovaSupport = 40000;
    enovaDesc = 'Du kan søke Enova om opptil 40 000 kr for bergvarme. Med akkumulatortank og energistyring kan du få opptil 55 000 kr totalt.';
    typeDescription = 'Bergvarme er det mest effektive og langvarige valget for store boliger. Varmepumpen henter stabil varme fra berggrunnen via en energibrønn, og gir jevn ytelse hele året – uavhengig av utetemperatur.';
    typeFeatures = [
      'Jevn, høy effekt hele året – uavhengig av utetemperatur',
      'Lengst levetid: 20–30 år',
      'Helt støyfri drift',
      'Best langsiktig økonomi av alle typer',
      'Høyest Enova-støtte – opptil 55 000 kr med tilleggstiltak'
    ];
  }

  // Adjust SCOP for multi-story buildings (slightly lower efficiency for luft-luft)
  if (pumpType === 'Luft-til-luft' && etasjer >= 2) {
    scop = Math.max(2.8, scop - 0.3); // Reduced efficiency when warming multiple floors
  }

  // Calculate heat pump coverage
  const hpCoverage = pumpType === 'Luft-til-luft' ? 0.55 : 0.80;
  const hpHeatingEnergy = Math.round(heatingEnergy * hpCoverage);
  const hpElectricity = Math.round(hpHeatingEnergy / scop);
  const remainingElectric = heatingEnergy - hpHeatingEnergy;

  // Current cost
  const effectiveCostPerKwh = heatingCostPerKwh[heatingType] || 1.0;
  const currentCostNok = Math.round(heatingEnergy * strompris * effectiveCostPerKwh);

  // Heat pump cost
  const heatPumpCostNok = Math.round((hpElectricity + remainingElectric) * strompris);

  // Savings
  const savingsKwh = Math.round(hpHeatingEnergy - hpElectricity);
  const savingsNok = Math.max(0, currentCostNok - heatPumpCostNok);

  // Required kW (peak load based on design temp)
  const peakFactor = pumpType === 'Luft-til-luft' ? 2200 : 1800;
  const rawKw = (heatingEnergy / peakFactor);
  const kw = Math.max(3, Math.min(20, Math.round(rawKw * 10) / 10));

  // Payback
  const avgInvestment = (investmentLow + investmentHigh) / 2;
  const netInvestment = avgInvestment - enovaSupport;
  const paybackRaw = savingsNok > 0 ? netInvestment / savingsNok : 99;
  const paybackYears = paybackRaw < 1 ? 'Under 1 år' :
    paybackRaw > 20 ? 'Over 20 år' :
    `${Math.round(paybackRaw * 10) / 10} år`;

  // Lifetime savings (kWh)
  const savingsKwh10yr = Math.round(savingsKwh * 10);
  const savingsKwh15yr = Math.round(savingsKwh * 15);
  const savingsKwhLifetime = Math.round(savingsKwh * lifetime);

  // Lifetime savings (kr, for internal use)
  const savings10yr = Math.round(savingsNok * 10 - netInvestment);
  const savings15yr = Math.round(savingsNok * 15 - netInvestment);
  const savingsLifetime = Math.round(savingsNok * lifetime - netInvestment);

  // CO2 savings (Norwegian grid ~8g CO2/kWh, but total savings contribute to less fossil use)
  const co2Savings = Math.round(savingsKwh * 0.132);

  // Investment label
  const investmentLabel = `${Math.round(investmentLow / 1000)}–${Math.round(investmentHigh / 1000)}k kr`;

  return {
    kw,
    savingsKwh: Math.max(0, savingsKwh),
    savingsNok: Math.max(0, savingsNok),
    type: pumpType,
    scop,
    currentCostNok: Math.max(0, currentCostNok),
    heatPumpCostNok: Math.max(0, heatPumpCostNok),
    investmentLow,
    investmentHigh,
    investmentLabel,
    paybackYears,
    lifetime,
    enovaSupport,
    enovaDesc,
    savings10yr: Math.max(0, savings10yr),
    savings15yr: Math.max(0, savings15yr),
    savingsLifetime: Math.max(0, savingsLifetime),
    savingsKwh10yr,
    savingsKwh15yr,
    savingsKwhLifetime,
    co2Savings: Math.max(0, co2Savings),
    typeDescription,
    typeFeatures,
    byggearLabel: byggearLabels[byggear] || byggear,
    heatingLabel: heatingLabels[heatingType] || heatingType
  };
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
route('/', () => { updatePageSEO('/'); renderHome(); });
route('/kalkulator', () => { updatePageSEO('/kalkulator'); renderCalculator(); });
route('/vannbaren-kalkulator', () => { updatePageSEO('/vannbaren-kalkulator'); renderWaterborneCalculator(); });

// ─── Init ────────────────────────────────────────────────
function init() {
  resolve();
}

init();
