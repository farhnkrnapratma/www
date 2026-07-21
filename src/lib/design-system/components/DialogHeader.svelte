<script lang="ts">
  import type { Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';
  import { cn } from '../utils/cn';

  interface Props {
    title: string;
    description?: string;
    showClose?: boolean;
    onClose?: () => void;
    class?: string;
  }

  let {
    title,
    description = '',
    showClose = false,
    onClose,
    class: className = '',
  }: Props = $props();
</script>

<div class={cn('flex flex-col gap-1 text-left relative pr-6 select-none', className)}>
  <h2 id="dialog-title" class="text-base font-bold text-text-primary">
    {title}
  </h2>
  {#if description}
    <p id="dialog-desc" class="mt-1 text-xs leading-relaxed text-text-secondary">
      {description}
    </p>
  {/if}

  {#if showClose && onClose}
    <div class="absolute right-0 top-0">
      <IconButton
        ariaLabel="Close dialog"
        variant="ghost"
        size="sm"
        onclick={onClose}>
        <i class="bi bi-x-lg text-xs" aria-hidden="true"></i>
      </IconButton>
    </div>
  {/if}
</div>
