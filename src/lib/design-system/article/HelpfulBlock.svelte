<script lang="ts">
  import Button from '../components/Button.svelte';
  import { cn } from '../utils/cn';

  interface Props {
    title?: string;
    onVote?: (helpful: boolean) => void;
    class?: string;
  }

  let {
    title = 'Was this article helpful?',
    onVote,
    class: className = '',
  }: Props = $props();

  let voted = $state<boolean | null>(null);

  function handleVote(helpful: boolean) {
    voted = helpful;
    onVote?.(helpful);
  }
</script>

<div
  class={cn(
    'my-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface/50 p-6 text-center shadow-xs sm:flex-row sm:text-left select-none',
    className
  )}>
  <div class="flex flex-col gap-0.5">
    <span class="text-xs font-bold text-text-primary">{title}</span>
    <span class="text-[11px] text-text-muted">Let us know if you found this post useful.</span>
  </div>

  {#if voted !== null}
    <span class="text-xs font-semibold text-accent flex items-center gap-1.5">
      <i class="bi bi-check-circle-fill" aria-hidden="true"></i> Thanks for your feedback!
    </span>
  {:else}
    <div class="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        leadingIcon="bi-hand-thumbs-up"
        onclick={() => handleVote(true)}>
        Yes
      </Button>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon="bi-hand-thumbs-down"
        onclick={() => handleVote(false)}>
        No
      </Button>
    </div>
  {/if}
</div>
