<script lang="ts">
  import PreviewCanvas from './PreviewCanvas.svelte';
  import PreviewStage from './PreviewStage.svelte';
  import PreviewToolbar from './PreviewToolbar.svelte';
  import { NATIVE_BY_KEY, type AspectKey } from '@lib/aspects';
  import {
    buildPanZoomTransform,
    clampZoom,
    createPanZoomState,
    endPan,
    movePan,
    resetPan,
    startPan,
  } from '@lib/studio/pan-zoom';

  // ---- props ----
  const { templatePath, bgDataURL, paragraph, textSize, credit, aspectKey, darken } = $props<{
    templatePath: string;
    bgDataURL: string | null;
    paragraph: string;
    textSize: number;
    credit: string;
    aspectKey: AspectKey;
    darken: number;
  }>();

  // ---- native export size (from aspects.ts) ----
  const native = $derived(NATIVE_BY_KEY[aspectKey as keyof typeof NATIVE_BY_KEY]);

  // ---- refs ----
  let hostEl: HTMLDivElement | null = $state(null);
  let iframeEl: HTMLIFrameElement | null = $state(null);
  let toolbarEl: HTMLDivElement | null = $state(null);

  // ---- messaging state ----
  let ready = false;
  let loading = $state(true);
  let loadingSince = 0;
  let loadingTimer: number | undefined;
  let msgSeq = 0;
  const pending = new Map<number, (blob: Blob) => void>();
  const MIN_LOADING_MS = 1000;

  function beginLoading() {
    loading = true;
    loadingSince = Date.now();
    if (loadingTimer) {
      window.clearTimeout(loadingTimer);
      loadingTimer = undefined;
    }
  }

  function finishLoading() {
    const remaining = Math.max(MIN_LOADING_MS - (Date.now() - loadingSince), 0);
    if (loadingTimer) window.clearTimeout(loadingTimer);
    loadingTimer = window.setTimeout(() => {
      loading = false;
      loadingTimer = undefined;
    }, remaining);
  }

  type Payload = {
    type: 'SET_DATA';
    bgDataURL: string | null;
    paragraph: string;
    textSize: number;
    credit: string;
    darken: number;
  };
  let latest: Payload = { type: 'SET_DATA', bgDataURL, paragraph, textSize, credit, darken };

  let pushTimer: number | undefined;
  function pushLatest() {
    if (!ready || !iframeEl?.contentWindow) return;
    if (pushTimer) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      iframeEl!.contentWindow!.postMessage(latest, '*');
    }, 0);
  }

  $effect(() => {
    latest = { type: 'SET_DATA', bgDataURL, paragraph, textSize, credit, darken };
    pushLatest();
  });

  let lastBgDataURL = $state<string | null>(bgDataURL);
  $effect(() => {
    if (bgDataURL === lastBgDataURL) return;
    lastBgDataURL = bgDataURL;
    beginLoading();
  });

  let lastSrc = '';
  $effect(() => {
    if (!templatePath || templatePath === lastSrc) return;
    lastSrc = templatePath;
    ready = false;
    beginLoading();
    resetView();
  });

  $effect(() => {
    if (!aspectKey) return;
    resetView();
  });

  $effect(() => {
    beginLoading();

    if (typeof window === 'undefined') return;

    const onMessage = (e: MessageEvent) => {
      if (!iframeEl || e.source !== iframeEl.contentWindow) return;
      const { type, id, blob } = e.data ?? {};

      if (type === 'READY') {
        ready = true;
        finishLoading();
        pushLatest();
      }

      if (type === 'SETTLED') {
        finishLoading();
      }

      if (type === 'SNAPSHOT_RESULT' && id && blob) {
        const resolve = pending.get(id);
        if (resolve) {
          pending.delete(id);
          resolve(new Blob([new Uint8Array(blob.data)], { type: blob.type }));
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (loadingTimer) {
        window.clearTimeout(loadingTimer);
        loadingTimer = undefined;
      }
    };
  });

  export function snapshot(scale = 1): Promise<Blob> {
    return new Promise(async (resolve) => {
      if (!iframeEl?.contentWindow || !templatePath) return resolve(new Blob());
      if (!ready) await waitForReady(2000).catch(() => {});
      const id = ++msgSeq;
      pending.set(id, resolve);
      iframeEl.contentWindow.postMessage({ type: 'SNAPSHOT', scale, id }, '*');
    });
  }

  function waitForReady(timeoutMs: number) {
    return new Promise<void>((res, rej) => {
      if (ready) return res();
      const win = iframeEl?.contentWindow;
      if (!win) return rej(new Error('iframe not mounted'));
      const timer = setTimeout(() => {
        window.removeEventListener('message', onMsg as any);
        rej(new Error('READY timeout'));
      }, timeoutMs);
      function onMsg(e: MessageEvent) {
        if (e.source === win && e.data?.type === 'READY') {
          clearTimeout(timer);
          window.removeEventListener('message', onMsg as any);
          res();
        }
      }
      window.addEventListener('message', onMsg as any);
    });
  }

  let fitScale = $state(1);
  let zoom = $state(1);
  let pan = $state(createPanZoomState(20));
  let touchMode: 'none' | 'pan' | 'pinch' = 'none';
  let activeTouchId: number | null = null;
  let pinchTouchIds: [number, number] | null = null;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  const horizontalInset = 24;
  const topInset = 24;
  const bottomInset = 24;
  const defaultOffsetY = 20;
  let ro: ResizeObserver | null = null;
  function recomputeScale() {
    if (!hostEl) return;
    const toolbarInset = toolbarEl ? toolbarEl.offsetHeight + 24 : 0;
    const hostW = Math.max((hostEl.clientWidth || 1) - horizontalInset * 2, 1);
    const hostH = Math.max((hostEl.clientHeight || 1) - (topInset + toolbarInset + bottomInset), 1);
    fitScale = Math.min(hostW / native.w, hostH / native.h, 1);
  }
  $effect(() => {
    ro?.disconnect();
    ro = new ResizeObserver(recomputeScale);
    if (hostEl) ro.observe(hostEl);
    if (toolbarEl) ro.observe(toolbarEl);
    queueMicrotask(recomputeScale);
    return () => ro?.disconnect();
  });

  $effect(() => {
    if (!native.w || !native.h) return;
    queueMicrotask(recomputeScale);
  });

  const renderScale = $derived(fitScale * zoom);
  const transform = $derived(buildPanZoomTransform(pan.panX, pan.panY, renderScale));

  function adjustZoom(nextZoom: number) {
    zoom = clampZoom(nextZoom, 0.5, 4);
  }

  function resetView() {
    zoom = 1;
    resetPan(pan, defaultOffsetY);
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    adjustZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    startPan(pan, event, hostEl);
  }

  function onPointerMove(event: PointerEvent) {
    movePan(pan, event);
  }

  function onPointerUp(event: PointerEvent) {
    endPan(pan, event, hostEl);
  }

  function isInteractivePreviewTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && !!target.closest('button, a, input, select, textarea');
  }

  function findTouch(event: TouchEvent, id: number | null) {
    if (id === null) return null;
    return (
      Array.from(event.touches).find((touch) => touch.identifier === id) ??
      Array.from(event.changedTouches).find((touch) => touch.identifier === id) ??
      null
    );
  }

  function getDistance(a: Touch, b: Touch) {
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }

  function beginTouchPan(touch: Touch) {
    touchMode = 'pan';
    activeTouchId = touch.identifier;
    pan.isDragging = true;
    pan.dragStartX = touch.clientX;
    pan.dragStartY = touch.clientY;
    pan.dragOriginX = pan.panX;
    pan.dragOriginY = pan.panY;
    pan.activePointerId = null;
  }

  function beginPinch(event: TouchEvent) {
    const [first, second] = Array.from(event.touches);
    if (!first || !second) return;
    touchMode = 'pinch';
    activeTouchId = null;
    pan.isDragging = false;
    pinchTouchIds = [first.identifier, second.identifier];
    pinchStartDistance = getDistance(first, second);
    pinchStartZoom = zoom;
  }

  function onTouchStart(event: TouchEvent) {
    if (isInteractivePreviewTarget(event.target)) return;
    if (event.touches.length >= 2) {
      event.preventDefault();
      beginPinch(event);
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) return;
    event.preventDefault();
    beginTouchPan(touch);
  }

  function onTouchMove(event: TouchEvent) {
    if (touchMode === 'pinch') {
      if (!pinchTouchIds) return;
      const first = findTouch(event, pinchTouchIds[0]);
      const second = findTouch(event, pinchTouchIds[1]);
      if (!first || !second || pinchStartDistance <= 0) return;
      event.preventDefault();
      adjustZoom(pinchStartZoom * (getDistance(first, second) / pinchStartDistance));
      return;
    }

    if (touchMode === 'pan') {
      const touch = findTouch(event, activeTouchId);
      if (!touch) return;
      event.preventDefault();
      pan.panX = pan.dragOriginX + touch.clientX - pan.dragStartX;
      pan.panY = pan.dragOriginY + touch.clientY - pan.dragStartY;
    }
  }

  function onTouchEnd(event: TouchEvent) {
    if (touchMode === 'pinch') {
      if (event.touches.length >= 2) {
        beginPinch(event);
        return;
      }

      if (event.touches.length === 1) {
        beginTouchPan(event.touches[0]);
        return;
      }
    }

    if (touchMode === 'pan') {
      const endedTouch = Array.from(event.changedTouches).some(
        (touch) => touch.identifier === activeTouchId
      );
      if (!endedTouch && event.touches.length > 0) return;
    }

    touchMode = 'none';
    activeTouchId = null;
    pinchTouchIds = null;
    pan.isDragging = false;
  }
</script>

<PreviewStage
  bind:bindHost={hostEl}
  isDragging={pan.isDragging}
  onwheel={onWheel}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointerleave={onPointerUp}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
  ontouchcancel={onTouchEnd}
>
  <PreviewToolbar
    bind:bindToolbar={toolbarEl}
    {zoom}
    onZoomOut={() => adjustZoom(zoom - 0.1)}
    onZoomIn={() => adjustZoom(zoom + 0.1)}
    onReset={resetView}
  />

  <PreviewCanvas bind:bindIframe={iframeEl} {templatePath} {native} {transform} {loading} />
</PreviewStage>
