<script lang="ts">
  import { cn } from '../../utils/cn';

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

  let id = $state(`filter-select-${Math.random().toString(36).substring(2, 9)}`);
</script>

<div class={cn('flex items-center gap-2 select-none', className)}>
  <label
    for={id}
    class="text-xs font-semibold whitespace-nowrap text-text-secondary">
    {label}:
  </label>
  <select
    {id}
    {value}
    onchange={e => onChange(e.currentTarget.value)}
    class="cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1.5 text-xs font-semibold text-text-primary shadow-2xs transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent">
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</div>
