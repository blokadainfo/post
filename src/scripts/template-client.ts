import { snapdom } from '@zumer/snapdom';

/* =========================
   Types
========================= */

type SetDataMsg = {
  type: 'SET_DATA';
  bgDataURL?: string | null;
  paragraph?: string;
  credit?: string;
  darken?: number;
};

type SnapshotMsg = {
  type: 'SNAPSHOT';
  scale?: number;
  id: number;
};

type Msg = SetDataMsg | SnapshotMsg;

/* =========================
   DOM lookups
========================= */

const postEl = document.getElementById('post') as HTMLElement | null;
const bgEl = document.getElementById('bg') as HTMLImageElement | null;
const shadeEl = document.getElementById('shade') as HTMLDivElement | null;
const pEl = document.getElementById('paragraph') as HTMLElement | null;
const cEl = document.getElementById('credit') as HTMLElement | null;

/* =========================
   Boot: signal READY
========================= */

window.parent?.postMessage({ type: 'READY' }, '*');
console.log('[template-client] READY posted');

/* =========================
   Helpers
========================= */

function waitForFonts(): Promise<void> {
  // @ts-expect-error: fonts is not on older DOM typings
  const ready = document.fonts?.ready as Promise<void> | undefined;
  return ready ?? Promise.resolve();
}

function waitForImageSafe(img: HTMLImageElement, timeoutMs = 1500): Promise<void> {
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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function dprCompensatedScale(requested: number | undefined) {
  const req = requested ?? 1;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  return req / dpr; // so final = native * requested
}

function toTransferableBlobParts(blob: Blob) {
  return blob.arrayBuffer().then((buf) => ({
    data: buf,
    type: blob.type,
  }));
}

function postSnapshotResult(id: number, payload: { data: ArrayBuffer; type: string }) {
  window.parent?.postMessage({ type: 'SNAPSHOT_RESULT', id, blob: payload }, '*');
}

/* =========================
   Message handling
========================= */

window.addEventListener('message', async (e: MessageEvent<Msg>) => {
  const data = e.data;
  if (!data || typeof data !== 'object') return;

  console.log('[template-client] received', data);

  if (data.type === 'SET_DATA') {
    // Background image
    if (bgEl && data.bgDataURL) bgEl.src = data.bgDataURL;

    // Text
    if (pEl) pEl.textContent = data.paragraph ?? '';
    if (cEl) cEl.textContent = data.credit ?? '';

    // Darken overlay (0..100 → 0..1 opacity)
    if (shadeEl && typeof data.darken === 'number') {
      shadeEl.style.opacity = String(clamp(data.darken, 0, 100) / 100);
    }

    return;
  }

  if (data.type === 'SNAPSHOT') {
    const { id } = data;

    try {
      if (!postEl) throw new Error('#post not found');
      await waitForFonts();
      if (bgEl) await waitForImageSafe(bgEl);

      const scale = dprCompensatedScale(data.scale);
      const rect = postEl.getBoundingClientRect();
      console.log('[template-client] capturing', {
        w: postEl.clientWidth,
        h: postEl.clientHeight,
        rect,
        scale,
      });

      const pngBlob = await snapdom.toBlob(postEl, {
        type: 'png',
        scale,
        embedFonts: true,
      });

      const transferable = await toTransferableBlobParts(pngBlob);
      console.log('[template-client] SNAPSHOT_RESULT', {
        id,
        type: pngBlob.type,
        size: pngBlob.size,
      });
      postSnapshotResult(id, transferable);
    } catch (err) {
      console.error('[template-client] snapshot failed:', err);
      const empty = new Blob([], { type: 'image/png' });
      const transferable = await toTransferableBlobParts(empty);
      postSnapshotResult(id, transferable);
    }
  }
});
