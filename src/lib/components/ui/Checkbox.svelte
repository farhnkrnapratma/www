<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type'> {
    checked?: boolean;
    label?: string;
  }

  let {
    checked = $bindable(false),
    label = '',
    id,
    disabled = false,
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<label
  class="inline-flex cursor-pointer items-center gap-2.5 select-none {disabled ?
    'cursor-not-allowed opacity-50'
  : ''} {className}">
  <input
    type="checkbox"
    {id}
    {disabled}
    bind:checked
    class="h-4 w-4 cursor-pointer rounded border-border-default bg-surface-base text-accent accent-accent transition-colors focus:ring-2 focus:ring-accent/20 focus:ring-offset-0 focus:outline-none"
    {...restProps} />
  {#if label}
    <span class="text-xs font-semibold text-text-primary sm:text-sm">{label}</span>
  {/if}
</label>
