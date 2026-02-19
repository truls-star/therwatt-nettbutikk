// Highlight active nav link and update footer year
document.addEventListener('DOMContentLoaded', () => {
  // Determine current page from location pathname
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.menu a[data-page]').forEach(link => {
    if (link.getAttribute('data-page') === path) {
      link.classList.add('active');
    }
  });
  // Update year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});