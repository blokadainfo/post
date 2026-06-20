<script lang="ts">
  import { tick } from 'svelte';
  import type { SpellcheckIssue } from '@lib/spellcheck/serbian';

  const { open, paragraph, issues, onCancel, onContinue, onReviewChange } = $props<{
    open: boolean;
    paragraph: string;
    issues: SpellcheckIssue[];
    onCancel: () => void;
    onContinue: (paragraph: string) => void;
    onReviewChange: (paragraph: string, issues: SpellcheckIssue[]) => void;
  }>();

  let draftParagraph = $state(paragraph);
  let draftIssues = $state<SpellcheckIssue[]>(issues);
  let selectedIssueStart = $state<number | null>(null);
  let customReplacement = $state('');
  let showCustomReplacement = $state(false);
  let isApplyingReplacement = $state(false);
  let bubblePosition = $state({ top: 0, left: 0 });
  let bubbleMaxWidth = $state(384);
  let bubbleElement = $state<HTMLDivElement | null>(null);
  let paragraphPreview = $state<HTMLDivElement | null>(null);
  let wasOpen = $state(false);
  const bubbleViewportPadding = 12;
  const bubbleParagraphInset = 12;
  type HighlightedSegment = {
    text: string;
    issue: SpellcheckIssue | null;
    start: number;
  };

  $effect(() => {
    if (!open) {
      wasOpen = false;
      return;
    }

    if (wasOpen) {
      return;
    }

    draftParagraph = paragraph;
    draftIssues = issues;
    selectedIssueStart = null;
    customReplacement = '';
    showCustomReplacement = false;
    isApplyingReplacement = false;
    wasOpen = true;
  });

  const selectedIssue = $derived(
    selectedIssueStart === null
      ? null
      : (draftIssues.find((issue: SpellcheckIssue) => issue.start === selectedIssueStart) ?? null)
  );
  const highlightedSegments = $derived(buildHighlightedSegments(draftParagraph, draftIssues));

  function buildHighlightedSegments(value: string, spellingIssues: SpellcheckIssue[]) {
    const segments: HighlightedSegment[] = [];
    const ranges = spellingIssues
      .slice()
      .sort((a, b) => a.start - b.start)
      .filter((issue, index, sorted) => index === 0 || issue.start >= sorted[index - 1].end);
    let cursor = 0;

    ranges.forEach((issue) => {
      if (issue.start > cursor) {
        segments.push({ text: value.slice(cursor, issue.start), issue: null, start: cursor });
      }

      segments.push({
        text: value.slice(issue.start, issue.end),
        issue,
        start: issue.start,
      });
      cursor = issue.end;
    });

    if (cursor < value.length) {
      segments.push({ text: value.slice(cursor), issue: null, start: cursor });
    }

    return segments;
  }

  async function selectIssue(issue: SpellcheckIssue) {
    selectedIssueStart = issue.start;
    customReplacement = issue.suggestions[0] ?? issue.word;
    showCustomReplacement = false;
    await tick();
    updateBubblePosition(issue.start);
  }

  function closeIssuePicker() {
    selectedIssueStart = null;
    customReplacement = '';
    showCustomReplacement = false;
  }

  function updateBubblePosition(start: number) {
    const issueElement = document.querySelector<HTMLElement>(`[data-issue-start="${start}"]`);
    if (!issueElement) {
      return;
    }

    const paragraphRect = paragraphPreview?.getBoundingClientRect();
    const rect = issueElement.getBoundingClientRect();
    bubbleMaxWidth = Math.min(
      Math.max((paragraphRect?.width ?? 384) - bubbleParagraphInset * 2, 0),
      window.innerWidth - bubbleViewportPadding * 2
    );
    const bubbleWidth = Math.min(bubbleElement?.offsetWidth ?? bubbleMaxWidth, bubbleMaxWidth);
    bubblePosition = {
      top: Math.min(rect.bottom + 10, window.innerHeight - 16),
      left: Math.max(
        paragraphRect ? paragraphRect.left + bubbleParagraphInset : bubbleViewportPadding,
        Math.min(
          rect.left,
          paragraphRect
            ? paragraphRect.right - bubbleParagraphInset - bubbleWidth
            : window.innerWidth - bubbleWidth - bubbleViewportPadding
        )
      ),
    };
  }

  async function applyReplacement(replacement: string) {
    const nextReplacement = replacement.trim();
    if (!selectedIssue || !nextReplacement) {
      return;
    }

    isApplyingReplacement = true;

    try {
      const nextParagraph =
        draftParagraph.slice(0, selectedIssue.start) +
        nextReplacement +
        draftParagraph.slice(selectedIssue.end);
      const { checkSerbianLatinText } = await import('@lib/spellcheck/serbian');
      const nextIssues = await checkSerbianLatinText(nextParagraph);

      draftParagraph = nextParagraph;
      draftIssues = nextIssues;
      onReviewChange(nextParagraph, nextIssues);
      closeIssuePicker();
    } finally {
      isApplyingReplacement = false;
    }
  }

  function submitCustomReplacement() {
    void applyReplacement(customReplacement);
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!open || !(target instanceof Element) || !selectedIssue) {
      return;
    }

    if (target.closest('[data-spellcheck-bubble]') || target.closest('[data-issue-start]')) {
      return;
    }

    closeIssuePicker();
  }

  function getIssueHighlightClass(isSelected: boolean) {
    return isSelected ? 'bg-red-300 text-neutral-950' : 'bg-red-500/70 decoration-red-200/80';
  }

  function selectSegmentIssue(segment: HighlightedSegment) {
    if (!segment.issue) {
      return;
    }

    void selectIssue(segment.issue);
  }
