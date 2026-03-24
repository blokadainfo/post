<script lang="ts">
  const {
    type = 'button',
    active = false,
    disabled = false,
    wide = false,
    className = '',
    children,
    onclick,
  } = $props<{
    type?: 'button' | 'submit' | 'reset';
    active?: boolean;
    disabled?: boolean;
    wide?: boolean;
    className?: string;
    onclick?: (event: MouseEvent) => void;
    children?: import('svelte').Snippet;
  }>();
</script>

<button
  {type}
  {disabled}
  class={`cursor-pointer rounded-[0.85rem] border border-neutral-700 bg-black/75 px-4 py-3 text-neutral-200 transition-colors duration-150 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset ${active ? 'border-neutral-400 bg-neutral-100 text-neutral-950' : ''} ${wide ? 'w-full' : ''} ${className} disabled:cursor-not-allowed disabled:opacity-45`}
  {onclick}
>
  {@render children?.()}
</button>
