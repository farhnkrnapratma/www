<script lang="ts">
  import Checkbox from '../Checkbox.svelte';
  import { cn } from '../../utils/cn';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    label: string;
    options: Option[];
    selectedValues: string[];
    onChange?: (value: string) => void;
    collapsible?: boolean;
    class?: string;
  }

  let {
    label,
    options = [],
    selectedValues = [],
    onChange = () => {},
    collapsible = true,
    class: className = '',
  }: Props = $props();

  let isOpen = $state(false);
</script>

<div class={cn('relative inline-block text-left select-none', className)}>
  {#if collapsible}
    <button
      type="button"
      onclick={() => (isOpen = !isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="true"
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-primary shadow-2xs transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent">
      <span
        class="material-symbols-rounded text-sm text-text-muted"
        aria-hidden="true">filter_alt</span>
      <span>{label}</span>
      {#if selectedValues.length > 0}
        <span
          class="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {selectedValues.length}
        </span>
      {/if}
      <i
        class="bi bi-chevron-down text-[10px] text-text-muted transition-transform {isOpen ?
          'rotate-180'
        : ''}"
        aria-hidden="true"></i>
    </button>

    {#if isOpen}
      <button
        type="button"
        class="fixed inset-0 z-40 cursor-default"
        onclick={() => (isOpen = false)}
        aria-label="Close menu"></button>

      <div
        role="group"
        aria-label={label}
        class="absolute top-9 left-0 z-50 flex min-w-48 flex-col gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-3 shadow-xl">
        <div class="mb-1 text-[11px] font-bold tracking-wider text-text-muted uppercase">
          {label}
        </div>
        <div class="no-scrollbar flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {#each options as opt (opt.value)}
            <label
              class="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs text-text-primary hover:bg-surface-hover">
              <Checkbox
                checked={selectedValues.includes(opt.value)}
                onChange={() => onChange(opt.value)} />
              <span>{opt.label}</span>
            </label>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 text-xs font-bold text-text-secondary">{label}</legend>
      <div class="flex flex-wrap gap-2">
        {#each options as opt (opt.value)}
          <label
            class="flex cursor-pointer items-center gap-2 rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs text-text-primary hover:bg-surface-hover">
            <Checkbox
              checked={selectedValues.includes(opt.value)}
              onChange={() => onChange(opt.value)} />
            <span>{opt.label}</span>
          </label>
        {/each}
      </div>
    </fieldset>
  {/if}
</div>
