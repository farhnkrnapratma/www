<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    active?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md';
    onclick?: () => void;
    children?: Snippet;
    class?: string;
  }

  let {
    active = false,
    disabled = false,
    size = 'md',
    onclick,
    children,
    class: className = '',
  }: Props = $props();

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs font-semibold gap-2',
  };
</script>

<button
  type="button"
  {disabled}
  {onclick}
  aria-pressed={active}
  class={cn(
    'inline-flex items-center justify-center rounded-full transition-all cursor-pointer select-none border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
    active
      ? 'bg-accent text-text-on-accent border-accent font-bold shadow-xs'
      : 'bg-surface border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:border-border-strong',
    sizeStyles[size],
    className
  )}>
  {@render children?.()}
</button>
