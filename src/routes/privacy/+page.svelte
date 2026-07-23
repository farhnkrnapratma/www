<script lang="ts">
  import { onMount } from 'svelte';
  import { SkipLink, FooterSection } from '$lib';
  import SpotlightSearch from '$lib/components/SpotlightSearch.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import { consentStore } from '$lib/stores/consentStore.svelte';

  const name = 'Farhan Kurnia Pratama';
  const siteUrl = 'https://fkp.my.id/';

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

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-border-subtle bg-surface-card/60 px-3 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300 sm:px-5"
  aria-label="Privacy page navigation">
  <!-- Left side: Bordered Back to Home button without icon (Matching Sign out button styling) -->
  <a
    href="/"
    class="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-card px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
    Back to Home
  </a>

  <!-- Right side: Search bar (SpotlightSearch) + Theme selector -->
  <div class="flex items-center gap-2">
    <SpotlightSearch />
    <div class="relative">
      <IconButton
        ariaLabel="Change theme"
        variant="default"
        size="md"
        onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
        aria-haspopup="true"
        aria-expanded={themeDropdownOpen}>
        {#if theme === 'auto'}
          <i
            class="bi bi-circle-half"
            aria-hidden="true"></i>
        {:else}
          <i
            class="bi {theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}"
            aria-hidden="true"></i>
        {/if}
      </IconButton>

      {#if themeDropdownOpen}
        <button
          type="button"
          class="fixed inset-0 z-40 cursor-default"
          onclick={() => (themeDropdownOpen = false)}
          aria-label="Close theme menu"></button>
        <div
          role="menu"
          class="absolute top-11 right-0 z-50 flex min-w-31 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1.5 shadow-lg">
          {#each [['auto', 'bi-circle-half', 'Auto'], ['light', 'bi-sun-fill', 'Light'], ['dark', 'bi-moon-stars-fill', 'Dark']] as const as [val, icon, label] (val)}
            <button
              type="button"
              role="menuitem"
              onclick={() => {
                applyTheme(val);
                themeDropdownOpen = false;
              }}
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-surface-hover {(
                theme === val
              ) ?
                'text-accent'
              : 'text-text-primary'}">
              <i
                class="bi {icon} text-sm"
                aria-hidden="true"></i>
              {label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</nav>

<main
  id="main-content"
  class="relative z-10 mx-auto w-full px-6 pt-24 pb-20 font-sans md:w-[80%] md:max-w-none md:pt-28 md:pb-24 lg:w-[50%]">
  <div class="mb-8">
    <h1 class="text-3xl font-bold tracking-tight text-text-primary">Privacy Policy</h1>
    <p class="mt-2 text-xs text-text-muted">Last updated: July 22, 2026</p>
  </div>

  <div class="space-y-8 text-sm leading-relaxed text-text-secondary">
    <!-- Section 1: Overview & Scope -->
    <section>
      <h2 class="text-base font-bold text-text-primary">1. Overview & Data Transparency</h2>
      <p class="mt-2">
        Farhan Kurnia Pratama ("we", "our", or "us") is committed to respecting your privacy and
        maintaining complete transparency regarding how your data is handled when you visit <a
          href={siteUrl}
          class="font-medium text-accent hover:underline">{siteUrl}</a
        >. This site operates with a strict privacy-by-default policy. We do not sell, rent, or
        monetize any user information.
      </p>
    </section>

    <!-- Section 2: Visitor Analytics & Consent Mode -->
    <section>
      <h2 class="text-base font-bold text-text-primary">2. Google Analytics 4 & Consent Mode v2</h2>
      <p class="mt-2">
        We use Google Analytics 4 (GA4) solely to analyze aggregate site traffic, measure content
        reach, and optimize site performance. Our analytics implementation fully adheres to <strong
          class="font-semibold text-text-primary">Google Consent Mode v2</strong
        >:
      </p>
      <ul class="mt-2 list-disc space-y-1.5 pl-5">
        <li>
          <strong class="font-semibold text-text-primary">Default Denial:</strong> All optional
          consent signals (<code class="rounded bg-surface-hover px-1 py-0.5 font-mono text-xs"
            >analytics_storage</code
          >,
          <code class="rounded bg-surface-hover px-1 py-0.5 font-mono text-xs">ad_storage</code>,
          <code class="rounded bg-surface-hover px-1 py-0.5 font-mono text-xs">ad_user_data</code>,
          <code class="rounded bg-surface-hover px-1 py-0.5 font-mono text-xs"
            >ad_personalization</code
          >) default to <strong class="text-accent">Denied</strong> until you explicitly grant consent
          via our Cookie Settings.
        </li>
        <li>
          <strong class="font-semibold text-text-primary">IP Anonymization:</strong> IP addresses are
          automatically masked and anonymized by GA4 prior to processing.
        </li>
        <li>
          <strong class="font-semibold text-text-primary">No Cross-Site Tracking:</strong> We do not use
          third-party advertising cookies or cross-site tracking technologies.
        </li>
      </ul>
    </section>

    <!-- Section 3: Data Retention -->
    <section>
      <h2 class="text-base font-bold text-text-primary">
        3. Data Retention Policy (14-Month Standard)
      </h2>
      <p class="mt-2">
        In accordance with Google Analytics 4 data retention capabilities and privacy best
        practices, user-level and event-level data (such as pageview events, session duration, and
        browser metrics) is strictly retained for a maximum duration of <strong
          class="font-semibold text-text-primary">14 months</strong> from the date of collection.
      </p>
      <p class="mt-2">
        After 14 months, all associated user data is automatically deleted from Google Analytics
        servers. Aggregate, non-identifiable summary reporting (such as monthly traffic totals) may
        be retained solely for historical site performance analysis.
      </p>
    </section>

    <!-- Section 4: Public Comments & Interactive Features -->
    <section>
      <h2 class="text-base font-bold text-text-primary">4. Public Comments & Feedback</h2>
      <p class="mt-2">
        When you submit a comment on a blog post or send feedback via our feedback form:
      </p>
      <ul class="mt-2 list-disc space-y-1.5 pl-5">
        <li>
          The name (or "Anonymous") and comment message you submit are stored securely in our
          database and displayed publicly on the post.
        </li>
        <li>
          We process comments through automated spam detection filter algorithms to prevent abuse.
        </li>
        <li>You may request the deletion of your published comments at any time.</li>
      </ul>
    </section>

    <!-- Section 5: Cookie Preferences & Controls -->
    <section>
      <h2 class="text-base font-bold text-text-primary">5. Your Choices & Cookie Preferences</h2>
      <p class="mt-2">
        You retain full control over your cookie preferences at all times. You can modify or revoke
        your consent decisions whenever you choose:
      </p>
      <div class="mt-3">
        <button
          type="button"
          onclick={() => consentStore.openCustomizeModal()}
          class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface-card px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          Manage Cookie Settings
        </button>
      </div>
    </section>

    <!-- Section 6: Contact -->
    <section>
      <h2 class="text-base font-bold text-text-primary">6. Contact Information</h2>
      <p class="mt-2">
        If you have any questions or privacy inquiries regarding this policy or your data, please
        contact us at <a
          href="mailto:contact@fkp.my.id"
          class="font-medium text-accent hover:underline">contact@fkp.my.id</a
        >.
      </p>
    </section>
  </div>
</main>

<FooterSection {name} />
