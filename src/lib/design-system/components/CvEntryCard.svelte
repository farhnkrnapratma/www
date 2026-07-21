<script lang="ts">
  import Tag from '../components/Tag.svelte';
  import TagGroup from '../components/TagGroup.svelte';
  import { cn } from '../utils/cn';

  interface Props {
    role: string;
    organization: string;
    period: string;
    location?: string;
    description?: string;
    highlights?: string[];
    tags?: string[];
    class?: string;
  }

  let {
    role,
    organization,
    period,
    location = '',
    description = '',
    highlights = [],
    tags = [],
    class: className = '',
  }: Props = $props();
</script>

<div
  class={cn(
    'relative flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface/60 p-5 sm:p-6 shadow-xs backdrop-blur-lg transition-all hover:bg-surface-hover hover:border-border-strong select-none',
    className
  )}>
  <!-- Top Row: Role + Organization & Period -->
  <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 class="text-base font-bold text-text-primary">{role}</h3>
      <span class="text-xs font-semibold text-accent">{organization}</span>
      {#if location}
        <span class="text-xs text-text-muted"> • {location}</span>
      {/if}
    </div>

    <span class="inline-flex items-center rounded-full border border-border-subtle bg-surface px-2.5 py-0.5 text-[11px] font-mono font-medium text-text-secondary self-start sm:self-auto shrink-0 mt-1 sm:mt-0">
      {period}
    </span>
  </div>

  <!-- Description -->
  {#if description}
    <p class="text-xs leading-relaxed text-text-secondary">
      {description}
    </p>
  {/if}

  <!-- Key Highlights Bullet List -->
  {#if highlights.length > 0}
    <ul class="list-disc pl-4 text-xs text-text-secondary space-y-1">
      {#each highlights as item}
        <li>{item}</li>
      {/each}
    </ul>
  {/if}

  <!-- Tech Tags -->
  {#if tags.length > 0}
    <TagGroup class="mt-1 pt-3 border-t border-border-subtle/40">
      {#each tags as t}
        <Tag variant="neutral" size="sm">{t}</Tag>
      {/each}
    </TagGroup>
  {/if}
</div>
