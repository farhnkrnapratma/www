<script lang="ts">
  import { onMount } from 'svelte';
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

  type Theme = 'auto' | 'dark' | 'light';

  let {
    name = 'Farhan Kurnia Pratama',
    description = 'Security-focused Software Engineer with expertise in Linux/Unix, AI, and Open-Source Software, dedicated to building reliable, maintainable, and privacy-centric systems.',
    navItems = [],
    onNavClick,
    class: className = '',
  }: Props = $props();

  let theme = $state<Theme>('auto');
  let themeDropdownOpen = $state(false);

  let resolvedNavItems = $derived(navItems.length > 0 ? navItems : defaultNavItems);

  function applyTheme(newTheme: Theme) {
    theme = newTheme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (newTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }

  function getThemeIcon(t: Theme = theme) {
    if (t === 'dark') return 'bi-moon-stars-fill';
    if (t === 'light') return 'bi-sun-fill';
    return 'bi-circle-half';
  }

  function getThemeLabel(t: Theme = theme) {
    if (t === 'dark') return 'Dark';
    if (t === 'light') return 'Light';
    return 'Auto';
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) {
        theme = saved;
      }
    }
  });
</script>

<footer
  class={cn(
    'relative z-10 mx-auto mt-auto w-full px-6 pt-4 pb-6 font-sans text-xs text-text-muted md:w-[80%] lg:w-[50%]',
    className,
  )}>
  <!-- Layer 1: Upper Footer Wrapped in Rounded Card Container -->
  <div class="rounded-2xl border border-border-subtle/80 bg-surface-card/60 p-6 shadow-2xs">
    <div class="grid grid-cols-1 gap-x-0 gap-y-1 md:grid-cols-12">
      <!-- Row 1: Name on Left (NO vertical divider line beside name) -->
      <div class="md:col-span-7 md:pr-6">
        <h3 class="text-base font-bold text-text-primary">{name}</h3>
      </div>

      <!-- Empty Header Slot on Right to align navigation start with description baseline -->
      {#if resolvedNavItems.length > 0}
        <div class="hidden md:col-span-5 md:block"></div>
      {/if}

      <!-- Row 2: Bio on Left; 2x3 Navigation Grid on Right (Horizontal Divider on Mobile, Vertical Divider on Desktop) -->
      <div class="pt-0.5 md:col-span-7 md:pr-6">
        <p class="max-w-md text-xs leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>

      {#if resolvedNavItems.length > 0}
        <div
          class="mt-3 border-t border-border-subtle/40 pt-3 md:col-span-5 md:mt-0 md:border-t-0 md:border-l md:border-border-subtle/40 md:pt-0.5 md:pl-6">
          <nav aria-label="Footer navigation">
            <ul class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-normal text-text-secondary">
              {#each resolvedNavItems as item, index (item.url)}
                <li class="text-xs leading-[29px] {index % 2 === 0 ? 'md:pl-2.5' : ''}">
                  {#if onNavClick}
                    <button
                      type="button"
                      onclick={() => onNavClick(item.url)}
                      class="cursor-pointer text-left text-xs leading-[29px] font-normal text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
                      {item.label}
                    </button>
                  {:else}
                    <a
                      href={item.url}
                      class="cursor-pointer text-left text-xs leading-[29px] font-normal text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
                      {item.label}
                    </a>
                  {/if}
                </li>
              {/each}
            </ul>
          </nav>
        </div>
      {/if}

      <!-- Row 3: Shared Horizontal Alignment Row (Social Media Buttons on Left + Theme Switcher Floated Right) -->
      <div class="flex items-center justify-between pt-4 md:col-span-12">
        <!-- Left: Social Media Buttons -->
        <div class="flex items-center gap-2.5">
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

        <!-- Right: Theme Switcher Button -->
        <div class="relative w-fit">
          <button
            type="button"
            onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
            class="inline-flex h-8 w-fit min-w-[5.5rem] cursor-pointer items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-semibold text-text-secondary shadow-2xs transition-all hover:border-border-subtle/80 hover:bg-surface-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label="Change theme"
            aria-haspopup="true"
            aria-expanded={themeDropdownOpen}>
            <span class="inline-flex items-center gap-1.5 whitespace-nowrap">
              <i
                class="bi {getThemeIcon()} text-xs text-text-secondary"
                aria-hidden="true"></i>
              <span>{getThemeLabel()}</span>
            </span>
            <span
              class="inline-flex h-3.5 w-3.5 shrink-0 origin-center items-center justify-center text-text-muted transition-transform duration-200 ease-out {(
                themeDropdownOpen
              ) ?
                'rotate-180'
              : ''}">
              <i
                class="bi bi-chevron-down text-[9px] leading-none"
                aria-hidden="true"></i>
            </span>
          </button>

          {#if themeDropdownOpen}
            <button
              type="button"
              class="fixed inset-0 z-40 cursor-default"
              onclick={() => (themeDropdownOpen = false)}
              aria-label="Close theme menu"></button>
            <div
              class="absolute right-0 bottom-full z-50 mb-1.5 flex min-w-[7rem] flex-col rounded-xl border border-border-subtle bg-surface-elevated p-1 shadow-xl backdrop-blur-md">
              {#each ['auto', 'light', 'dark'] as const as option (option)}
                <button
                  type="button"
                  onclick={() => {
                    applyTheme(option);
                    themeDropdownOpen = false;
                  }}
                  class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors {(
                    theme === option
                  ) ?
                    'bg-accent/10 font-semibold text-accent'
                  : 'text-text-primary hover:bg-surface-hover'}">
                  <i
                    class="bi {getThemeIcon(option)} text-xs {theme === option ? 'text-accent' : (
                      'text-text-secondary'
                    )}"
                    aria-hidden="true"></i>
                  <span>{getThemeLabel(option)}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Layer 2: Consolidated Single Bottom Meta Row (Center Aligned) -->
  <div class="pt-5 text-center select-none">
    <div
      class="no-scrollbar flex max-w-full items-center justify-center gap-x-4 overflow-x-auto text-xs font-medium whitespace-nowrap text-text-muted">
      <span class="shrink-0 text-text-muted/70">
        &copy; {new Date().getFullYear()}
        {name}.
      </span>
      <a
        href="/atom.xml"
        class="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        <i
          class="bi bi-rss-fill text-[11px] leading-none text-text-muted transition-colors group-hover:text-text-primary"
          aria-hidden="true"></i>
        <span>RSS</span>
      </a>
      <a
        href="/sitemap.xml"
        class="shrink-0 whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        Sitemap
      </a>
      <a
        href="/privacy"
        class="shrink-0 whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        Privacy
      </a>
      <button
        type="button"
        onclick={() => consentStore.openCustomizeModal()}
        class="shrink-0 cursor-pointer whitespace-nowrap transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none">
        Manage cookies
      </button>
    </div>
  </div>
</footer>
