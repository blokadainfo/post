<script lang="ts">
  import StudioControls from "./StudioControls.svelte";
  import PreviewFrame from "./PreviewFrame.svelte";
  import { ASPECTS, type AspectKey } from "@lib/aspects";
  import { TEMPLATES } from "@lib/templates";

  // ---- state ----
  let bgDataURL = $state<string | null>(null);
  let aspectKey = $state<AspectKey>(ASPECTS[1]?.key);
  let templatePath = $state<string>("");
  let paragraph = $state<string>("");
  let credit = $state<string>("");
  let generate2x = $state<boolean>(true);
  let darken = $state<number>(0);

  let isGenerating = $state(false);

  $effect(() => {
    const belongs = TEMPLATES.some(
      (t) => t.path === templatePath && t.aspect === aspectKey
    );
    if (!belongs && templatePath) templatePath = "";
  });

  function onBG(dataURL: string) {
    bgDataURL = dataURL;
  }
  function onChange(payload: {
    aspectKey: AspectKey;
    templatePath: string;
    paragraph: string;
    credit: string;
    generate2x: boolean;
    darken: number;
  }) {
    aspectKey = payload.aspectKey;
    templatePath = payload.templatePath;
    paragraph = payload.paragraph;
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
      console.error("Snapshot failed", e);
      alert("Snapshot failed. Check your template page console for errors.");
    } finally {
      isGenerating = false;
    }
  }

  function buildFilename() {
    const aspectSlug = aspectKey;
    const tmplSlug = templatePath.split("/").slice(-1)[0] || "template";
    const suffix = generate2x ? "@2x" : "";
    return `post-${aspectSlug}-${tmplSlug}${suffix}.png`;
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
</script>

<div class="w-full flex flex-wrap justify-center gap-5">
  <section class="w-full lg:w-auto h-fit">
    <StudioControls {onBG} {onChange} {onGenerate} {isGenerating} />
  </section>

  <section
    class="w-full lg:w-auto border border-neutral-800 bg-neutral-900/60 rounded-2xl p-3 h-fit"
  >
    <div class="cursor-default flex items-center justify-between mb-2">
      <div class="hidden sm:block text-neutral-300 text-sm">
        Preview — <span class="capitalize">{aspectKey}</span>
      </div>
      <div class="text-sm">
        <span class="text-neutral-300">Template:</span>
        <code class="text-neutral-400 font-mono"
          >{templatePath.split("/").slice(-2).join("/") || "template"}</code
        >
      </div>
    </div>

    <PreviewFrame
      bind:this={previewRef}
      {templatePath}
      {bgDataURL}
      {paragraph}
      {credit}
      {aspectKey}
      {darken}
    />
  </section>
</div>
