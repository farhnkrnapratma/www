<script lang="ts">
  import { onMount } from 'svelte';
  import { SkipLink, FooterSection } from '$lib';

  const name = 'Farhan Kurnia Pratama';
  const desc =
    'Security-focused Software Engineer with expertise in Linux/Unix, AI, and Open-Source Software, dedicated to building reliable, maintainable, and privacy-centric systems.';
  const siteUrl = 'https://fkp.my.id/';

  const footerNavItems = [
    { label: 'Home', url: '/' },
    { label: 'Projects', url: '/#projects' },
    { label: 'Blogs', url: '/#blogs' },
    { label: 'CV', url: '/#cv' },
    { label: 'Funding', url: '/#funding' },
    { label: 'Contacts', url: '/#contacts' },
  ];

  type Theme = 'auto' | 'dark' | 'light';
  let theme = $state<Theme>('auto');
  let themeDropdownOpen = $state(false);

  function applyTheme(newTheme: Theme) {
    theme = newTheme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      const isDark =
        newTheme === 'dark' ||
        (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  onMount(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'auto';
    applyTheme(saved);
  });
</script>

<svelte:head>
  <title>Privacy Policy — {name}</title>
  <meta
    name="description"
    content="Privacy policy and data collection transparency statement for {siteUrl}" />
  <meta
    property="og:title"
    content="Privacy Policy — {name}" />
  <meta
    property="og:description"
    content="Privacy policy and data collection transparency statement for {siteUrl}" />
  <meta
    property="og:url"
    content="{siteUrl}privacy" />
  <meta
    property="og:type"
    content="website" />
</svelte:head>

<SkipLink />

<!-- Top Header Navigation Bar -->
<header
  class="fixed top-0 right-0 left-0 z-40 border-b border-border-subtle bg-surface-card/80 backdrop-blur-md">
  <div
    class="mx-auto flex h-15 items-center justify-between px-6 font-sans md:w-[80%] md:max-w-none lg:w-[50%]">
    <a
      href="/"
      class="flex items-center gap-2.5 text-text-primary transition-opacity hover:opacity-85">
      <img
        src="/android-chrome-512x512.png"
        alt="Farhan Kurnia Pratama"
        class="h-6.5 w-6.5 rounded-full border border-accent/40 object-cover object-top" />
      <span class="text-sm font-bold tracking-tight">{name}</span>
    </a>

    <div class="flex items-center gap-3">
      <!-- Theme Switcher -->
      <div class="relative">
        <button
          type="button"
          onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
          aria-label="Select theme"
          aria-expanded={themeDropdownOpen}
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
          <i
            class="bi {theme === 'dark' ? 'bi-moon-stars-fill'
            : theme === 'light' ? 'bi-sun-fill'
            : 'bi-circle-half'} text-sm"
            aria-hidden="true"></i>
        </button>

        {#if themeDropdownOpen}
          <button
            type="button"
            class="fixed inset-0 z-40 cursor-default"
            onclick={() => (themeDropdownOpen = false)}
            aria-label="Close menu"></button>
          <div
            class="absolute top-11 right-0 z-50 flex min-w-32 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1 shadow-xl backdrop-blur-md">
            {#each [['auto', 'bi-circle-half', 'Auto'], ['light', 'bi-sun-fill', 'Light'], ['dark', 'bi-moon-stars-fill', 'Dark']] as const as [val, icon, label] (val)}
              <button
                type="button"
                onclick={() => {
                  applyTheme(val);
                  themeDropdownOpen = false;
                }}
                class="flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left text-xs font-semibold transition-colors hover:bg-surface-hover {(
                  theme === val
                ) ?
                  'text-accent'
                : 'text-text-primary'}">
                <i
                  class="bi {icon} text-xs"
                  aria-hidden="true"></i>
                <span>{label}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <a
        href="/"
        class="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-card px-3 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover">
        Back to Home
      </a>
    </div>
  </div>
</header>

<main
  id="main-content"
  class="relative z-10 mx-auto w-full px-6 pt-24 pb-20 font-sans md:w-[80%] md:max-w-none md:pt-28 md:pb-24 lg:w-[50%]">
  <div class="mb-8">
    <h1 class="text-3xl font-bold tracking-tight text-text-primary">Privacy Policy</h1>
    <p class="mt-2 text-xs text-text-muted">Last updated: July 22, 2026</p>
  </div>

  <div class="flex flex-col gap-6 text-sm leading-relaxed text-text-secondary">
    <section
      class="rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-lg">
      <h2 class="text-base font-bold text-text-primary">1. Overview</h2>
      <p class="mt-2">
        This Privacy Policy outlines how personal and usage information is handled on
        <strong class="text-text-primary">fkp.my.id</strong>. I am committed to respecting your
        privacy and building privacy-centric, security-focused web experiences.
      </p>
    </section>

    <section
      class="rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-lg">
      <h2 class="text-base font-bold text-text-primary">2. Data Collection & Analytics</h2>
      <p class="mt-2">
        This website uses <strong>Google Analytics (gtag.js)</strong> to understand aggregate site traffic,
        popular content, and visitor demographics.
      </p>
      <ul class="mt-3 list-disc space-y-1.5 pl-5 text-xs text-text-secondary">
        <li>
          <strong>Information Collected:</strong> Pages visited, time spent, browser/device type, general
          geographic location, and referral sources.
        </li>
        <li>
          <strong>No Personal Selling:</strong> No personal identification data (PII) is sold, traded,
          or shared with third-party advertisers.
        </li>
        <li>
          <strong>Cookies & Identifiers:</strong> Google Analytics uses first-party cookies and anonymous
          identifiers to distinguish unique users and sessions.
        </li>
      </ul>
    </section>

    <section
      class="rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-lg">
      <h2 class="text-base font-bold text-text-primary">3. Form Submissions</h2>
      <p class="mt-2">
        If you submit a message via the Contact or Feedback forms, the information you provide
        (name, email, message) is used solely to respond to your inquiry. Form entries are
        transmitted securely and are never shared for marketing purposes.
      </p>
    </section>

    <section
      class="rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-lg">
      <h2 class="text-base font-bold text-text-primary">4. Your Choices & Controls</h2>
      <p class="mt-2">
        You can disable cookies in your browser settings or use browser extensions like <em
          >uBlock Origin</em>
        or <em>Google Analytics Opt-out Browser Add-on</em> to prevent data collection by Google Analytics
        without affecting your ability to view this website.
      </p>
    </section>

    <section
      class="rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-lg">
      <h2 class="text-base font-bold text-text-primary">5. Contact Information</h2>
      <p class="mt-2">
        If you have any questions regarding this privacy policy or data collection practices, please
        feel free to reach out via email at
        <a
          href="mailto:contact@fkp.my.id"
          class="font-semibold text-accent hover:underline">contact@fkp.my.id</a
        >.
      </p>
    </section>
  </div>
</main>

<FooterSection
  {name}
  description={desc}
  navItems={footerNavItems} />
