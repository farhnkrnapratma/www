<script lang="ts">
  import { cn } from '../utils/cn';

  interface Props {
    label: string;
    href: string;
    icon?: string;
    class?: string;
  }

  let {
    label,
    href,
    icon = 'bi-arrow-right',
    class: className = '',
  }: Props = $props();
</script>

<div
  class={cn(
    'mt-6 flex items-center justify-end border-t border-border-subtle/50 pt-4 select-none',
    className
  )}>
  <a
    {href}
    class="group inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded-sm">
    <span>{label}</span>
    <i class="bi {icon} text-xs transition-transform group-hover:translate-x-1" aria-hidden="true"></i>
  </a>
</div>
