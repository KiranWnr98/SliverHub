import {
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import {
  CreditCard,
  Smartphone,
  Banknote,
  Landmark,
  Wallet,
  ShieldCheck,
  Save,
  Settings,
  CheckCircle2,
  AlertCircle,
  X,
  IndianRupee,
  LockKeyhole,
  ExternalLink,
  RotateCcw,
  Info,
  Receipt,
  CircleDollarSign,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  getPaymentSettings,
  savePaymentSettings,
  type PaymentSettings,
} from '../../../../context/paymentSettings';

import './Payments.css';

/* =========================================
   TYPES
========================================= */

type Notification = {
  message: string;
  type: 'success' | 'error';
};

type PaymentMethodKey =
  | 'upiEnabled'
  | 'cardEnabled'
  | 'codEnabled'
  | 'netBankingEnabled'
  | 'walletEnabled';

/* =========================================
   REUSABLE TOGGLE
========================================= */

function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      className={`pay-toggle ${
        checked ? 'enabled' : ''
      }`}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

/* =========================================
   REUSABLE PAYMENT CARD
========================================= */

function PaymentCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pay-card">

      <div className="pay-card-heading">

        <div className="pay-heading-icon">
          {icon}
        </div>

        <div>
          <h2>{title}</h2>

          {description && (
            <p>{description}</p>
          )}
        </div>

      </div>

      {children}

    </section>
  );
}

/* =========================================
   PAYMENTS PAGE
========================================= */

