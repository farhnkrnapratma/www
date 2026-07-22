<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { consentStore } from '../stores/consentStore.svelte';
  import Button from '../design-system/components/Button.svelte';
  import Dialog from '../design-system/components/Dialog.svelte';
  import Checkbox from '../design-system/components/Checkbox.svelte';
  import Badge from '../design-system/components/Badge.svelte';

  let tempAnalytics = $state(consentStore.signals.analytics_storage === 'granted');
  let tempAdStorage = $state(consentStore.signals.ad_storage === 'granted');
  let tempAdUserData = $state(consentStore.signals.ad_user_data === 'granted');
  let tempAdPersonalization = $state(consentStore.signals.ad_personalization === 'granted');

  onMount(() => {
    consentStore.init();
  });

  $effect(() => {
    if (consentStore.isCustomizeModalOpen) {
      tempAnalytics = consentStore.signals.analytics_storage === 'granted';
      tempAdStorage = consentStore.signals.ad_storage === 'granted';
      tempAdUserData = consentStore.signals.ad_user_data === 'granted';
      tempAdPersonalization = consentStore.signals.ad_personalization === 'granted';
    }
  });

  function openCustomize() {
    consentStore.openCustomizeModal();
  }

  function saveCustomPreferences() {
    consentStore.updateConsent({
      analytics_storage: tempAnalytics ? 'granted' : 'denied',
      ad_storage: tempAdStorage ? 'granted' : 'denied',
      ad_user_data: tempAdUserData ? 'granted' : 'denied',
      ad_personalization: tempAdPersonalization ? 'granted' : 'denied',
    });
    consentStore.closeCustomizeModal();
  }

  const statusDescription = $derived.by(() => {
    const isAnalytics = tempAnalytics;
    const isAd = tempAdStorage || tempAdUserData || tempAdPersonalization;
    if (isAnalytics && isAd) {
      return 'Your current preferences allow analytics and advertising data processing.';
    }
    if (isAnalytics && !isAd) {
      return 'Your current preferences allow analytics but disable advertising-related consent.';
    }
    if (!isAnalytics && isAd) {
      return 'Your current preferences allow advertising signals but disable analytics measurement.';
    }
    return 'All optional analytics and advertising tracking signals are disabled.';
  });
</script>

