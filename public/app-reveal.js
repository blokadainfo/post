const revealApp = () => {
  const overlay = document.querySelector('[data-app-reveal]');
  if (!(overlay instanceof HTMLElement)) return;

  window.setTimeout(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.replace('opacity-100', 'opacity-0');
      });
    });
  }, 1000);
};

if (document.readyState === 'complete') {
  revealApp();
} else {
  window.addEventListener('load', revealApp, { once: true });
}
