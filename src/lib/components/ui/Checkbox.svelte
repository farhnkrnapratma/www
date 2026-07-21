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

<label class="inline-flex items-center gap-2.5 cursor-pointer select-none {disabled ? 'opacity-50 cursor-not-allowed' : ''} {className}">
  <input
    type="checkbox"
    {id}
    {disabled}
    bind:checked
    class="h-4 w-4 rounded border-border-default bg-surface-base text-accent focus:ring-2 focus:ring-accent/20 focus:ring-offset-0 focus:outline-none transition-colors cursor-pointer accent-accent"
    {...restProps}
  />
  {#if label}
    <span class="text-xs sm:text-sm font-semibold text-text-primary">{label}</span>
  {/if}
</label>
