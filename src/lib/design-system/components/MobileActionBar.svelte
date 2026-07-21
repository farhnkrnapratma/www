<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div
  class={cn(
    'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t border-border-subtle bg-surface/90 p-3.5 shadow-2xl backdrop-blur-lg sm:hidden select-none',
    className
  )}>
  {@render children?.()}
</div>
