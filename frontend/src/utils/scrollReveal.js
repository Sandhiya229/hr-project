// src/utils/scrollReveal.js

/**
 * Initializes IntersectionObserver to add the 'visible' class to elements with the
 * 'reveal' class when they enter the viewport. This drives the fade‑in /
 * slide‑up animation defined in index.css.
 */
export default function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));
}
