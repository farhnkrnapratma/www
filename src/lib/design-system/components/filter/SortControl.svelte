<script lang="ts">
  import { cn } from '../../utils/cn';

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

  let id = $state(`sort-control-${Math.random().toString(36).substring(2, 9)}`);
</script>

<div class={cn('flex items-center gap-1.5 select-none', className)}>
  <label
    for={id}
    class="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-text-secondary">
    <span
      class="material-symbols-rounded text-sm text-text-muted"
      aria-hidden="true">filter_alt</span>
    <span>Sort:</span>
  </label>

  <select
    {id}
    value={currentField}
    onchange={e => onFieldChange(e.currentTarget.value)}
    class="cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1.5 text-xs font-semibold text-text-primary shadow-2xs transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent">
    {#each fields as field (field.value)}
      <option value={field.value}>{field.label}</option>
    {/each}
  </select>

  <button
    type="button"
    onclick={onDirectionToggle}
    aria-label="Sort direction: {currentDirection === 'asc' ? 'Ascending' : 'Descending'}"
    class="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-primary shadow-2xs transition-colors hover:bg-surface-hover hover:text-accent focus-visible:outline-2 focus-visible:outline-accent">
    <i
      class="bi {currentDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} text-sm"
      aria-hidden="true"></i>
  </button>
</div>
