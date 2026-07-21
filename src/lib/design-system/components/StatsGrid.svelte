<script lang="ts">
  import { cn } from '../utils/cn';

  interface StatItem {
    label: string;
    value: string;
    description?: string;
    icon?: string;
  }

  interface Props {
    stats: StatItem[];
    class?: string;
  }

  let { stats = [], class: className = '' }: Props = $props();
</script>

<div class={cn('grid grid-cols-2 sm:grid-cols-4 gap-4 w-full select-none', className)}>
  {#each stats as item (item.label)}
    <div class="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface/50 p-4 text-center shadow-xs">
      {#if item.icon}
        <i class="bi {item.icon} text-lg text-accent mb-1" aria-hidden="true"></i>
      {/if}
      <span class="text-2xl font-extrabold text-text-primary tracking-tight font-mono">{item.value}</span>
      <span class="mt-0.5 text-xs font-bold text-text-secondary">{item.label}</span>
      {#if item.description}
        <span class="mt-0.5 text-[10px] text-text-muted">{item.description}</span>
      {/if}
    </div>
  {/each}
</div>