export default function Payments() {

  const [settings, setSettings] =
    useState<PaymentSettings>(getPaymentSettings);

  const [savedSettings, setSavedSettings] =
    useState<PaymentSettings>(getPaymentSettings);

  const [notification, setNotification] =
    useState<Notification | null>(null);

  /* =========================================
     PAYMENT METHODS
  ========================================= */

  const paymentMethods: {
    key: PaymentMethodKey;
    name: string;
    description: string;
    icon: ReactNode;
    available: boolean;
  }[] = [
    {
      key: 'upiEnabled',
      name: 'UPI Payments',
      description: 'Google Pay, PhonePe, Paytm and BHIM',
      icon: <Smartphone size={23} />,
      available: true,
    },
    {
      key: 'cardEnabled',
      name: 'Credit & Debit Cards',
      description: 'Visa, Mastercard and RuPay',
      icon: <CreditCard size={23} />,
      available: true,
    },
    {
      key: 'codEnabled',
      name: 'Cash on Delivery',
      description: 'Customers can pay when their order arrives',
      icon: <Banknote size={23} />,
      available: true,
    },
    {
      key: 'netBankingEnabled',
      name: 'Net Banking',
      description: 'Direct payments through supported banks',
      icon: <Landmark size={23} />,
      available: false,
    },
    {
      key: 'walletEnabled',
      name: 'Digital Wallets',
      description: 'Payments using supported digital wallets',
      icon: <Wallet size={23} />,
      available: false,
    },
  ];

  const activeMethods = paymentMethods.filter(
    (method) =>
      method.available && savedSettings[method.key]
  ).length;

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(savedSettings);

  /* =========================================
     UPDATE SETTINGS
  ========================================= */

  function update<K extends keyof PaymentSettings>(
    key: K,
    value: PaymentSettings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =========================================
     NOTIFICATIONS
  ========================================= */

  function notify(
    message: string,
    type: 'success' | 'error' = 'success'
  ) {
    setNotification({
      message,
      type,
    });
  }

  useEffect(() => {

    if (!notification) return;

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 2800);

    return () => {
      window.clearTimeout(timer);
    };

  }, [notification]);

  /* =========================================
     SAVE PAYMENT SETTINGS
  ========================================= */

  function handleSave() {

    if (
      !settings.upiEnabled &&
      !settings.cardEnabled &&
      !settings.codEnabled
    ) {
      notify(
        'Please enable at least one payment method.',
        'error'
      );
      return;
    }

    const amounts = [
      settings.minimumOrderAmount,
      settings.codCharges,
      settings.maximumCodAmount,
    ];

    if (
      amounts.some(
        (amount) =>
          !Number.isFinite(amount) || amount < 0
      )
    ) {
      notify(
        'Please enter valid payment amounts.',
        'error'
      );
      return;
    }

    if (
      settings.codEnabled &&
      settings.maximumCodAmount <
        settings.minimumOrderAmount
    ) {
      notify(
        'Maximum COD amount cannot be less than the minimum order amount.',
        'error'
      );
      return;
    }

    if (
      settings.gateway === 'razorpay' &&
      settings.razorpayKeyId.trim() &&
      !/^rzp_test_[A-Za-z0-9]+$/.test(
        settings.razorpayKeyId.trim()
      )
    ) {
      notify(
        'Please enter a valid Razorpay test Key ID.',
        'error'
      );
      return;
    }

    try {

      const updatedSettings: PaymentSettings = {
        ...settings,
        paymentMode: 'test',
        netBankingEnabled: false,
        walletEnabled: false,
        razorpayKeyId: settings.razorpayKeyId.trim(),
      };

      savePaymentSettings(updatedSettings);

      setSettings(updatedSettings);

      setSavedSettings(updatedSettings);

      notify(
        'Payment settings saved successfully!'
      );

    } catch {

      notify(
        'Unable to save payment settings.',
        'error'
      );

    }
  }

  /* =========================================
     RESET UNSAVED CHANGES
  ========================================= */

  function handleReset() {
    setSettings({ ...savedSettings });

    notify('Unsaved changes discarded.');
  }

  return (

    <motion.div
      className="pay-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >

      {/* =================================
          PAGE HEADER
      ================================= */}

      <div className="pay-page-header">

        <div>

          <span className="pay-eyebrow">
            ADMIN STUDIO
          </span>

          <h1>Payment Settings</h1>

          <p>
            Manage payment methods, gateway configurations
            and payment preferences.
          </p>

        </div>

        <div className="pay-header-actions">

          {hasChanges && (
            <button
              type="button"
              className="pay-reset-button"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              Reset Changes
            </button>
          )}

          <button
            type="button"
            className="pay-save-button"
            onClick={handleSave}
          >
            <Save size={18} />
            Save Changes
          </button>

        </div>

      </div>

      {hasChanges && (
        <div className="pay-unsaved">
          <span />
          You have unsaved changes
        </div>
      )}

      {/* =================================
          PAYMENT OVERVIEW
      ================================= */}

      <div className="pay-overview-grid">

        <div className="pay-overview-card">

          <div className="pay-overview-icon">
            <CreditCard size={24} />
          </div>

          <div>
            <p>Enabled Payment Methods</p>
            <h2>{activeMethods}</h2>
            <span>Saved payment options</span>
          </div>

        </div>

        <div className="pay-overview-card">

          <div className="pay-overview-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <p>Payment Environment</p>
            <h2>Test Mode</h2>
            <span>No real transactions</span>
          </div>

        </div>

        <div className="pay-overview-card">

          <div className="pay-overview-icon">
            <CircleDollarSign size={24} />
          </div>

          <div>
            <p>COD Charges</p>
            <h2>
              ₹{savedSettings.codCharges.toLocaleString('en-IN')}
            </h2>
            <span>Configured per COD order</span>
          </div>

        </div>

      </div>

      {/* =================================
          MAIN PAYMENT LAYOUT
      ================================= */}

      <div className="pay-layout">

        <div className="pay-main-column">

          {/* PAYMENT METHODS */}

          <PaymentCard
            title="Payment Methods"
            description="Choose the payment options available to your customers."
            icon={<CreditCard size={23} />}
          >

            <div className="pay-method-list">

              {paymentMethods.map((method) => (

                <div
                  className="pay-method-row"
                  key={method.key}
                >

                  <div className="pay-method-icon">
                    {method.icon}
                  </div>

                  <div className="pay-method-details">

                    <h3>{method.name}</h3>

                    <p>{method.description}</p>

                    {!method.available && (
                      <span className="pay-coming-soon">
                        Coming Soon
                      </span>
                    )}

                  </div>

                  <div className="pay-method-control">

                    <span
                      className={`pay-method-status ${
                        method.available &&
                        settings[method.key]
                          ? 'active'
                          : ''
                      }`}
                    >
                      {method.available &&
                      settings[method.key]
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>

                    <Toggle
                      checked={
                        method.available &&
                        settings[method.key]
                      }
                      label={method.name}
                      disabled={!method.available}
                      onChange={() =>
                        update(
                          method.key,
                          !settings[method.key]
                        )
                      }
                    />

                  </div>

                </div>

              ))}

            </div>

          </PaymentCard>

          {/* PAYMENT RULES */}

          <PaymentCard
            title="Payment Rules"
            description="Configure order limits and additional payment charges."
            icon={<Receipt size={23} />}
          >

            <div className="pay-form-grid">

              <label className="pay-field">

                <span>Minimum Order Amount</span>

                <div className="pay-input-wrapper">

                  <IndianRupee size={17} />

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.minimumOrderAmount}
                    onChange={(event) =>
                      update(
                        'minimumOrderAmount',
                        Number(event.target.value)
                      )
                    }
                  />

                </div>

                <small>
                  Minimum purchase amount required.
                </small>

              </label>

              <label className="pay-field">

                <span>COD Charges</span>

                <div className="pay-input-wrapper">

                  <IndianRupee size={17} />

                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!settings.codEnabled}
                    value={settings.codCharges}
                    onChange={(event) =>
                      update(
                        'codCharges',
                        Number(event.target.value)
                      )
                    }
                  />

                </div>

                <small>
                  Additional charge for Cash on Delivery.
                </small>

              </label>

              <label className="pay-field">

                <span>Maximum COD Amount</span>

                <div className="pay-input-wrapper">

                  <IndianRupee size={17} />

                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!settings.codEnabled}
                    value={settings.maximumCodAmount}
                    onChange={(event) =>
                      update(
                        'maximumCodAmount',
                        Number(event.target.value)
                      )
                    }
                  />

                </div>

                <small>
                  Maximum order value eligible for COD.
                </small>

              </label>

              <label className="pay-field pay-full-width">

                <span>Payment Instructions</span>

                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Enter additional instructions for customers..."
                  value={settings.paymentInstructions}
                  onChange={(event) =>
                    update(
                      'paymentInstructions',
                      event.target.value
                    )
                  }
                />

                <small>
                  {settings.paymentInstructions.length}/500
                  characters
                </small>

              </label>

            </div>

          </PaymentCard>

        </div>

        {/* =================================
            RIGHT SIDEBAR
        ================================= */}

        <aside className="pay-side-column">

          {/* PAYMENT GATEWAY */}

          <PaymentCard
            title="Payment Gateway"
            description="Configure your payment provider."
            icon={<ShieldCheck size={23} />}
          >

            <div className="pay-gateway-brand">

              <div className="pay-razorpay-icon">
                R
              </div>

              <div>
                <h3>Razorpay</h3>
                <p>Online payment gateway</p>
              </div>

            </div>

            <div className="pay-gateway-status">
              <span />
              Not Connected
            </div>

            <label className="pay-field">

              <span>Payment Provider</span>

              <select
                value={settings.gateway}
                onChange={(event) =>
                  update(
                    'gateway',
                    event.target.value as PaymentSettings['gateway']
                  )
                }
              >
                <option value="none">
                  No Gateway — Demo
                </option>

                <option value="razorpay">
                  Razorpay
                </option>
              </select>

            </label>

            <div className="pay-environment">

              <span>Payment Environment</span>

              <div className="pay-mode-buttons">

                <button
                  type="button"
                  className="pay-mode-button active"
                  onClick={() =>
                    update('paymentMode', 'test')
                  }
                >
                  Test Mode
                </button>

                <button
                  type="button"
                  className="pay-mode-button"
                  disabled
                  title="Requires secure backend integration"
                >
                  <LockKeyhole size={13} />
                  Live Mode
                </button>

              </div>

            </div>

            {settings.gateway === 'razorpay' && (

              <label className="pay-field">

                <span>Razorpay Test Key ID</span>

                <input
                  type="text"
                  placeholder="rzp_test_XXXXXXXX"
                  autoComplete="off"
                  value={settings.razorpayKeyId}
                  onChange={(event) =>
                    update(
                      'razorpayKeyId',
                      event.target.value
                    )
                  }
                />

                <small>
                  Enter the public test Key ID only.
                </small>

              </label>

            )}

            <div className="pay-security-note">

              <LockKeyhole size={18} />

              <p>
                Secret keys must be configured securely
                on the backend. Never store secret keys
                in the browser.
              </p>

            </div>

            <a
              href="https://dashboard.razorpay.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="pay-gateway-link"
            >
              Open Razorpay Dashboard
              <ExternalLink size={15} />
            </a>

          </PaymentCard>

          {/* PAYMENT SUMMARY */}

          <PaymentCard
            title="Payment Summary"
            icon={<Settings size={22} />}
          >

            <div className="pay-summary-row">
              <span>UPI Payments</span>

              <span className={
                savedSettings.upiEnabled
                  ? 'pay-text-active'
                  : 'pay-text-disabled'
              }>
                {savedSettings.upiEnabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>

            <div className="pay-summary-row">
              <span>Card Payments</span>

              <span className={
                savedSettings.cardEnabled
                  ? 'pay-text-active'
                  : 'pay-text-disabled'
              }>
                {savedSettings.cardEnabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>

            <div className="pay-summary-row">
              <span>Cash on Delivery</span>

              <span className={
                savedSettings.codEnabled
                  ? 'pay-text-active'
                  : 'pay-text-disabled'
              }>
                {savedSettings.codEnabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>

            <div className="pay-summary-row">
              <span>Minimum Order</span>
              <strong>
                ₹{savedSettings.minimumOrderAmount}
              </strong>
            </div>

            <div className="pay-summary-row">
              <span>COD Limit</span>
              <strong>
                ₹{savedSettings.maximumCodAmount}
              </strong>
            </div>

          </PaymentCard>

          {/* DEMO INFORMATION */}

          <div className="pay-demo-note">

            <Info size={20} />

            <div>

              <h4>Demo Environment</h4>

              <p>
                Payment settings are saved locally.
                Checkout integration and secure gateway
                setup are required before these settings
                can control customer payments.
              </p>

            </div>

          </div>

        </aside>

      </div>

      {/* =================================
          SUCCESS / ERROR NOTIFICATION
      ================================= */}

      <AnimatePresence>

        {notification && (

          <motion.div

            role="status"

            className={`pay-notification ${
              notification.type
            }`}

            initial={{ opacity: 0, x: 100 }}

            animate={{ opacity: 1, x: 0 }}

            exit={{ opacity: 0, x: 120 }}

            transition={{ duration: 0.3 }}

          >

            {notification.type === 'success' ? (
              <CheckCircle2 size={22} />
            ) : (
              <AlertCircle size={22} />
            )}

            <span>
              {notification.message}
            </span>

            <button
              type="button"
              aria-label="Close notification"
              onClick={() => setNotification(null)}
            >
              <X size={18} />
            </button>

          </motion.div>

        )}

      </AnimatePresence>

    </motion.div>

  );
}