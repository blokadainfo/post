export type PanZoomState = {
  panX: number;
  panY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragOriginX: number;
  dragOriginY: number;
  activePointerId: number | null;
};

export function createPanZoomState(initialPanY = 0): PanZoomState {
  return {
    panX: 0,
    panY: initialPanY,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragOriginX: 0,
    dragOriginY: 0,
    activePointerId: null,
  };
}

export function clampZoom(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildPanZoomTransform(panX: number, panY: number, scale: number) {
  return `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
}

export function resetPan(state: PanZoomState, defaultPanY = 0) {
  state.panX = 0;
  state.panY = defaultPanY;
}

export function startPan(
  state: PanZoomState,
  event: PointerEvent,
  host?: { setPointerCapture(pointerId: number): void } | null
) {
  state.isDragging = true;
  state.dragStartX = event.clientX;
  state.dragStartY = event.clientY;
  state.dragOriginX = state.panX;
  state.dragOriginY = state.panY;
  state.activePointerId = event.pointerId;
  host?.setPointerCapture(event.pointerId);
}

export function movePan(
  state: PanZoomState,
  event: PointerEvent,
  mapPosition?: (nextX: number, nextY: number) => { x: number; y: number }
) {
  if (!state.isDragging) return;
  if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;

  const nextX = state.dragOriginX + event.clientX - state.dragStartX;
  const nextY = state.dragOriginY + event.clientY - state.dragStartY;
  const next = mapPosition ? mapPosition(nextX, nextY) : { x: nextX, y: nextY };
  state.panX = next.x;
  state.panY = next.y;
}

export function endPan(
  state: PanZoomState,
  event: PointerEvent,
  host?: { releasePointerCapture(pointerId: number): void } | null
) {
  if (!state.isDragging) return;
  if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;
  state.isDragging = false;
  if (state.activePointerId !== null) {
    host?.releasePointerCapture(state.activePointerId);
  }
  state.activePointerId = null;
}
