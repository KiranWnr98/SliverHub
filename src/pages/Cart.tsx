
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { useCart } from '../context/CartContext';

export default function Cart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString('en-IN')}`;

  return (
    <main className="cart-page">

      <motion.div
        className="cart-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="cart-eyebrow">
          SILVERAURA COLLECTION
        </span>

        <h1>Your Jewellery Box</h1>

        <p>
          Every beautiful piece deserves a place in your collection.
        </p>
      </motion.div>

      {cart.length === 0 ? (
        <motion.div
          className="empty-cart"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-cart-icon">
            <ShoppingBag size={42} />
          </div>

          <h2>Your jewellery box is empty</h2>

          <p>
            Discover something beautiful and add it to your collection.
          </p>

          <a href="/shop" className="continue-shopping">
            <ArrowLeft size={17} />
            Explore Collection
          </a>
        </motion.div>
      ) : (
        <div className="cart-layout">

          {/* CART PRODUCTS */}

          <section className="cart-items-section">

            <div className="cart-items-heading">
              <h2>Your Selection</h2>

              <span>
                {cart.reduce(
                  (total, item) => total + item.quantity,
                  0
                )} items
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {cart.map(({ product, quantity }) => (
                <motion.article
                  key={product.id}
                  className="cart-item"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: -40,
                    height: 0,
                    marginBottom: 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="cart-product-image">
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="cart-product-details">

                    <span className="cart-product-category">
                      {product.category}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="cart-product-price">
                      {formatPrice(product.price)}
                    </p>

                    <div className="cart-quantity-control">

                      <button
                        type="button"
                        aria-label="Decrease quantity; removes item at zero"
                        onClick={() =>
                          updateQuantity(
                            product.id,
                            quantity - 1
                          )
                        }
                      >
                        <Minus size={15} />
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          updateQuantity(
                            product.id,
                            quantity + 1
                          )
                        }
                      >
                        <Plus size={15} />
                      </button>

                    </div>

                  </div>

                  <div className="cart-item-actions">

                    <strong>
                      {formatPrice(product.price * quantity)}
                    </strong>

                    <button
                      type="button"
                      className="remove-cart-item"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>

                  </div>

                </motion.article>
              ))}
            </AnimatePresence>

            <a href="/shop" className="back-to-shopping">
              <ArrowLeft size={17} />
              Continue Shopping
            </a>

          </section>

          {/* ORDER SUMMARY */}

          <motion.aside
            className="cart-summary"
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(cartTotal)}</strong>
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
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              onClick={() => alert('Checkout integration coming soon!')}
            >
              Proceed to Checkout
              <ArrowLeft
                size={18}
                className="checkout-arrow"
              />
            </button>

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

            <p className="cart-secure-note">
              Your beautiful collection is just a step away.
            </p>

          </motion.aside>

        </div>
      )}

    </main>
  );
}
