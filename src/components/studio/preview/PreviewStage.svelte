<script lang="ts">
  let {
    isDragging = false,
    bindHost = $bindable<HTMLDivElement | null>(null),
    children,
    onwheel,
    onpointerdown,
    onpointermove,
    onpointerup,
    onpointerleave,
    ontouchstart,
    ontouchmove,
    ontouchend,
    ontouchcancel,
  } = $props<{
    isDragging?: boolean;
    bindHost?: HTMLDivElement | null;
    children?: import('svelte').Snippet;
    onwheel?: (event: WheelEvent) => void;
    onpointerdown?: (event: PointerEvent) => void;
    onpointermove?: (event: PointerEvent) => void;
    onpointerup?: (event: PointerEvent) => void;
    onpointerleave?: (event: PointerEvent) => void;
    ontouchstart?: (event: TouchEvent) => void;
    ontouchmove?: (event: TouchEvent) => void;
    ontouchend?: (event: TouchEvent) => void;
    ontouchcancel?: (event: TouchEvent) => void;
  }>();
</script>

<div
  bind:this={bindHost}
  class={`relative h-full min-h-0 w-full flex-1 touch-none overflow-hidden bg-[#0a0a0a] bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:28px_28px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
  {onwheel}
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  {onpointerleave}
  {ontouchstart}
  {ontouchmove}
  {ontouchend}
  {ontouchcancel}
>
  {@render children?.()}
</div>
