<script lang="ts">
  import { cn } from '../utils/cn';
  import { consentStore } from '../../stores/consentStore.svelte';

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

  const defaultNavItems: NavItem[] = [
    { label: 'Home', url: '/' },
    { label: 'Projects', url: '/#projects' },
    { label: 'Blogs', url: '/#blogs' },
    { label: 'CV', url: '/#cv' },
    { label: 'Funding', url: '/#funding' },
    { label: 'Contacts', url: '/#contacts' },
  ];

  let {
    name = 'Farhan Kurnia Pratama',
    description = 'Security-focused Software Engineer with expertise in Linux/Unix, AI, and Open-Source Software, dedicated to building reliable, maintainable, and privacy-centric systems.',
    navItems = [],
    onNavClick,
    class: className = '',
  }: Props = $props();

  let resolvedNavItems = $derived(navItems.length > 0 ? navItems : defaultNavItems);
</script>

<footer
  class={cn(
    'relative z-10 mx-auto mt-auto w-full border-t border-border-subtle px-6 pt-10 pb-8 font-sans text-xs text-text-muted md:w-[80%] lg:w-[50%]',
    className,
  )}>
  <!-- Layer 1: Upper Footer (2-Zone Grid with Baseline Alignment & Matched Description Rhythm) -->
  <div class="grid grid-cols-1 gap-8 pb-6 md:grid-cols-12">
    <!-- Zone 1 (Left): Brand, Bio & Social Links -->
    <div class="flex flex-col gap-3.5 md:col-span-7">
      <div>
        <h3 class="text-base font-bold text-text-primary">{name}</h3>
        <p class="mt-1.5 max-w-md text-xs leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>

      <div class="flex items-center gap-2.5 pt-0.5">
        <a
          href="https://github.com/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label="GitHub profile (opens in a new tab)">
          <i
            class="bi bi-github text-base leading-none"
            aria-hidden="true"></i>
        </a>
        <a
          href="https://linkedin.com/in/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label="LinkedIn profile (opens in a new tab)">
          <i
            class="bi bi-linkedin text-base leading-none"
            aria-hidden="true"></i>
        </a>
        <a
          href="https://x.com/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label="X profile (opens in a new tab)">
          <i
            class="bi bi-twitter-x text-base leading-none"
            aria-hidden="true"></i>
        </a>
        <a
          href="https://instagram.com/farhnkrnapratma"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label="Instagram profile (opens in a new tab)">
          <i
            class="bi bi-instagram text-base leading-none"
            aria-hidden="true"></i>
        </a>
      </div>
    </div>

    <!-- Zone 2 (Right Zone): Navigation Column (Baseline Aligned with Name, Non-Bold Text Matched with Description) -->
    {#if resolvedNavItems.length > 0}
      <div class="flex flex-col md:col-span-5">
        <h4
          class="pt-0.5 text-[11px] font-bold tracking-wider text-text-primary uppercase md:pt-[3px]">
          Navigation
        </h4>
        <ul class="mt-1.5 flex flex-col gap-1">
          {#each resolvedNavItems as item (item.url)}
            <li>
              {#if onNavClick}
                <button
                  type="button"
                  onclick={() => onNavClick(item.url)}
                  class="cursor-pointer text-left text-xs leading-relaxed font-normal text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
                  {item.label}
                </button>
              {:else}
                <a
                  href={item.url}
                  class="cursor-pointer text-left text-xs leading-relaxed font-normal text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
                  {item.label}
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <!-- Layer 2: Consolidated Single Bottom Meta Row (Copyright · RSS · Sitemap · Privacy · Manage cookies) -->
  <div class="border-t border-border-subtle/50 pt-4 select-none">
    <div
      class="no-scrollbar flex max-w-full items-center justify-start gap-x-3 overflow-x-auto text-xs font-medium whitespace-nowrap text-text-muted">
      <span class="shrink-0 text-text-muted/70">
        &copy; {new Date().getFullYear()}
        {name}.
      </span>
      <span
        class="shrink-0 text-text-muted/30"
        aria-hidden="true">&middot;</span>
      <a
        href="/atom.xml"
        class="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        <i
          class="bi bi-rss-fill text-[11px] leading-none text-text-muted transition-colors group-hover:text-text-primary"
          aria-hidden="true"></i>
        <span>RSS</span>
      </a>
      <span
        class="shrink-0 text-text-muted/30"
        aria-hidden="true">&middot;</span>
      <a
        href="/sitemap.xml"
        class="shrink-0 whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        Sitemap
      </a>
      <span
        class="shrink-0 text-text-muted/30"
        aria-hidden="true">&middot;</span>
      <a
        href="/privacy"
        class="shrink-0 whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        Privacy
      </a>
      <span
        class="shrink-0 text-text-muted/30"
        aria-hidden="true">&middot;</span>
      <button
        type="button"
        onclick={() => consentStore.openCustomizeModal()}
        class="shrink-0 cursor-pointer whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        Manage cookies
      </button>
    </div>
  </div>
</footer>
