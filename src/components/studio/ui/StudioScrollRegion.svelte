<script lang="ts">
  const { className = '', children } = $props<{
    className?: string;
    children?: import('svelte').Snippet;
  }>();
</script>

<div class={`min-h-0 flex-1 overflow-visible min-[1101px]:overflow-y-auto ${className}`}>
  {@render children?.()}
</div>
