// ═══════════════════════════════════════════════════════════
// Simple SPA Router
// ═══════════════════════════════════════════════════════════

const routes = [];
let currentCleanup = null;

export function route(pattern, handler) {
  routes.push({ pattern, handler });
}

export function navigate(path) {
  history.pushState(null, '', path);
  resolve();
}

export function resolve() {
  const path = location.pathname;

  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  for (const r of routes) {
    const match = matchRoute(r.pattern, path);
    if (match) {
      currentCleanup = r.handler(match);
      return;
    }
  }

  // 404
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="main">
      <div class="container" style="padding: 6rem 1.5rem; text-align: center;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Siden ble ikke funnet</h1>
        <p style="color: #6b7280; margin-bottom: 2rem;">Beklager, men denne siden finnes ikke.</p>
        <a href="/" class="btn btn-primary btn-lg" data-link>Tilbake til forsiden</a>
      </div>
    </div>
  `;
}

function matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return { params };
}

// Handle link clicks
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-link], a[href^="/"]');
  if (link && link.getAttribute('href')?.startsWith('/')) {
    e.preventDefault();
    navigate(link.getAttribute('href'));
  }
});

window.addEventListener('popstate', resolve);