</script>

<svelte:document onclick={handleDocumentClick} />

{#if open}
  <div class="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3 sm:p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spellcheck-review-title"
      class="flex max-h-[calc(100svh-1.5rem)] w-full max-w-xl flex-col gap-4 overflow-hidden rounded-[1.25rem] border border-neutral-800 bg-neutral-950 p-4 text-neutral-100 shadow-2xl select-none sm:max-h-[calc(100svh-2rem)] sm:gap-5 sm:p-5"
    >
      <div class="space-y-1">
        <h2 id="spellcheck-review-title" class="m-0 text-lg font-semibold">Review spelling</h2>
        <p class="m-0 text-sm text-neutral-400">
          Click a highlighted word to replace it with a suggestion or your own text.
        </p>
      </div>

      <div class="min-h-0 overflow-y-auto pr-1" onscroll={closeIssuePicker}>
        <div
          bind:this={paragraphPreview}
          class="rounded-[0.9rem] border border-neutral-800 bg-black/50 p-4 text-base leading-relaxed whitespace-pre-wrap text-neutral-100"
        >
          {#each highlightedSegments as segment (segment.start)}
            {#if segment.issue}
              <button
                type="button"
                class={`mx-0 my-[0.1em] inline-block cursor-pointer rounded-[0.22rem] px-[0.12em] py-[0.04em] align-baseline text-neutral-50 decoration-2 underline-offset-4 ${getIssueHighlightClass(selectedIssue?.start === segment.issue.start)}`}
                title={segment.issue.suggestions.length
                  ? `Suggestions: ${segment.issue.suggestions.join(', ')}`
                  : 'No suggestion found'}
                data-issue-start={segment.issue.start}
                onclick={() => selectSegmentIssue(segment)}
              >
                {segment.text}
              </button>
            {:else}
              {segment.text}
            {/if}
          {/each}
        </div>
      </div>

      {#if selectedIssue}
        <div
          bind:this={bubbleElement}
          data-spellcheck-bubble
          class="fixed z-[110] w-max rounded-[1rem] border border-neutral-700 bg-neutral-950/98 p-3 shadow-2xl backdrop-blur-sm"
          style={`top:${bubblePosition.top}px;left:${bubblePosition.left}px;max-width:${bubbleMaxWidth}px;`}
        >
          <div
            class="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div class="flex w-max min-w-full items-center justify-center gap-2">
              {#if selectedIssue.suggestions.length}
                {#each selectedIssue.suggestions as suggestion (suggestion)}
                  <button
                    type="button"
                    class="shrink-0 cursor-pointer rounded-[0.75rem] border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset disabled:cursor-wait disabled:opacity-60"
                    disabled={isApplyingReplacement}
                    onclick={() => applyReplacement(suggestion)}
                  >
                    {suggestion}
                  </button>
                {/each}
                <button
                  type="button"
                  class="shrink-0 cursor-pointer rounded-[0.75rem] border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
                  onclick={() => (showCustomReplacement = !showCustomReplacement)}
                >
                  ...
                </button>
              {:else}
                <button
                  type="button"
                  class="shrink-0 cursor-pointer rounded-[0.75rem] border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
                  onclick={() => (showCustomReplacement = true)}
                >
                  ...
                </button>
              {/if}
            </div>
          </div>

          {#if showCustomReplacement}
            <div class="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={customReplacement}
                class="min-w-0 flex-1 rounded-[0.75rem] border border-neutral-700 bg-black/70 px-3 py-2 text-sm text-neutral-100 select-text focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
                oninput={(event) =>
                  (customReplacement = (event.currentTarget as HTMLInputElement).value)}
                onkeydown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitCustomReplacement();
                  }
                }}
              />
              <button
                type="button"
                class="shrink-0 cursor-pointer rounded-[0.75rem] bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset disabled:cursor-wait disabled:opacity-60"
                disabled={isApplyingReplacement || !customReplacement.trim()}
                onclick={submitCustomReplacement}
              >
                Apply
              </button>
            </div>
          {/if}
        </div>
      {:else if !draftIssues.length}
        <div
          class="rounded-[0.9rem] border border-emerald-900/70 bg-emerald-950/40 p-4 text-sm text-emerald-100"
        >
          No spelling issues remain in this text.
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="cursor-pointer rounded-[0.9rem] border border-neutral-700 px-4 py-3 text-sm text-neutral-200 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
          onclick={onCancel}
        >
          Go back
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-[0.9rem] bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-950 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none focus-visible:ring-inset"
          onclick={() => onContinue(draftParagraph)}
        >
          {draftIssues.length ? 'Export anyway' : 'Export'}
        </button>
      </div>
    </div>
  </div>
{/if}
