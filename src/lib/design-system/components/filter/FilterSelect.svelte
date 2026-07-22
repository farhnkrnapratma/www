<script lang="ts">
  import { cn } from '../../utils/cn';
  import DropdownTrigger from './DropdownTrigger.svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    label: string;
    options: Option[];
    value: string;
    onChange?: (val: string) => void;
    class?: string;
  }

  let { label, options = [], value, onChange = () => {}, class: className = '' }: Props = $props();

  let isOpen = $state(false);

  // Derive the display label from the selected value, with a stable fallback.
  let displayLabel = $derived(
    options.find(o => o.value === value)?.label ?? options[0]?.label ?? label,
  );

  function select(val: string) {
    onChange(val);
    isOpen = false;
  }
</script>

<div class={cn('relative inline-flex items-center gap-2 select-none', className)}>
  <span class="text-xs font-medium whitespace-nowrap text-text-secondary">{label}</span>

  <DropdownTrigger
    ariaLabel="{label}: {displayLabel}"
    {isOpen}
    onclick={() => (isOpen = !isOpen)}>
    {displayLabel}
  </DropdownTrigger>

  {#if isOpen}
    <!-- Backdrop to close on outside click -->
    <button
      type="button"
      class="fixed inset-0 z-40 cursor-default"
      onclick={() => (isOpen = false)}
      aria-label="Close {label} filter"></button>

    <!-- Panel -->
    <div
      role="listbox"
      aria-label="{label} options"
      class="absolute top-[calc(100%+4px)] left-0 z-50 flex min-w-36 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1 shadow-xl backdrop-blur-md">
      {#each options as option (option.value)}
        <button
          type="button"
          role="option"
          aria-selected={option.value === value}
          onclick={() => select(option.value)}
          class="flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors
            {option.value === value ?
            'bg-accent/10 text-accent'
          : 'text-text-primary hover:bg-surface-hover'}">
          <span>{option.label}</span>
          {#if option.value === value}
            <i
              class="bi bi-check2 shrink-0 text-accent"
              aria-hidden="true"></i>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
