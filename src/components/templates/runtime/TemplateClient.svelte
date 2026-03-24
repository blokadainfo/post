<script lang="ts">
  import { onMount } from 'svelte';
  import { snapdom } from '@zumer/snapdom';

  type SetDataMsg = {
    type: 'SET_DATA';
    bgDataURL?: string | null;
    paragraph?: string;
    textSize?: number;
    credit?: string;
    darken?: number;
  };
  type SnapshotMsg = { type: 'SNAPSHOT'; scale?: number; id: number };
  type Msg = SetDataMsg | SnapshotMsg;

  const postEl = document.getElementById('post') as HTMLElement | null;
  const bgEl = document.getElementById('bg') as HTMLImageElement | null;
  const shadeEl = document.getElementById('shade') as HTMLDivElement | null;
  const pEl = document.getElementById('paragraph') as HTMLElement | null;
  const cEl = document.getElementById('credit') as HTMLElement | null;

  const waitForFonts = () =>
    // @ts-expect-error: older DOM typings
    (document.fonts?.ready as Promise<void> | undefined) ?? Promise.resolve();

  function waitForImageSafe(img: HTMLImageElement, timeoutMs = 1500) {
    return new Promise<void>((resolve) => {
      if (!img.src || (img.complete && img.naturalWidth > 0)) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        cleanup();
        resolve();
      };
      const t = setTimeout(finish, timeoutMs);
      const onload = () => finish();
      const onerror = () => finish();
      img.addEventListener('load', onload, { once: true });
      img.addEventListener('error', onerror, { once: true });
      function cleanup() {
        clearTimeout(t);
        img.removeEventListener('load', onload);
        img.removeEventListener('error', onerror);
      }
    });
  }

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const dprCompensatedScale = (req?: number) => {
    const r = req ?? 1;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    return r / dpr;
  };

  async function toParts(blob: Blob) {
    const buf = await blob.arrayBuffer();
    return { data: buf, type: blob.type };
  }

  function postResult(id: number, payload: { data: ArrayBuffer; type: string }) {
    window.parent?.postMessage({ type: 'SNAPSHOT_RESULT', id, blob: payload }, '*');
  }

  function postSettled() {
    window.parent?.postMessage({ type: 'SETTLED' }, '*');
  }

  function waitForImagesSafe(images: Iterable<HTMLImageElement>, timeoutMs = 4000) {
    return Promise.all(Array.from(images, (img) => waitForImageSafe(img, timeoutMs)));
  }

  async function blobToDataURL(blob: Blob) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('blob read failed'));
      reader.readAsDataURL(blob);
    });
  }

  async function inlineImageSource(img: HTMLImageElement) {
    const src = img.currentSrc || img.src || '';
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    if (img === bgEl) return;

    try {
      const response = await fetch(src, { credentials: 'same-origin' });
      if (!response.ok) return;
      const blob = await response.blob();
      const dataUrl = await blobToDataURL(blob);
      if (dataUrl) img.src = dataUrl;
    } catch {
      // Keep original src as fallback.
    }
  }

  async function inlineTemplateImages() {
    const images = Array.from(document.images).filter((img) => img !== bgEl);
    await Promise.all(images.map((img) => inlineImageSource(img)));
  }

  function decodeImageSafe(img: HTMLImageElement, timeoutMs = 4000) {
    return new Promise<void>((resolve) => {
      if (!img.src) return resolve();

      const finish = () => {
        clearTimeout(timer);
        resolve();
      };

      const timer = window.setTimeout(finish, timeoutMs);

      if (typeof img.decode === 'function') {
        img.decode().then(finish).catch(finish);
        return;
      }

      finish();
    });
  }

  async function settleTemplateImages(timeoutMs = 4000) {
    await inlineTemplateImages();
    const images = Array.from(document.images);
    await waitForImagesSafe(images, timeoutMs);
    await Promise.all(images.map((img) => decodeImageSafe(img, timeoutMs)));
  }

  function preloadImage(src: string, timeoutMs = 4000) {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
        resolve(ok);
      };
      const timer = window.setTimeout(() => finish(false), timeoutMs);
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = src;
    });
  }

  let bgRequestId = 0;

  onMount(() => {
    // Post READY only after the current template frame, fonts, and images are settled.
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      try {
        await waitForFonts();
        await settleTemplateImages();
      } catch {
        throw new Error('template preload failed');
      }
      window.parent?.postMessage({ type: 'READY' }, '*');
    })();

    const handler = async (e: MessageEvent<Msg>) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SET_DATA') {
        if ('bgDataURL' in data && bgEl) {
          const requestId = ++bgRequestId;
          if (data.bgDataURL) {
            const loaded = await preloadImage(data.bgDataURL);
            if (requestId === bgRequestId && loaded) {
              bgEl.src = data.bgDataURL;
              await waitForImageSafe(bgEl, 4000);
            }
          } else {
            bgEl.removeAttribute('src');
          }
        }
        if (pEl) {
          pEl.textContent = data.paragraph ?? '';
          if (typeof data.textSize === 'number') {
            const textBlockEl = document.getElementById('main-text-block') as HTMLElement | null;
            if (textBlockEl?.dataset.alignFirstLineToLogo === 'true') {
              textBlockEl.style.fontSize = `${data.textSize}px`;
              pEl.style.fontSize = 'inherit';
            } else {
              pEl.style.fontSize = `${data.textSize}px`;
            }
          }
        }
        if (cEl) {
          const creditPrefix = cEl.dataset.creditPrefix ?? 'foto';
          cEl.textContent = data.credit ?? '';
          cEl.textContent = cEl.textContent === '' ? '' : `${creditPrefix}: ${cEl.textContent}`;
        }
        if (shadeEl && typeof data.darken === 'number') {
          shadeEl.style.opacity = String(clamp(data.darken, 0, 100) / 100);
        }
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        postSettled();
        return;
      }

      if (data.type === 'SNAPSHOT') {
        const { id, scale: reqScale } = data;
        try {
          if (!postEl) throw new Error('#post not found');
          await waitForFonts();
          await settleTemplateImages(4000);

          const scale = dprCompensatedScale(reqScale);
          const png = await snapdom.toBlob(postEl, { type: 'png', scale, embedFonts: true });
          postResult(id, await toParts(png));
        } catch {
          const empty = new Blob([], { type: 'image/png' });
          postResult(id, await toParts(empty));
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  });
</script>

<!-- This component renders nothing; it’s just a client runtime -->
