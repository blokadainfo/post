<script lang="ts">
  import ImageCropDialog from '../dialogs/ImageCropDialog.svelte';
  import PreviewFrame from '../preview/PreviewFrame.svelte';
  import ExportSidebarContent from '../sidebars/ExportSidebarContent.svelte';
  import PresetSidebarContent from '../sidebars/PresetSidebarContent.svelte';
  import SettingsSidebarContent from '../sidebars/SettingsSidebarContent.svelte';
  import StudioDrawer from '../ui/StudioDrawer.svelte';
  import StudioSidebar from '../ui/StudioSidebar.svelte';
  import {
    buildExportSidebarProps,
    buildPresetSidebarProps,
    buildSettingsSidebarProps,
  } from '@lib/studio/studio-presenters';
  import {
    applyCroppedImage,
    closeCropDialog,
    closeMobilePanel,
    createStudioState,
    getActiveAspect,
    hasField,
    syncTemplateSelection,
    syncTextSize,
    toggleMobilePanel,
  } from '@lib/studio/studio-state';

  let studio = $state(createStudioState());
  const activeAspect = $derived(getActiveAspect(studio));

  $effect(() => {
    syncTemplateSelection(studio);
  });

  $effect(() => {
    syncTextSize(studio);
  });

  type PreviewFrameHandle = { snapshot: (scale?: number) => Promise<Blob> };
  let previewRef: PreviewFrameHandle | null = null;

  async function onGenerate() {
    if (!previewRef) return;
    studio.isGenerating = true;

    try {
      const blob = await previewRef.snapshot(studio.generate2x ? 2 : 1);
      downloadBlob(blob, buildFilename());
    } catch (error) {
      console.error('Snapshot failed', error);
      alert('Snapshot failed. Check your template page console for errors.');
    } finally {
      studio.isGenerating = false;
    }
  }

  function buildFilename() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `post-${yy}${MM}${dd}${hh}${mm}${ss}.png`;
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const presetSidebarProps = $derived(buildPresetSidebarProps(studio));
  const settingsSidebarProps = $derived(buildSettingsSidebarProps(studio, onGenerate));
  const exportSidebarProps = $derived(buildExportSidebarProps(studio, onGenerate));
</script>

<div
  class="min-h-svh select-none max-[1100px]:flex max-[1100px]:flex-col max-[1100px]:overflow-hidden"
>
  <div
    class="min-h-svh max-[1100px]:flex max-[1100px]:min-h-0 max-[1100px]:flex-1 max-[1100px]:flex-col"
  >
    <StudioSidebar side="left">
      <PresetSidebarContent {...presetSidebarProps} />
    </StudioSidebar>

    <section
      class="mx-[320px] flex min-h-svh min-w-0 flex-col border-x border-neutral-800 bg-neutral-900/80 text-neutral-200 backdrop-blur-[12px] max-[1100px]:m-0 max-[1100px]:min-h-0 max-[1100px]:flex-1"
    >
      <PreviewFrame
        bind:this={previewRef}
        templatePath={studio.templatePath}
        bgDataURL={studio.bgDataURL}
        paragraph={studio.paragraph}
        textSize={studio.textSize}
        credit={studio.credit}
        aspectKey={studio.aspectKey}
        darken={hasField(studio, 'shade') ? studio.darken : 0}
      />
    </section>

    <StudioSidebar side="right">
      <SettingsSidebarContent {...settingsSidebarProps} />
    </StudioSidebar>
  </div>

  {#if studio.mobilePanel}
    <button
      type="button"
      class="fixed inset-0 z-40 border-0 bg-black/55 min-[1101px]:hidden"
      aria-label="Close drawer"
      onclick={() => closeMobilePanel(studio)}
    ></button>
  {/if}

  <StudioDrawer open={studio.isMobileDrawerOpen} onRequestClose={() => closeMobilePanel(studio)}>
    {#if studio.mobilePanel === 'input'}
      <PresetSidebarContent {...presetSidebarProps} />
    {/if}

    {#if studio.mobilePanel === 'settings'}
      <SettingsSidebarContent {...settingsSidebarProps} showExport={false} />
    {/if}

    {#if studio.mobilePanel === 'export'}
      <ExportSidebarContent {...exportSidebarProps} />
    {/if}
  </StudioDrawer>

  <nav
    class="relative z-[60] grid shrink-0 grid-cols-3 gap-3 border-t border-neutral-800 bg-black/95 p-3 backdrop-blur-[16px] min-[1101px]:hidden"
  >
    <button
      type="button"
      class={`cursor-pointer rounded-[0.9rem] border border-neutral-700 bg-neutral-900 px-4 py-4 text-sm tracking-[0.08em] text-neutral-200 uppercase ${studio.mobilePanel === 'input' && studio.isMobileDrawerOpen ? 'border-neutral-400 bg-neutral-100' : ''}`}
      onclick={() => toggleMobilePanel(studio, 'input')}
    >
      Preset
    </button>
    <button
      type="button"
      class={`cursor-pointer rounded-[0.9rem] border border-neutral-700 bg-neutral-900 px-4 py-4 text-sm tracking-[0.08em] text-neutral-200 uppercase ${studio.mobilePanel === 'settings' && studio.isMobileDrawerOpen ? 'border-neutral-400 bg-neutral-100' : ''}`}
      onclick={() => toggleMobilePanel(studio, 'settings')}
    >
      Settings
    </button>
    <button
      type="button"
      class={`cursor-pointer rounded-[0.9rem] border border-neutral-700 bg-neutral-900 px-4 py-4 text-sm tracking-[0.08em] text-neutral-200 uppercase ${studio.mobilePanel === 'export' && studio.isMobileDrawerOpen ? 'border-neutral-400 bg-neutral-100' : ''}`}
      onclick={() => toggleMobilePanel(studio, 'export')}
    >
      Export
    </button>
  </nav>
</div>

<ImageCropDialog
  open={studio.cropDialogOpen}
  imageSrc={studio.pendingImageSrc}
  aspectSize={activeAspect.size}
  onCancel={() => closeCropDialog(studio)}
  onConfirm={(dataUrl) => applyCroppedImage(studio, dataUrl)}
/>
