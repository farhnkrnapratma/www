<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    title: string;
    href?: string;
    description?: string;
    interactive?: boolean;
    class?: string;
    meta?: Snippet;
    tags?: Snippet;
    actions?: Snippet;
    children?: Snippet;
  }

  let {
    title,
    href = '',
    description = '',
    interactive = true,
    class: className = '',
    meta,
    tags,
    actions,
    children,
  }: Props = $props();
</script>

<div
  class={cn(
    'group relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface/60 p-5 sm:p-6 shadow-xs backdrop-blur-lg transition-all duration-300',
    interactive ? 'hover:bg-surface-hover hover:border-border-strong' : '',
    className
  )}>
  <div class="flex flex-col gap-2">
    <!-- Header Title & Link -->
    <div class="flex items-start justify-between gap-3">
      <h3 class="text-base font-bold tracking-tight text-text-primary group-hover:text-accent transition-colors">
        {#if href}
          <a href={href} class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded-sm">
            {title}
          </a>
        {:else}
          {title}
        {/if}
      </h3>
      {#if href && interactive}
        <i class="bi bi-arrow-up-right text-xs text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent shrink-0 mt-1" aria-hidden="true"></i>
      {/if}
    </div>

    <!-- Metadata Slot -->
    {#if meta}
      <div class="text-xs text-text-muted select-none">
        {@render meta()}
      </div>
    {/if}

    <!-- Description -->
    {#if description}
      <p class="mt-1 text-xs leading-relaxed text-text-secondary line-clamp-3">
        {description}
      </p>
    {/if}

    {#if children}
      {@render children()}
    {/if}
  </div>

  <!-- Footer Tags & Actions -->
  {#if tags || actions}
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle/40 select-none">
      {#if tags}
        <div class="flex flex-wrap items-center gap-1.5">
          {@render tags()}
        </div>
      {/if}

      {#if actions}
        <div class="flex items-center gap-2 ml-auto">
          {@render actions()}
        </div>
      {/if}
    </div>
  {/if}
</div>
