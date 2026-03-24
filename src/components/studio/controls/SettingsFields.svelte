<script lang="ts">
  import type { TemplateDef, FieldKey } from '@lib/templates';

  const {
    activeTemplate,
    hasField,
    fieldConfig,
    paragraph,
    credit,
    textSize,
    darken,
    onParagraph,
    onCredit,
    onTextSize,
    onDarken,
  } = $props<{
    activeTemplate: TemplateDef | undefined;
    hasField: (key: FieldKey) => boolean;
    fieldConfig: <K extends FieldKey>(
      key: K
    ) => Extract<TemplateDef['fields'][number], { key: K }> | undefined;
    paragraph: string;
    credit: string;
    textSize: number;
    darken: number;
    onParagraph: (value: string) => void;
    onCredit: (value: string) => void;
    onTextSize: (value: number) => void;
    onDarken: (value: number) => void;
  }>();

  function blurActiveTextField() {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      active.blur();
    }
  }

  function claimSliderInteraction(event: Event) {
    blurActiveTextField();
    const target = event.currentTarget;
    if (target instanceof HTMLInputElement) {
      target.focus({ preventScroll: true });
    }
  }
</script>

{#if hasField('paragraph')}
  <label class="flex flex-col gap-2">
    <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">
      {fieldConfig('paragraph')?.label ?? 'Paragraph'}
    </span>
    <textarea
      rows={fieldConfig('paragraph')?.rows ?? 6}
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      value={paragraph}
      class="min-h-40 w-full resize-y rounded-[0.85rem] border border-neutral-700 bg-black/75 px-4 py-3 text-neutral-100 select-text focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
      oninput={(event) => onParagraph((event.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </label>
{/if}

{#if hasField('credit')}
  <label class="flex flex-col gap-2">
    <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">
      {fieldConfig('credit')?.label ?? 'Picture source / credit'}
    </span>
    <input
      type="text"
      value={credit}
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      spellcheck="false"
      inputmode="text"
      class="w-full rounded-[0.85rem] border border-neutral-700 bg-black/75 px-4 py-3 text-neutral-100 select-text focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
      placeholder="Blokada INFO"
      oninput={(event) => onCredit((event.currentTarget as HTMLInputElement).value)}
    />
  </label>
{/if}

{#if activeTemplate}
  {#if hasField('shade')}
    <label class="flex flex-col gap-2">
      <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">
        {fieldConfig('shade')?.label ?? 'Darken picture'}: {darken}%
      </span>
      <input
        type="range"
        min={fieldConfig('shade')?.min ?? 0}
        max={fieldConfig('shade')?.max ?? 100}
        step={fieldConfig('shade')?.step ?? 1}
        value={darken}
        class="w-full cursor-pointer touch-auto accent-neutral-200"
        data-drawer-no-drag
        onpointerdown={claimSliderInteraction}
        ontouchstart={claimSliderInteraction}
        oninput={(event) => onDarken(Number((event.currentTarget as HTMLInputElement).value))}
      />
    </label>
  {/if}

  {#if hasField('textSize')}
    <label class="flex flex-col gap-2">
      <span class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">
        {fieldConfig('textSize')?.label ?? 'Text size'}: {textSize}px
      </span>
      <input
        type="range"
        min={fieldConfig('textSize')?.min ?? 12}
        max={fieldConfig('textSize')?.max ?? 128}
        step={fieldConfig('textSize')?.step ?? 1}
        value={textSize}
        class="w-full cursor-pointer touch-auto accent-neutral-200"
        data-drawer-no-drag
        onpointerdown={claimSliderInteraction}
        ontouchstart={claimSliderInteraction}
        oninput={(event) => onTextSize(Number((event.currentTarget as HTMLInputElement).value))}
      />
    </label>
  {/if}
{:else}
  <p class="m-0 text-neutral-500">Choose a preset to see its controls.</p>
{/if}
