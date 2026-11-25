import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { ArrowLeft, Heart } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import ProductCard from '../../components/ProductCard/ProductCard';

import { useWishlist } from '../../context/useWishlist';

import { useProducts } from '../../hooks/useProducts';

import './Wishlist.css';

export default function Wishlist() {

  const { wishlist } = useWishlist();

  const { visibleProducts } = useProducts();

  const navigate = useNavigate();

  const [isLeaving, setIsLeaving] = useState(false);

  // =========================================
  // SAVED PRODUCTS
  // =========================================

  const savedProducts = visibleProducts.filter(
    (product) => wishlist.includes(product.id),
  );

  // =========================================
  // CONTINUE SHOPPING ANIMATION
  // =========================================

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

  return (

    <main
      className={`wishlist-page ${
        isLeaving ? 'wishlist-page-leaving' : ''
      }`}
    >

      {/* =====================================
          CONTINUE SHOPPING BUTTON
      ===================================== */}

      <div className="wishlist-topbar">

        <motion.button
          type="button"
          className="wishlist-back-button"
          onClick={handleContinueShopping}
          disabled={isLeaving}
          whileTap={{ scale: 0.94 }}
        >

          <motion.span
            className="wishlist-back-arrow"
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

          <span>Continue Shopping</span>

        </motion.button>

      </div>

      {/* =====================================
          WISHLIST HEADER
      ===================================== */}

      <motion.div
        className="wishlist-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >

        <span className="wishlist-eyebrow">

          SILVERHUB COLLECTION

        </span>

        <h1>Your Wishlist</h1>

      

      </motion.div>

      {/* =====================================
          EMPTY WISHLIST
      ===================================== */}

      {savedProducts.length === 0 ? (

        <motion.div
          className="empty-wishlist"
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 15,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
        >

          {/* HEART ICON */}

          <motion.div
            className="empty-wishlist-icon"
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 12,
            }}
          >

            <Heart size={42} strokeWidth={1.5} />

          </motion.div>

          <h2>Your wishlist is empty</h2>

          <p>

            You haven't added any products to your wishlist yet.

          </p>

          <motion.button
            type="button"
            className="wishlist-explore-button"
            onClick={handleContinueShopping}
            disabled={isLeaving}
            whileTap={{ scale: 0.95 }}
          >

            <ArrowLeft size={17} />

            Explore Collection

          </motion.button>

        </motion.div>

      ) : (

        /* =====================================
           SAVED WISHLIST PRODUCTS
        ===================================== */

        <section className="wishlist-products-section">

          <div className="wishlist-products-heading">

            <h2>Your Favourites</h2>

            <span>

              {savedProducts.length}{' '}

              {savedProducts.length === 1
                ? 'item'
                : 'items'}

            </span>

          </div>

          <div className="product-grid wishlist-product-grid">

            <AnimatePresence mode="popLayout">

              {savedProducts.map((product) => (

                <motion.div
                  key={product.id}
                  className="wishlist-product-wrapper"
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
                    scale: 0.85,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                >

                  <ProductCard
                    product={product}
                    showCartControls={false}
                  />

                </motion.div>

              ))}

            </AnimatePresence>

          </div>

        </section>

      )}

    </main>

  );
}