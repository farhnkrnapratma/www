<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    platform: string;
    description?: string;
    icon?: string;
    href: string;
    badge?: string;
    class?: string;
  }

  let {
    platform,
    description = '',
    icon = 'bi-heart-fill',
    href,
    badge = '',
    class: className = '',
  }: Props = $props();
</script>

<a
  {href}
  target="_blank"
  rel="noopener noreferrer"
  class={cn(
    'group flex items-center justify-between gap-4 p-4 rounded-xl border border-border-subtle bg-surface/40 hover:bg-surface-hover hover:border-border-strong transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring select-none',
    className
  )}>
  <div class="flex items-center gap-3.5 min-w-0">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-accent group-hover:scale-105 transition-transform">
      <i class="bi {icon} text-base" aria-hidden="true"></i>
    </div>
    <div class="flex flex-col min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate">
          {platform}
        </span>
        {#if badge}
          <span class="rounded bg-accent-subtle/40 px-1.5 py-0.25 text-[10px] font-bold text-accent">
            {badge}
          </span>
        {/if}
      </div>
      {#if description}
        <span class="text-[11px] text-text-muted truncate">{description}</span>
      {/if}
    </div>
  </div>

  <div class="flex items-center gap-1.5 text-xs text-text-muted group-hover:text-accent transition-colors shrink-0 font-medium">
    <span>Sponsor</span>
    <i class="bi bi-box-arrow-up-right text-[10px]" aria-hidden="true"></i>
  </div>
</a>
