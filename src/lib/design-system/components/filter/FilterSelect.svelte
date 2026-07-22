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
    class="text-xs font-medium whitespace-nowrap text-text-secondary">
    {label}
  </label>
  <select
    {id}
    {value}
    onchange={e => onChange(e.currentTarget.value)}
    class="h-8.5 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-medium text-text-primary shadow-2xs transition-all hover:border-border-subtle/80 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
    {#each options as option (option.value)}
      <option
        value={option.value}
        class="bg-surface-elevated text-text-primary">{option.label}</option>
    {/each}
  </select>
</div>
