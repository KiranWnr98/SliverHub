
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Minus, Plus, Check } from 'lucide-react';

import type { Product } from '../../types';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import JewelryBoxIcon from '../JewelryBoxIcon/JewelryBoxIcon';

interface Props {
  product: Product;
  showCartControls?: boolean;
}

export default function ProductCard({
  product,
  showCartControls = true,
}: Props) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [showHeart, setShowHeart] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const saved = isWishlisted(product.id);

  const cartItem = cart.find(
    (item) => item.product.id === product.id
  );

  const quantity = cartItem?.quantity ?? 0;

  const handleWishlist = () => {
    toggleWishlist(product.id);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
  };

  const handleIncrease = () => {
    if (quantity === 0) {
      addToCart(product);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 1400);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity === 1) {
      removeFromCart(product.id);
    } else if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <motion.article
      className="product-card"
      layout
      whileHover={{
        y: -7,
        transition: { duration: 0.25 }
      }}
    >
      {/* PRODUCT IMAGE */}
      <div className="product-image">

        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5 }}
        />

        <span className="sale-label">
          {product.isNew ? 'NEW ARRIVAL' : 'SPECIAL PRICE'}
        </span>

        {/* WISHLIST HEART */}
        <motion.button
          type="button"
          className={`product-heart ${saved ? 'saved' : ''}`}
          onClick={handleWishlist}
          whileTap={{ scale: 0.75 }}
          animate={{
            scale: showHeart ? [1, 1.35, 0.9, 1] : 1,
            rotate: showHeart ? [0, -12, 12, 0] : 0
          }}
          transition={{ duration: 0.4 }}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <motion.span
            animate={{
              color: saved ? '#D94B64' : '#0D1C2E'
            }}
          >
            <Heart
              size={21}
              fill={saved ? 'currentColor' : 'none'}
            />
          </motion.span>

          <AnimatePresence>
            {showHeart && saved && (
              <motion.span
                className="heart-pop"
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -40, scale: 1.2 }}
                exit={{ opacity: 0, y: -45 }}
                transition={{ duration: 0.55 }}
              >
                ♥
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

      </div>

      {/* PRODUCT INFORMATION */}
      <div className="product-info">

        <span className="product-category">
          {product.category}
        </span>

        <h3>{product.name}</h3>

        <div className="product-rating">
          ★ {product.rating} / 5
        </div>

        <div className="product-prices">
          <strong>
            ₹{product.price.toLocaleString('en-IN')}
          </strong>

          {product.oldPrice && (
            <del>
              ₹{product.oldPrice.toLocaleString('en-IN')}
            </del>
          )}
        </div>

        {/* CART CONTROLS - HIDDEN IN WISHLIST */}
        {showCartControls && (
          <>
            <AnimatePresence mode="wait">

              {quantity === 0 ? (

                <motion.button
                  key="add-button"
                  type="button"
                  className="add-cart-button"
                  onClick={handleIncrease}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ backgroundColor: '#BD9456' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    animate={showAdded ? {
                      rotate: [0, -12, 12, 0],
                      scale: [1, 1.2, 1]
                    } : {}}
                  >
                    <JewelryBoxIcon />
                  </motion.span>

                  Add to Box
                </motion.button>

              ) : (

                <motion.div
                  key="quantity-control"
                  className="quantity-control"
                  initial={{ opacity: 0, scale: 0.85, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 24
                  }}
                >

                  <motion.button
                    type="button"
                    className="quantity-btn"
                    onClick={handleDecrease}
                    whileTap={{ scale: 0.8 }}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </motion.button>

                  <AnimatePresence mode="wait">
                    <motion.span
                      key={quantity}
                      className="quantity-value"
                      initial={{ opacity: 0, y: -8, scale: 0.7 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.7 }}
                      transition={{ duration: 0.16 }}
                    >
                      {quantity}
                    </motion.span>
                  </AnimatePresence>

                  <motion.button
                    type="button"
                    className="quantity-btn"
                    onClick={handleIncrease}
                    whileTap={{ scale: 0.8 }}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </motion.button>

                </motion.div>

              )}

            </AnimatePresence>

            {/* ADDED CONFIRMATION */}
            <AnimatePresence>
              {showAdded && (
                <motion.div
                  className="added-message"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  role="status"
                >
                  <Check size={14} />
                  Added to your jewellery box!
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

      </div>
    </motion.article>
  );
}
