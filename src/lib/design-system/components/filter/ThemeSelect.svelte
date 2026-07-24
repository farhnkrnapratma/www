<script lang="ts">
  import { cn } from '../../utils/cn';
  import DropdownTrigger from './DropdownTrigger.svelte';

  type Theme = 'auto' | 'dark' | 'light';

  interface Props {
    theme: Theme;
    onThemeChange: (newTheme: Theme) => void;
    class?: string;
    dropdownDirection?: 'up' | 'down';
  }

  let {
    theme = 'auto',
    onThemeChange,
    class: className = '',
    dropdownDirection = 'down',
  }: Props = $props();

  let isOpen = $state(false);

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'auto', label: 'Auto', icon: 'bi-circle-half' },
    { value: 'light', label: 'Light', icon: 'bi-sun-fill' },
    { value: 'dark', label: 'Dark', icon: 'bi-moon-stars-fill' },
  ];

  let currentOption = $derived(themeOptions.find(o => o.value === theme) ?? themeOptions[0]);

  function selectTheme(value: Theme) {
    onThemeChange(value);
    isOpen = false;
  }
</script>

<div
  class={cn(
    'relative inline-flex items-center select-none',
    isOpen ? 'z-[60]' : 'z-20',
    className,
  )}>
  <DropdownTrigger
    ariaLabel="Theme: {currentOption.label}"
    {isOpen}
    onclick={() => (isOpen = !isOpen)}>
    <span class="inline-flex items-center gap-1.5">
      <i
        class="bi {currentOption.icon} text-xs"
        aria-hidden="true"></i>
      <span>{currentOption.label}</span>
    </span>
  </DropdownTrigger>

  {#if isOpen}
    <button
      type="button"
      class="fixed inset-0 z-[65] cursor-default"
      onclick={() => (isOpen = false)}
      aria-label="Close theme selector"></button>

    <div
      role="listbox"
      aria-label="Theme options"
      class={cn(
        'absolute right-0 z-[70] flex min-w-32 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated py-1 shadow-xl backdrop-blur-md',
        dropdownDirection === 'up' ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]',
      )}>
      {#each themeOptions as option (option.value)}
        <button
          type="button"
          role="option"
          aria-selected={theme === option.value}
          onclick={() => selectTheme(option.value)}
          class={cn(
            'flex cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors',
            theme === option.value ?
              'bg-accent/10 font-semibold text-accent'
            : 'text-text-primary hover:bg-surface-hover',
          )}>
          <i
            class="bi {option.icon} text-xs {theme === option.value ?
              'text-accent'
            : 'text-text-secondary'}"
            aria-hidden="true"></i>
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
