<script lang="ts">
  const { open, onRequestClose, children } = $props<{
    open: boolean;
    onRequestClose?: () => void;
    children?: import('svelte').Snippet;
  }>();

  let dragOffset = $state(0);
  let isDragging = $state(false);
  let dragStartY = 0;
  let activePointerId: number | null = null;
  let activeTouchId: number | null = null;
  let drawerSheetEl: HTMLDivElement | null = $state(null);
  let dragRaf = 0;
  let queuedDragY: number | null = null;
  const dismissDistance = 240;

  const transformStyle = $derived(
    open ? `translate3d(0, ${dragOffset}px, 0)` : 'translate3d(0, calc(100% + 1rem), 0)'
  );
  const backdropOpacity = $derived.by(() => {
    if (!open && !isDragging) return 0;
    const progress = Math.min(Math.max(dragOffset / dismissDistance, 0), 1);
    return 1 - progress;
  });
  const drawerSheetClass = $derived(
    `pointer-events-auto absolute right-0 bottom-0 left-0 flex max-h-[calc(100svh-0.75rem)] touch-none flex-col select-none [contain:layout_paint_style] ${
      isDragging ? '' : 'transition-transform duration-200'
    } ${open || isDragging ? 'will-change-transform' : ''}`
  );

  function isInteractiveTarget(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      !!target.closest(
        'input, textarea, select, button, a, label, [contenteditable="true"], [data-drawer-no-drag]'
      )
    );
  }

  function beginDrag(startY: number) {
    isDragging = true;
    dragStartY = startY;
  }

  function startDrag(event: PointerEvent) {
    if (!open) return;
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    beginDrag(event.clientY);
    activePointerId = event.pointerId;
    drawerSheetEl?.setPointerCapture(event.pointerId);
  }

  function startTouchDrag(event: TouchEvent) {
    if (!open) return;
    if (isInteractiveTarget(event.target)) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    event.preventDefault();
    event.stopPropagation();
    beginDrag(touch.clientY);
    activeTouchId = touch.identifier;
  }

  function flushDrag() {
    dragRaf = 0;
    if (queuedDragY === null) return;
    dragOffset = Math.max(0, queuedDragY - dragStartY);
    queuedDragY = null;
  }

  function updateDrag(clientY: number) {
    queuedDragY = clientY;
    if (dragRaf) return;
    dragRaf = window.requestAnimationFrame(flushDrag);
  }

  function moveDrag(event: PointerEvent) {
    if (!isDragging || event.pointerId !== activePointerId) return;
    updateDrag(event.clientY);
  }

  function endDrag(event?: PointerEvent) {
    if (!isDragging) return;
    if (event && event.pointerId !== activePointerId) return;
    isDragging = false;
    if (activePointerId !== null) {
      drawerSheetEl?.releasePointerCapture(activePointerId);
    }
    activePointerId = null;
    activeTouchId = null;
    if (dragRaf) {
      window.cancelAnimationFrame(dragRaf);
      dragRaf = 0;
    }
    if (queuedDragY !== null) {
      dragOffset = Math.max(0, queuedDragY - dragStartY);
      queuedDragY = null;
    }

    if (dragOffset > 120) {
      dragOffset = 0;
      onRequestClose?.();
      return;
    }

    dragOffset = 0;
  }

  $effect(() => {
    if (!isDragging || typeof window === 'undefined') return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;
      updateDrag(event.clientY);
    };

    const onPointerEnd = (event: PointerEvent) => {
      endDrag(event);
    };

    const findActiveTouch = (event: TouchEvent) => {
      return (
        Array.from(event.touches).find((touch) => touch.identifier === activeTouchId) ??
        Array.from(event.changedTouches).find((touch) => touch.identifier === activeTouchId) ??
        null
      );
    };

    const preventTouchMove = (event: TouchEvent) => {
      const touch = findActiveTouch(event);
      if (touch) updateDrag(touch.clientY);
      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (activeTouchId === null) return;
      const endedTouch = Array.from(event.changedTouches).find(
        (touch) => touch.identifier === activeTouchId
      );
      if (endedTouch && isDragging) {
        endDrag();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('touchmove', preventTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      if (dragRaf) {
        window.cancelAnimationFrame(dragRaf);
        dragRaf = 0;
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('touchmove', preventTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  });
</script>

<div
  class={`fixed inset-0 z-[70] block min-[1101px]:hidden ${open || isDragging ? 'pointer-events-auto' : 'pointer-events-none'}`}
  onpointermove={moveDrag}
  onpointerup={endDrag}
  onpointercancel={endDrag}
>
  <div
    class={`absolute inset-0 touch-none [overscroll-behavior:none] bg-black/60 ${isDragging ? '' : 'transition-opacity duration-150'}`}
    style={`opacity:${backdropOpacity};`}
    ontouchstart={startTouchDrag}
    onpointerdown={startDrag}
    onpointermove={moveDrag}
    onpointerup={endDrag}
    onpointercancel={endDrag}
    onclick={() => {
      if (!isDragging) onRequestClose?.();
    }}
  ></div>

  <div
    bind:this={drawerSheetEl}
    class={drawerSheetClass}
    style={`transform:${transformStyle};`}
    ontouchstart={startTouchDrag}
    onpointerdown={startDrag}
    onpointermove={moveDrag}
    onpointerup={endDrag}
    onpointercancel={endDrag}
  >
    <div class="flex justify-center px-6 pt-2 pb-1">
      <button
        type="button"
        aria-label="Drag drawer"
        class="h-2 w-16 cursor-grab rounded-full bg-neutral-700 active:cursor-grabbing"
      ></button>
    </div>
    {@render children?.()}
  </div>
</div>
