<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    title: string;
    subtitle?: string;
    icon?: string;
    href?: string;
    copyableText?: string;
    class?: string;
    trailing?: Snippet;
  }

  let {
    title,
    subtitle = '',
    icon = 'bi-envelope',
    href = '',
    copyableText = '',
    class: className = '',
    trailing,
  }: Props = $props();

  let copied = $state(false);

  function handleCopy() {
    if (!copyableText || typeof window === 'undefined') return;
    navigator.clipboard.writeText(copyableText).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  }
</script>

<div
  class={cn(
    'group flex items-center justify-between gap-4 p-4 rounded-xl border border-border-subtle bg-surface/40 hover:bg-surface-hover hover:border-border-strong transition-all duration-300',
    className
  )}>
  <div class="flex items-center gap-3.5 min-w-0">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary group-hover:text-accent transition-colors">
      <i class="bi {icon} text-base" aria-hidden="true"></i>
    </div>
    <div class="flex flex-col min-w-0">
      {#if href}
        <a
          {href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          class="text-xs font-bold text-text-primary hover:text-accent truncate transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          {title}
        </a>
      {:else}
        <span class="text-xs font-bold text-text-primary truncate">{title}</span>
      {/if}
      {#if subtitle}
        <span class="text-[11px] text-text-muted truncate">{subtitle}</span>
      {/if}
    </div>
  </div>

  <div class="flex items-center gap-2 shrink-0">
    {#if copyableText}
      <button
        type="button"
        onclick={handleCopy}
        aria-label="Copy contact information"
        class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-[11px] font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring">
        {#if copied}
          <i class="bi bi-check2 text-accent" aria-hidden="true"></i>
          <span class="text-accent">Copied</span>
        {:else}
          <i class="bi bi-clipboard" aria-hidden="true"></i>
          <span>Copy</span>
        {/if}
      </button>
    {/if}

    {#if trailing}
      {@render trailing()}
    {/if}
  </div>
</div>
