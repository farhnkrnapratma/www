<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    isOpen = $bindable(false),
    title,
    description = '',
    onClose,
    children,
    footer,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (isOpen && e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <button
      type="button"
      class="absolute inset-0 bg-overlay-backdrop backdrop-blur-sm cursor-default"
      aria-label="Close modal"
      onclick={onClose}></button>

    <!-- Modal Box -->
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-desc' : undefined}
      class="relative z-10 w-full max-w-md transform rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-2xl transition-all select-none">
      <div class="flex flex-col gap-1 text-left">
        <h2
          id="dialog-title"
          class="text-base font-bold text-text-primary">
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
