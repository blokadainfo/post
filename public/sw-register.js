const currentScript = document.currentScript;
const buildSha =
  currentScript instanceof HTMLScriptElement ? currentScript.dataset.version || 'dev' : 'dev';
const isLocalhost =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '[::1]';

if ('serviceWorker' in navigator) {
  window.addEventListener(
    'load',
    async () => {
      if (isLocalhost) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.filter((key) => key.startsWith('binfo-post-')).map((key) => caches.delete(key))
        );
        return;
      }

      navigator.serviceWorker
        .register('/sw.js?v=' + buildSha)
        .catch((error) => console.error('Service worker registration failed', error));
    },
    { once: true }
  );
}
