<script lang="ts">
  import {
    buildPanZoomTransform,
    clampZoom,
    createPanZoomState,
    endPan,
    movePan,
    resetPan,
    startPan,
  } from '@lib/studio/pan-zoom';

  type AspectSize = { w: number; h: number };

  const { open, imageSrc, aspectSize, onCancel, onConfirm } = $props<{
    open: boolean;
    imageSrc: string | null;
    aspectSize: AspectSize;
    onCancel: () => void;
    onConfirm: (dataUrl: string) => void;
  }>();

  let imageEl: HTMLImageElement | null = $state(null);
  let cropViewportEl: HTMLDivElement | null = $state(null);
  let imageLoaded = $state(false);
  let naturalWidth = $state(0);
  let naturalHeight = $state(0);
  let cropWidth = $state(0);
  let cropHeight = $state(0);
  let baseScale = $state(1);
  let zoom = $state(1);
  let pan = $state(createPanZoomState());
  let touchMode: 'none' | 'pan' | 'pinch' = 'none';
  let activeTouchId: number | null = null;
  let pinchTouchIds: [number, number] | null = null;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let resizeObserver: ResizeObserver | null = null;

  const aspectRatio = $derived(aspectSize.w / aspectSize.h);
  const displayScale = $derived(baseScale * zoom);
  const imageStyle = $derived(buildPanZoomTransform(pan.panX, pan.panY, displayScale));

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function clampPan(nextX: number, nextY: number, scale = displayScale) {
    const horizontalLimit = (naturalWidth * scale + cropWidth) / 2;
    const verticalLimit = (naturalHeight * scale + cropHeight) / 2;

    return {
      x: clamp(nextX, -horizontalLimit, horizontalLimit),
      y: clamp(nextY, -verticalLimit, verticalLimit),
    };
  }

  function fitViewport() {
    if (!cropViewportEl) return;
    const viewportWidth = cropViewportEl.clientWidth || 1;
    const viewportHeight = cropViewportEl.clientHeight || 1;
    if (!naturalWidth || !naturalHeight || !viewportWidth || !viewportHeight) return;

    const viewportRatio = viewportWidth / viewportHeight;
    if (viewportRatio > aspectRatio) {
      cropHeight = viewportHeight;
      cropWidth = cropHeight * aspectRatio;
    } else {
      cropWidth = viewportWidth;
      cropHeight = cropWidth / aspectRatio;
    }

    baseScale = Math.max(cropWidth / naturalWidth, cropHeight / naturalHeight);
    resetCrop();
  }

  function resetCrop() {
    zoom = 1;
    resetPan(pan);
  }

  function handleImageLoad() {
    if (!imageEl) return;
    naturalWidth = imageEl.naturalWidth;
    naturalHeight = imageEl.naturalHeight;
    imageLoaded = true;
    queueMicrotask(fitViewport);
  }

  $effect(() => {
    if (!open) return;
    imageLoaded = false;
    naturalWidth = 0;
    naturalHeight = 0;
    resetCrop();
    queueMicrotask(fitViewport);
  });

  $effect(() => {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => fitViewport());
    if (cropViewportEl) resizeObserver.observe(cropViewportEl);
    return () => resizeObserver?.disconnect();
  });

  function onPointerDown(event: PointerEvent) {
    if (!imageLoaded) return;
    startPan(pan, event, cropViewportEl);
  }

  function onPointerMove(event: PointerEvent) {
    movePan(pan, event, (nextX, nextY) => clampPan(nextX, nextY));
  }

  function onPointerUp(event: PointerEvent) {
    endPan(pan, event, cropViewportEl);
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    handleZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  }

  function handleZoom(nextZoom: number) {
    zoom = clampZoom(nextZoom, 0.5, 3);
    const next = clampPan(pan.panX, pan.panY, baseScale * zoom);
    pan.panX = next.x;
    pan.panY = next.y;
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
    if (!imageLoaded) return;
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
      handleZoom(pinchStartZoom * (getDistance(first, second) / pinchStartDistance));
      return;
    }

    if (touchMode === 'pan') {
      const touch = findTouch(event, activeTouchId);
      if (!touch) return;
      event.preventDefault();
      const next = clampPan(
        pan.dragOriginX + touch.clientX - pan.dragStartX,
        pan.dragOriginY + touch.clientY - pan.dragStartY
      );
      pan.panX = next.x;
      pan.panY = next.y;
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

  function confirmCrop() {
    if (!imageLoaded || !imageEl || !cropWidth || !cropHeight || !displayScale) return;

    const canvas = document.createElement('canvas');
    canvas.width = aspectSize.w;
    canvas.height = aspectSize.h;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const exportScale = canvas.width / cropWidth;
    const drawWidth = naturalWidth * displayScale * exportScale;
    const drawHeight = naturalHeight * displayScale * exportScale;
    const drawX = canvas.width / 2 - drawWidth / 2 + pan.panX * exportScale;
    const drawY = canvas.height / 2 - drawHeight / 2 + pan.panY * exportScale;

    context.drawImage(imageEl, drawX, drawY, drawWidth, drawHeight);

    onConfirm(canvas.toDataURL('image/png'));
  }
</script>

{#if open && imageSrc}
  <div class="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 sm:p-4">
    <div
      class="flex max-h-[calc(100svh-1.5rem)] w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-[1.25rem] border border-neutral-800 bg-neutral-950 p-4 text-neutral-100 shadow-2xl sm:max-h-[calc(100svh-2rem)] sm:gap-5 sm:p-5"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">Crop background image</h2>
          <p class="text-sm text-neutral-400">
            Position the image inside the {aspectSize.w} × {aspectSize.h} frame.
          </p>
        </div>
        <button
          type="button"
          class="rounded-[0.8rem] border border-neutral-700 px-3 py-2 text-sm text-neutral-200 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
          onclick={onCancel}
        >
          Cancel
        </button>
      </div>

      <div
        bind:this={cropViewportEl}
        class="relative flex h-[min(52svh,32rem)] w-full shrink-0 touch-none items-center justify-center overflow-hidden [overscroll-behavior:none] bg-black sm:h-[min(70vh,44rem)]"
        onwheel={onWheel}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        ontouchstart={onTouchStart}
        ontouchmove={onTouchMove}
        ontouchend={onTouchEnd}
        ontouchcancel={onTouchEnd}
      >
        <div
          class="pointer-events-none absolute top-1/2 left-1/2 overflow-hidden border border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.58)]"
          style={`width:${cropWidth}px;height:${cropHeight}px;transform:translate(-50%,-50%);`}
        >
          <div class="absolute inset-0 bg-black"></div>
          <img
            bind:this={imageEl}
            src={imageSrc}
            alt="Crop preview"
            class="absolute top-1/2 left-1/2 max-w-none select-none"
            style={`transform:${imageStyle};`}
            draggable="false"
            onload={handleImageLoad}
          />
          <div
            class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:25%_25%] opacity-80"
          ></div>
          <div class="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/45"></div>
          <div class="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-white/45"></div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col gap-4 overflow-y-auto sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">
            Drag to position. Use mouse wheel to zoom. Current zoom: {zoom.toFixed(2)}x
          </span>
          <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              class="rounded-[0.9rem] border border-neutral-700 px-4 py-3 text-sm text-neutral-200 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
              onclick={() => handleZoom(zoom - 0.1)}
            >
              Zoom out
            </button>
            <button
              type="button"
              class="rounded-[0.9rem] border border-neutral-700 px-4 py-3 text-sm text-neutral-200 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
              onclick={() => handleZoom(zoom + 0.1)}
            >
              Zoom in
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-none sm:flex-wrap sm:items-center">
          <button
            type="button"
            class="rounded-[0.9rem] border border-neutral-700 px-4 py-3 text-sm text-neutral-200 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
            onclick={resetCrop}
          >
            Reset
          </button>
          <button
            type="button"
            class="rounded-[0.9rem] bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-950 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
            onclick={confirmCrop}
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
