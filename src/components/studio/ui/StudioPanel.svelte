<script lang="ts">
  const {
    title,
    meta,
    bodyClass = '',
    children,
  } = $props<{
    title: string;
    meta?: string | number;
    bodyClass?: string;
    children?: import('svelte').Snippet;
  }>();
</script>

<section
  class="flex max-h-full flex-col overflow-visible rounded-t-2xl rounded-b-none border border-neutral-800 bg-neutral-900/80 text-neutral-200 backdrop-blur-[12px] min-[1101px]:min-h-full min-[1101px]:overflow-hidden min-[1101px]:rounded-none"
>
  <div
    class="flex items-center justify-between gap-4 border-b border-neutral-800 px-4 py-3 text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase"
  >
    <span>{title}</span>
    {#if meta !== undefined}
      <span>{meta}</span>
    {/if}
  </div>

  <div class={`flex min-h-0 flex-col gap-4 px-4 pt-4 pb-8 ${bodyClass}`}>
    {@render children?.()}
  </div>
</section>
