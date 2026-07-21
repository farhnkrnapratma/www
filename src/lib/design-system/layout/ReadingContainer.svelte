<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<article
  class={cn(
    'mx-auto w-full max-w-2xl px-4 sm:px-6 py-10 md:py-16 font-serif leading-relaxed',
    className
  )}>
  {@render children?.()}
</article>
