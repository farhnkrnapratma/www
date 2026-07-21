<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    title: string;
    excerpt?: string;
    class?: string;
    meta?: Snippet;
  }

  let { title, excerpt = '', class: className = '', meta }: Props = $props();
</script>

<header class={cn('flex flex-col gap-4 border-b border-border-subtle pb-8 mb-10 select-none', className)}>
  <h1 class="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl leading-[1.15]">
    {title}
  </h1>

  {#if excerpt}
    <p class="text-base sm:text-lg font-normal leading-relaxed text-text-secondary">
      {excerpt}
    </p>
  {/if}

  {#if meta}
    <div class="mt-2 text-xs text-text-muted">
      {@render meta()}
    </div>
  {/if}
</header>
