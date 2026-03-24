<script lang="ts">
  import StudioButton from '../ui/StudioButton.svelte';

  const {
    label,
    fileName,
    hasImage,
    isActive = false,
    disabled = false,
    onFiles,
    onClear,
  } = $props<{
    label: string;
    fileName: string;
    hasImage: boolean;
    isActive?: boolean;
    disabled?: boolean;
    onFiles: (files?: FileList | null) => void;
    onClear: () => void;
  }>();

  let inputEl: HTMLInputElement | null = null;

  function openPicker() {
    if (disabled) return;
    inputEl?.click();
  }

  function handlePaste(event: ClipboardEvent) {
    if (disabled) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (!item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (!file) continue;

      event.preventDefault();
      onFiles({
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
      } as unknown as FileList);
      break;
    }
  }

  function clear(event: MouseEvent) {
    event.stopPropagation();
    if (disabled) return;
    if (inputEl) inputEl.value = '';
    onClear();
  }
</script>

<div class="flex flex-col gap-2">
  <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">{label}</span>
  <div
    class={`flex items-center justify-between gap-4 rounded-[0.85rem] border border-dashed px-4 py-4 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset ${disabled ? 'cursor-not-allowed border-neutral-800 bg-black/30 opacity-55' : 'cursor-pointer'} ${!disabled && isActive ? 'border-neutral-500 bg-white/5' : ''} ${!disabled && !isActive ? 'border-neutral-600 bg-black/55' : ''}`}
    role="button"
    tabindex={disabled ? -1 : 0}
    onclick={openPicker}
    onkeydown={(event) => (event.key === 'Enter' || event.key === ' ') && openPicker()}
    ondragover={(event) => {
      if (disabled) return;
      event.preventDefault();
    }}
    ondrop={(event) => {
      if (disabled) return;
      event.preventDefault();
      onFiles(event.dataTransfer?.files ?? null);
    }}
    onpaste={handlePaste}
  >
    <input
      bind:this={inputEl}
      type="file"
      accept="image/*"
      class="sr-only"
      {disabled}
      onchange={(event) => onFiles((event.currentTarget as HTMLInputElement).files)}
    />
    <div class="min-w-0 flex-1">
      <strong class="block truncate text-[0.95rem] text-neutral-100">
        {disabled ? 'Background image unavailable' : fileName || 'Drop image or click to browse'}
      </strong>
      {#if disabled || !hasImage}
        <p class="mt-1 text-[0.8rem] text-neutral-500">
          {disabled
            ? 'Choose a preset with background media.'
            : 'PNG, JPG, WEBP. Paste also works.'}
        </p>
      {/if}
    </div>
    {#if hasImage && !disabled}
      <StudioButton onclick={clear} className="px-3 py-2 text-sm">Clear</StudioButton>
    {/if}
  </div>
</div>
