<script module lang="ts">
  declare const __BUILD_SHA__: string;
  export const buildSha = __BUILD_SHA__;
</script>

<script lang="ts">
  let {
    templatePath,
    native,
    transform,
    loading,
    bindIframe = $bindable<HTMLIFrameElement | null>(null),
  } = $props<{
    templatePath: string;
    native: { w: number; h: number };
    transform: string;
    loading: boolean;
    bindIframe?: HTMLIFrameElement | null;
  }>();
</script>

{#if templatePath}
  <iframe
    title="Generated Image"
    bind:this={bindIframe}
    class="absolute top-1/2 left-1/2 block origin-center bg-transparent"
    src={templatePath}
    width={native.w}
    height={native.h}
    style={`transform:${transform};width:${native.w}px;height:${native.h}px;border:0;pointer-events:none;opacity:${loading ? '0' : '1'};`}
    scrolling="no"
  ></iframe>

  {#if loading}
    <div class="absolute inset-0 grid place-items-center text-neutral-400" aria-live="polite">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
      <span class="sr-only">Loading preview…</span>
    </div>
  {/if}

  <div
    class="pointer-events-none absolute right-4 bottom-2 z-20 text-[0.72rem] tracking-[0.08em] text-white/50"
  >
    Build: {buildSha}
  </div>
{:else}
  <div
    class="absolute inset-4 grid place-items-center rounded-[0.85rem] border border-dashed border-neutral-700 text-neutral-400"
  >
    Choose a template to preview
  </div>
{/if}
