import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import {
  Settings,
  Monitor,
  Info,
  Save,
  Tag,
  Store,
  Upload,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Zap,
  Heart,
  Star,
  Link2,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Gem,
  Truck,
  Receipt,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import logo from '../../../../assets/logo.png';

import {
  getStoreSettings,
  saveStoreSettings,
  type StoreSettings,
} from '../../../../context/storeSettings';

import './StoreConfiguration.css';

type Tab = 'general' | 'storefront' | 'about';

/* =========================================
   REUSABLE CONFIGURATION CARD
========================================= */

function ConfigCard({
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
    <section className="sc-card">

      <div className="sc-card-heading">

        <span className="sc-heading-icon">
          {icon}
        </span>

        <div>
          <h2>{title}</h2>

          {description && <p>{description}</p>}
        </div>

      </div>

      {children}

    </section>
  );
}

/* =========================================
   REUSABLE TOGGLE SWITCH
========================================= */

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      className={`sc-toggle ${checked ? 'enabled' : ''}`}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

/* =========================================
   STORE CONFIGURATION PAGE
========================================= */

export default function StoreConfiguration() {

  const [activeTab, setActiveTab] =
    useState<Tab>('general');

  const [settings, setSettings] =
    useState<StoreSettings>(getStoreSettings);

  const [savedSettings, setSavedSettings] =
    useState<StoreSettings>(getStoreSettings);

  const [notification, setNotification] =
    useState<{
      message: string;
      type: 'success' | 'error';
    } | null>(null);

  const logoInputRef =
    useRef<HTMLInputElement>(null);

  const faviconInputRef =
    useRef<HTMLInputElement>(null);

  /* STORE LINKS */

  const storefrontURL = window.location.origin;

  const adminURL =
    `${window.location.origin}/admin/dashboard`;

  /* UNSAVED CHANGES */

  const hasChanges =
    JSON.stringify(settings) !==
    JSON.stringify(savedSettings);

  /* =========================================
     UPDATE SETTINGS
  ========================================= */

  function update<K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
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

    }, 2500);

    return () => window.clearTimeout(timer);

  }, [notification]);

  /* =========================================
     IMAGE UPLOAD
  ========================================= */

  function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: 'logo' | 'favicon'
  ) {

    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes =
      field === 'logo'
        ? [
            'image/png',
            'image/jpeg',
            'image/webp',
          ]
        : [
            'image/png',
            'image/x-icon',
            'image/vnd.microsoft.icon',
          ];

    const isIcoFile =
      field === 'favicon' &&
      file.name.toLowerCase().endsWith('.ico') &&
      !file.type;

    if (
      !allowedTypes.includes(file.type) &&
      !isIcoFile
    ) {

      notify(
        field === 'logo'
          ? 'Please select a PNG, JPG or WEBP image.'
          : 'Please select a PNG or ICO image.',
        'error'
      );

      event.target.value = '';

      return;
    }

    /* MAXIMUM IMAGE SIZE - 1 MB */

    if (file.size > 1024 * 1024) {

      notify(
        'Image size must not exceed 1 MB.',
        'error'
      );

      event.target.value = '';

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      if (typeof reader.result === 'string') {

        update(field, reader.result);

        notify(
          `${
            field === 'logo'
              ? 'Logo'
              : 'Favicon'
          } selected. Save changes to apply.`
        );

      }

    };

    reader.onerror = () => {

      notify(
        'Unable to read image.',
        'error'
      );

    };

    reader.readAsDataURL(file);

    event.target.value = '';

  }

  /* =========================================
     SAVE STORE SETTINGS
  ========================================= */

  function handleSave() {

    if (!settings.storeName.trim()) {

      notify(
        'Store name is required.',
        'error'
      );

      return;
    }

    if (
      settings.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        settings.email
      )
    ) {

      notify(
        'Please enter a valid email address.',
        'error'
      );

      return;
    }

    if (
      settings.phone.trim() &&
      !/^\+?[\d\s()-]{10,18}$/.test(
        settings.phone.trim()
      )
    ) {

      notify(
        'Please enter a valid contact number.',
        'error'
      );

      return;
    }

    if (
      settings.description.length > 250
    ) {

      notify(
        'Store description cannot exceed 250 characters.',
        'error'
      );

      return;
    }

    if (
      settings.silverRateMode === 'manual' &&
      (
        !Number.isFinite(settings.manualSilverRate) ||
        settings.manualSilverRate <= 0
      )
    ) {

      notify(
        'Please enter a valid silver rate.',
        'error'
      );

      return;
    }

    if (
      !Number.isFinite(settings.shippingCharge) ||
      settings.shippingCharge < 0 ||
      !Number.isFinite(settings.gstPercentage) ||
      settings.gstPercentage < 0 ||
      settings.gstPercentage > 100 ||
      !Number.isInteger(settings.returnDays) ||
      settings.returnDays < 0
    ) {

      notify(
        'Please check your numeric settings.',
        'error'
      );

      return;
    }

    try {

      saveStoreSettings(settings);

      setSavedSettings({
        ...settings,
      });

      notify(
        'Store configuration saved successfully!'
      );

    } catch {

      notify(
        'Unable to save settings. Please check browser storage.',
        'error'
      );

    }

  }

  /* =========================================
     COPY STORE LINKS
  ========================================= */

  async function copyLink(url: string) {

    try {

      await navigator.clipboard.writeText(url);

      notify('Link copied successfully!');

    } catch {

      notify(
        'Unable to copy link.',
        'error'
      );

    }

  }

  /* =========================================
     TAB CONFIGURATION
  ========================================= */

  const tabs = [
    {
      id: 'general' as const,
      label: 'General',
      icon: Settings,
    },
    {
      id: 'storefront' as const,
      label: 'Storefront',
      icon: Monitor,
    },
    {
      id: 'about' as const,
      label: 'About',
      icon: Info,
    },
  ];

  /* =========================================
     QUICK SETTINGS
  ========================================= */

  const quickSettings = [
    {
      key: 'wishlistEnabled',
      label: 'Enable Wishlist',
      icon: Heart,
    },
    {
      key: 'productReviews',
      label: 'Show Product Reviews',
      icon: Star,
    },
  ] as const;

  /* =========================================
     PAGE CONTENT
  ========================================= */

  return (

    <motion.div

      className="sc-page"

      initial={{
        opacity: 0,
        y: 10,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        duration: 0.35,
      }}

    >

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="sc-page-header">

        <span className="sc-eyebrow">
          ADMIN STUDIO
        </span>

        <h1>Store Configuration</h1>

        <p>
          Manage your store details, branding, and basic settings.
        </p>

      </header>

      <div className="sc-layout">

        {/* =====================================
            LEFT MAIN COLUMN
        ===================================== */}

        <div className="sc-main-column">

          {/* TABS AND SAVE BUTTON */}

          <div className="sc-toolbar">

            <div className="sc-tabs">

              {tabs.map(({ id, label, icon: Icon }) => (

                <button

                  key={id}

                  type="button"

                  className={`sc-tab ${
                    activeTab === id ? 'active' : ''
                  }`}

                  onClick={() => setActiveTab(id)}

                  aria-pressed={activeTab === id}

                >

                  <Icon size={19} />

                  {label}

                </button>

              ))}

            </div>

            <motion.button

              type="button"

              className="sc-save-button"

              whileTap={{
                scale: 0.96,
              }}

              onClick={handleSave}

            >

              <Save size={19} />

              Save Changes

            </motion.button>

          </div>

          {/* UNSAVED CHANGES */}

          {hasChanges && (

            <div className="sc-unsaved">

              <span />

              You have unsaved changes

            </div>

          )}

          {/* =================================
              TAB ANIMATION
          ================================= */}

          <AnimatePresence mode="wait">

            <motion.div

              key={activeTab}

              initial={{
                opacity: 0,
                y: 7,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              exit={{
                opacity: 0,
                y: -7,
              }}

              transition={{
                duration: 0.18,
              }}

            >

              {/* =================================
                  GENERAL TAB
              ================================= */}

              {activeTab === 'general' && (

                <>

                  {/* STORE BRANDING */}

                  <ConfigCard

                    title="Store Branding"

                    description="Your store's visual identity and brand assets."

                    icon={<Tag size={25} />}

                  >

                    <div className="sc-branding-grid">

                      {/* STORE LOGO */}

                      <div className="sc-branding-item">

                        <label className="sc-label">

                          Store Logo

                        </label>

                        <div className="sc-upload-layout">

                          <div className="sc-logo-preview">

                            <img

                              src={settings.logo || logo}

                              alt="Store logo"

                            />

                          </div>

                          <div className="sc-upload-actions">

                            <input

                              ref={logoInputRef}

                              type="file"

                              accept="image/png,image/jpeg,image/webp"

                              hidden

                              onChange={(event) =>
                                handleImageUpload(
                                  event,
                                  'logo'
                                )
                              }

                            />

                            <button

                              type="button"

                              className="sc-outline-button"

                              onClick={() =>
                                logoInputRef.current?.click()
                              }

                            >

                              <Upload size={15} />

                              Upload Logo

                            </button>

                            <button

                              type="button"

                              className="sc-outline-button"

                              onClick={() =>
                                update('logo', '')
                              }

                            >

                              <Trash2 size={15} />

                              Remove

                            </button>

                            <small>

                              Recommended: 512 × 512 px

                              <br />

                              PNG, JPG, WEBP

                            </small>

                          </div>

                        </div>

                      </div>

                      {/* FAVICON */}

                      <div className="sc-branding-item">

                        <label className="sc-label">

                          Favicon

                        </label>

                        <div className="sc-upload-layout">

                          <div className="sc-favicon-preview">

                            <img

                              src={settings.favicon || logo}

                              alt="Store favicon"

                            />

                          </div>

                          <div className="sc-upload-actions">

                            <input

                              ref={faviconInputRef}

                              type="file"

                              accept=".png,.ico,image/png,image/x-icon,image/vnd.microsoft.icon"

                              hidden

                              onChange={(event) =>
                                handleImageUpload(
                                  event,
                                  'favicon'
                                )
                              }

                            />

                            <button

                              type="button"

                              className="sc-outline-button"

                              onClick={() =>
                                faviconInputRef.current?.click()
                              }

                            >

                              <Upload size={15} />

                              Upload Favicon

                            </button>

                            <button

                              type="button"

                              className="sc-outline-button"

                              onClick={() =>
                                update('favicon', '')
                              }

                            >

                              <Trash2 size={15} />

                              Remove

                            </button>

                            <small>

                              Recommended: 64 × 64 px

                              <br />

                              PNG, ICO

                            </small>

                          </div>

                        </div>

                      </div>

                      {/* BRANDING BANNER */}

                      <div className="sc-brand-preview">

                        <div className="sc-brand-preview-content">

                          <Gem size={30} />

                          <h3>

                            {settings.storeName || 'SilverHub'}

                          </h3>

                          <p>

                            Premium Silver Jewellery

                          </p>

                        </div>

                      </div>

                    </div>

                  </ConfigCard>

                  {/* =================================
                      STORE INFORMATION
                  ================================= */}

                  <ConfigCard

                    title="Store Information"

                    description="Basic information about your store."

                    icon={<Store size={25} />}

                  >

                    <div className="sc-form-grid">

                      {/* STORE NAME */}

                      <label className="sc-field">

                        <span>

                          Store Name <b>*</b>

                        </span>

                        <input

                          type="text"

                          value={settings.storeName}

                          placeholder="Enter store name"

                          onChange={(e) =>
                            update(
                              'storeName',
                              e.target.value
                            )
                          }

                        />

                      </label>

                      {/* STORE TAGLINE */}

                      <label className="sc-field">

                        <span>Store Tagline</span>

                        <input

                          type="text"

                          value={settings.tagline}

                          placeholder="Enter store tagline"

                          onChange={(e) =>
                            update(
                              'tagline',
                              e.target.value
                            )
                          }

                        />

                      </label>

                      {/* STORE DESCRIPTION */}

                      <label className="sc-field sc-full-width">

                        <span>Store Description</span>

                        <div className="sc-textarea-wrapper">

                          <textarea

                            rows={3}

                            maxLength={250}

                            value={settings.description}

                            placeholder="Enter store description"

                            onChange={(e) =>
                              update(
                                'description',
                                e.target.value
                              )
                            }

                          />

                          <small className="sc-character-count">

                            {settings.description.length} / 250

                          </small>

                        </div>

                      </label>

                    </div>

                    {/* CONTACT INFORMATION */}

                    <div className="sc-contact-grid">

                      {/* CONTACT EMAIL */}

                      <label className="sc-field">

                        <span>Contact Email</span>

                        <div className="sc-icon-input">

                          <Mail size={17} />

                          <input

                            type="email"

                            placeholder="support@example.com"

                            value={settings.email}

                            onChange={(e) =>
                              update(
                                'email',
                                e.target.value
                              )
                            }

                          />

                        </div>

                      </label>

                      {/* CONTACT PHONE */}

                      <label className="sc-field">

                        <span>Contact Phone</span>

                        <div className="sc-icon-input">

                          <Phone size={17} />

                          <input

                            type="tel"

                            placeholder="+91"

                            value={settings.phone}

                            onChange={(e) =>
                              update(
                                'phone',
                                e.target.value
                              )
                            }

                          />

                        </div>

                      </label>

                      {/* STORE ADDRESS */}

                      <label className="sc-field">

                        <span>Store Address</span>

                        <div className="sc-icon-input">

                          <MapPin size={18} />

                          <textarea

                            rows={2}

                            placeholder="Enter store address"

                            value={settings.address}

                            onChange={(e) =>
                              update(
                                'address',
                                e.target.value
                              )
                            }

                          />

                        </div>

                      </label>

                    </div>

                  </ConfigCard>

                </>

              )}

              {/* =================================
                  STOREFRONT TAB
              ================================= */}

              {activeTab === 'storefront' && (

                <>

                  {/* SILVER RATE CONFIGURATION */}

                  <ConfigCard

                    title="Silver Rate Configuration"

                    description="Manage silver purity and pricing preferences."

                    icon={<Gem size={25} />}

                  >

                    <div className="sc-form-grid">

                      {/* SILVER PURITY */}

                      <label className="sc-field">

                        <span>Silver Purity</span>

                        <select

                          value={settings.silverPurity}

                          onChange={(e) =>
                            update(
                              'silverPurity',
                              e.target.value
                            )
                          }

                        >

                          <option value="925">
                            925 Silver
                          </option>

                          <option value="935">
                            935 Silver
                          </option>

                          <option value="999">
                            999 Silver
                          </option>

                        </select>

                      </label>

                      {/* SILVER RATE MODE */}

                      <label className="sc-field">

                        <span>Silver Rate Mode</span>

                        <select

                          value={settings.silverRateMode}

                          onChange={(e) =>
                            update(
                              'silverRateMode',
                              e.target.value === 'manual'
                                ? 'manual'
                                : 'automatic'
                            )
                          }

                        >

                          <option value="automatic">

                            Automatic API

                          </option>

                          <option value="manual">

                            Manual Rate

                          </option>

                        </select>

                      </label>

                      {/* MANUAL SILVER RATE */}

                      {settings.silverRateMode === 'manual' && (

                        <label className="sc-field sc-full-width">

                          <span>

                            Silver Rate (₹ per gram)

                          </span>

                          <input

                            type="number"

                            min="0.01"

                            step="0.01"

                            value={settings.manualSilverRate || ''}

                            placeholder="Enter silver rate"

                            onChange={(e) =>
                              update(
                                'manualSilverRate',
                                Number(e.target.value)
                              )
                            }

                          />

                        </label>

                      )}

                    </div>

                  </ConfigCard>

                  {/* =================================
                      SHIPPING CONFIGURATION
                  ================================= */}

                  <ConfigCard

                    title="Shipping Configuration"

                    description="Manage shipping charges and delivery preferences."

                    icon={<Truck size={25} />}

                  >

                    <div className="sc-setting-row">

                      <span>Enable Free Shipping</span>

                      <Toggle

                        label="Free shipping"

                        checked={settings.freeShipping}

                        onChange={() =>
                          update(
                            'freeShipping',
                            !settings.freeShipping
                          )
                        }

                      />

                    </div>

                    <div className="sc-form-grid sc-spacing">

                      {/* SHIPPING CHARGE */}

                      {!settings.freeShipping && (

                        <label className="sc-field">

                          <span>Shipping Charges (₹)</span>

                          <input

                            type="number"

                            min="0"

                            step="0.01"

                            value={settings.shippingCharge}

                            onChange={(e) =>
                              update(
                                'shippingCharge',
                                Number(e.target.value)
                              )
                            }

                          />

                        </label>

                      )}

                      {/* DELIVERY DURATION */}

                      <label className="sc-field">

                        <span>Estimated Delivery</span>

                        <input

                          type="text"

                          value={settings.deliveryDuration}

                          placeholder="3–7 business days"

                          onChange={(e) =>
                            update(
                              'deliveryDuration',
                              e.target.value
                            )
                          }

                        />

                      </label>

                      {/* WHATSAPP NUMBER */}

                      <label className="sc-field">

                        <span>WhatsApp Number</span>

                        <input

                          type="tel"

                          placeholder="+91"

                          value={settings.whatsapp}

                          onChange={(e) =>
                            update(
                              'whatsapp',
                              e.target.value
                            )
                          }

                        />

                      </label>

                    </div>

                  </ConfigCard>

                  {/* =================================
                      TAX AND RETURN POLICY
                  ================================= */}

                  <ConfigCard

                    title="Tax & Return Policy"

                    description="Manage tax and product return preferences."

                    icon={<Receipt size={25} />}

                  >

                    <div className="sc-form-grid">

                      {/* GST PERCENTAGE */}

                      <label className="sc-field">

                        <span>GST Percentage (%)</span>

                        <input

                          type="number"

                          min="0"

                          max="100"

                          step="0.01"

                          value={settings.gstPercentage}

                          onChange={(e) =>
                            update(
                              'gstPercentage',
                              Number(e.target.value)
                            )
                          }

                        />

                      </label>

                      {/* RETURN PERIOD */}

                      <label className="sc-field">

                        <span>Return Period (Days)</span>

                        <input

                          type="number"

                          min="0"

                          step="1"

                          value={settings.returnDays}

                          onChange={(e) =>
                            update(
                              'returnDays',
                              Number(e.target.value)
                            )
                          }

                        />

                      </label>

                    </div>

                  </ConfigCard>

                </>

              )}

              {/* =================================
                  ABOUT TAB
              ================================= */}

              {activeTab === 'about' && (

                <ConfigCard

                  title="About Store"

                  description="Manage the content displayed on your About page."

                  icon={<Info size={25} />}

                >

                  <div className="sc-form-grid">

                    {/* ABOUT TITLE */}

                    <label className="sc-field sc-full-width">

                      <span>About Page Title</span>

                      <input

                        type="text"

                        value={settings.aboutTitle}

                        onChange={(e) =>
                          update(
                            'aboutTitle',
                            e.target.value
                          )
                        }

                      />

                    </label>

                    {/* ABOUT DESCRIPTION */}

                    <label className="sc-field sc-full-width">

                      <span>About Description</span>

                      <textarea

                        rows={3}

                        value={settings.aboutDescription}

                        onChange={(e) =>
                          update(
                            'aboutDescription',
                            e.target.value
                          )
                        }

                      />

                    </label>

                    {/* OUR STORY */}

                    <label className="sc-field sc-full-width">

                      <span>Our Story</span>

                      <textarea

                        rows={4}

                        value={settings.storeStory}

                        onChange={(e) =>
                          update(
                            'storeStory',
                            e.target.value
                          )
                        }

                      />

                    </label>

                    {/* OUR PROMISE */}

                    <label className="sc-field sc-full-width">

                      <span>Our Promise</span>

                      <textarea

                        rows={4}

                        value={settings.storePromise}

                        onChange={(e) =>
                          update(
                            'storePromise',
                            e.target.value
                          )
                        }

                      />

                    </label>

                  </div>

                </ConfigCard>

              )}

            </motion.div>

          </AnimatePresence>

        </div>

        {/* =====================================
            RIGHT SIDE PANEL
        ===================================== */}

        <aside className="sc-side-column">

          {/* =================================
              STORE STATUS
          ================================= */}

          <section className="sc-card sc-side-card">

            <div className="sc-side-heading">

              <Store size={25} />

              <h2>Store Status</h2>

              <span

                className={`sc-status ${
                  savedSettings.storefrontVisible
                    ? 'live'
                    : 'offline'
                }`}

              >

                {savedSettings.storefrontVisible
                  ? 'Live'
                  : 'Offline'}

              </span>

            </div>

            <p className="sc-status-description">

              {savedSettings.storefrontVisible
                ? 'Your storefront is configured to be visible to customers.'
                : 'Your storefront is configured to be offline.'}

            </p>

            <div className="sc-setting-row">

              <Settings size={20} />

              <span>Storefront Visibility</span>

              <Toggle

                label="Storefront visibility"

                checked={settings.storefrontVisible}

                onChange={() =>
                  update(
                    'storefrontVisible',
                    !settings.storefrontVisible
                  )
                }

              />

            </div>

          </section>

          {/* =================================
              QUICK SETTINGS
          ================================= */}

          <section className="sc-card sc-side-card">

            <div className="sc-side-heading">

              <Zap size={25} />

              <h2>Quick Settings</h2>

            </div>

            {quickSettings.map(
              ({ key, label, icon: Icon }) => (

                <div

                  className="sc-setting-row"

                  key={key}

                >

                  <Icon size={21} />

                  <span>{label}</span>

                  <Toggle

                    label={label}

                    checked={settings[key]}

                    onChange={() =>
                      update(
                        key,
                        !settings[key]
                      )
                    }

                  />

                </div>

              )
            )}

          </section>

          {/* =================================
              STORE LINKS
          ================================= */}

          <section className="sc-card sc-side-card">

            <div className="sc-side-heading">

              <Link2 size={25} />

              <h2>Store Links</h2>

            </div>

            {[
              {
                label: 'Storefront URL',
                url: storefrontURL,
              },
              {
                label: 'Admin Portal URL',
                url: adminURL,
              },
            ].map(({ label, url }) => (

              <div

                className="sc-link-item"

                key={label}

              >

                <div className="sc-link-label">

                  <Link2 size={17} />

                  {label}

                </div>

                <div className="sc-link-row">

                  <div className="sc-link-input">

                    <input

                      value={url}

                      readOnly

                      aria-label={label}

                    />

                    <a

                      href={url}

                      target="_blank"

                      rel="noopener noreferrer"

                      aria-label={`Open ${label}`}

                    >

                      <ExternalLink size={17} />

                    </a>

                  </div>

                  <button

                    type="button"

                    className="sc-copy-button"

                    aria-label={`Copy ${label}`}

                    onClick={() => copyLink(url)}

                  >

                    <Copy size={18} />

                  </button>

                </div>

              </div>

            ))}

          </section>

          {/* DEMO STORAGE INFORMATION */}

          <div className="sc-demo-note">

            <Info size={16} />

            Settings are currently stored in this browser.
            Storefront integration is pending.

          </div>

        </aside>

      </div>

      {/* =====================================
          SUCCESS AND ERROR NOTIFICATIONS
      ===================================== */}

      <AnimatePresence>

        {notification && (

          <motion.div

            role="status"

            className={`sc-notification ${notification.type}`}

            initial={{
              opacity: 0,
              x: 100,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            exit={{
              opacity: 0,
              x: 120,
            }}

            transition={{
              duration: 0.3,
            }}

          >

            {notification.type === 'success'
              ? <CheckCircle2 size={22} />
              : <AlertCircle size={22} />
            }

            <span>

              {notification.message}

            </span>

            <button

              type="button"

              aria-label="Close notification"

              onClick={() => setNotification(null)}

            >

              <X size={17} />

            </button>

          </motion.div>

        )}

      </AnimatePresence>

    </motion.div>

  );

}