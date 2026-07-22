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

    {#if resolvedNavItems.length > 0}
      <div class="flex flex-col justify-between pt-8 md:col-span-5 md:pt-8">
        <ul class="grid grid-cols-2 gap-x-4 gap-y-2">
          {#each resolvedNavItems as item (item.url)}
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

        <div class="relative mt-6 pt-1">
          <button
            type="button"
            onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
            class="inline-flex h-8 items-center gap-2 rounded-lg border border-border-subtle bg-surface-card px-3 text-xs font-medium text-text-secondary shadow-2xs transition-all hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none"
            aria-label="Change theme"
            aria-haspopup="true"
            aria-expanded={themeDropdownOpen}>
            <i
              class="bi {getThemeIcon()} text-xs text-text-secondary"
              aria-hidden="true"></i>
            <span>{getThemeLabel()}</span>
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
              class="absolute bottom-full left-0 z-50 mb-1.5 flex min-w-32 flex-col rounded-xl border border-border-subtle bg-surface-elevated p-1 shadow-xl backdrop-blur-md">
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
    {/if}
  </div>

  <!-- Footer Meta Section with Categorized Resources & Legal Columns -->
  <div class="mt-8 border-t border-border-subtle/60 pt-8 select-none">
    <div class="grid grid-cols-2 gap-8 sm:grid-cols-2">
      <!-- Resources Column -->
      <div class="flex flex-col gap-2.5">
        <h4 class="text-[11px] font-bold tracking-wider text-text-primary uppercase">Resources</h4>
        <div class="flex flex-col gap-2">
          <a
            href="/atom.xml"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-[#f26522] focus-visible:text-[#f26522] focus-visible:outline-none">
            <i
              class="bi bi-rss-fill text-[11px] leading-none text-[#f26522]"
              aria-hidden="true"></i>
            <span>RSS feed</span>
          </a>
          <a
            href="/sitemap.xml"
            class="text-xs font-semibold text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
            Sitemap
          </a>
        </div>
      </div>

      <!-- Legal & Privacy Column -->
      <div class="flex flex-col gap-2.5">
        <h4 class="text-[11px] font-bold tracking-wider text-text-primary uppercase">Legal</h4>
        <div class="flex flex-col gap-2">
          <a
            href="/privacy"
            class="text-xs font-semibold text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
            Privacy Policy
          </a>
          <button
            type="button"
            onclick={() => consentStore.openCustomizeModal()}
            class="cursor-pointer text-left text-xs font-semibold text-text-secondary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none">
            Cookie Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Concise Dynamic Copyright Notice -->
    <div class="mt-8 border-t border-border-subtle/40 pt-4 text-center">
      <p class="text-xs font-medium text-text-muted">
        &copy; {new Date().getFullYear()}
        {name}
      </p>
    </div>
  </div>
</footer>
