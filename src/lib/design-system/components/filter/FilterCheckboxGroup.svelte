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

<div class={cn('relative inline-flex items-center gap-2 text-left select-none', className)}>
  <span class="text-xs font-medium whitespace-nowrap text-text-secondary">
    {label}
  </span>

  {#if collapsible}
    <button
      type="button"
      onclick={() => (isOpen = !isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="true"
      class="inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-all hover:border-border-subtle/80 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
      <span>{selectedValues.length > 0 ? `${selectedValues.length} selected` : 'All'}</span>
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
        class="absolute top-10 left-0 z-50 flex min-w-48 flex-col gap-1.5 rounded-xl border border-border-subtle bg-surface-elevated p-2.5 shadow-xl backdrop-blur-md">
        <div
          class="border-b border-border-subtle/40 px-1.5 py-1 text-[11px] font-semibold text-text-secondary">
          Filter by {label}
        </div>
        <div class="no-scrollbar flex max-h-52 flex-col gap-1 overflow-y-auto pt-1">
          {#each options as opt (opt.value)}
            <label
              class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover/70">
              <Checkbox
                checked={selectedValues.includes(opt.value)}
                onchange={() => onChange(opt.value)} />
              <span>{opt.label}</span>
            </label>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 text-xs font-medium text-text-secondary">{label}</legend>
      <div class="flex flex-wrap gap-2">
        {#each options as opt (opt.value)}
          <label
            class="flex cursor-pointer items-center gap-2 rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-surface-hover">
            <Checkbox
              checked={selectedValues.includes(opt.value)}
              onchange={() => onChange(opt.value)} />
            <span>{opt.label}</span>
          </label>
        {/each}
      </div>
    </fieldset>
  {/if}
</div>
