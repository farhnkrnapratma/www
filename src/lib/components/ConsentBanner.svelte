<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { consentStore, type ConsentStatus } from '../stores/consentStore.svelte';
  import Button from '../design-system/components/Button.svelte';
  import Dialog from '../design-system/components/Dialog.svelte';

  let tempAnalytics = $state<ConsentStatus>('denied');
  let tempAdStorage = $state<ConsentStatus>('denied');
  let tempAdUserData = $state<ConsentStatus>('denied');
  let tempAdPersonalization = $state<ConsentStatus>('denied');

  onMount(() => {
    consentStore.init();
  });

  $effect(() => {
    if (consentStore.isCustomizeModalOpen) {
      tempAnalytics = consentStore.signals.analytics_storage;
      tempAdStorage = consentStore.signals.ad_storage;
      tempAdUserData = consentStore.signals.ad_user_data;
      tempAdPersonalization = consentStore.signals.ad_personalization;
    }
  });

  function openCustomize() {
    consentStore.openCustomizeModal();
  }

  function saveCustomPreferences() {
    consentStore.updateConsent({
      analytics_storage: tempAnalytics,
      ad_storage: tempAdStorage,
      ad_user_data: tempAdUserData,
      ad_personalization: tempAdPersonalization,
    });
    consentStore.closeCustomizeModal();
  }

  function applyPreset(type: 'all' | 'analytics' | 'deny') {
    if (type === 'all') {
      tempAnalytics = 'granted';
      tempAdStorage = 'granted';
      tempAdUserData = 'granted';
      tempAdPersonalization = 'granted';
    } else if (type === 'analytics') {
      tempAnalytics = 'granted';
      tempAdStorage = 'denied';
      tempAdUserData = 'denied';
      tempAdPersonalization = 'denied';
    } else {
      tempAnalytics = 'denied';
      tempAdStorage = 'denied';
      tempAdUserData = 'denied';
      tempAdPersonalization = 'denied';
    }
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
          Cookie Settings
        </button>
      </div>
    </div>
  </aside>
{/if}

<Dialog
  bind:isOpen={consentStore.isCustomizeModalOpen}
  title="Cookie Preferences"
  description="Manage your analytics and advertising privacy choices."
  size="2xl"
  class="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto"
  onClose={() => consentStore.closeCustomizeModal()}>
  <div class="flex flex-col gap-4 py-1">
    <!-- Quick Presets Toolbar -->
    <div
      class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle/70 bg-surface-card/50 p-2.5">
      <span class="text-xs font-semibold text-text-muted">Quick Presets</span>
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onclick={() => applyPreset('all')}
          class="inline-flex cursor-pointer items-center rounded-lg border border-border-subtle/80 bg-surface-card px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
          Allow All
        </button>
        <button
          type="button"
          onclick={() => applyPreset('analytics')}
          class="inline-flex cursor-pointer items-center rounded-lg border border-border-subtle/80 bg-surface-card px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
          Analytics Only
        </button>
        <button
          type="button"
          onclick={() => applyPreset('deny')}
          class="inline-flex cursor-pointer items-center rounded-lg border border-border-subtle/80 bg-surface-card px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
          Deny All
        </button>
      </div>
    </div>

    <!-- Simplified Compact Category Rows -->
    <div
      class="divide-y divide-border-subtle/50 rounded-xl border border-border-subtle/70 bg-surface-card/30">
      <!-- Behavioral Analytics -->
      <div class="flex items-center justify-between gap-3 p-3 sm:p-3.5">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h4 class="text-xs font-bold text-text-primary">Behavioral Analytics</h4>
          <p class="text-xs leading-snug text-text-secondary">
            Measures sessions, page views and interactions.
          </p>
        </div>
        <select
          bind:value={tempAnalytics}
          aria-label="Behavioral Analytics preference"
          class="h-8 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-accent/60 focus:border-accent focus:outline-none">
          <option value="denied">Deny</option>
          <option value="granted">Allow</option>
        </select>
      </div>

      <!-- Advertising Storage -->
      <div class="flex items-center justify-between gap-3 p-3 sm:p-3.5">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h4 class="text-xs font-bold text-text-primary">Advertising Storage</h4>
          <p class="text-xs leading-snug text-text-secondary">Stores advertising identifiers.</p>
        </div>
        <select
          bind:value={tempAdStorage}
          aria-label="Advertising Storage preference"
          class="h-8 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-accent/60 focus:border-accent focus:outline-none">
          <option value="denied">Deny</option>
          <option value="granted">Allow</option>
        </select>
      </div>

      <!-- Ad User Data -->
      <div class="flex items-center justify-between gap-3 p-3 sm:p-3.5">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h4 class="text-xs font-bold text-text-primary">Ad User Data</h4>
          <p class="text-xs leading-snug text-text-secondary">
            Shares advertising measurement data.
          </p>
        </div>
        <select
          bind:value={tempAdUserData}
          aria-label="Ad User Data preference"
          class="h-8 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-accent/60 focus:border-accent focus:outline-none">
          <option value="denied">Deny</option>
          <option value="granted">Allow</option>
        </select>
      </div>

      <!-- Ad Personalization -->
      <div class="flex items-center justify-between gap-3 p-3 sm:p-3.5">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h4 class="text-xs font-bold text-text-primary">Ad Personalization</h4>
          <p class="text-xs leading-snug text-text-secondary">
            Personalized advertising preferences.
          </p>
        </div>
        <select
          bind:value={tempAdPersonalization}
          aria-label="Ad Personalization preference"
          class="h-8 shrink-0 cursor-pointer rounded-lg border border-border-subtle bg-surface-card px-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-accent/60 focus:border-accent focus:outline-none">
          <option value="denied">Deny</option>
          <option value="granted">Allow</option>
        </select>
      </div>
    </div>

    <!-- Reset Preferences Utility Row -->
    <div class="flex items-center justify-between gap-3 px-1 pt-1">
      <span class="text-[11px] text-text-muted">Need to clear stored choices?</span>
      <button
        type="button"
        onclick={consentStore.resetVisitorConsent}
        class="cursor-pointer text-xs font-semibold text-text-muted transition-colors hover:text-danger hover:underline">
        Reset choice
      </button>
    </div>
  </div>

  {#snippet footer()}
    <div class="flex w-full flex-col-reverse items-center justify-end gap-2 sm:flex-row">
      <Button
        variant="secondary"
        size="md"
        onclick={() => consentStore.closeCustomizeModal()}
        class="w-full sm:w-auto">
        <span class="inline-flex items-center gap-1.5">
          <span>Cancel</span>
          <kbd
            class="hidden items-center rounded border border-border-subtle/80 bg-surface-elevated/80 px-1 py-0.5 font-mono text-[9px] leading-none text-text-muted select-none sm:inline-flex">
            Esc
          </kbd>
        </span>
      </Button>

      <Button
        variant="secondary"
        size="md"
        onclick={() => {
          applyPreset('all');
          saveCustomPreferences();
        }}
        class="w-full sm:w-auto">
        Accept All
      </Button>

      <Button
        variant="primary"
        size="md"
        onclick={saveCustomPreferences}
        class="w-full sm:w-auto">
        Save Preferences
      </Button>
    </div>
  {/snippet}
</Dialog>
