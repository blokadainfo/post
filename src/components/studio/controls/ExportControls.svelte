<script lang="ts">
  const { generate2x, onToggleResolution, onGenerate, disabled, isGenerating } = $props<{
    generate2x: boolean;
    onToggleResolution: () => void;
    onGenerate: () => void;
    disabled: boolean;
    isGenerating: boolean;
  }>();
</script>

<label class="flex items-center justify-between gap-4">
  <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">Resolution</span>
  <div class="grid grid-cols-2 gap-2">
    <button
      type="button"
      class={`cursor-pointer rounded-[0.85rem] border px-4 py-2 text-sm font-medium focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset ${!generate2x ? 'border-neutral-200 bg-neutral-100 text-neutral-950' : 'border-neutral-700 bg-black/75 text-neutral-200'}`}
      onclick={() => {
        if (generate2x) onToggleResolution();
      }}
    >
      HD
    </button>
    <button
      type="button"
      class={`cursor-pointer rounded-[0.85rem] border px-4 py-2 text-sm font-medium focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset ${generate2x ? 'border-neutral-200 bg-neutral-100 text-neutral-950' : 'border-neutral-700 bg-black/75 text-neutral-200'}`}
      onclick={() => {
        if (!generate2x) onToggleResolution();
      }}
    >
      2K
    </button>
  </div>
</label>

<button
  type="button"
  class="w-full cursor-pointer rounded-[0.85rem] bg-neutral-100 px-4 py-4 font-bold text-neutral-950 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-45"
  onclick={onGenerate}
  {disabled}
>
  {isGenerating ? 'Generating…' : 'Generate & Download'}
</button>
