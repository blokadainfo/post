<script lang="ts">
  import ExportControls from '../controls/ExportControls.svelte';
  import StudioPanel from '../ui/StudioPanel.svelte';

  const { generate2x, onToggleResolution, onGenerate, generateDisabled, isGenerating } = $props<{
    generate2x: boolean;
    onToggleResolution: () => void;
    onGenerate: () => void;
    generateDisabled: boolean;
    isGenerating: boolean;
  }>();
</script>

<StudioPanel title="Export">
  <ExportControls
    {generate2x}
    {onToggleResolution}
    {onGenerate}
    disabled={generateDisabled}
    {isGenerating}
  />
</StudioPanel>
