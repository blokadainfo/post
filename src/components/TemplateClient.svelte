<script lang="ts">
  import { onMount } from 'svelte';
  import { snapdom } from '@zumer/snapdom';

  type SetDataMsg = {
    type: 'SET_DATA';
    bgDataURL?: string | null;
    paragraph?: string;
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

  onMount(() => {
    // Post READY after a frame + (best-effort) fonts so parent can reveal iframe
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      try {
        await waitForFonts();
      } catch {}
      window.parent?.postMessage({ type: 'READY' }, '*');
    })();

    const handler = async (e: MessageEvent<Msg>) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SET_DATA') {
        if ('bgDataURL' in data && bgEl) {
          if (data.bgDataURL) bgEl.src = data.bgDataURL;
          else bgEl.removeAttribute('src');
        }
        if (pEl) pEl.textContent = data.paragraph ?? '';
        if (cEl) cEl.textContent = data.credit ?? '';
        if (shadeEl && typeof data.darken === 'number') {
          shadeEl.style.opacity = String(clamp(data.darken, 0, 100) / 100);
        }
        return;
      }

      if (data.type === 'SNAPSHOT') {
        const { id, scale: reqScale } = data;
        try {
          if (!postEl) throw new Error('#post not found');
          await waitForFonts();
          if (bgEl) await waitForImageSafe(bgEl);

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
