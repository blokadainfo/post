<script lang="ts">
  import { NATIVE_BY_KEY, type AspectKey } from "@lib/aspects";

  // ---- props ----
  const { templatePath, bgDataURL, paragraph, credit, aspectKey, darken } = $props<{
    templatePath: string;
    bgDataURL: string | null;
    paragraph: string;
    credit: string;
    aspectKey: AspectKey;
    darken: number;
  }>();

  // ---- native export size (from aspects.ts) ----
  const native = $derived(NATIVE_BY_KEY[aspectKey as keyof typeof NATIVE_BY_KEY]);

  // ---- refs ----
  let hostEl: HTMLDivElement | null = $state(null);
  let iframeEl: HTMLIFrameElement | null = $state(null);

  // ---- messaging state ----
  let ready = false;
  let loading = $state(true);
  let msgSeq = 0;
  const pending = new Map<number, (blob: Blob) => void>();

  type Payload = {
    type: "SET_DATA";
    bgDataURL: string | null;
    paragraph: string;
    credit: string;
    darken: number;
  };
  let latest: Payload = { type: "SET_DATA", bgDataURL, paragraph, credit, darken };

  let pushTimer: number | undefined;
  function pushLatest() {
    if (!ready || !iframeEl?.contentWindow) return;
    if (pushTimer) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      iframeEl!.contentWindow!.postMessage(latest, "*");
    }, 0);
  }

  $effect(() => {
    latest = { type: "SET_DATA", bgDataURL, paragraph, credit, darken };
    pushLatest();
  });

  let lastSrc = "";
  $effect(() => {
    if (!templatePath || templatePath === lastSrc) return;
    lastSrc = templatePath;
    ready = false;
    loading = true;
  });

  window.addEventListener("message", (e) => {
    if (!iframeEl || e.source !== iframeEl.contentWindow) return;
    const { type, id, blob } = e.data ?? {};

    if (type === "READY") {
      ready = true;
      loading = false;
      pushLatest();
    }

    if (type === "SNAPSHOT_RESULT" && id && blob) {
      const resolve = pending.get(id);
      if (resolve) {
        pending.delete(id);
        resolve(new Blob([new Uint8Array(blob.data)], { type: blob.type }));
      }
    }
  });

  export function snapshot(scale = 1): Promise<Blob> {
    return new Promise(async (resolve) => {
      if (!iframeEl?.contentWindow || !templatePath) return resolve(new Blob());
      if (!ready) await waitForReady(2000).catch(() => {});
      const id = ++msgSeq;
      pending.set(id, resolve);
      iframeEl.contentWindow.postMessage({ type: "SNAPSHOT", scale, id }, "*");
    });
  }

  function waitForReady(timeoutMs: number) {
    return new Promise<void>((res, rej) => {
      if (ready) return res();
      const win = iframeEl?.contentWindow;
      if (!win) return rej(new Error("iframe not mounted"));
      const timer = setTimeout(() => {
        window.removeEventListener("message", onMsg as any);
        rej(new Error("READY timeout"));
      }, timeoutMs);
      function onMsg(e: MessageEvent) {
        if (e.source === win && e.data?.type === "READY") {
          clearTimeout(timer);
          window.removeEventListener("message", onMsg as any);
          res();
        }
      }
      window.addEventListener("message", onMsg as any);
    });
  }

  let scale = $state(1);
  let ro: ResizeObserver | null = null;
  function recomputeScale() {
    if (!hostEl) return;
    const hostW = hostEl.clientWidth || 1;
    scale = Math.min(hostW / native.w, 1);
  }
  $effect(() => {
    ro?.disconnect();
    ro = new ResizeObserver(recomputeScale);
    if (hostEl) ro.observe(hostEl);
    queueMicrotask(recomputeScale);
    return () => ro?.disconnect();
  });

  const scaledW = $derived(native.w * scale);
  const scaledH = $derived(native.h * scale);
</script>

<div bind:this={hostEl} class="relative w-full lg:max-w-[420px]">
  {#if templatePath}
    <div
      class="absolute top-0 left-0"
      style={`transform:scale(${scale});transform-origin:top left;width:${native.w}px;height:${native.h}px;`}
    >
      <iframe
        title="Generated Image"
        bind:this={iframeEl}
        class="block bg-neutral-950"
        src={templatePath}
        width={native.w}
        height={native.h}
        style="border:0;pointer-events:none;"
        scrolling="no"
      ></iframe>
    </div>

    {#if loading}
      <div
        class="absolute inset-0 grid place-items-center"
        style={`width:${scaledW}px;height:${scaledH}px;`}
        aria-live="polite"
      >
        <div class="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
        <span class="sr-only">Loading preview…</span>
      </div>
    {/if}

    <div style={`width:${scaledW}px;height:${scaledH}px;`} aria-hidden="true"></div>
  {:else}
    <div
      class="cursor-default grid place-items-center text-neutral-400 rounded-lg border border-neutral-800 bg-neutral-900/50"
      style={`width:${scaledW}px;height:${scaledH}px;`}
    >
      Choose a template to preview
    </div>
  {/if}
</div>
