import { useEffect, useState } from 'react';

/* =========================================
   STORE SETTINGS TYPE
========================================= */

export type StoreSettings = {
  storeName: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;

  logo: string;
  favicon: string;

  storefrontVisible: boolean;
  guestCheckout: boolean;
  wishlistEnabled: boolean;
  productReviews: boolean;
  backInStockAlerts: boolean;

  currency: string;
  silverPurity: string;
  silverRateMode: 'automatic' | 'manual';
  manualSilverRate: number;

  freeShipping: boolean;
  shippingCharge: number;
  deliveryDuration: string;

  gstPercentage: number;
  returnDays: number;

  aboutTitle: string;
  aboutDescription: string;
  storeStory: string;
  storePromise: string;
};

/* =========================================
   STORAGE CONFIGURATION
========================================= */

const STORAGE_KEY = 'silverhub-store-settings';

const SETTINGS_EVENT = 'silverhub-settings-changed';

/* =========================================
   DEFAULT STORE SETTINGS
========================================= */

export const defaultStoreSettings: StoreSettings = {
  storeName: 'SilverHub',

  tagline: 'Premium Silver Jewellery for Every Occasion',

  description:
    'Discover a timeless collection of sterling silver jewellery, crafted with elegance, quality, and modern designs.',

  email: '',
  phone: '',
  address: '',
  whatsapp: '',

  logo: '',
  favicon: '',

  storefrontVisible: true,
  guestCheckout: false,
  wishlistEnabled: true,
  productReviews: true,
  backInStockAlerts: false,

  currency: 'INR',

  silverPurity: '935',
  silverRateMode: 'automatic',
  manualSilverRate: 0,

  freeShipping: true,
  shippingCharge: 0,
  deliveryDuration: '3–7 business days',

  gstPercentage: 3,
  returnDays: 7,

  aboutTitle: 'About SilverHub',

  aboutDescription:
    'Where craftsmanship meets timeless elegance.',

  storeStory:
    'We celebrate the beauty of silver through elegant jewellery designs.',

  storePromise:
    'We aim to deliver quality, style and a memorable shopping experience.',
};

/* =========================================
   GET SAVED STORE SETTINGS
========================================= */

export function getStoreSettings(): StoreSettings {

  try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return { ...defaultStoreSettings };
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return { ...defaultStoreSettings };
    }

    return {
      ...defaultStoreSettings,
      ...parsed,
    };

  } catch {

    return { ...defaultStoreSettings };

  }

}

/* =========================================
   SAVE STORE SETTINGS
========================================= */

export function saveStoreSettings(
  settings: StoreSettings
): void {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings)
  );

  // Notify all components in the current tab

  window.dispatchEvent(
    new Event(SETTINGS_EVENT)
  );

}

/* =========================================
   LIVE STORE SETTINGS HOOK
========================================= */

export function useStoreSettings(): StoreSettings {

  const [settings, setSettings] =
    useState<StoreSettings>(getStoreSettings);

  useEffect(() => {

    function refreshSettings() {

      setSettings(getStoreSettings());

    }

    function handleStorage(event: StorageEvent) {

      if (
        event.key === STORAGE_KEY ||
        event.key === null
      ) {

        refreshSettings();

      }

    }

    // Update settings in the same browser tab

    window.addEventListener(
      SETTINGS_EVENT,
      refreshSettings
    );

    // Update settings across browser tabs

    window.addEventListener(
      'storage',
      handleStorage
    );

    // Refresh settings when returning to the tab

    window.addEventListener(
      'focus',
      refreshSettings
    );

    refreshSettings();

    return () => {

      window.removeEventListener(
        SETTINGS_EVENT,
        refreshSettings
      );

      window.removeEventListener(
        'storage',
        handleStorage
      );

      window.removeEventListener(
        'focus',
        refreshSettings
      );

    };

  }, []);

  return settings;

}