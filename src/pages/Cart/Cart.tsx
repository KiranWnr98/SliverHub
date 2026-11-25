import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { useCart } from '../../context/useCart';

import {
  isProductPurchasable,
  useProductCatalog,
} from '../../hooks/useProducts';

import { useProductImage } from '../../hooks/useProductMedia';

// =========================================
// PRODUCT IMAGE
// =========================================

function CartProductImage({
  image,
  name,
}: {
  image: string;
  name: string;
}) {
  const imageUrl = useProductImage(image);

  return imageUrl
    ? <img src={imageUrl} alt={name} />
    : null;
}

export default function Cart() {

  const {
    cart,
    removeFromCart,
    updateQuantity,
    payableSubtotal,
    hasAvailableItems,
  } = useCart();

  const navigate = useNavigate();

  const { products } = useProductCatalog();

  // =========================================
  // CONTINUE SHOPPING ANIMATION
  // =========================================

  const [isLeaving, setIsLeaving] = useState(false);

  const handleContinueShopping = () => {

    if (isLeaving) return;

    setIsLeaving(true);
  };

  useEffect(() => {

    if (!isLeaving) return;

    const timer = window.setTimeout(() => {

      navigate('/shop');

    }, 400);

    return () => window.clearTimeout(timer);

  }, [isLeaving, navigate]);

  // =========================================
  // PRODUCT CATALOG
  // =========================================

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

  const cartItems = useMemo(
    () =>
      cart.flatMap((item) => {

        const currentProduct = productById.get(
          item.product.id
        );

        return currentProduct &&
          !currentProduct.isDeleted &&
          !currentProduct.isHidden &&
          !currentProduct.scheduledDeletionAt
          ? [{ ...item, currentProduct }]
          : [];

      }),
    [cart, productById],
  );

  // =========================================
  // PRICE FORMAT
  // =========================================

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString('en-IN')}`;

  // =========================================
  // STOCK VALIDATION
  // =========================================

  const outOfStockProductNames = cartItems
    .filter(
      ({ currentProduct }) =>
        (currentProduct.stockQuantity ?? 0) <= 0,
    )
    .map(({ product }) => product.name);

  const overStockProductNames = cartItems
    .filter(
      ({ currentProduct, quantity }) =>
        (currentProduct.stockQuantity ?? 0) > 0 &&
        quantity > (currentProduct.stockQuantity ?? 0),
    )
    .map(({ product }) => product.name);

  return (

    <main
      className={`cart-page ${
        isLeaving ? 'cart-page-leaving' : ''
      }`}
    >

      {/* =====================================
          CONTINUE SHOPPING BUTTON
      ===================================== */}

      <div className="cart-topbar">

        <motion.button
          type="button"
          className="back-to-shopping"
          onClick={handleContinueShopping}
          disabled={isLeaving}
          whileTap={{ scale: 0.94 }}
        >

          <motion.span
            className="cart-back-arrow"
            animate={{
              x: isLeaving ? -12 : 0,
              opacity: isLeaving ? 0 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
          >

            <ArrowLeft size={18} />

          </motion.span>

          <span className="cart-back-text">

            Continue Shopping

          </span>

        </motion.button>

      </div>

      {/* =====================================
          CART HEADER
      ===================================== */}

      <motion.div
        className="cart-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <span className="cart-eyebrow">

          SILVERHUB COLLECTION

        </span>

        <h1>Your Jewellery Box</h1>

      </motion.div>

      {/* =====================================
          EMPTY JEWELLERY BOX
      ===================================== */}

      {cartItems.length === 0 ? (

        <motion.div
          className="empty-cart"
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
        >

          <div className="empty-cart-icon">

            <ShoppingBag size={42} />

          </div>

          <h2>Your jewellery box is empty</h2>

          <p>

            Discover something beautiful and add it
            to your collection.

          </p>

          <motion.button
            type="button"
            className="continue-shopping"
            onClick={handleContinueShopping}
            disabled={isLeaving}
            whileTap={{ scale: 0.95 }}
          >

            <ArrowLeft size={17} />

            Explore Collection

          </motion.button>

        </motion.div>

      ) : (

        <div className="cart-layout">

          {/* =====================================
              CART PRODUCTS
          ===================================== */}

          <section className="cart-items-section">

            <div className="cart-items-heading">

              <h2>Your Selection</h2>

              <span>

                {cartItems.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0
                )} items

              </span>

            </div>

            <AnimatePresence mode="popLayout">

              {cartItems.map(
                ({
                  product,
                  currentProduct,
                  quantity,
                }) => (

                  <motion.article
                    key={product.id}
                    className="cart-item"
                    layout
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -40,
                      height: 0,
                      marginBottom: 0,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                  >

                    {/* =================================
                        CLICKABLE PRODUCT IMAGE
                    ================================= */}

                    <Link
                      to={`/products/${product.id}`}
                      state={{
                        from: '/cart',
                      }}
                      className="cart-product-image"
                      aria-label={`View ${product.name} details`}
                    >

                      <CartProductImage
                        image={currentProduct.image}
                        name={product.name}
                      />

                    </Link>

                    {/* PRODUCT DETAILS */}

                    <div className="cart-product-details">

                      <span className="cart-product-category">

                        {product.category}

                      </span>

                      {/* CLICKABLE PRODUCT NAME */}

                      <h3>

                        <Link
                          to={`/products/${product.id}`}
                          state={{
                            from: '/cart',
                          }}
                          className="cart-product-name-link"
                        >

                          {product.name}

                        </Link>

                      </h3>

                      {/* OUT OF STOCK BADGE */}

                      {(currentProduct.stockQuantity ?? 0) <= 0 && (

                        <span
                          className="cart-stock-badge"
                          role="status"
                        >

                          Out of Stock

                        </span>

                      )}

                      {/* PRODUCT PRICE */}

                      <p className="cart-product-price">

                        {formatPrice(product.price)}

                      </p>

                      {/* STOCK AVAILABILITY WARNING */}

                      {(!isProductPurchasable(currentProduct) ||
                        quantity >
                          (currentProduct.stockQuantity ?? 0)) && (

                        <p
                          className="cart-availability-warning"
                          role="alert"
                        >

                          {(currentProduct.stockQuantity ?? 0) <= 0

                            ? 'This item is currently out of stock. Remove it or wait until it is back in stock.'

                            : !isProductPurchasable(currentProduct)

                              ? 'This item is no longer available. Remove it to continue.'

                              : `Only ${currentProduct.stockQuantity} available. Reduce the quantity to continue.`}

                        </p>

                      )}

                      {/* =================================
                          QUANTITY CONTROLS
                      ================================= */}

                      <div className="cart-quantity-control">

                        {/* MINUS BUTTON */}

                        <motion.button
                          type="button"
                          aria-label="Decrease quantity; removes item at zero"
                          whileTap={{ scale: 0.85 }}
                          onClick={() =>
                            updateQuantity(
                              product.id,
                              quantity - 1
                            )
                          }
                        >

                          <Minus size={15} />

                        </motion.button>

                        {/* QUANTITY VALUE */}

                        <span>{quantity}</span>

                        {/* PLUS BUTTON */}

                        <motion.button
                          type="button"
                          aria-label="Increase quantity"
                          whileTap={{ scale: 0.85 }}
                          disabled={
                            !isProductPurchasable(currentProduct) ||
                            quantity >=
                              (currentProduct.stockQuantity ?? 0)
                          }
                          onClick={() =>
                            updateQuantity(
                              product.id,
                              quantity + 1
                            )
                          }
                        >

                          <Plus size={15} />

                        </motion.button>

                      </div>

                    </div>

                    {/* =================================
                        PRODUCT TOTAL AND REMOVE
                    ================================= */}

                    <div className="cart-item-actions">

                      <strong>

                        {formatPrice(
                          product.price * quantity
                        )}

                      </strong>

                      <motion.button
                        type="button"
                        className="remove-cart-item"
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          removeFromCart(product.id)
                        }
                      >

                        <Trash2 size={16} />

                        Remove

                      </motion.button>

                    </div>

                  </motion.article>

                )
              )}

            </AnimatePresence>

          </section>

          {/* =====================================
              ORDER SUMMARY
          ===================================== */}

          <motion.aside
            className="cart-summary"
            initial={{
              opacity: 0,
              x: 25,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
          >

            <h2>Order Summary</h2>

            <div className="summary-row">

              <span>Subtotal</span>

              <strong>

                {formatPrice(payableSubtotal)}

              </strong>

            </div>

            <div className="summary-row">

              <span>Shipping</span>

              <span className="shipping-note">

                Calculated at checkout

              </span>

            </div>

            <div className="summary-divider" />

            <div className="summary-total">

              <span>Total</span>

              <strong>

                {formatPrice(payableSubtotal)}

              </strong>

            </div>

            {/* OUT OF STOCK WARNINGS */}

            {outOfStockProductNames.length > 0 &&
              hasAvailableItems && (

                <p
                  className="cart-availability-warning"
                  role="alert"
                >

                  Out of Stock items are saved in your
                  Jewellery Box but are excluded from
                  your order total.

                </p>

            )}

            {outOfStockProductNames.length > 0 &&
              !hasAvailableItems && (

                <p
                  className="cart-availability-warning"
                  role="alert"
                >

                  No available products to purchase.
                  Your Out of Stock items are still
                  saved in your Jewellery Box.

                </p>

            )}

            {overStockProductNames.length > 0 && (

              <p
                className="cart-availability-warning"
                role="alert"
              >

                {overStockProductNames.join(', ')} exceed
                the available stock and are excluded from
                your order total. Reduce their quantities
                to purchase them.

              </p>

            )}

            {/* =====================================
                CHECKOUT BUTTON
            ===================================== */}

            <button
              type="button"
              className={`checkout-button${
                !hasAvailableItems ? ' disabled' : ''
              }`}
              disabled={!hasAvailableItems}
              onClick={() => navigate('/checkout')}
            >

              {hasAvailableItems

                ? 'Proceed to Pay'

                : 'No available items to purchase'}

              <ArrowLeft
                size={18}
                className="checkout-arrow"
              />

            </button>

            {/* TRUST INFORMATION */}

            <div className="cart-trust-info">

              <div>

                <ShieldCheck size={20} />

                <span>Secure Shopping</span>

              </div>

              <div>

                <Truck size={20} />

                <span>Delivery Across India</span>

              </div>

            </div>

          </motion.aside>

        </div>

      )}

    </main>

  );
}