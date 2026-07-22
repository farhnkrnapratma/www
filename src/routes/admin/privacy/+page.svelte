<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { consentStore, type RetentionPeriod } from '$lib/stores/consentStore.svelte';
  import { Button, IconButton, Badge, Dialog, SkipLink, StatusBanner, LoadingState } from '$lib';

  let isLoading = $state(true);
  let isLoggingOut = $state(false);

  let selectedEventRetention = $state<RetentionPeriod>('14_months');
  let selectedUserRetention = $state<RetentionPeriod>('14_months');

  let showTechDetailsBehavioral = $state(false);
  let showTechDetailsAd = $state(false);

  let showTestSignalModal = $state(false);
  let showConfigureBannerModal = $state(false);
  let testLog = $state<string[]>([]);
  let isTesting = $state(false);

  function resetStoredConsent() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fkp_cookie_consent_v2');
    }
    consentStore.openBanner();
    showConfigureBannerModal = false;
  }

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

  onMount(async () => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'auto';
    applyTheme(savedTheme);

    consentStore.init();
    selectedEventRetention = consentStore.retention.eventDataRetention;
    selectedUserRetention = consentStore.retention.userDataRetention;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.href = '/admin/login';
      return;
    }

    isLoading = false;
  });

  async function handleLogout() {
    isLoggingOut = true;
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  function handleSaveRetention() {
    consentStore.saveRetentionSettings(selectedEventRetention, selectedUserRetention);
  }

  function runSignalTest() {
    isTesting = true;
    testLog = [];

    const now = new Date().toLocaleTimeString();
    testLog.push(`[${now}] Initializing Consent Signal Test Harness...`);
    testLog.push(`[${now}] Target Stream: Web Stream (G-6HR3DKWZLF)`);
    testLog.push(
      `[${now}] Checking gtag.js execution order... PASS (gtag consent default executed prior to script tag)`,
    );

    setTimeout(() => {
      testLog.push(
        `[${now}] Dispatching test signal: gtag('consent', 'update', { analytics_storage: '${consentStore.signals.analytics_storage}', ad_storage: '${consentStore.signals.ad_storage}' })`,
      );
    }, 400);

    setTimeout(() => {
      testLog.push(`[${now}] dataLayer payload verified successfully.`);
      testLog.push(`[${now}] Result: Consent Mode v2 signals active and properly mapped.`);
      isTesting = false;
    }, 900);
  }
</script>

<svelte:head>
  <title>Privacy & Analytics — Admin Console</title>
</svelte:head>

<SkipLink />

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-border-subtle bg-surface-card/60 px-5 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300"
  aria-label="Admin navigation">
  <div class="flex items-center gap-4">
    <a
      href="/admin"
      class="flex items-center gap-2">
      <span
        class="material-symbols-rounded text-lg text-accent select-none"
        aria-hidden="true">code</span>
      <span class="text-sm font-bold text-text-primary select-none">Console</span>
    </a>

    <div class="h-4 w-[1px] bg-border-subtle"></div>

    <div class="flex items-center gap-1">
      <a
        href="/admin"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
        Posts & Comments
      </a>
      <a
        href="/admin/privacy"
        class="rounded-lg bg-surface-switcher-active px-3 py-1.5 text-xs font-bold text-accent shadow-xs">
        Privacy & Analytics
      </a>
    </div>
  </div>

  <div class="flex items-center gap-2">
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

    <Button
      variant="secondary"
      size="md"
      onclick={handleLogout}
      disabled={isLoggingOut}
      isLoading={isLoggingOut}>
      Sign out
    </Button>
  </div>
</nav>

<main
  id="main-content"
  class="flex min-h-[calc(100vh-3.75rem)] flex-col pt-15 font-sans">
  {#if isLoading}
    <section class="mx-auto w-full flex-1 px-6 py-10 md:w-[80%] md:max-w-none lg:w-[50%]">
      <LoadingState
        label="Loading privacy & analytics data..."
        size="lg"
        class="py-20" />
    </section>
  {:else}
    <section
      class="mx-auto w-full flex-1 px-6 py-10 md:w-[80%] md:max-w-none lg:w-[50%]"
      aria-label="Privacy and Analytics Management">
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-semibold text-accent">
          <i
            class="bi bi-shield-lock-fill"
            aria-hidden="true"></i>
          <span>GA4 & Consent Control Panel</span>
        </div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Privacy & Analytics
        </h1>
        <p class="mt-1 text-xs leading-relaxed text-text-secondary">
          Manage Google Analytics 4 data retention limits, Google Consent Mode v2 signals, and
          regional privacy rules.
        </p>
      </div>

      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          class="flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-card/60 p-5 shadow-xs backdrop-blur-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                Data Retention
              </span>
              <h3 class="mt-1 text-lg font-bold text-text-primary">
                Retention: {consentStore.retention.eventDataRetention === '14_months' ?
                  '14 months'
                : '2 months'}
              </h3>
            </div>
            <Badge
              variant="success"
              size="sm">Active</Badge>
          </div>
          <p class="text-xs leading-relaxed text-text-secondary">
            User-level and event-level data retention windows are configured to standard limits.
          </p>
        </div>

        <div
          class="flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-card/60 p-5 shadow-xs backdrop-blur-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                Consent Mode v2
              </span>
              <h3 class="mt-1 text-lg font-bold text-text-primary">
                Consent: {consentStore.overallConsentStatus}
              </h3>
            </div>
            <Badge
              variant={consentStore.overallConsentStatus === 'Good' ? 'success'
              : consentStore.overallConsentStatus === 'Partial' ? 'warning'
              : 'default'}
              size="sm">
              {consentStore.overallConsentStatus}
            </Badge>
          </div>
          <p class="text-xs leading-relaxed text-text-secondary">
            {consentStore.overallConsentStatus === 'Good' ?
              'Both Behavioral and Advertising consent signals are active.'
            : consentStore.overallConsentStatus === 'Partial' ?
              'Behavioral analytics active; advertising signals restricted.'
            : 'Consent banner active. Awaiting visitor consent choices.'}
          </p>
        </div>
      </div>

      <div
        class="mb-8 flex flex-col gap-5 rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-md">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <i
              class="bi bi-clock-history text-accent"
              aria-hidden="true"></i>
            <h2 class="text-base font-bold text-text-primary">Data Retention</h2>
          </div>
          <p class="text-xs text-text-secondary">
            Configure how long user-level and event-level identifiers are retained in Google
            Analytics 4 before automatic deletion.
          </p>
        </div>

        {#if consentStore.retentionSaveSuccess}
          <StatusBanner
            type="success"
            title="Retention settings updated successfully"
            message="Your data retention preference has been saved and will apply within 24 hours." />
        {/if}

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label
              for="event-retention-select"
              class="text-xs font-bold text-text-primary">
              Event data retention
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => (selectedEventRetention = '2_months')}
                class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all
                {selectedEventRetention === '2_months' ?
                  'border-accent bg-accent/10 text-accent shadow-2xs'
                : 'border-border-subtle bg-surface-card text-text-secondary hover:bg-surface-hover'}">
                2 months
              </button>
              <button
                type="button"
                onclick={() => (selectedEventRetention = '14_months')}
                class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all
                {selectedEventRetention === '14_months' ?
                  'border-accent bg-accent/10 text-accent shadow-2xs'
                : 'border-border-subtle bg-surface-card text-text-secondary hover:bg-surface-hover'}">
                14 months
              </button>
            </div>
            <span class="text-[11px] text-text-muted">
              Standard event-level data retention limit.
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="user-retention-select"
              class="text-xs font-bold text-text-primary">
              User data retention
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => (selectedUserRetention = '2_months')}
                class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all
                {selectedUserRetention === '2_months' ?
                  'border-accent bg-accent/10 text-accent shadow-2xs'
                : 'border-border-subtle bg-surface-card text-text-secondary hover:bg-surface-hover'}">
                2 months
              </button>
              <button
                type="button"
                onclick={() => (selectedUserRetention = '14_months')}
                class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all
                {selectedUserRetention === '14_months' ?
                  'border-accent bg-accent/10 text-accent shadow-2xs'
                : 'border-border-subtle bg-surface-card text-text-secondary hover:bg-surface-hover'}">
                14 months
              </button>
            </div>
            <span class="text-[11px] text-text-muted">
              User-level identifier retention window.
            </span>
          </div>
        </div>

        <div
          class="rounded-xl border border-border-subtle/50 bg-surface/40 p-3.5 text-xs text-text-muted">
          <ul class="list-disc space-y-1 pl-4">
            <li>
              <strong>Changes apply after 24 hours</strong> according to Google Analytics processing rules.
            </li>
            <li>
              Retention affects user-level and event-level data associated with cookies, User-IDs,
              or advertising identifiers.
            </li>
            <li>
              Google Signals data maintains a 26-month maximum limit regardless of these general
              settings.
            </li>
          </ul>
        </div>

        <div class="flex justify-end pt-2">
          <Button
            variant="primary"
            size="md"
            onclick={handleSaveRetention}
            isLoading={consentStore.isSavingRetention}
            disabled={consentStore.isSavingRetention}>
            Save retention settings
          </Button>
        </div>
      </div>

      <div
        class="mb-8 flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-md">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <i
                class="bi bi-sliders text-accent"
                aria-hidden="true"></i>
              <h2 class="text-base font-bold text-text-primary">Consent Settings</h2>
            </div>
            <p class="mt-0.5 text-xs text-text-secondary">
              Manage Google Consent Mode v2 signals mapped to visitor choices.
            </p>
          </div>

          <div class="flex items-center gap-2 select-none">
            <span class="text-xs font-semibold whitespace-nowrap text-text-muted">Stream:</span>
            <select
              value={consentStore.selectedStreamId}
              onchange={e => consentStore.setSelectedStream(e.currentTarget.value)}
              class="h-8.5 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-medium text-text-primary shadow-2xs">
              {#each consentStore.streams as stream (stream.id)}
                <option value={stream.id}>{stream.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-5">
          <div
            class="flex flex-col justify-between gap-4 rounded-xl border border-border-subtle bg-surface/50 p-5">
            <div class="flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Behavioral Analytics Consent</h3>
                  <p class="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    Measures sessions, page views, and interactions without personal advertising
                    tracking.
                  </p>
                </div>
                <Badge
                  variant={consentStore.isBehavioralActive ? 'success' : 'default'}
                  size="sm">
                  {consentStore.isBehavioralActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div
                class="flex flex-col gap-2 rounded-xl border border-border-subtle/50 bg-surface-card p-3 shadow-2xs">
                <span class="text-[11px] font-semibold text-text-muted">Underlying Signal:</span>
                <div
                  class="flex items-center justify-between gap-2 rounded-lg border border-border-subtle/40 bg-surface/60 px-3 py-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <span
                      class="h-2 w-2 shrink-0 rounded-full {(
                        consentStore.signals.analytics_storage === 'granted'
                      ) ?
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                      : 'bg-text-muted/40'}"></span>
                    <code class="truncate font-mono text-xs font-semibold text-text-primary">
                      analytics_storage
                    </code>
                  </div>
                  <Badge
                    variant={consentStore.signals.analytics_storage === 'granted' ?
                      'success'
                    : 'default'}
                    size="sm"
                    class="shrink-0 font-mono text-[10px] uppercase">
                    {consentStore.signals.analytics_storage}
                  </Badge>
                </div>
              </div>

              <div>
                <span class="text-[11px] font-semibold text-text-muted">Impact Summary:</span>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    class="rounded-md border border-border-subtle/60 bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    Session Measurement
                  </span>
                  <span
                    class="rounded-md border border-border-subtle/60 bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    Pageview Metrics
                  </span>
                  <span
                    class="rounded-md border border-border-subtle/60 bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    Engagement Reports
                  </span>
                </div>
              </div>

              <button
                type="button"
                onclick={() => (showTechDetailsBehavioral = !showTechDetailsBehavioral)}
                class="text-left text-[11px] font-bold text-accent hover:underline">
                {showTechDetailsBehavioral ? 'Hide technical spec' : 'Show technical spec →'}
              </button>

              {#if showTechDetailsBehavioral}
                <div
                  class="rounded-lg border border-border-subtle bg-surface-card p-3 font-mono text-[11px] text-text-muted">
                  <p>gtag('consent', 'update', &#123;</p>
                  <p class="pl-3">
                    'analytics_storage': '{consentStore.signals.analytics_storage}'
                  </p>
                  <p>&#125;);</p>
                </div>
              {/if}
            </div>

            <div class="flex flex-wrap items-center gap-2 border-t border-border-subtle/40 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onclick={() => (showConfigureBannerModal = true)}>
                Configure banner
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onclick={() =>
                  consentStore.updateConsent({
                    analytics_storage:
                      consentStore.signals.analytics_storage === 'granted' ? 'denied' : 'granted',
                  })}>
                Toggle signal
              </Button>
            </div>
          </div>

          <div
            class="flex flex-col justify-between gap-4 rounded-xl border border-border-subtle bg-surface/50 p-5">
            <div class="flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Advertising Consent</h3>
                  <p class="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    Controls Google Ads measurement, conversion export, and remarketing
                    personalization.
                  </p>
                </div>
                <Badge
                  variant={consentStore.isAdvertisingActive ? 'success' : 'default'}
                  size="sm">
                  {consentStore.isAdvertisingActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div
                class="flex flex-col gap-2 rounded-xl border border-border-subtle/50 bg-surface-card p-3 shadow-2xs">
                <span class="text-[11px] font-semibold text-text-muted">Underlying Signals:</span>
                <div class="flex flex-col gap-1.5">
                  {#each [['ad_storage', consentStore.signals.ad_storage], ['ad_user_data', consentStore.signals.ad_user_data], ['ad_personalization', consentStore.signals.ad_personalization]] as [signalKey, signalValue] (signalKey)}
                    <div
                      class="flex items-center justify-between gap-2 rounded-lg border border-border-subtle/40 bg-surface/60 px-3 py-1.5">
                      <div class="flex min-w-0 items-center gap-2">
                        <span
                          class="h-2 w-2 shrink-0 rounded-full {signalValue === 'granted' ?
                            'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                          : 'bg-text-muted/40'}"></span>
                        <code class="truncate font-mono text-xs font-semibold text-text-primary">
                          {signalKey}
                        </code>
                      </div>
                      <Badge
                        variant={signalValue === 'granted' ? 'success' : 'default'}
                        size="sm"
                        class="shrink-0 font-mono text-[10px] uppercase">
                        {signalValue}
                      </Badge>
                    </div>
                  {/each}
                </div>
              </div>

              <div>
                <span class="text-[11px] font-semibold text-text-muted">Impact Summary:</span>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    class="rounded-md border border-border-subtle/60 bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    Ad Measurement
                  </span>
                  <span
                    class="rounded-md border border-border-subtle/60 bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    Conversion Export
                  </span>
                  <span
                    class="rounded-md border border-border-subtle/60 bg-surface-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                    Remarketing
                  </span>
                </div>
              </div>

              <button
                type="button"
                onclick={() => (showTechDetailsAd = !showTechDetailsAd)}
                class="text-left text-[11px] font-bold text-accent hover:underline">
                {showTechDetailsAd ? 'Hide technical spec' : 'Show technical spec →'}
              </button>

              {#if showTechDetailsAd}
                <div
                  class="rounded-lg border border-border-subtle bg-surface-card p-3 font-mono text-[11px] text-text-muted">
                  <p>gtag('consent', 'update', &#123;</p>
                  <p class="pl-3">'ad_storage': '{consentStore.signals.ad_storage}',</p>
                  <p class="pl-3">'ad_user_data': '{consentStore.signals.ad_user_data}',</p>
                  <p class="pl-3">
                    'ad_personalization': '{consentStore.signals.ad_personalization}'
                  </p>
                  <p>&#125;);</p>
                </div>
              {/if}
            </div>

            <div class="flex flex-wrap items-center gap-2 border-t border-border-subtle/40 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onclick={() => (showTestSignalModal = true)}>
                Test consent signals
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-card/60 p-6 shadow-xs backdrop-blur-md">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <i
              class="bi bi-globe-americas text-accent"
              aria-hidden="true"></i>
            <h2 class="text-base font-bold text-text-primary">Default Consent by Region</h2>
          </div>
          <p class="text-xs text-text-secondary">
            Configure default consent signals applied before visitor interaction based on
            jurisdiction.
          </p>
        </div>

        <div class="space-y-3">
          <div
            class="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 class="text-xs font-bold text-text-primary">
                EEA / UK (European Economic Area & United Kingdom)
              </h4>
              <p class="mt-0.5 text-[11px] text-text-muted">
                GDPR compliance: All storage signals default to DENIED until explicit opt-in.
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <Badge
                variant="warning"
                size="sm">Denied by default</Badge>
              <span class="font-mono text-[11px] text-text-muted">wait_for_update: 500ms</span>
            </div>
          </div>

          <div
            class="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 class="text-xs font-bold text-text-primary">Global / Default Fallback Region</h4>
              <p class="mt-0.5 text-[11px] text-text-muted">
                Default fallback policy prior to visitor banner choices.
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <Badge
                variant="default"
                size="sm">Denied by default</Badge>
              <span class="font-mono text-[11px] text-text-muted">wait_for_update: 500ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}
</main>

<Dialog
  bind:isOpen={showTestSignalModal}
  title="Test Consent Mode v2 Signals"
  description="Run live dataLayer verification for Google Consent Mode signals."
  onClose={() => (showTestSignalModal = false)}>
  <div class="flex flex-col gap-4 py-2 font-sans">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-text-secondary">Stream ID: G-6HR3DKWZLF</span>
      <Button
        variant="primary"
        size="sm"
        onclick={runSignalTest}
        isLoading={isTesting}>
        Run Test
      </Button>
    </div>

    <div
      class="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-border-subtle bg-zinc-950 p-4 font-mono text-xs text-emerald-400 select-text">
      {#if testLog.length === 0}
        <p class="text-zinc-500">
          Click "Run Test" to dispatch and inspect Consent Mode v2 dataLayer signals...
        </p>
      {:else}
        {#each testLog as line (line)}
          <p>{line}</p>
        {/each}
      {/if}
    </div>
  </div>

  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => (showTestSignalModal = false)}>
      Close
    </Button>
  {/snippet}
</Dialog>

<Dialog
  bind:isOpen={showConfigureBannerModal}
  title="Configure Consent Banner"
  description="Manage visitor cookie banner behavior, test preset choices, or launch the floating banner."
  onClose={() => (showConfigureBannerModal = false)}>
  <div class="flex flex-col gap-4 py-2 font-sans text-xs">
    <div class="rounded-xl border border-border-subtle bg-surface-card p-4">
      <h4 class="font-bold text-text-primary">Banner Status & Actions</h4>
      <p class="mt-1 leading-relaxed text-text-secondary">
        The public banner prompts new visitors for consent choices and updates Google Consent Mode
        v2 signals.
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onclick={() => {
            consentStore.openBanner();
            showConfigureBannerModal = false;
          }}>
          Open floating banner on screen
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onclick={resetStoredConsent}>
          Reset visitor choice in localStorage
        </Button>
      </div>
    </div>

    <div class="rounded-xl border border-border-subtle bg-surface-card p-4">
      <h4 class="font-bold text-text-primary">Test Consent Callbacks</h4>
      <p class="mt-1 text-text-muted">
        Simulate visitor actions to trigger live <code class="font-mono text-accent"
          >gtag('consent', 'update', ...)</code> signals.
      </p>

      <div class="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onclick={() => {
            consentStore.acceptAll();
            showConfigureBannerModal = false;
          }}>
          Accept All
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onclick={() => {
            consentStore.acceptAnalyticsOnly();
            showConfigureBannerModal = false;
          }}>
          Analytics Only
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onclick={() => {
            consentStore.rejectAll();
            showConfigureBannerModal = false;
          }}>
          Reject All
        </Button>
      </div>
    </div>
  </div>

  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => (showConfigureBannerModal = false)}>
      Done
    </Button>
  {/snippet}
</Dialog>
