<script lang="ts">
  import { onMount } from 'svelte';

  let dismissed = $state(false);
  let unsupported = $state(false);
  let visible = $state(false);
  let closingTimer: number | undefined;

  function isSupportedBrowser() {
    if (typeof navigator === 'undefined') return true;

    const ua = navigator.userAgent;
    const isFirefox = /Firefox\/|FxiOS\//.test(ua);
    const isChrome =
      /Chrome\/|CriOS\//.test(ua) &&
      !/Edg\//.test(ua) &&
      !/OPR\//.test(ua) &&
      !/SamsungBrowser\//.test(ua);
    const isSafari =
      /Safari\//.test(ua) &&
      /Version\//.test(ua) &&
      !/Chrome\/|CriOS\//.test(ua) &&
      !/Chromium\//.test(ua) &&
      !/Android/.test(ua);

    return isFirefox || isChrome || isSafari;
  }

  onMount(() => {
    unsupported = !isSupportedBrowser();
    if (!unsupported) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        visible = true;
      });
    });
  });

  function dismiss() {
    visible = false;
    if (closingTimer) window.clearTimeout(closingTimer);
    closingTimer = window.setTimeout(() => {
      dismissed = true;
      closingTimer = undefined;
    }, 420);
  }
</script>

{#if unsupported && !dismissed}
  <div
    class={`ease fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4 transition-opacity duration-[420ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
  >
    <div
      class="w-full max-w-md border border-neutral-800 bg-neutral-950 p-5 text-neutral-100 shadow-2xl backdrop-blur-[12px] select-none"
    >
      <div class="space-y-2">
        <p class="text-[0.72rem] tracking-[0.08em] text-neutral-400 uppercase">Browser Warning</p>
        <h2 class="text-lg font-semibold">Unsupported browser detected</h2>
        <p class="text-sm leading-6 text-neutral-300">
          This app was tested on Chrome, Firefox, and Safari. Other browsers are not guranteed to
          behave correctly and as intended. Please download and use one of the tested browsers.
        </p>
      </div>

      <div class="mt-5 flex justify-end">
        <button
          type="button"
          class="cursor-pointer rounded-[0.85rem] border border-neutral-700 bg-black/75 px-4 py-3 text-sm text-neutral-200 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
          onclick={dismiss}
        >
          Continue anyway
        </button>
      </div>
    </div>
  </div>
{/if}
