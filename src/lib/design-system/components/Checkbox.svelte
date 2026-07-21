<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '../utils/cn';

  interface Props extends Omit<HTMLInputAttributes, 'type'> {
    checked?: boolean;
    label?: string;
    description?: string;
  }

  let {
    checked = $bindable(false),
    label = '',
    description = '',
    id,
    disabled = false,
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<label
  class={cn(
    'inline-flex items-start gap-2.5 cursor-pointer select-none',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  )}>
  <input
    type="checkbox"
    {id}
    {disabled}
    bind:checked
    class="mt-0.5 h-4 w-4 rounded border-border-default bg-surface text-accent focus:ring-2 focus:ring-accent/20 focus:ring-offset-0 focus:outline-none transition-colors cursor-pointer accent-accent"
    {...restProps} />
  {#if label || description}
    <div class="flex flex-col">
      {#if label}
        <span class="text-xs sm:text-sm font-semibold text-text-primary">{label}</span>
      {/if}
      {#if description}
        <span class="text-xs text-text-muted mt-0.5">{description}</span>
      {/if}
    </div>
  {/if}
</label>
