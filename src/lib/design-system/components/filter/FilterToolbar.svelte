<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../utils/cn';

  interface Props {
    title?: string;
    searchSlot?: Snippet;
    filterControlsSlot?: Snippet;
    sortSlot?: Snippet;
    chipsSlot?: Snippet;
    countSlot?: Snippet;
    class?: string;
  }

  let {
    title = '',
    searchSlot,
    filterControlsSlot,
    sortSlot,
    chipsSlot,
    countSlot,
    class: className = '',
  }: Props = $props();
</script>

<div
  role="region"
  aria-label={title || 'Filter and sort options'}
  class={cn(
    'flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-card/45 p-4 shadow-xs backdrop-blur-lg select-none',
    className,
  )}>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <!-- Left side: Search & Filter controls -->
    <div class="flex flex-wrap items-center gap-2.5">
      {#if searchSlot}
        {@render searchSlot()}
      {/if}
      {#if filterControlsSlot}
        {@render filterControlsSlot()}
      {/if}
    </div>

    <!-- Right side: Count & Sort -->
    <div class="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
      {#if countSlot}
        {@render countSlot()}
      {/if}
      {#if sortSlot}
        {@render sortSlot()}
      {/if}
    </div>
  </div>

  <!-- Bottom side: Active Filter Chips -->
  {#if chipsSlot}
    {@render chipsSlot()}
  {/if}
</div>
