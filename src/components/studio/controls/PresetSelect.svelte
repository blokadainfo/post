<script module lang="ts">
  let presetSelectCounter = 0;
</script>

<script lang="ts">
  type PresetOption = { path: string; name: string };

  let { label, value, options, onChange } = $props<{
    label: string;
    value: string;
    options: PresetOption[];
    onChange: (value: string) => void;
  }>();

  let menuOpen = $state(false);
  let highlightedIndex = $state(-1);
  let triggerEl: HTMLButtonElement | null = $state(null);
  let menuEl: HTMLDivElement | null = $state(null);
  let optionEls = $state<(HTMLButtonElement | null)[]>([]);

  const menuId = `preset-choice-menu-${++presetSelectCounter}`;

  const selectedLabel = $derived(
    options.find((template) => template.path === value)?.name ?? 'Select preset'
  );

  function syncHighlightedOption() {
    if (highlightedIndex >= 0) {
      optionEls[highlightedIndex]?.focus();
    }
  }

  function setHighlightedIndex(index: number) {
    if (options.length === 0) {
      highlightedIndex = -1;
      return;
    }

    highlightedIndex = Math.max(0, Math.min(index, options.length - 1));
  }

  function openMenu() {
    menuOpen = true;
    const selectedIndex = options.findIndex((template) => template.path === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    queueMicrotask(syncHighlightedOption);
  }

  function closeMenu() {
    menuOpen = false;
    highlightedIndex = -1;
    triggerEl?.focus();
  }

  function selectValue(nextValue: string) {
    onChange(nextValue);
    closeMenu();
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!menuOpen) openMenu();
      else {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        setHighlightedIndex(
          highlightedIndex >= 0 ? highlightedIndex + delta : delta > 0 ? 0 : options.length - 1
        );
        queueMicrotask(syncHighlightedOption);
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!menuOpen) openMenu();
      else closeMenu();
    }

    if (event.key === 'Escape' && menuOpen) {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    if (!menuOpen) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex(
        highlightedIndex >= 0 ? highlightedIndex + delta : delta > 0 ? 0 : options.length - 1
      );
      queueMicrotask(syncHighlightedOption);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setHighlightedIndex(0);
      queueMicrotask(syncHighlightedOption);
    }

    if (event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
      queueMicrotask(syncHighlightedOption);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }

    if (event.key === 'Tab') {
      closeMenu();
    }
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!menuOpen) return;
    if (!(event.target instanceof Node)) return;
    if (triggerEl?.contains(event.target) || menuEl?.contains(event.target)) return;
    closeMenu();
  }

  function handleOptionFocus(index: number) {
    highlightedIndex = index;
  }
</script>

<svelte:document onclick={handleDocumentClick} />

<div class="flex flex-col gap-2">
  <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">{label}</span>

  <div class="hidden min-[1101px]:flex min-[1101px]:flex-col min-[1101px]:gap-2">
    {#each options as template (template.path)}
      <button
        type="button"
        class={`w-full cursor-pointer rounded-[0.85rem] border px-4 py-3 text-left text-[0.82rem] leading-tight text-neutral-200 transition-colors duration-150 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset ${template.path === value ? 'border-neutral-400 bg-neutral-100 text-neutral-950' : 'border-neutral-700 bg-black/75'}`}
        onclick={() => onChange(template.path)}
      >
        {template.name}
      </button>
    {/each}
  </div>

  <div class="relative min-[1101px]:hidden">
    <button
      bind:this={triggerEl}
      type="button"
      data-drawer-no-drag
      aria-haspopup="listbox"
      aria-expanded={menuOpen}
      aria-controls={menuId}
      class="flex w-full cursor-pointer items-center justify-between rounded-[0.85rem] border border-neutral-700 bg-black/75 px-4 py-3 text-sm text-neutral-100 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
      onclick={() => (menuOpen ? closeMenu() : openMenu())}
      onkeydown={handleTriggerKeydown}
    >
      <span>{selectedLabel}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4 text-neutral-400"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    </button>

    {#if menuOpen}
      <div
        bind:this={menuEl}
        id={menuId}
        role="listbox"
        tabindex="-1"
        data-drawer-no-drag
        class="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 flex max-h-[9.75rem] w-full flex-col overflow-y-auto rounded-[0.85rem] border border-neutral-800 bg-neutral-950/98 p-2 backdrop-blur-[14px]"
        onkeydown={handleMenuKeydown}
      >
        {#each options as template, index (template.path)}
          <button
            bind:this={optionEls[index]}
            id={`${menuId}-option-${index}`}
            type="button"
            data-drawer-no-drag
            role="option"
            aria-selected={template.path === value}
            tabindex={highlightedIndex === index ? 0 : -1}
            class={`flex w-full cursor-pointer items-center justify-between rounded-[0.7rem] px-3 py-2 text-left text-sm focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset ${template.path === value ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-200 hover:bg-white/8'} ${highlightedIndex === index && template.path !== value ? 'bg-white/8' : ''}`}
            onfocus={() => handleOptionFocus(index)}
            onclick={() => selectValue(template.path)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectValue(template.path);
              }
            }}
          >
            <span>{template.name}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
