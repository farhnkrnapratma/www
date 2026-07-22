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
          Cookies Settings
        </button>
      </div>
    </div>
  </aside>
{/if}

<Dialog
  bind:isOpen={consentStore.isCustomizeModalOpen}
  title="Cookies Settings"
  description="Manage Google Consent Mode v2 signals, data processing, and visitor choices."
  onClose={() => consentStore.closeCustomizeModal()}>
  <div class="flex flex-col gap-4 py-2">
    <!-- Consent Status Banner -->
    <div
      class="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-card px-4 py-3">
      <div>
        <h4 class="text-xs font-bold text-text-primary">Current Consent Status</h4>
        <p class="text-[11px] text-text-secondary">
          {consentStore.overallConsentStatus === 'Good' ?
            'All signals enabled for optimal site analytics.'
          : consentStore.overallConsentStatus === 'Partial' ?
            'Partial signals allowed based on your selections.'
          : 'Default settings active. Choice pending.'}
        </p>
      </div>
      <Badge
        variant={consentStore.overallConsentStatus === 'Good' ? 'success'
        : consentStore.overallConsentStatus === 'Partial' ? 'warning'
        : 'neutral'}>
        {consentStore.overallConsentStatus}
      </Badge>
    </div>

    <!-- Quick Action Presets -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-medium text-text-muted">Quick presets:</span>
      <button
        type="button"
        onclick={() => {
          tempAnalytics = true;
          tempAdStorage = true;
          tempAdUserData = true;
          tempAdPersonalization = true;
        }}
        class="rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover">
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
        class="rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover">
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
        class="rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-hover">
        Deny all
      </button>
    </div>

    <!-- Signal Toggles -->
    <div class="flex flex-col gap-3">
      <div class="rounded-xl border border-border-subtle bg-surface-card p-3.5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-text-primary">Behavioral Analytics</h4>
            <p class="mt-0.5 text-[11px] text-text-secondary">
              Measures sessions and page views to improve content without advertising tracking.
            </p>
            <span class="mt-1 inline-block font-mono text-[10px] text-text-muted"
              >analytics_storage</span>
          </div>
          <Checkbox
            bind:checked={tempAnalytics}
            label="" />
        </div>
      </div>

      <div class="rounded-xl border border-border-subtle bg-surface-card p-3.5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-text-primary">Advertising Storage</h4>
            <p class="mt-0.5 text-[11px] text-text-secondary">
              Enables storage related to advertising (e.g. cookies or device identifiers).
            </p>
            <span class="mt-1 inline-block font-mono text-[10px] text-text-muted">ad_storage</span>
          </div>
          <Checkbox
            bind:checked={tempAdStorage}
            label="" />
        </div>
      </div>

      <div class="rounded-xl border border-border-subtle bg-surface-card p-3.5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-text-primary">Ad User Data</h4>
            <p class="mt-0.5 text-[11px] text-text-secondary">
              Sends user-level data to Google for online advertising and conversion measurement.
            </p>
            <span class="mt-1 inline-block font-mono text-[10px] text-text-muted"
              >ad_user_data</span>
          </div>
          <Checkbox
            bind:checked={tempAdUserData}
            label="" />
        </div>
      </div>

      <div class="rounded-xl border border-border-subtle bg-surface-card p-3.5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-text-primary">Ad Personalization</h4>
            <p class="mt-0.5 text-[11px] text-text-secondary">
              Allows personalized advertising (remarketing) based on visitor activity.
            </p>
            <span class="mt-1 inline-block font-mono text-[10px] text-text-muted"
              >ad_personalization</span>
          </div>
          <Checkbox
            bind:checked={tempAdPersonalization}
            label="" />
        </div>
      </div>
    </div>

    <!-- Data Retention & Reset Section -->
    <div
      class="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-card/60 p-3.5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h4 class="text-xs font-bold text-text-primary">Reset Visitor Choices</h4>
          <p class="mt-0.5 text-[11px] text-text-secondary">
            Clear saved cookie consent signals from your browser and reopen the consent banner.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onclick={consentStore.resetVisitorConsent}>
          Reset choice
        </Button>
      </div>
    </div>
  </div>

  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => consentStore.closeCustomizeModal()}>
      Cancel
    </Button>
    <Button
      variant="primary"
      size="md"
      onclick={saveCustomPreferences}>
      Save preferences
    </Button>
  {/snippet}
</Dialog>
