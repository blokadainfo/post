<script lang="ts">
  const { side, children } = $props<{
    side: 'left' | 'right';
    children?: import('svelte').Snippet;
  }>();
</script>

<aside
  class={`hidden min-[1101px]:fixed min-[1101px]:top-0 min-[1101px]:bottom-0 min-[1101px]:block min-[1101px]:w-[320px] min-[1101px]:overflow-y-auto ${side === 'left' ? 'min-[1101px]:left-0' : 'min-[1101px]:right-0'}`}
>
  {@render children?.()}
</aside>
