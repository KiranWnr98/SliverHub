import { useEffect, useMemo, useState } from 'react';

import {
  Heart,
  ShoppingBag,
  PlayCircle,
  ArrowLeft,
  Minus,
  Plus,
  Check,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  Link,
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';

import {
  isProductPurchasable,
  useProductCatalog,
} from '../../hooks/useProducts';

import {
  useProductGallery,
  useProductImage,
} from '../../hooks/useProductMedia';

import AuthPopup from '../../components/AuthPopup/AuthPopup';

import './ProductDetails.css';

export default function ProductDetails() {

  const { productId } = useParams();

  const { products } = useProductCatalog();

  const navigate = useNavigate();
  const location = useLocation();

  // =========================================
  // DYNAMIC BACK BUTTON NAVIGATION
  // =========================================

  const backPages: Record<string, string> = {
    '/': 'Home',
    '/shop': 'Shop',
    '/collections': 'Collections',
    '/new-arrivals': 'New Arrivals',
    '/wishlist': 'Wishlist',
    '/cart': 'Jewellery Box',
  };

  const from = location.state?.from;

  const backPath =
    typeof from === 'string' &&
    Object.prototype.hasOwnProperty.call(
      backPages,
      from
    )
      ? from
      : '/shop';

  const backLabel = backPages[backPath];

  // PRESERVE PREVIOUS PAGE QUERY PARAMETERS

  const backSearch =
    from === backPath &&
    typeof location.state?.search === 'string' &&
    location.state.search.startsWith('?')
      ? location.state.search
      : '';

  const backDestination = backPath + backSearch;

  // =========================================
  // BACK BUTTON ANIMATION
  // =========================================

  const [isLeaving, setIsLeaving] = useState(false);

  const handleBackToHome = () => {
    if (isLeaving) return;

    setIsLeaving(true);
  };

  useEffect(() => {
    if (!isLeaving) return;

    const timer = window.setTimeout(() => {
      navigate(backDestination);
    }, 400);

    return () => window.clearTimeout(timer);

  }, [isLeaving, navigate, backDestination]);

  // =========================================
  // FIND PRODUCT
  // =========================================

  const product = products.find(
    (item) =>
      item.id === Number(productId) &&
      !item.isDeleted &&
      !item.isHidden &&
      !item.scheduledDeletionAt,
  );

  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  const [message, setMessage] = useState('');

  const [selectedMediaId, setSelectedMediaId] =
    useState<string | null>(null);

  const [failedImageUrl, setFailedImageUrl] =
    useState<string | null>(null);

  const [showAuthPopup, setShowAuthPopup] =
    useState(false);

  const [authPopupType, setAuthPopupType] =
    useState<'wishlist' | 'cart'>('cart');

  // =========================================
  // WISHLIST HEART ANIMATION
  // =========================================

  const [heartAnimation, setHeartAnimation] =
    useState(0);

  const [showHeart, setShowHeart] =
    useState(false);

  const galleryMedia = useProductGallery(
    product?.media
  );

  const fallbackImage = useProductImage(
    product?.image ?? ''
  );

  // =========================================
  // CURRENT PRODUCT QUANTITY
  // =========================================

  const cartItem = cart.find(
    (item) => item.product.id === product?.id
  );

  const quantity = cartItem?.quantity ?? 0;

  const stockQuantity = product?.stockQuantity ?? 0;

  // =========================================
  // PRODUCT MEDIA SELECTION
  // =========================================

  const selectedMedia = useMemo(() => {

    if (!product) return null;

    const selected = galleryMedia.find(
      (media) => media.id === selectedMediaId,
    );

    if (selected) return selected;

    const primaryImage = galleryMedia.find(
      (media) =>
        media.id === product.primaryMediaId &&
        media.kind === 'image',
    );

    if (primaryImage) return primaryImage;

    const matchingImage = galleryMedia.find(
      (media) =>
        media.kind === 'image' &&
        (
          media.url === fallbackImage ||
          media.id === (
            product.image.startsWith('indexeddb:')
              ? product.image.slice('indexeddb:'.length)
              : ''
          )
        ),
    );

    if (matchingImage) return matchingImage;

    return galleryMedia.find(
      (media) => media.kind === 'image',
    ) ?? null;

  }, [
    product,
    galleryMedia,
    selectedMediaId,
    fallbackImage,
  ]);

  const mainImageUrl =
    selectedMedia?.kind === 'image'
      ? selectedMedia.url
      : fallbackImage;

  // =========================================
  // RESET WHEN PRODUCT CHANGES
  // =========================================

  useEffect(() => {

    setSelectedMediaId(null);
    setFailedImageUrl(null);
    setMessage('');
    setShowAuthPopup(false);
    setShowHeart(false);
    setHeartAnimation(0);
    setIsLeaving(false);

  }, [product?.id]);

  // =========================================
  // AUTOMATIC MESSAGE REMOVAL
  // =========================================

  useEffect(() => {

    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage('');
    }, 1800);

    return () => window.clearTimeout(timer);

  }, [message]);

  // =========================================
  // HEART ANIMATION TIMER
  // =========================================

  useEffect(() => {

    if (!heartAnimation) return;

    const timer = window.setTimeout(() => {
      setShowHeart(false);
    }, 850);

    return () => window.clearTimeout(timer);

  }, [heartAnimation]);

  // =========================================
  // DYNAMIC ANIMATED BACK BUTTON
  // =========================================

  const backToHomeButton = (

    <div className="product-detail-topbar">

      <motion.button
        type="button"
        className="product-detail-back"
        onClick={handleBackToHome}
        disabled={isLeaving}
        whileTap={{ scale: 0.94 }}
      >

        <motion.span
          className="back-home-arrow"
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

        <span className="back-home-text">
          Back to {backLabel}
        </span>

      </motion.button>

    </div>

  );

  // =========================================
  // PRODUCT NOT FOUND
  // =========================================

  if (!product) {

    return (

      <section
        className={`product-detail-page ${
          isLeaving ? 'page-leaving' : ''
        }`}
      >

        {backToHomeButton}

        <h1>Product not found</h1>

        <p>This product is no longer available.</p>

      </section>

    );
  }

  const isAvailable = isProductPurchasable(product);

  const saved = isWishlisted(product.id);

  const canIncrease =
    isAvailable && quantity < stockQuantity;

  // =========================================
  // ADD / INCREASE QUANTITY
  // =========================================

  const handleIncrease = () => {

    if (!canIncrease) return;

    const customer = sessionStorage.getItem(
      'silverhub-demo-customer'
    );

    // LOGIN REQUIRED

    if (!customer) {

      sessionStorage.setItem(
        'silverhub-pending-cart',
        String(product.id)
      );

      setAuthPopupType('cart');
      setShowAuthPopup(true);

      return;
    }

    // FIRST ADD TO JEWELLERY BOX

    if (quantity === 0) {

      const added = addToCart(product);

      if (added) {
        setMessage('Added to your Jewellery Box!');
      } else {
        setMessage('Unable to add this product.');
      }

      return;
    }

    // INCREASE EXISTING QUANTITY

    if (canIncrease) {

      const updated = updateQuantity(
        product.id,
        quantity + 1
      );

      if (!updated) {

        setMessage(
          'Maximum available quantity reached.'
        );

      }
    }
  };

  // =========================================
  // DECREASE QUANTITY
  // =========================================

  const handleDecrease = () => {

    if (quantity === 1) {

      removeFromCart(product.id);
      setMessage('');

    } else if (quantity > 1) {

      updateQuantity(
        product.id,
        quantity - 1
      );

    }
  };

  // =========================================
  // WISHLIST LOGIN AND ANIMATION
  // =========================================

  const handleWishlist = () => {

    const customer = sessionStorage.getItem(
      'silverhub-demo-customer'
    );

    if (!customer) {

      sessionStorage.setItem(
        'silverhub-pending-wishlist',
        String(product.id)
      );

      setAuthPopupType('wishlist');
      setShowAuthPopup(true);

      return;
    }

    toggleWishlist(product.id);

    setShowHeart(!saved);

    setHeartAnimation(
      (previous) => previous + 1
    );
  };

  return (

    <section
      className={`product-detail-page ${
        isLeaving ? 'page-leaving' : ''
      }`}
    >

      {/* DYNAMIC BACK BUTTON */}

      {backToHomeButton}

      <article className="product-detail-content">

        {/* =====================================
            PRODUCT MEDIA GALLERY
        ===================================== */}

        <div className="product-detail-gallery">

          <div className="product-detail-image">

            {selectedMedia?.kind === 'video' ? (

              <video
                key={selectedMedia.id}
                src={selectedMedia.url}
                controls
                playsInline
                preload="metadata"
                aria-label={`${product.name} showcase video`}
              >

                Your browser does not support video playback.

              </video>

            ) : mainImageUrl &&
              failedImageUrl !== mainImageUrl ? (

              <img
                src={mainImageUrl}
                alt={
                  selectedMedia?.kind === 'image'
                    ? selectedMedia.name || product.name
                    : product.name
                }
                onError={() =>
                  setFailedImageUrl(mainImageUrl)
                }
              />

            ) : (

              <div
                role="img"
                aria-label={`${product.name} image unavailable`}
              >

                {product.name}

              </div>

            )}

          </div>

          {/* IMAGE AND VIDEO THUMBNAILS */}

          {galleryMedia.length > 1 && (

            <div
              className="product-detail-thumbnails"
              aria-label="Product images and videos"
            >

              {galleryMedia.map((media, index) => (

                <button
                  key={media.id}
                  type="button"
                  className={`product-detail-thumbnail ${
                    selectedMedia?.id === media.id
                      ? 'is-active'
                      : ''
                  } ${
                    media.kind === 'video'
                      ? 'is-video'
                      : ''
                  }`}
                  onClick={() => {

                    setSelectedMediaId(media.id);
                    setFailedImageUrl(null);

                  }}
                  aria-label={
                    media.kind === 'video'
                      ? `View showcase video ${index + 1}`
                      : `View ${media.name || `image ${index + 1}`}`
                  }
                  aria-pressed={
                    selectedMedia?.id === media.id
                  }
                >

                  {media.kind === 'video' ? (

                    <>

                      <video
                        src={media.url}
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                      />

                      <span className="product-detail-video-icon">

                        <PlayCircle size={25} />

                      </span>

                    </>

                  ) : (

                    <img
                      src={media.url}
                      alt=""
                      loading="lazy"
                    />

                  )}

                </button>

              ))}

            </div>

          )}

        </div>

        {/* =====================================
            PRODUCT INFORMATION
        ===================================== */}

        <div className="product-detail-copy">

          <span className="product-detail-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          {product.sku && (

            <p className="product-detail-sku">
              SKU {product.sku}
            </p>

          )}

          <p className="product-detail-rating">
            ★ {product.rating} / 5
          </p>

          {/* PRODUCT PRICE */}

          <div className="product-detail-prices">

            <strong>
              ₹{product.price.toLocaleString('en-IN')}
            </strong>

            {product.oldPrice != null &&
              product.oldPrice > product.price && (

                <del>
                  ₹{product.oldPrice.toLocaleString('en-IN')}
                </del>

            )}

          </div>

          {/* STOCK STATUS */}

          <p
            className={`product-detail-stock ${
              isAvailable ? '' : 'is-unavailable'
            }`}
          >

            {isAvailable
              ? `${stockQuantity} available`
              : 'Currently out of stock'}

          </p>

          {/* =====================================
              CART AND WISHLIST ACTIONS
          ===================================== */}

          <div className="product-detail-actions">

            <AnimatePresence mode="wait">

              {quantity === 0 ? (

                <motion.button
                  key="add-to-box"
                  type="button"
                  className="product-detail-add"
                  onClick={handleIncrease}
                  disabled={!canIncrease}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileTap={{ scale: 0.96 }}
                >

                  <ShoppingBag size={18} />

                  {isAvailable
                    ? 'Add to Jewellery Box'
                    : 'Out of Stock'}

                </motion.button>

              ) : (

                <motion.div
                  key="quantity-counter"
                  className="product-detail-quantity"
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >

                  {/* MINUS BUTTON */}

                  <motion.button
                    type="button"
                    className="product-detail-quantity-btn"
                    onClick={handleDecrease}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Decrease quantity"
                  >

                    <Minus size={19} />

                  </motion.button>

                  {/* QUANTITY VALUE */}

                  <AnimatePresence mode="wait">

                    <motion.span
                      key={quantity}
                      className="product-detail-quantity-value"
                      initial={{
                        opacity: 0,
                        y: -8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: 8,
                      }}
                      transition={{
                        duration: 0.15,
                      }}
                      aria-live="polite"
                    >

                      {quantity}

                    </motion.span>

                  </AnimatePresence>

                  {/* PLUS BUTTON */}

                  <motion.button
                    type="button"
                    className="product-detail-quantity-btn"
                    onClick={handleIncrease}
                    disabled={!canIncrease}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Increase quantity"
                  >

                    <Plus size={19} />

                  </motion.button>

                </motion.div>

              )}

            </AnimatePresence>

            {/* =====================================
                ANIMATED WISHLIST BUTTON
            ===================================== */}

            <motion.button
              type="button"
              className={`product-detail-wishlist ${
                saved ? 'is-saved' : ''
              }`}
              onClick={handleWishlist}
              aria-pressed={saved}
              whileTap={{ scale: 0.95 }}
            >

              {/* ANIMATED HEART ICON */}

              <motion.span
                key={heartAnimation}
                className="product-detail-heart-wrapper"
                initial={{
                  scale: 1,
                  rotate: 0,
                }}
                animate={{
                  scale: heartAnimation > 0
                    ? [1, 1.5, 0.85, 1.15, 1]
                    : 1,

                  rotate: heartAnimation > 0
                    ? [0, -15, 12, -5, 0]
                    : 0,

                  color: saved
                    ? '#D94B64'
                    : '#17283e',
                }}
                transition={{
                  duration: 0.45,
                  ease: 'easeInOut',
                }}
              >

                <Heart
                  size={20}
                  fill={saved ? 'currentColor' : 'none'}
                  strokeWidth={1.8}
                />

                {/* FLOATING HEART ANIMATION */}

                <AnimatePresence>

                  {showHeart && saved && (

                    <motion.span
                      key={`heart-${heartAnimation}`}
                      className="product-detail-heart-pop"
                      initial={{
                        opacity: 1,
                        y: 0,
                        scale: 0.5,
                      }}
                      animate={{
                        opacity: [1, 1, 0],
                        y: -55,
                        scale: [0.5, 1.4, 1.1],
                        rotate: [0, -12, 8],
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.75,
                        ease: 'easeOut',
                      }}
                      aria-hidden="true"
                    >

                      <Heart
                        size={24}
                        fill="currentColor"
                        strokeWidth={1}
                      />

                    </motion.span>

                  )}

                </AnimatePresence>

              </motion.span>

              {/* WISHLIST BUTTON TEXT */}

              <span>

                {saved
                  ? 'Saved to Wishlist'
                  : 'Add to Wishlist'}

              </span>

            </motion.button>

          </div>

          {/* =====================================
              CURRENT QUANTITY INFORMATION
          ===================================== */}

          {quantity > 0 && (

            <div className="product-detail-cart-info">

              <p className="product-detail-added-count">

                <Check size={16} />

                {quantity}{' '}
                {quantity === 1 ? 'item' : 'items'}{' '}
                in your Jewellery Box

              </p>

              <div className="product-detail-total">

                <span>Total Amount</span>

                <strong>

                  ₹{(
                    product.price * quantity
                  ).toLocaleString('en-IN')}

                </strong>

              </div>

              <Link
                to="/cart"
                className="product-detail-view-box"
              >

                <ShoppingBag size={16} />

                View Jewellery Box

              </Link>

            </div>

          )}

          {/* MAXIMUM STOCK MESSAGE */}

          {quantity > 0 && !canIncrease && (

            <p className="product-detail-stock-limit">

              {isAvailable
                ? 'Maximum available quantity reached.'
                : 'This product is currently out of stock.'}

            </p>

          )}

          {/* SUCCESS NOTIFICATION */}

          <AnimatePresence>

            {message && (

              <motion.p
                className="product-detail-message"
                role="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >

                {message}

              </motion.p>

            )}

          </AnimatePresence>

        </div>

      </article>

      {/* =====================================
          LOGIN / SIGNUP POPUP
      ===================================== */}

      <AuthPopup
        open={showAuthPopup}
        type={authPopupType}
        onClose={() => setShowAuthPopup(false)}
      />

    </section>

  );
}