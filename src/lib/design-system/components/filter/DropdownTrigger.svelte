<script lang="ts">
  import { cn } from '../../utils/cn';
  import type { Snippet } from 'svelte';

  /**
   * Shared dropdown trigger button used by FilterSelect, FilterCheckboxGroup, and SortControl.
   * All three toolbar controls derive their trigger appearance from this single primitive,
   * ensuring a unified look across every toolbar on the site.
   */
  interface Props {
    /** Screen-reader accessible label for the button */
    ariaLabel: string;
    /** Whether the associated panel is currently open */
    isOpen?: boolean;
    /** Slot for the trigger's visible content (value label, badge, etc.) */
    children: Snippet;
    onclick?: () => void;
  }

  let { ariaLabel, isOpen = false, children, onclick }: Props = $props();
</script>

<button
  type="button"
  {onclick}
  aria-label={ariaLabel}
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  class={cn(
    'inline-flex h-8 min-w-[5.5rem] cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-medium text-text-primary shadow-2xs',
    'transition-all hover:border-border-subtle/80 hover:bg-surface-hover',
    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
    isOpen && 'border-border-subtle/60 bg-surface-hover',
  )}>
  <span class="truncate leading-none">{@render children()}</span>
  <i
    class="bi bi-chevron-down shrink-0 text-[10px] text-text-muted transition-transform duration-150 {(
      isOpen
    ) ?
      'rotate-180'
    : ''}"
    aria-hidden="true"></i>
</button>