{#if consentStore.isBannerOpen}
  <aside
    transition:fade={{ duration: 200 }}
    aria-label="Cookie and Privacy Consent"
    class="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-xl rounded-2xl border border-border-subtle bg-surface-card/95 p-5 shadow-2xl backdrop-blur-xl transition-all sm:right-auto sm:bottom-6 sm:left-6 sm:w-full">
    <div class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <i
              class="bi bi-shield-check text-base"
              aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Cookie & Privacy Preferences</h3>
            <p class="text-[11px] text-text-muted">
              We use cookies to analyze site traffic and enhance your experience.
            </p>
          </div>
        </div>
        <button
          type="button"
          onclick={consentStore.closeBanner}
          aria-label="Dismiss banner"
          class="shrink-0 text-text-muted hover:text-text-primary">
          <i
            class="bi bi-x-lg text-xs"
            aria-hidden="true"></i>
        </button>
      </div>

      <p class="text-xs leading-relaxed text-text-secondary">
        Choose which data processing signals you wish to allow. You can update your choice at any
        time. See our <a
          href="/privacy"
          class="font-semibold text-accent underline hover:text-accent-hover">Privacy Policy</a> for full
        details.
      </p>

      <div class="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          onclick={consentStore.acceptAll}>
          Accept all
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onclick={consentStore.acceptAnalyticsOnly}>
          Analytics only
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onclick={consentStore.rejectAll}>
          Reject all
        </Button>
        <button
          type="button"
          onclick={openCustomize}
          class="ml-auto text-xs font-semibold text-text-muted hover:text-accent hover:underline">
          Cookie Settings
        </button>
      </div>
    </div>
  </aside>
{/if}

<Dialog
  bind:isOpen={consentStore.isCustomizeModalOpen}
  title="Cookie settings"
  description="Customize your analytics and advertising privacy preferences. Your choices determine how data is processed during your visit."
  onClose={() => consentStore.closeCustomizeModal()}>
  <div class="flex flex-col gap-5 py-1">
    <!-- StatusSummaryCard -->
    <div
      class="flex items-center justify-between gap-3.5 rounded-xl border border-border-subtle/70 bg-surface-card/40 p-4 backdrop-blur-xs">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-bold tracking-tight text-text-primary">Current status</span>
        <p class="text-xs leading-relaxed text-text-secondary">
          {statusDescription}
        </p>
      </div>
      <Badge
        variant={tempAnalytics && (tempAdStorage || tempAdUserData || tempAdPersonalization) ?
          'success'
        : tempAnalytics || tempAdStorage || tempAdUserData || tempAdPersonalization ? 'warning'
        : 'default'}
        class="shrink-0 font-medium">
        {tempAnalytics && (tempAdStorage || tempAdUserData || tempAdPersonalization) ? 'Active'
        : tempAnalytics || tempAdStorage || tempAdUserData || tempAdPersonalization ? 'Partial'
        : 'Disabled'}
      </Badge>
    </div>

    <!-- PresetActionGroup -->
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold tracking-wider text-text-muted uppercase"
        >Quick Presets</span>
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          onclick={() => {
            tempAnalytics = true;
            tempAdStorage = true;
            tempAdUserData = true;
            tempAdPersonalization = true;
          }}
          class="inline-flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-all {(
            tempAnalytics && tempAdStorage && tempAdUserData && tempAdPersonalization
          ) ?
            'border-accent bg-accent/10 text-accent'
          : 'border-border-subtle/80 bg-surface-card/60 text-text-secondary hover:bg-surface-hover hover:text-text-primary'}">
          Allow all
        </button>
        <button
          type="button"
          onclick={() => {
            tempAnalytics = true;
            tempAdStorage = false;
            tempAdUserData = false;
            tempAdPersonalization = false;
          }}
          class="inline-flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-all {(
            tempAnalytics && !tempAdStorage && !tempAdUserData && !tempAdPersonalization
          ) ?
            'border-accent bg-accent/10 text-accent'
          : 'border-border-subtle/80 bg-surface-card/60 text-text-secondary hover:bg-surface-hover hover:text-text-primary'}">
          Analytics only
        </button>
        <button
          type="button"
          onclick={() => {
            tempAnalytics = false;
            tempAdStorage = false;
            tempAdUserData = false;
            tempAdPersonalization = false;
          }}
          class="inline-flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-all {(
            !tempAnalytics && !tempAdStorage && !tempAdUserData && !tempAdPersonalization
          ) ?
            'border-accent bg-accent/10 text-accent'
          : 'border-border-subtle/80 bg-surface-card/60 text-text-secondary hover:bg-surface-hover hover:text-text-primary'}">
          Deny all
        </button>
      </div>
    </div>

    <!-- ConsentCategoryList -->
    <div class="flex flex-col gap-2.5">
      <span class="text-xs font-semibold tracking-wider text-text-muted uppercase">Categories</span>

      <div
        class="flex items-center justify-between gap-4 rounded-xl border border-border-subtle/60 bg-surface-card/40 p-4 transition-colors hover:bg-surface-card/70">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h4 class="text-xs font-bold text-text-primary">Behavioral Analytics</h4>
          <p class="text-xs leading-relaxed text-text-secondary">
            Measures sessions, page views, and interactions to improve site performance.
          </p>
          <span class="font-mono text-[10px] text-text-muted opacity-75">analytics_storage</span>
        </div>
        <Checkbox
          bind:checked={tempAnalytics}
          label="" />
      </div>

      <div
        class="flex items-center justify-between gap-4 rounded-xl border border-border-subtle/60 bg-surface-card/40 p-4 transition-colors hover:bg-surface-card/70">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h4 class="text-xs font-bold text-text-primary">Advertising Storage</h4>
          <p class="text-xs leading-relaxed text-text-secondary">
            Allows storing advertising cookies and device identifiers on your device.
          </p>
          <span class="font-mono text-[10px] text-text-muted opacity-75">ad_storage</span>
        </div>
        <Checkbox
          bind:checked={tempAdStorage}
          label="" />
      </div>

      <div
        class="flex items-center justify-between gap-4 rounded-xl border border-border-subtle/60 bg-surface-card/40 p-4 transition-colors hover:bg-surface-card/70">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h4 class="text-xs font-bold text-text-primary">Ad User Data</h4>
          <p class="text-xs leading-relaxed text-text-secondary">
            Permits sending visitor data to Google for online advertising measurement.
          </p>
          <span class="font-mono text-[10px] text-text-muted opacity-75">ad_user_data</span>
        </div>
        <Checkbox
          bind:checked={tempAdUserData}
          label="" />
      </div>

      <div
        class="flex items-center justify-between gap-4 rounded-xl border border-border-subtle/60 bg-surface-card/40 p-4 transition-colors hover:bg-surface-card/70">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h4 class="text-xs font-bold text-text-primary">Ad Personalization</h4>
          <p class="text-xs leading-relaxed text-text-secondary">
            Enables personalized advertising and remarketing tailored to your interests.
          </p>
          <span class="font-mono text-[10px] text-text-muted opacity-75">ad_personalization</span>
        </div>
        <Checkbox
          bind:checked={tempAdPersonalization}
          label="" />
      </div>
    </div>

    <!-- ResetPreferencesSection -->
    <div class="mt-1 border-t border-border-subtle/60 pt-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-col gap-0.5">
          <h4 class="text-xs font-bold text-text-primary">Reset Preferences</h4>
          <p class="text-[11px] text-text-muted">
            Clear saved browser consent choices and restore default privacy prompts.
          </p>
        </div>
        <button
          type="button"
          onclick={consentStore.resetVisitorConsent}
          class="shrink-0 cursor-pointer rounded-lg border border-border-subtle/80 bg-surface-card/40 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-danger/30 hover:bg-danger-subtle hover:text-danger">
          Reset choice
        </button>
      </div>
    </div>
  </div>

  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => consentStore.closeCustomizeModal()}>
      <span class="inline-flex items-center gap-1.5">
        <span>Cancel</span>
        <kbd
          class="hidden items-center rounded border border-border-subtle/80 bg-surface-elevated/80 px-1 py-0.5 font-mono text-[9px] leading-none text-text-muted select-none sm:inline-flex">
          Esc
        </kbd>
      </span>
    </Button>
    <Button
      variant="primary"
      size="md"
      onclick={saveCustomPreferences}>
      Save preferences
    </Button>
  {/snippet}
</Dialog>
