<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Props {
    isOpen: boolean;
    title: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    isDestructive?: boolean;
    closeOnBackdrop?: boolean;
    onClose: () => void;
    children?: Snippet;
    footer?: Snippet;
    class?: string;
  }

  let {
    isOpen = $bindable(false),
    title,
    description = '',
    size = 'md',
    isDestructive = false,
    closeOnBackdrop = true,
    onClose,
    children,
    footer,
    class: className = '',
  }: Props = $props();

  let dialogRef = $state<HTMLElement | null>(null);

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  function handleKeydown(e: KeyboardEvent) {
    if (isOpen && e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  $effect(() => {
    if (isOpen && typeof document !== 'undefined') {
      setTimeout(() => {
        const focusable = dialogRef?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        focusable?.focus();
      }, 30);
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop Overlay -->
    <button
      type="button"
      class="absolute inset-0 bg-overlay-backdrop backdrop-blur-sm cursor-default"
      aria-label="Close modal"
      onclick={() => closeOnBackdrop && onClose()}></button>

    <!-- Modal Card Box -->
    <div
      bind:this={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-desc' : undefined}
      class={cn(
        'relative z-10 w-full transform rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-2xl transition-all select-none',
        sizeStyles[size],
        isDestructive ? 'border-danger/30' : '',
        className
      )}>
      <div class="flex flex-col gap-1 text-left">
        <h2
          id="dialog-title"
          class={cn(
            'text-base font-bold text-text-primary flex items-center gap-2',
            isDestructive ? 'text-danger' : ''
          )}>
          {#if isDestructive}
            <i class="bi bi-exclamation-triangle-fill text-danger text-sm" aria-hidden="true"></i>
          {/if}
          {title}
        </h2>
        {#if description}
          <p
            id="dialog-desc"
            class="mt-1 text-xs leading-relaxed text-text-secondary">
            {description}
          </p>
        {/if}
      </div>

      {#if children}
        <div class="mt-4">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="mt-6 flex items-center justify-end gap-3">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
