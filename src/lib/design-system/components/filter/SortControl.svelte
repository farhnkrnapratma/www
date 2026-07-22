<script lang="ts">
  import { cn } from '../../utils/cn';
  import DropdownTrigger from './DropdownTrigger.svelte';

  interface SortOption {
    value: string;
    label: string;
  }

  interface Props {
    fields: SortOption[];
    currentField: string;
    currentDirection: 'asc' | 'desc';
    onFieldChange?: (field: string) => void;
    onDirectionToggle?: () => void;
    class?: string;
  }

  let {
    fields = [],
    currentField,
    currentDirection = 'desc',
    onFieldChange = () => {},
    onDirectionToggle = () => {},
    class: className = '',
  }: Props = $props();

  let isOpen = $state(false);

  // Always resolve the selected label; fall back to first option so sort is never blank.
  let selectedLabel = $derived(
    fields.find(f => f.value === currentField)?.label ?? fields[0]?.label ?? 'Sort by',
  );

  // Ensure currentField is never empty (initialise to first field if nothing is set yet)
  let resolvedField = $derived(
    fields.some(f => f.value === currentField) ? currentField : (fields[0]?.value ?? ''),
  );

  function selectField(value: string) {
    onFieldChange(value);
    isOpen = false;
  }
</script>

<div class={cn('relative flex items-center gap-2 select-none', className)}>
  <span class="text-xs font-medium whitespace-nowrap text-text-secondary">Sort by</span>

  <DropdownTrigger
    ariaLabel="Sort by: {selectedLabel}"
    {isOpen}
    onclick={() => (isOpen = !isOpen)}>
    {selectedLabel}
  </DropdownTrigger>

  {#if isOpen}
    <!-- Backdrop -->
    <button
      type="button"
      class="fixed inset-0 z-40 cursor-default"
      onclick={() => (isOpen = false)}
      aria-label="Close sort options"></button>

    <!-- Panel -->
    <div
      role="listbox"
      aria-label="Sort field options"
      class="absolute top-[calc(100%+4px)] right-0 z-50 flex min-w-36 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1 shadow-xl backdrop-blur-md">
      {#each fields as field (field.value)}
        <button
          type="button"
          role="option"
          aria-selected={field.value === resolvedField}
          onclick={() => selectField(field.value)}
          class="flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors
            {field.value === resolvedField ?
            'bg-accent/10 text-accent'
          : 'text-text-primary hover:bg-surface-hover'}">
          <span>{field.label}</span>
          {#if field.value === resolvedField}
            <i
              class="bi bi-check2 shrink-0 text-accent"
              aria-hidden="true"></i>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Direction toggle -->
  <button
    type="button"
    onclick={onDirectionToggle}
    aria-label="Sort direction: {currentDirection === 'asc' ? 'Ascending' : 'Descending'}"
    title="Toggle sort direction"
    class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary shadow-2xs transition-all hover:bg-surface-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
    <i
      class="bi {currentDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} text-xs"
      aria-hidden="true"></i>
  </button>
</div>
