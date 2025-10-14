<script lang="ts">
  import { ASPECTS, type AspectKey } from '@lib/aspects';
  import { TEMPLATES, type TemplateDef } from '@lib/templates';

  // ---- callbacks ----
  const { onBG, onChange, onGenerate, isGenerating } = $props<{
    onBG: (dataURL: string | null, file: File) => void;
    onChange: (payload: {
      aspectKey: AspectKey;
      templatePath: string;
      paragraph: string;
      textSize: number;
      credit: string;
      generate2x: boolean;
      darken: number;
    }) => void;
    onGenerate: () => void;
    isGenerating: boolean;
  }>();

  // ---- state ----
  let aspectKey = $state<AspectKey>(ASPECTS[0].key);
  let templatePath = $state<string>('');
  let paragraph = $state<string>('');
  let textSize = $state<number>(48);
  let textSizeDirty = $state<boolean>(false);
  let credit = $state<string>('');
  let generate2x = $state<boolean>(true);
  let darken = $state<number>(40);

  // dropzone state
  let dzHover = $state(false);
  let dzInputEl: HTMLInputElement | null = $state(null);
  let dzFileName = $state<string>('');
  let dzPreview = $state<string | null>(null);

  // ---- derived ----
  const tplOptions = $derived(TEMPLATES.filter((t) => t.aspect === aspectKey));
  const activeTpl: TemplateDef | undefined = $derived(
    tplOptions.find((t) => t.path === templatePath)
  );

  type FieldKey = 'bg' | 'paragraph' | 'textSize' | 'credit' | 'shade';
  function has(key: FieldKey) {
    const f = activeTpl?.fields ?? [];
    return f.some((x: any) => (typeof x === 'string' ? x === key : x.key === key));
  }
  function fieldCfg<K extends FieldKey>(key: K) {
    const f = activeTpl?.fields ?? [];
    return f.find((x: any) => (typeof x === 'string' ? x === key : x.key === key)) as
      | {
          key: K;
          required?: boolean;
          min?: number;
          max?: number;
          step?: number;
          default?: number;
          rows?: number;
          label?: string;
        }
      | undefined;
  }

  // check template validity
  $effect(() => {
    if (templatePath && !tplOptions.some((t) => t.path === templatePath)) {
      templatePath = '';
    }
  });

  // set initial textSize
  $effect(() => {
    const cfg = fieldCfg('textSize');
    if (!cfg) return;

    const min = cfg.min ?? 12;
    const max = cfg.max ?? 128;
    const def = cfg.default ?? 48;

    if (!textSizeDirty) {
      textSize = Math.min(max, Math.max(min, def));
    } else {
      textSize = Math.min(max, Math.max(min, textSize));
    }
  });

  // bubble changes up
  $effect(() => {
    onChange?.({
      aspectKey,
      templatePath,
      paragraph,
      textSize,
      credit,
      generate2x,
      darken,
    });
  });

  // compute "required"
  const requiredMissing = $derived(() => {
    if (!activeTpl) return true;
    return (activeTpl.fields ?? []).some((f: any) => {
      const key = typeof f === 'string' ? f : f.key;
      const req = typeof f === 'string' ? false : !!f.required;
      if (!req) return false;
      if (key === 'bg') return !dzPreview;
      if (key === 'paragraph') return !paragraph.trim();
      if (key === 'credit') return !credit.trim();
      return false;
    });
  });

  // ---------- template dropdown ----------
  let tplOpen = $state(false);
  let tplButtonEl: HTMLButtonElement | null = $state(null);
  let tplMenuEl: HTMLDivElement | null = $state(null);
  let activeIdx = $state(0);

  $effect(() => {
    const idx = tplOptions.findIndex((t) => t.path === templatePath);
    activeIdx = idx >= 0 ? idx : 0;
  });

  function labelFor(path: string) {
    if (!path) return '— choose a template —';
    return tplOptions.find((t) => t.path === path)?.name ?? '— choose a template —';
  }

  function openTpl() {
    if (!tplOptions.length) return;
    if (!templatePath) activeIdx = 0;
    tplOpen = true;
    queueMicrotask(() => {
      tplMenuEl?.focus();
      tplMenuEl
        ?.querySelector<HTMLElement>(`[data-index="${activeIdx}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }
  function closeTpl() {
    tplOpen = false;
    tplButtonEl?.focus();
  }
  function chooseIdx(i: number) {
    const opt = tplOptions[i];
    if (!opt) return;
    templatePath = opt.path;
    tplOpen = false;
  }
  function onTplButtonKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openTpl();
    }
  }
  function onTplListKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTpl();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      chooseIdx(activeIdx);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, tplOptions.length - 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      activeIdx = 0;
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      activeIdx = tplOptions.length - 1;
      return;
    }
  }
  const onDocPointer = (e: PointerEvent) => {
    if (!tplOpen) return;
    const t = e.target as Node;
    if (tplButtonEl?.contains(t)) return;
    if (tplMenuEl?.contains(t)) return;
    tplOpen = false;
  };
  $effect(() => {
    document.addEventListener('pointerdown', onDocPointer, true);
    return () => document.removeEventListener('pointerdown', onDocPointer, true);
  });

  // ---------- dropzone helpers ----------
  function openFilePicker() {
    dzInputEl?.click();
  }
  async function handleFiles(files?: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('Max file size is 25MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dzFileName = file.name;
      dzPreview = reader.result as string;
      onBG?.(dzPreview!, file);
    };
    reader.readAsDataURL(file);
  }
  function onDzInputChange(e: Event) {
    handleFiles((e.currentTarget as HTMLInputElement).files);
  }
  function onDzDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dzHover = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }
  function onDzDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dzHover = true;
  }
  function onDzDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dzHover = false;
  }
  function onDzPaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items)
      if (it.type.startsWith('image/')) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          handleFiles({
            0: file,
            length: 1,
            item: (i: number) => (i === 0 ? file : null),
          } as unknown as FileList);
          break;
        }
      }
  }
  function clearDz() {
    dzFileName = '';
    dzPreview = null;
    if (dzInputEl) dzInputEl.value = '';
    onBG?.(null);
  }
</script>

<div
  class="w-full space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-neutral-100 lg:min-w-[454px]"
>
  <!-- Aspect -->
  <div>
    <span class="mb-1 block cursor-default text-xs font-semibold tracking-wide uppercase opacity-70"
      >Aspect</span
    >
    <div class="grid grid-cols-3 gap-2">
      {#each ASPECTS as a (a.key)}
        <button
          type="button"
          class="cursor-pointer rounded-xl border px-3 py-2 text-sm accent-[#50C2BE] transition
                 {aspectKey === a.key
            ? 'border-neutral-700 bg-neutral-800'
            : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800'}"
          onclick={() => (aspectKey = a.key)}
        >
          {a.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Template (custom dropdown) -->
  <div>
    <span class="mb-1 block cursor-default text-xs font-semibold tracking-wide uppercase opacity-70"
      >Template</span
    >

    {#if !tplOptions.length}
      <div
        class="flex h-[42px] cursor-default items-center rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-amber-400"
      >
        No templates for this aspect yet.
      </div>
    {:else}
      <button
        bind:this={tplButtonEl}
        type="button"
        class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-neutral-800
               bg-neutral-900 px-3 py-2 text-left accent-[#50C2BE] transition hover:border-neutral-700"
        aria-haspopup="listbox"
        aria-expanded={tplOpen}
        aria-controls="tpl-listbox"
        onclick={() => (tplOpen ? (tplOpen = false) : openTpl())}
        onkeydown={onTplButtonKey}
      >
        <span class="truncate">{labelFor(templatePath)}</span>
        <svg
          class="h-4 w-4 shrink-0 text-neutral-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      {#if tplOpen}
        <div
          id="tpl-listbox"
          bind:this={tplMenuEl}
          role="listbox"
          tabindex="0"
          aria-activedescendant={`tpl-opt-${activeIdx}`}
          onkeydown={onTplListKey}
          onfocus={() => {
            tplMenuEl
              ?.querySelector<HTMLElement>(`[data-index="${activeIdx}"]`)
              ?.scrollIntoView({ block: 'nearest' });
          }}
          class="mt-2 max-h-60 w-full overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-lg ring-1 ring-black/20 focus:outline-none"
        >
          {#each tplOptions as t, i (t.path)}
            <button
              id={`tpl-opt-${i}`}
              role="option"
              aria-selected={templatePath === t.path}
              tabindex="-1"
              data-index={i}
              class="flex w-full cursor-pointer items-center justify-between px-3 py-2
                     hover:bg-neutral-800/60 focus:bg-neutral-800/60
                     {i === activeIdx ? 'bg-neutral-800/60' : ''}"
              onclick={() => chooseIdx(i)}
              onmouseenter={() => (activeIdx = i)}
            >
              <span class="truncate">{t.name}</span>
              {#if templatePath === t.path}
                <svg
                  class="h-4 w-4 shrink-0 text-teal-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-7.07 7.07a1 1 0 01-1.42 0L3.296 9.87a1 1 0 011.414-1.414l3.09 3.09 6.364-6.364a1 1 0 011.54.108z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  {#if activeTpl}
    <!-- Background image -->
    {#if has('bg')}
      <div>
        <span
          class="mb-1 block cursor-default text-xs font-semibold tracking-wide uppercase opacity-70"
          >Background image</span
        >
        <div
          role="button"
          tabindex="0"
          onclick={openFilePicker}
          onkeydown={(e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && openFilePicker()}
          ondragover={onDzDragOver}
          ondragleave={onDzDragLeave}
          ondrop={onDzDrop}
          onpaste={onDzPaste}
          class="relative w-full cursor-pointer rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/60
                 p-4 transition hover:border-neutral-500
                 focus:ring-2 focus:ring-teal-400/60 focus:outline-none
                 {dzHover ? 'border-teal-400 bg-neutral-900/80' : ''}"
          aria-label="Choose image, or drop/paste here"
        >
          <input
            bind:this={dzInputEl}
            type="file"
            accept="image/*"
            class="sr-only"
            onchange={onDzInputChange}
          />
          <div class="flex items-center gap-3">
            <div class="shrink-0 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100">
              Choose file
            </div>
            <div class="min-w-0 flex-1">
              {#if dzFileName}
                <div class="truncate text-sm text-neutral-300">
                  {dzFileName}
                </div>
                <div class="text-xs text-neutral-500">Click or drop a new image to replace</div>
              {:else}
                <div class="text-sm text-neutral-400">
                  Click to browse, or <span class="text-neutral-200">drop / paste</span> an image
                </div>
                <div class="text-xs text-neutral-500">PNG, JPG, WEBP, etc.</div>
              {/if}
            </div>
            {#if dzPreview}
              <img
                src={dzPreview}
                alt=""
                class="h-9 w-9 rounded-md object-cover ring-1 ring-neutral-700"
              />
            {/if}
          </div>
          {#if dzPreview}
            <button
              type="button"
              class="absolute top-2 right-2 flex cursor-pointer items-center justify-center rounded-md bg-neutral-800/80 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
              onclick={(e) => {
                e.stopPropagation();
                clearDz();
              }}
              aria-label="Clear image">✕</button
            >
          {/if}
        </div>
      </div>
    {/if}

    <!-- Shade -->
    {#if has('shade')}
      <div class="mt-3">
        <label>
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-semibold tracking-wide uppercase opacity-70">
              {fieldCfg('shade')?.label ?? 'Darken picture'}
            </span>
            <span class="text-xs tabular-nums">{darken}%</span>
          </div>
          <input
            type="range"
            min={fieldCfg('shade')?.min ?? 0}
            max={fieldCfg('shade')?.max ?? 100}
            step={fieldCfg('shade')?.step ?? 1}
            bind:value={darken}
            class="w-full cursor-pointer accent-[#DB2340]"
          />
        </label>
      </div>
    {/if}

    <!-- Credit -->
    {#if has('credit')}
      <div>
        <label>
          <span class="mb-1 block text-xs font-semibold tracking-wide uppercase opacity-70">
            {fieldCfg('credit')?.label ?? 'Picture source / credit'}
          </span>
          <input
            class="w-full rounded-xl bg-neutral-800 px-3 py-2 accent-[#50C2BE]"
            placeholder="Blokada INFO"
            bind:value={credit}
          />
        </label>
      </div>
    {/if}

    <!-- Paragraph -->
    {#if has('paragraph')}
      <div>
        <label>
          <span class="mb-1 block text-xs font-semibold tracking-wide uppercase opacity-70">
            {fieldCfg('paragraph')?.label ?? 'Paragraph'}
          </span>
          <textarea
            rows={fieldCfg('paragraph')?.rows ?? 6}
            class="w-full rounded-xl bg-neutral-800 px-3 py-2 accent-[#50C2BE]"
            bind:value={paragraph}
          ></textarea>
        </label>
      </div>
    {/if}

    <!-- Text size (PX) -->
    {#if has('textSize')}
      <div class="mt-3">
        <label>
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-semibold tracking-wide uppercase opacity-70">
              {fieldCfg('textSize')?.label ?? 'Text size (px)'}
            </span>
            <span class="text-xs tabular-nums">
              {textSize}px
            </span>
          </div>

          <input
            type="range"
            min={fieldCfg('textSize')?.min ?? 12}
            max={fieldCfg('textSize')?.max ?? 128}
            step={fieldCfg('textSize')?.step ?? 1}
            bind:value={textSize}
            oninput={(e) => {
              const cfg = fieldCfg('textSize');
              const min = cfg?.min ?? 12;
              const max = cfg?.max ?? 128;
              textSize = Math.min(
                max,
                Math.max(min, Number((e.currentTarget as HTMLInputElement).value))
              );
              textSizeDirty = textSize !== (cfg?.default ?? 48);
            }}
            class="w-full cursor-pointer accent-[#DB2340]"
          />
        </label>
      </div>
    {/if}
  {:else}
    <div
      class="flex h-[42px] cursor-default items-center rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-amber-400"
    >
      Choose a template to see its available controls.
    </div>
  {/if}

  <!-- Footer -->
  <div class="flex items-center justify-between">
    <label class="flex cursor-pointer items-center gap-3">
      <div class="relative">
        <input type="checkbox" class="peer sr-only" bind:checked={generate2x} />
        <div
          class="h-6 w-11 rounded-full bg-neutral-700 transition-colors peer-checked:bg-[#50C2BE]"
        ></div>
        <div
          class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        ></div>
      </div>
      <span class="font-mono text-sm">{generate2x ? '2K' : 'HD'}</span>
    </label>

    <button
      type="button"
      class="inline-flex w-[200px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#50C2BE] px-4
           py-2 font-semibold text-neutral-900 accent-[#50C2BE] transition-colors
           hover:bg-teal-800 active:bg-[#50C2BE] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#50C2BE]"
      onclick={onGenerate}
      disabled={!activeTpl || requiredMissing() || isGenerating}
      title={!activeTpl
        ? 'Choose a template first'
        : requiredMissing()
          ? 'Fill required fields'
          : 'Generate'}
      aria-busy={isGenerating}
      aria-live="polite"
    >
      {#if isGenerating}
        <span class="relative inline-block">
          <span
            class="block h-4 w-4 animate-spin rounded-full border-2 border-neutral-900/30 border-t-neutral-900"
          ></span>
        </span>
        <span>Generating…</span>
      {:else}
        <span>Generate & Download</span>
      {/if}
    </button>
  </div>
</div>
