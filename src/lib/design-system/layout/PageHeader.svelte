<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: 'left' | 'center';
    actions?: Snippet;
    class?: string;
  }

  let {
    eyebrow = '',
    title,
    description = '',
    align = 'left',
    actions,
    class: className = '',
  }: Props = $props();
</script>

<div
  class={cn(
    'flex flex-col gap-3 mb-8 sm:mb-10',
    align === 'center' ? 'items-center text-center' : 'text-left',
    className
  )}>
  {#if eyebrow}
    <span class="text-xs font-bold uppercase tracking-wider text-accent select-none">
      {eyebrow}
    </span>
  {/if}

  <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between w-full">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
        {title}
      </h1>
      {#if description}
        <p class="mt-1.5 text-xs sm:text-sm leading-relaxed text-text-secondary max-w-xl">
          {description}
        </p>
      {/if}
    </div>

    {#if actions}
      <div class="flex items-center gap-2 shrink-0 mt-3 sm:mt-0">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
