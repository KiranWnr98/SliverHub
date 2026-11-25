import { useEffect, useState } from 'react';

/* =========================================
   PAYMENT SETTINGS TYPE
========================================= */

export type PaymentSettings = {
  upiEnabled: boolean;
  cardEnabled: boolean;
  codEnabled: boolean;
  netBankingEnabled: boolean;
  walletEnabled: boolean;

  gateway: 'razorpay' | 'none';
  paymentMode: 'test' | 'live';
  razorpayKeyId: string;

  minimumOrderAmount: number;
  codCharges: number;
  maximumCodAmount: number;

  paymentInstructions: string;
};

const STORAGE_KEY = 'silverhub-payment-settings';

const PAYMENT_EVENT = 'silverhub-payments-changed';

/* =========================================
   DEFAULT PAYMENT SETTINGS
========================================= */

export const defaultPaymentSettings: PaymentSettings = {
  upiEnabled: true,
  cardEnabled: true,
  codEnabled: true,
  netBankingEnabled: false,
  walletEnabled: false,

  gateway: 'none',
  paymentMode: 'test',
  razorpayKeyId: '',

  minimumOrderAmount: 0,
  codCharges: 0,
  maximumCodAmount: 5000,

  paymentInstructions: '',
};

/* =========================================
   GET PAYMENT SETTINGS
========================================= */

export function getPaymentSettings(): PaymentSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return { ...defaultPaymentSettings };
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return { ...defaultPaymentSettings };
    }

    return {
      ...defaultPaymentSettings,
      ...parsed,
    };
  } catch {
    return { ...defaultPaymentSettings };
  }
}

/* =========================================
   SAVE PAYMENT SETTINGS
========================================= */

export function savePaymentSettings(
  settings: PaymentSettings
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings)
  );

  window.dispatchEvent(
    new Event(PAYMENT_EVENT)
  );
}

/* =========================================
   LIVE PAYMENT SETTINGS HOOK
========================================= */

export function usePaymentSettings(): PaymentSettings {

  const [settings, setSettings] =
    useState<PaymentSettings>(getPaymentSettings);

  useEffect(() => {

    const refreshSettings = () => {
      setSettings(getPaymentSettings());
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY ||
        event.key === null
      ) {
        refreshSettings();
      }
    };

    window.addEventListener(
      PAYMENT_EVENT,
      refreshSettings
    );

    window.addEventListener(
      'storage',
      handleStorage
    );

    window.addEventListener(
      'focus',
      refreshSettings
    );

    refreshSettings();

    return () => {
      window.removeEventListener(
        PAYMENT_EVENT,
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