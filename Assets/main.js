
document.addEventListener('DOMContentLoaded', () => {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-page]').forEach(link => {
    if ((link.getAttribute('data-page') || '').toLowerCase() === path) {
      link.classList.add('active');
    }
  });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
