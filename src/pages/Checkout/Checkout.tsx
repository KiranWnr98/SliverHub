import { useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';

import {
  ArrowLeft,
  MapPin,
  Plus,
  House,
  BriefcaseBusiness,
  Smartphone,
  CreditCard,
  Banknote,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
  Info,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';

import { useCart } from '../../context/useCart';

import {
  isProductPurchasable,
  useProductCatalog,
} from '../../hooks/useProducts';

import { useProductImage } from '../../hooks/useProductMedia';

import {
  usePaymentSettings,
  getPaymentSettings,
} from '../../context/paymentSettings';

import './Checkout.css';

/* =========================================
   ADDRESS TYPE
========================================= */

type Address = {
  id: string;
  name: string;
  phone: string;
  doorNo: string;
  street: string;
  pincode: string;
  landmark: string;
  city: string;
  state: string;
  alternatePhone: string;
  addressType: 'Home' | 'Work' | 'Other';
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

type PaymentMethod = 'UPI' | 'Card' | 'COD';

/* =========================================
   CUSTOMER ADDRESS STORAGE
========================================= */

function getSavedAddresses(): Address[] {
  try {
    const customer = JSON.parse(
      sessionStorage.getItem(
        'silverhub-demo-customer'
      ) || 'null'
    );

    const email = customer?.email;

    if (typeof email !== 'string' || !email.trim()) {
      return [];
    }

    const storageKey =
      `silverhub-addresses-${email.trim().toLowerCase()}`;

    const saved = localStorage.getItem(storageKey);

    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];

  } catch {
    return [];
  }
}

/* =========================================
   PRODUCT IMAGE
========================================= */

function CheckoutProductImage({
  image,
  name,
}: {
  image: string;
  name: string;
}) {

  const imageUrl = useProductImage(image);

  return imageUrl ? (

    <img src={imageUrl} alt={name} />

  ) : (

    <ShoppingBag size={25} />

  );
}

/* =========================================
   FORMAT PRICE
========================================= */

function formatPrice(price: number) {

  return `₹${price.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

}

/* =========================================
   MAIN CHECKOUT PAGE
========================================= */

export default function Checkout() {

  const navigate = useNavigate();

  const { cart } = useCart();

  const { products } = useProductCatalog();

  /* ADMIN PAYMENT SETTINGS */

  const paymentSettings = usePaymentSettings();

  const [addresses, setAddresses] =
    useState<Address[]>(getSavedAddresses);

  const [selectedAddressId, setSelectedAddressId] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const [error, setError] = useState('');

  const [isLeaving, setIsLeaving] = useState(false);

  /* =========================================
     LOAD SAVED ADDRESSES
  ========================================= */

  useEffect(() => {

    const refreshAddresses = () => {

      setAddresses(getSavedAddresses());

    };

    refreshAddresses();

    window.addEventListener(
      'silverhub-auth-changed',
      refreshAddresses
    );

    window.addEventListener(
      'storage',
      refreshAddresses
    );

    window.addEventListener(
      'focus',
      refreshAddresses
    );

    return () => {

      window.removeEventListener(
        'silverhub-auth-changed',
        refreshAddresses
      );

      window.removeEventListener(
        'storage',
        refreshAddresses
      );

      window.removeEventListener(
        'focus',
        refreshAddresses
      );

    };

  }, []);

  /* =========================================
     SELECT DEFAULT ADDRESS
  ========================================= */

  useEffect(() => {

    setSelectedAddressId((previous) => {

      if (
        addresses.some(
          (address) => address.id === previous
        )
      ) {
        return previous;
      }

      const defaultAddress =
        addresses.find(
          (address) => address.isDefault
        ) || addresses[0];

      return defaultAddress?.id || '';

    });

  }, [addresses]);

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId
  );

  /* =========================================
     BACK BUTTON ANIMATION
  ========================================= */

  const handleBack = () => {

    if (isLeaving) return;

    setIsLeaving(true);

  };

  useEffect(() => {

    if (!isLeaving) return;

    const timer = window.setTimeout(() => {

      navigate('/cart');

    }, 400);

    return () => window.clearTimeout(timer);

  }, [isLeaving, navigate]);

  /* =========================================
     AVAILABLE PRODUCTS
  ========================================= */

  const productById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          product,
        ])
      ),
    [products],
  );

  const checkoutItems = useMemo(
    () =>
      cart.flatMap((item) => {

        const product = productById.get(
          item.product.id
        );

        return product &&
          isProductPurchasable(product) &&
          item.quantity > 0 &&
          item.quantity <=
            (product.stockQuantity ?? 0)

          ? [{
              product,
              quantity: item.quantity,
            }]

          : [];

      }),

    [cart, productById],
  );

  /* =========================================
     ORDER TOTAL
  ========================================= */

  const subtotal = checkoutItems.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0,
  );

  const deliveryCharge = 0;

  const baseTotal = subtotal + deliveryCharge;

  const configuredCodCharge = Math.max(
    0,
    Number(paymentSettings.codCharges) || 0
  );

  const maximumCodAmount = Math.max(
    0,
    Number(paymentSettings.maximumCodAmount) || 0
  );

  const minimumOrderAmount = Math.max(
    0,
    Number(paymentSettings.minimumOrderAmount) || 0
  );

  /* COD AVAILABILITY */

  const codAvailable =
    paymentSettings.codEnabled &&
    baseTotal + configuredCodCharge <= maximumCodAmount;

  /* COD ADDITIONAL CHARGES */

  const codCharge =
    paymentMethod === 'COD' && codAvailable
      ? configuredCodCharge
      : 0;

  const totalAmount =
    baseTotal + codCharge;

  const totalItems = checkoutItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  /* =========================================
     DYNAMIC PAYMENT METHODS
  ========================================= */

  const paymentMethods = [

    {
      id: 'UPI' as const,
      title: 'UPI Payment',
      description: 'Google Pay, PhonePe, Paytm',
      icon: Smartphone,
      enabled: paymentSettings.upiEnabled,
      available: true,
    },

    {
      id: 'Card' as const,
      title: 'Credit / Debit Card',
      description: 'Visa, Mastercard and RuPay',
      icon: CreditCard,
      enabled: paymentSettings.cardEnabled,
      available: true,
    },

    {
      id: 'COD' as const,
      title: 'Cash on Delivery',

      description: !codAvailable

        ? `Available for orders up to ${formatPrice(
            maximumCodAmount
          )}, including COD charges`

        : configuredCodCharge > 0

          ? `Pay on delivery · ${formatPrice(
              configuredCodCharge
            )} additional charge`

          : 'Pay when your order arrives',

      icon: Banknote,
      enabled: paymentSettings.codEnabled,
      available: codAvailable,
    },

  ].filter((method) => method.enabled);

  const hasAvailablePayment =
    paymentMethods.some((method) => method.available);

  /* =========================================
     RESET DISABLED PAYMENT SELECTION
  ========================================= */

  useEffect(() => {

    if (!paymentMethod) return;

    const stillAvailable =

      paymentMethod === 'UPI'
        ? paymentSettings.upiEnabled

        : paymentMethod === 'Card'
          ? paymentSettings.cardEnabled

          : codAvailable;

    if (!stillAvailable) {

      setPaymentMethod(null);

      setError(
        'The selected payment method is no longer available. Please choose another method.'
      );

    }

  }, [
    paymentMethod,
    paymentSettings.upiEnabled,
    paymentSettings.cardEnabled,
    codAvailable,
  ]);

  /* =========================================
     VALIDATE CHECKOUT
  ========================================= */

  const handlePayment = () => {

    setError('');

    if (!selectedAddress) {

      setError(
        'Please select or add a delivery address.'
      );

      return;
    }

    if (checkoutItems.length === 0) {

      setError(
        'No available products to purchase.'
      );

      return;
    }

    if (!paymentMethod) {

      setError(
        'Please select a payment method.'
      );

      return;
    }

    /* READ LATEST ADMIN SETTINGS */

    const latestSettings = getPaymentSettings();

    const latestMinimum = Math.max(
      0,
      Number(latestSettings.minimumOrderAmount) || 0
    );

    const latestCodCharge = Math.max(
      0,
      Number(latestSettings.codCharges) || 0
    );

    const latestMaximumCod = Math.max(
      0,
      Number(latestSettings.maximumCodAmount) || 0
    );

    if (subtotal < latestMinimum) {

      setError(
        `Minimum order amount is ${formatPrice(
          latestMinimum
        )}. Please add more products.`
      );

      return;

    }

    /* UPI VALIDATION */

    if (
      paymentMethod === 'UPI' &&
      !latestSettings.upiEnabled
    ) {

      setPaymentMethod(null);

      setError(
        'UPI payment is currently unavailable.'
      );

      return;

    }

    /* CARD VALIDATION */

    if (
      paymentMethod === 'Card' &&
      !latestSettings.cardEnabled
    ) {

      setPaymentMethod(null);

      setError(
        'Card payment is currently unavailable.'
      );

      return;

    }

    /* COD VALIDATION */

    if (paymentMethod === 'COD') {

      if (!latestSettings.codEnabled) {

        setPaymentMethod(null);

        setError(
          'Cash on Delivery is currently unavailable.'
        );

        return;

      }

      if (
        baseTotal + latestCodCharge >
        latestMaximumCod
      ) {

        setPaymentMethod(null);

        setError(
          `Cash on Delivery is available only for orders up to ${formatPrice(
            latestMaximumCod
          )}, including COD charges.`
        );

        return;

      }

      /*
        Connect COD order submission here.

        Actual order creation is not connected
        in the supplied Checkout.tsx.
      */

      setError(
        'Cash on Delivery is available, but order submission is not connected yet.'
      );

      return;

    }

    /*
      Razorpay or another payment gateway
      must be integrated here.
    */

    setError(
      'Online payment gateway is not connected yet.'
    );

  };

  /* =========================================
     BACK BUTTON
  ========================================= */

  const backButton = (

    <div className="checkout-topbar">

      <motion.button
        type="button"
        className="checkout-back-button"
        onClick={handleBack}
        disabled={isLeaving}
        whileTap={{ scale: 0.94 }}
      >

        <motion.span
          animate={{
            x: isLeaving ? -12 : 0,
            opacity: isLeaving ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        >

          <ArrowLeft size={18} />

        </motion.span>

        Back to Jewellery Box

      </motion.button>

    </div>

  );

  /* =========================================
     EMPTY CHECKOUT
  ========================================= */

  if (checkoutItems.length === 0) {

    return (

      <main
        className={`checkout-page ${
          isLeaving ? 'checkout-page-leaving' : ''
        }`}
      >

        {backButton}

        <div className="checkout-header">

          <span>SECURE CHECKOUT</span>

          <h1>Checkout</h1>

        </div>

        <section className="empty-cart">

          <ShoppingBag size={42} />

          <h2>No available products to purchase</h2>

          <p>
            Return to your Jewellery Box to review
            your saved items.
          </p>

          <button
            type="button"
            className="checkout-primary-button"
            onClick={handleBack}
            disabled={isLeaving}
          >

            <ArrowLeft size={17} />

            Return to Jewellery Box

          </button>

        </section>

      </main>

    );

  }

  /* =========================================
     MAIN CHECKOUT PAGE
  ========================================= */

  return (

    <main
      className={`checkout-page ${
        isLeaving ? 'checkout-page-leaving' : ''
      }`}
    >

      {backButton}

      {/* PAGE HEADER */}

      <motion.div
        className="checkout-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <span>SECURE CHECKOUT</span>

        <h1>Checkout</h1>

        <p>

          <ShieldCheck size={17} />

          Safe and secure checkout

        </p>

      </motion.div>

      <div className="checkout-layout">

        <div className="checkout-left">

          {/* =================================
              DELIVERY ADDRESS
          ================================= */}

          <motion.section
            className="checkout-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <div className="checkout-panel-heading">

              <div className="checkout-heading-icon">

                <MapPin size={23} />

              </div>

              <div>

                <h2>Delivery Address</h2>

                <p>
                  Select your preferred delivery address
                </p>

              </div>

            </div>

            {addresses.length === 0 ? (

              <div className="checkout-empty-address">

                <MapPin size={35} />

                <h3>No saved addresses</h3>

                <p>
                  Add a delivery address to continue.
                </p>

              </div>

            ) : (

              <div className="checkout-address-list">

                {addresses.map((address) => (

                  <label
                    key={address.id}
                    className={`checkout-address-card ${
                      selectedAddressId === address.id
                        ? 'selected'
                        : ''
                    }`}
                  >

                    <input
                      type="radio"
                      name="delivery-address"
                      checked={
                        selectedAddressId === address.id
                      }
                      onChange={() => {

                        setSelectedAddressId(address.id);

                        setError('');

                      }}
                    />

                    <div className="checkout-address-content">

                      <div className="checkout-address-top">

                        <span className="checkout-address-type">

                          {address.addressType === 'Home' ? (

                            <House size={16} />

                          ) : address.addressType === 'Work' ? (

                            <BriefcaseBusiness size={16} />

                          ) : (

                            <MapPin size={16} />

                          )}

                          {address.addressType}

                        </span>

                        {address.isDefault && (

                          <span className="checkout-default">

                            Default

                          </span>

                        )}

                      </div>

                      <h3>{address.name}</h3>

                      <p>

                        {address.doorNo}, {address.street}

                        {address.landmark
                          ? `, Near ${address.landmark}`
                          : ''}

                      </p>

                      <p>

                        {address.city}, {address.state}

                        {' - '}

                        {address.pincode}

                      </p>

                      <p className="checkout-address-phone">

                        +91 {address.phone}

                      </p>

                    </div>

                    {selectedAddressId === address.id && (

                      <CheckCircle2
                        size={21}
                        className="checkout-selected-icon"
                      />

                    )}

                  </label>

                ))}

              </div>

            )}

            <Link
              to="/account/addresses"
              state={{ from: '/checkout' }}
              className="checkout-add-address"
            >

              <Plus size={19} />

              {addresses.length === 0
                ? 'Add New Address'
                : 'Add / Manage Addresses'}

            </Link>

          </motion.section>

          {/* =================================
              DYNAMIC PAYMENT METHODS
          ================================= */}

          <motion.section
            className="checkout-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >

            <div className="checkout-panel-heading">

              <div className="checkout-heading-icon">

                <CreditCard size={23} />

              </div>

              <div>

                <h2>Payment Method</h2>

                <p>Choose how you would like to pay</p>

              </div>

            </div>

            {/* PAYMENT OPTIONS */}

            <div className="checkout-payment-list">

              {paymentMethods.map((method) => {

                const Icon = method.icon;

                return (

                  <label
                    key={method.id}
                    className={`checkout-payment-card ${
                      paymentMethod === method.id &&
                      method.available
                        ? 'selected'
                        : ''
                    } ${
                      !method.available
                        ? 'payment-disabled'
                        : ''
                    }`}
                  >

                    <input
                      type="radio"
                      name="payment-method"
                      disabled={!method.available}
                      checked={
                        paymentMethod === method.id &&
                        method.available
                      }
                      onChange={() => {

                        if (!method.available) return;

                        setPaymentMethod(method.id);

                        setError('');

                      }}
                    />

                    <div className="checkout-payment-icon">

                      <Icon size={25} />

                    </div>

                    <div className="checkout-payment-content">

                      <h3>{method.title}</h3>

                      <p>{method.description}</p>

                      {!method.available && (

                        <span className="checkout-payment-unavailable">

                          Currently unavailable for this order

                        </span>

                      )}

                    </div>

                    {paymentMethod === method.id &&
                      method.available && (

                      <CheckCircle2
                        size={21}
                        className="checkout-selected-icon"
                      />

                    )}

                  </label>

                );

              })}

            </div>

            {/* NO PAYMENT METHODS */}

            {!hasAvailablePayment && (

              <div className="checkout-payment-warning">

                <AlertCircle size={21} />

                <div>

                  <strong>
                    No payment methods available
                  </strong>

                  <p>
                    Please review your order or try again later.
                  </p>

                </div>

              </div>

            )}

            {/* MINIMUM ORDER AMOUNT */}

            {subtotal < minimumOrderAmount && (

              <div className="checkout-payment-warning">

                <Info size={20} />

                <div>

                  <strong>
                    Minimum order amount
                  </strong>

                  <p>

                    Please add products worth{' '}

                    {formatPrice(
                      minimumOrderAmount - subtotal
                    )}

                    {' '}more to continue.

                  </p>

                </div>

              </div>

            )}

            {/* ADMIN PAYMENT INSTRUCTIONS */}

            {paymentSettings.paymentInstructions.trim() && (

              <div className="checkout-payment-instructions">

                <Info size={19} />

                <div>

                  <strong>Payment Instructions</strong>

                  <p>
                    {paymentSettings.paymentInstructions}
                  </p>

                </div>

              </div>

            )}

            {/* SECURITY NOTE */}

            <div className="checkout-security-note">

              {paymentMethod === 'COD' ? (

                <Banknote size={16} />

              ) : (

                <Lock size={16} />

              )}

              {paymentMethod === 'COD'

                ? 'Pay for your jewellery when your order is delivered.'

                : 'Online payment details will be handled by the payment provider after integration.'}

            </div>

          </motion.section>

          {/* =================================
              ORDER PRODUCTS
          ================================= */}

          <motion.section
            className="checkout-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >

            <div className="checkout-panel-heading">

              <div className="checkout-heading-icon">

                <ShoppingBag size={23} />

              </div>

              <div>

                <h2>Your Order</h2>

                <p>

                  {totalItems}{' '}

                  {totalItems === 1 ? 'item' : 'items'}

                </p>

              </div>

            </div>

            {checkoutItems.map(({ product, quantity }) => (

              <article
                className="checkout-product"
                key={product.id}
              >

                <div className="checkout-product-image">

                  <CheckoutProductImage
                    image={product.image}
                    name={product.name}
                  />

                </div>

                <div className="checkout-product-details">

                  <span>{product.category}</span>

                  <h3>{product.name}</h3>

                  <p>

                    {formatPrice(product.price)}

                    {' × '}

                    {quantity}

                  </p>

                </div>

                <strong>

                  {formatPrice(
                    product.price * quantity
                  )}

                </strong>

              </article>

            ))}

          </motion.section>

        </div>

        {/* =====================================
            ORDER SUMMARY
        ===================================== */}

        <motion.aside
          className="checkout-summary"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >

          <h2>Order Summary</h2>

          {/* SUBTOTAL */}

          <div className="checkout-summary-row">

            <span>Subtotal</span>

            <strong>{formatPrice(subtotal)}</strong>

          </div>

          {/* DELIVERY CHARGES */}

          <div className="checkout-summary-row">

            <span>Delivery Charges</span>

            <strong className="checkout-free-delivery">

              {deliveryCharge === 0

                ? 'FREE'

                : formatPrice(deliveryCharge)}

            </strong>

          </div>

          {/* COD CHARGES */}

          {paymentMethod === 'COD' &&
            codAvailable && (

            <motion.div
              className="checkout-summary-row"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >

              <span>Cash on Delivery Charges</span>

              <strong>

                {codCharge === 0

                  ? 'FREE'

                  : formatPrice(codCharge)}

              </strong>

            </motion.div>

          )}

          <div className="checkout-summary-divider" />

          {/* TOTAL AMOUNT */}

          <div className="checkout-summary-total">

            <span>Total Amount</span>

            <motion.strong
              key={totalAmount}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >

              {formatPrice(totalAmount)}

            </motion.strong>

          </div>

          {/* SELECTED DELIVERY ADDRESS */}

          {selectedAddress && (

            <div className="checkout-summary-address">

              <MapPin size={18} />

              <div>

                <strong>Delivering to</strong>

                <p>

                  {selectedAddress.name}

                </p>

                <p>

                  {selectedAddress.city}

                  {' - '}

                  {selectedAddress.pincode}

                </p>

              </div>

            </div>

          )}

          {/* SELECTED PAYMENT METHOD */}

          {paymentMethod && (

            <div className="checkout-summary-payment">

              {paymentMethod === 'COD' ? (

                <Banknote size={20} />

              ) : paymentMethod === 'UPI' ? (

                <Smartphone size={20} />

              ) : (

                <CreditCard size={20} />

              )}

              <div>

                <small>Selected Payment Method</small>

                <strong>

                  {paymentMethod === 'COD'

                    ? 'Cash on Delivery'

                    : paymentMethod === 'UPI'

                      ? 'UPI Payment'

                      : 'Credit / Debit Card'}

                </strong>

              </div>

            </div>

          )}

          {/* VALIDATION ERROR */}

          {error && (

            <motion.p
              className="checkout-error"
              role="alert"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >

              {error}

            </motion.p>

          )}

          {/* PAYMENT BUTTON */}

          <motion.button
            type="button"
            className="checkout-primary-button"
            whileTap={{ scale: 0.96 }}
            onClick={handlePayment}
            disabled={
              !hasAvailablePayment ||
              subtotal < minimumOrderAmount ||
              isLeaving
            }
          >

            {paymentMethod === 'COD' ? (

              <>

                <ShoppingBag size={19} />

                Place Order

              </>

            ) : (

              <>

                <Lock size={18} />

                {paymentMethod

                  ? `Pay ${formatPrice(totalAmount)}`

                  : 'Proceed to Pay'}

              </>

            )}

          </motion.button>

          {/* TRUST NOTE */}

          <div className="checkout-trust">

            <ShieldCheck size={20} />

            <span>Secure Checkout</span>

          </div>

        </motion.aside>

      </div>

    </main>

  );

}