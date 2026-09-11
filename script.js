const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const menuLabel = menuButton?.querySelector('.sr-only');

const setMenuState = (open) => {
  menuButton?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
  if (menuLabel) menuLabel.textContent = open ? 'Close navigation' : 'Open navigation';
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  setMenuState(!open);
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    setMenuState(false);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenuState(false);
    menuButton?.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 720) setMenuState(false);
});

const sectionLinks = [...document.querySelectorAll('#primary-nav a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
        if (isCurrent) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });

  sections.forEach((section) => observer.observe(section));
}

const revealItems = [...document.querySelectorAll('[data-reveal]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  document.body.classList.add('reveal-ready');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
