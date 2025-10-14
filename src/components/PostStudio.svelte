<script lang="ts">
  import StudioControls from './StudioControls.svelte';
  import PreviewFrame from './PreviewFrame.svelte';
  import { ASPECTS, type AspectKey } from '@lib/aspects';
  import { TEMPLATES } from '@lib/templates';

  // ---- state ----
  let bgDataURL = $state<string | null>(null);
  let aspectKey = $state<AspectKey>(ASPECTS[1]?.key);
  let templatePath = $state<string>('');
  let paragraph = $state<string>('');
  let textSize = $state<number>(48);
  let credit = $state<string>('');
  let generate2x = $state<boolean>(true);
  let darken = $state<number>(0);

  let isGenerating = $state(false);

  $effect(() => {
    const belongs = TEMPLATES.some((t) => t.path === templatePath && t.aspect === aspectKey);
    if (!belongs && templatePath) templatePath = '';
  });

  function onBG(dataURL: string | null) {
    bgDataURL = dataURL;
  }
  function onChange(payload: {
    aspectKey: AspectKey;
    templatePath: string;
    paragraph: string;
    textSize: number;
    credit: string;
    generate2x: boolean;
    darken: number;
  }) {
    aspectKey = payload.aspectKey;
    templatePath = payload.templatePath;
    paragraph = payload.paragraph;
    textSize = payload.textSize;
    credit = payload.credit;
    generate2x = payload.generate2x;
    darken = payload.darken;
  }

  type PreviewFrameHandle = { snapshot: (scale?: number) => Promise<Blob> };
  let previewRef: PreviewFrameHandle | null = null;

  async function onGenerate() {
    if (!previewRef) return;
    const scale = generate2x ? 2 : 1;

    isGenerating = true;
    try {
      const blob = await previewRef.snapshot(scale);
      downloadBlob(blob, buildFilename());
    } catch (e) {
      console.error('Snapshot failed', e);
      alert('Snapshot failed. Check your template page console for errors.');
    } finally {
      isGenerating = false;
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
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
</script>

<div class="flex w-full flex-wrap justify-center gap-5">
  <section class="h-fit w-full lg:w-auto">
    <StudioControls {onBG} {onChange} {onGenerate} {isGenerating} />
  </section>

  <section
    class="h-fit w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 lg:w-auto"
  >
    <span
      class="mb-1 block cursor-default text-xs font-semibold tracking-wide uppercase opacity-70"
    >
      Template
    </span>

    <PreviewFrame
      bind:this={previewRef}
      {templatePath}
      {bgDataURL}
      {paragraph}
      {textSize}
      {credit}
      {aspectKey}
      {darken}
    />
  </section>
</div>
