<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    align?: 'left' | 'center';
    actions?: Snippet;
  }

  let { title, subtitle = '', align = 'left', actions }: Props = $props();
</script>

<div
  class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between {align === 'center'
    ? 'text-center items-center'
    : 'text-left'}">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
      {title}
    </h1>
    {#if subtitle}
      <p class="mt-1 text-xs text-text-secondary sm:text-sm leading-relaxed max-w-xl">
        {subtitle}
      </p>
    {/if}
  </div>

  {#if actions}
    <div class="flex items-center gap-2 shrink-0 mt-3 sm:mt-0">
      {@render actions()}
    </div>
  {/if}
</div>
