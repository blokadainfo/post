<script lang="ts">
  let {
    zoom,
    onZoomOut,
    onZoomIn,
    onReset,
    bindToolbar = $bindable<HTMLDivElement | null>(null),
  } = $props<{
    zoom: number;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReset: () => void;
    bindToolbar?: HTMLDivElement | null;
  }>();
</script>

<div
  bind:this={bindToolbar}
  class="absolute top-4 right-4 left-4 z-20 flex items-center justify-between gap-3 text-[0.82rem] text-neutral-400"
>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="cursor-pointer rounded-[0.7rem] border border-neutral-700 bg-black/80 px-3 py-[0.55rem] text-neutral-200 backdrop-blur-[10px] focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
      onclick={onZoomOut}
      onpointerdown={(event) => event.stopPropagation()}
    >
      -
    </button>
    <span>{Math.round(zoom * 100)}%</span>
    <button
      type="button"
      class="cursor-pointer rounded-[0.7rem] border border-neutral-700 bg-black/80 px-3 py-[0.55rem] text-neutral-200 backdrop-blur-[10px] focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
      onclick={onZoomIn}
      onpointerdown={(event) => event.stopPropagation()}
    >
      +
    </button>
  </div>

  <button
    type="button"
    class="cursor-pointer rounded-[0.7rem] border border-neutral-700 bg-black/80 px-3 py-[0.55rem] text-neutral-200 backdrop-blur-[10px] focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
    onclick={onReset}
    onpointerdown={(event) => event.stopPropagation()}
  >
    Reset view
  </button>
</div>
