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

<div class={cn('flex items-center gap-2 select-none', className)}>
  <label
    for={id}
    class="text-xs font-medium whitespace-nowrap text-text-secondary">
    Sort by
  </label>

  <select
    {id}
    value={currentField}
    onchange={e => onFieldChange(e.currentTarget.value)}
    class="h-8.5 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-all hover:border-border-subtle/80 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
    {#each fields as field (field.value)}
      <option
        value={field.value}
        class="bg-surface-elevated text-text-primary">{field.label}</option>
    {/each}
  </select>

  <button
    type="button"
    onclick={onDirectionToggle}
    aria-label="Sort direction: {currentDirection === 'asc' ? 'Ascending' : 'Descending'}"
    title="Sort direction: {currentDirection === 'asc' ? 'Ascending' : 'Descending'}"
    class="inline-flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary shadow-2xs transition-all hover:bg-surface-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
    <i
      class="bi {currentDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} text-xs"
      aria-hidden="true"></i>
  </button>
</div>
