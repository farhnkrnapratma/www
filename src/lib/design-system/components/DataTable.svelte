<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../utils/cn';

  interface Column {
    key: string;
    header: string;
    align?: 'left' | 'center' | 'right';
  }

  interface Props {
    caption?: string;
    columns: Column[];
    data: Record<string, any>[];
    class?: string;
  }

  let {
    caption = '',
    columns = [],
    data = [],
    class: className = '',
  }: Props = $props();

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
</script>

<div class="w-full overflow-x-auto rounded-2xl border border-border-subtle shadow-xs select-none">
  <table class={cn('w-full border-collapse text-xs text-text-primary', className)}>
    {#if caption}
      <caption class="sr-only">{caption}</caption>
    {/if}
    <thead class="bg-surface-elevated text-text-secondary font-bold uppercase tracking-wider text-[11px] border-b border-border-subtle">
      <tr>
        {#each columns as col (col.key)}
          <th
            scope="col"
            class={cn('px-4 py-3 font-bold', alignStyles[col.align || 'left'])}>
            {col.header}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-border-subtle/50 bg-surface/50">
      {#each data as row, i (i)}
        <tr class="hover:bg-surface-hover transition-colors">
          {#each columns as col (col.key)}
            <td class={cn('px-4 py-3 font-medium', alignStyles[col.align || 'left'])}>
              {row[col.key] ?? '—'}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
