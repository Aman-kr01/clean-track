function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('[data-nav]');
  for (const a of links) {
    const target = a.getAttribute('href');
    if (target === path) a.classList.add('active');
  }
}

setActiveNav();
