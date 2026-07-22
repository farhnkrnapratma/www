/**
 * Svelte 5 reactive store for Google Consent Mode v2 and GA4 Data Retention settings.
 * Manages visitor consent signals, admin retention preferences, and gtag sync.
 */

export type ConsentStatus = 'granted' | 'denied';

export interface ConsentSignals {
  analytics_storage: ConsentStatus;
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
}

export type RetentionPeriod = '2_months' | '14_months';

export interface RetentionSettings {
  eventDataRetention: RetentionPeriod;
  userDataRetention: RetentionPeriod;
  lastUpdated?: string;
}

export interface StreamInfo {
  id: string;
  name: string;
  type: 'Web Stream' | 'iOS App' | 'Android App';
  measurementId: string;
  status: 'Active' | 'Warning' | 'Inactive';
}

const STORAGE_KEY = 'fkp_cookie_consent_v2';
const RETENTION_STORAGE_KEY = 'fkp_ga4_retention_settings';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function createConsentStore() {
  let hasUserChosen = $state(false);
  let isBannerOpen = $state(false);
  let isSavingRetention = $state(false);
  let retentionSaveSuccess = $state(false);

  let signals = $state<ConsentSignals>({
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  let retention = $state<RetentionSettings>({
    eventDataRetention: '14_months',
    userDataRetention: '14_months',
    lastUpdated: undefined,
  });

  let selectedStreamId = $state<string>('stream-web-1');

  const streams: StreamInfo[] = [
    {
      id: 'stream-web-1',
      name: 'Web Stream (fkp.my.id)',
      type: 'Web Stream',
      measurementId: 'G-6HR3DKWZLF',
      status: 'Active',
    },
  ];

  // Derived states
  let isBehavioralActive = $derived(signals.analytics_storage === 'granted');
  let isAdvertisingActive = $derived(
    signals.ad_storage === 'granted' ||
      signals.ad_user_data === 'granted' ||
      signals.ad_personalization === 'granted',
  );

  let overallConsentStatus = $derived<'Good' | 'Setup needed' | 'Partial'>(
    !hasUserChosen ? 'Setup needed'
    : isBehavioralActive && isAdvertisingActive ? 'Good'
    : 'Partial',
  );

  function init() {
    if (typeof window === 'undefined') return;

    // Load saved visitor consent
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        signals.analytics_storage = parsed.analytics_storage || 'denied';
        signals.ad_storage = parsed.ad_storage || 'denied';
        signals.ad_user_data = parsed.ad_user_data || 'denied';
        signals.ad_personalization = parsed.ad_personalization || 'denied';
        hasUserChosen = true;
      } else {
        isBannerOpen = true;
      }
    } catch (e) {
      isBannerOpen = true;
    }

    // Load saved retention settings
    try {
      const storedRet = localStorage.getItem(RETENTION_STORAGE_KEY);
      if (storedRet) {
        const parsedRet = JSON.parse(storedRet);
        retention.eventDataRetention = parsedRet.eventDataRetention || '14_months';
        retention.userDataRetention = parsedRet.userDataRetention || '14_months';
        retention.lastUpdated = parsedRet.lastUpdated;
      }
    } catch (e) {}
  }

  function applyGtagUpdate(newSignals: ConsentSignals) {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: newSignals.analytics_storage,
          ad_storage: newSignals.ad_storage,
          ad_user_data: newSignals.ad_user_data,
          ad_personalization: newSignals.ad_personalization,
        });
      } else {
        window.dataLayer.push([
          'consent',
          'update',
          {
            analytics_storage: newSignals.analytics_storage,
            ad_storage: newSignals.ad_storage,
            ad_user_data: newSignals.ad_user_data,
            ad_personalization: newSignals.ad_personalization,
          },
        ]);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSignals));
      } catch (e) {}
    }
  }

  function updateConsent(newSignals: Partial<ConsentSignals>) {
    signals = {
      ...signals,
      ...newSignals,
    };
    hasUserChosen = true;
    isBannerOpen = false;
    applyGtagUpdate(signals);
  }

  function acceptAll() {
    updateConsent({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  }

  function acceptAnalyticsOnly() {
    updateConsent({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  function rejectAll() {
    updateConsent({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  function openBanner() {
    isBannerOpen = true;
  }

  function closeBanner() {
    isBannerOpen = false;
  }

  async function saveRetentionSettings(eventPeriod: RetentionPeriod, userPeriod: RetentionPeriod) {
    isSavingRetention = true;
    retentionSaveSuccess = false;

    // Simulate save request
    await new Promise(res => setTimeout(res, 400));

    retention.eventDataRetention = eventPeriod;
    retention.userDataRetention = userPeriod;
    retention.lastUpdated = new Date().toISOString();

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(RETENTION_STORAGE_KEY, JSON.stringify(retention));
      } catch (e) {}
    }

    isSavingRetention = false;
    retentionSaveSuccess = true;

    setTimeout(() => {
      retentionSaveSuccess = false;
    }, 3000);
  }

  function setSelectedStream(id: string) {
    selectedStreamId = id;
  }

  return {
    get signals() {
      return signals;
    },
    get retention() {
      return retention;
    },
    get hasUserChosen() {
      return hasUserChosen;
    },
    get isBannerOpen() {
      return isBannerOpen;
    },
    get isSavingRetention() {
      return isSavingRetention;
    },
    get retentionSaveSuccess() {
      return retentionSaveSuccess;
    },
    get isBehavioralActive() {
      return isBehavioralActive;
    },
    get isAdvertisingActive() {
      return isAdvertisingActive;
    },
    get overallConsentStatus() {
      return overallConsentStatus;
    },
    get selectedStreamId() {
      return selectedStreamId;
    },
    get streams() {
      return streams;
    },
    init,
    updateConsent,
    acceptAll,
    acceptAnalyticsOnly,
    rejectAll,
    openBanner,
    closeBanner,
    saveRetentionSettings,
    setSelectedStream,
  };
}

export const consentStore = createConsentStore();
