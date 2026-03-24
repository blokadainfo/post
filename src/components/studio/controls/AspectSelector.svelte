<script lang="ts">
  import type { AspectKey } from '@lib/aspects';
  import StudioButton from '../ui/StudioButton.svelte';

  const { aspects, value, onChange } = $props<{
    aspects: readonly { key: AspectKey; label: string }[];
    value: AspectKey;
    onChange: (next: AspectKey) => void;
  }>();
</script>

<div class="flex flex-col gap-2">
  <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">Format</span>
  <div class="grid grid-cols-3 gap-2">
    {#each aspects as aspect (aspect.key)}
      <StudioButton active={aspect.key === value} onclick={() => onChange(aspect.key)}>
        {aspect.label}
      </StudioButton>
    {/each}
  </div>
</div>
