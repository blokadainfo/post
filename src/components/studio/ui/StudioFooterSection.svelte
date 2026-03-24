<script lang="ts">
  const { className = '', children } = $props<{
    className?: string;
    children?: import('svelte').Snippet;
  }>();
</script>

<div class={`mt-4 flex flex-none flex-col gap-4 border-t border-neutral-800 pt-4 ${className}`}>
  {@render children?.()}
</div>
