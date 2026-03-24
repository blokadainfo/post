<script lang="ts">
  import type { TemplateDef, FieldKey } from '@lib/templates';
  import ExportControls from '../controls/ExportControls.svelte';
  import SettingsFields from '../controls/SettingsFields.svelte';
  import StudioFooterSection from '../ui/StudioFooterSection.svelte';
  import StudioPanel from '../ui/StudioPanel.svelte';
  import StudioScrollRegion from '../ui/StudioScrollRegion.svelte';

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
    generate2x,
    onToggleResolution,
    onGenerate,
    generateDisabled,
    isGenerating,
    showExport = true,
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
    generate2x: boolean;
    onToggleResolution: () => void;
    onGenerate: () => void;
    generateDisabled: boolean;
    isGenerating: boolean;
    showExport?: boolean;
  }>();
</script>

<StudioPanel title="Preset Settings" bodyClass="flex-1 overflow-hidden">
  <div class="flex min-h-0 flex-1 flex-col">
    <StudioScrollRegion className="px-1">
      <div class="flex flex-col gap-4 px-1">
        <SettingsFields
          {activeTemplate}
          {hasField}
          {fieldConfig}
          {paragraph}
          {credit}
          {textSize}
          {darken}
          {onParagraph}
          {onCredit}
          {onTextSize}
          {onDarken}
        />
      </div>
    </StudioScrollRegion>

    {#if showExport}
      <StudioFooterSection className="px-1">
        <ExportControls
          {generate2x}
          {onToggleResolution}
          {onGenerate}
          disabled={generateDisabled}
          {isGenerating}
        />
      </StudioFooterSection>
    {/if}
  </div>
</StudioPanel>
