const currentScript = document.currentScript;
const buildSha =
  currentScript instanceof HTMLScriptElement ? currentScript.dataset.version || 'dev' : 'dev';

if ('serviceWorker' in navigator) {
  window.addEventListener(
    'load',
    () => {
      navigator.serviceWorker
        .register('/sw.js?v=' + buildSha)
        .catch((error) => console.error('Service worker registration failed', error));
    },
    { once: true }
  );
}
