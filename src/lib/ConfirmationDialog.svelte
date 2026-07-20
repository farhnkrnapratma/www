<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    isOpen = $bindable(false),
    title,
    message = '',
    confirmLabel = '',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm = () => {},
    onCancel = () => {},
    children
  }: Props = $props();

  let dialogElement = $state<HTMLElement | null>(null);
  let previousActiveElement: HTMLElement | null = null;

  function close() {
    isOpen = false;
    if (onCancel) onCancel();
    if (previousActiveElement) {
      previousActiveElement.focus();
    }
  }

  function confirm() {
    isOpen = false;
    onConfirm();
    if (previousActiveElement) {
      previousActiveElement.focus();
    }
  }

  // Handle global keyboard events (Escape to close, Enter to confirm unless destructive)
  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Enter') {
      // Prevent automatic Enter confirmation if destructive to avoid accidents
      if (!isDestructive) {
        e.preventDefault();
        confirm();
      }
    }
  }

  // Manage focus when dialog opens/closes
  $effect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined') {
        previousActiveElement = document.activeElement as HTMLElement;
        // Wait a tiny bit for render, then focus the cancel button
        setTimeout(() => {
          const cancelBtn = dialogElement?.querySelector('.cancel-btn') as HTMLElement;
          cancelBtn?.focus();
        }, 30);
      }
    }
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-md transition-all duration-300"
    role="presentation"
    onclick={close}>
    
    <!-- Modal Card (GNOME HIG Boxed/Card Style) -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      bind:this={dialogElement}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
      class="w-[90%] max-w-[360px] transform rounded-2xl border border-adwaita-border bg-adwaita-card p-6 shadow-2xl transition-all duration-300 select-none"
      onclick={(e) => e.stopPropagation()}>
      
      <!-- Icon & Header Info -->
      <div class="flex flex-col gap-1 text-left">
        <h2 
          id="dialog-title" 
          class="text-base font-bold text-adwaita-text">
          {title}
        </h2>
        {#if message}
          <p 
            id="dialog-desc" 
            class="text-xs leading-normal text-adwaita-subtitle/90 mt-1">
            {message}
          </p>
        {/if}
      </div>

      {#if children}
        {@render children()}
      {:else}
        <!-- Action Row: GNOME HIG specifies Cancel on left/start, Action on right/end -->
        <div class="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onclick={close}
            class="cancel-btn inline-flex h-9.5 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-2 focus:outline-adwaita-accent">
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onclick={confirm}
            class="inline-flex h-9.5 cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-bold text-white transition-colors focus:outline-2 focus:outline-adwaita-accent {
              isDestructive 
                ? 'bg-adwaita-error hover:opacity-90' 
                : 'bg-adwaita-accent hover:bg-adwaita-accent-hover'
            }">
            {confirmLabel}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
