<script lang="ts">
  import type { AspectKey } from '@lib/aspects';
  import AspectSelector from '../controls/AspectSelector.svelte';
  import ImageDropzone from '../controls/ImageDropzone.svelte';
  import PresetSelect from '../controls/PresetSelect.svelte';
  import StudioPanel from '../ui/StudioPanel.svelte';
  import StudioScrollRegion from '../ui/StudioScrollRegion.svelte';

  const {
    title,
    aspects,
    aspectKey,
    onAspectChange,
    templatePath,
    templateOptions,
    onTemplateChange,
    imageEnabled,
    imageLabel,
    fileName,
    hasImage,
    isDropActive = false,
    onFiles,
    onClearImage,
  } = $props<{
    title: string;
    aspects: readonly { key: AspectKey; label: string }[];
    aspectKey: AspectKey;
    onAspectChange: (next: AspectKey) => void;
    templatePath: string;
    templateOptions: { path: string; name: string }[];
    onTemplateChange: (value: string) => void;
    imageEnabled: boolean;
    imageLabel: string;
    fileName: string;
    hasImage: boolean;
    isDropActive?: boolean;
    onFiles: (files?: FileList | null) => void;
    onClearImage: () => void;
  }>();
</script>

<StudioPanel
  {title}
  bodyClass="flex-1 overflow-y-auto overflow-x-visible min-[1101px]:overflow-hidden"
>
  <ImageDropzone
    label={imageLabel}
    {fileName}
    {hasImage}
    isActive={isDropActive}
    disabled={!imageEnabled}
    {onFiles}
    onClear={onClearImage}
  />

  <AspectSelector {aspects} value={aspectKey} onChange={onAspectChange} />

  <StudioScrollRegion className="px-1">
    <PresetSelect
      label="Preset choice"
      value={templatePath}
      options={templateOptions}
      onChange={onTemplateChange}
    />
  </StudioScrollRegion>
</StudioPanel>
