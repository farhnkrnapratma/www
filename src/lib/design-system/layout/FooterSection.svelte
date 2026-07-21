<script lang="ts">
  import { cn } from '../utils/cn';

  interface NavItem {
    label: string;
    url: string;
  }

  interface Props {
    name?: string;
    description?: string;
    navItems?: NavItem[];
    onNavClick?: (url: string) => void;
    class?: string;
  }

  let {
    name = 'Farhan Kurnia Pratama',
    description = 'Security-focused Software Engineer with expertise in Linux/Unix, AI, and Open-Source Software.',
    navItems = [],
    onNavClick,
    class: className = '',
  }: Props = $props();
</script>

<footer
  class={cn(
    'relative z-10 mx-auto mt-auto w-full border-t border-border-subtle px-6 pt-16 pb-12 font-sans text-xs text-text-muted md:w-[80%] lg:w-[50%]',
    className,
  )}>
  <div class="grid grid-cols-1 gap-8 pb-10 md:grid-cols-12">
    <div class="flex flex-col gap-4 md:col-span-7">
      <div>
        <h3 class="text-base font-bold text-text-primary">{name}</h3>
        <p class="mt-2 max-w-md text-xs leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <a
          href="https://github.com/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
          aria-label="GitHub (opens in a new tab)">
          <i
            class="bi bi-github text-base leading-none"
            aria-hidden="true"></i>
        </a>
        <a
          href="https://linkedin.com/in/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
          aria-label="LinkedIn (opens in a new tab)">
          <i
            class="bi bi-linkedin text-base leading-none"
            aria-hidden="true"></i>
        </a>
        <a
          href="https://x.com/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
          aria-label="X (opens in a new tab)">
          <i
            class="bi bi-twitter-x text-base leading-none"
            aria-hidden="true"></i>
        </a>
        <a
          href="https://instagram.com/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
          aria-label="Instagram (opens in a new tab)">
          <i
            class="bi bi-instagram text-base leading-none"
            aria-hidden="true"></i>
        </a>
      </div>
    </div>

    {#if navItems.length > 0}
      <div class="flex flex-col pt-1 md:col-span-5 md:pt-8">
        <ul class="grid grid-cols-2 gap-x-4 gap-y-2">
          {#each navItems as item (item.url)}
            <li>
              {#if onNavClick}
                <button
                  type="button"
                  onclick={() => onNavClick(item.url)}
                  class="cursor-pointer text-left font-medium transition-colors hover:text-accent">
                  {item.label}
                </button>
              {:else}
                <a
                  href={item.url}
                  class="cursor-pointer text-left font-medium transition-colors hover:text-accent">
                  {item.label}
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <div
    class="flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-6 select-none sm:flex-row">
    <p>&copy; {new Date().getFullYear()} {name}. All rights reserved</p>
    <div class="flex items-center gap-4 text-[11px] text-text-muted">
      <a
        href="/atom.xml"
        class="inline-flex items-center gap-1 transition-colors hover:text-[#f26522]">
        <i
          class="bi bi-rss-fill"
          aria-hidden="true"></i> RSS Feed
      </a>
      <a
        href="/sitemap.xml"
        class="transition-colors hover:text-accent">Sitemap</a>
    </div>
  </div>
</footer>
