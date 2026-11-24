
import { useEffect, useMemo, useState } from 'react';
import { Heart, ShoppingBag, PlayCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

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

import './ProductDetails.css';

export default function ProductDetails() {
  const { productId } = useParams();
  const { products } = useProductCatalog();

  const product = products.find(
    (item) =>
      item.id === Number(productId) &&
      !item.isDeleted &&
      !item.isHidden &&
      !item.scheduledDeletionAt,
  );

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [message, setMessage] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const galleryMedia = useProductGallery(product?.media);
  const fallbackImage = useProductImage(product?.image ?? '');

  // Always prefer an image as the initial gallery selection.
  // Videos are selectable separately and never become the primary image.
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

  useEffect(() => {
    setSelectedMediaId(null);
    setFailedImageUrl(null);
    setMessage('');
  }, [product?.id]);

  if (!product) {
    return (
      <section className="product-detail-page">
        <Link to="/shop" className="product-detail-back">
          Back to Shop
        </Link>

        <h1>Product not found</h1>
        <p>This product is no longer available.</p>
      </section>
    );
  }

  const isAvailable = isProductPurchasable(product);
  const saved = isWishlisted(product.id);

  return (
    <section className="product-detail-page">
      <Link to="/shop" className="product-detail-back">
        Back to Shop
      </Link>

      <article className="product-detail-content">
        {/* PRODUCT MEDIA GALLERY */}
        <div className="product-detail-gallery">

          {/* Main image or video */}
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
            ) : mainImageUrl && failedImageUrl !== mainImageUrl ? (
              <img
                src={mainImageUrl}
                alt={
                  selectedMedia?.kind === 'image'
                    ? selectedMedia.name || product.name
                    : product.name
                }
                onError={() => setFailedImageUrl(mainImageUrl)}
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

          {/* Image and video thumbnails */}
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
                    selectedMedia?.id === media.id ? 'is-active' : ''
                  } ${
                    media.kind === 'video' ? 'is-video' : ''
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
                  aria-pressed={selectedMedia?.id === media.id}
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

        {/* PRODUCT INFORMATION */}
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

          <p
            className={`product-detail-stock ${
              isAvailable ? '' : 'is-unavailable'
            }`}
          >
            {isAvailable
              ? `${product.stockQuantity ?? 0} available`
              : 'Currently out of stock'}
          </p>

          <p className="product-detail-description">
            {product.description ||
              'A timeless piece selected for the SilverHub collection.'}
          </p>

          {/* CART AND WISHLIST */}
          <div className="product-detail-actions">
            <button
              type="button"
              className="product-detail-add"
              onClick={() => {
                setMessage(
                  addToCart(product)
                    ? 'Added to your Jewellery Box.'
                    : 'This product is currently unavailable.',
                );
              }}
              disabled={!isAvailable}
            >
              <ShoppingBag size={18} />
              Add to Jewellery Box
            </button>

            <button
              type="button"
              className={`product-detail-wishlist ${
                saved ? 'is-saved' : ''
              }`}
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={saved}
            >
              <Heart
                size={18}
                fill={saved ? 'currentColor' : 'none'}
              />

              {saved
                ? 'Saved to Wishlist'
                : 'Add to Wishlist'}
            </button>
          </div>

          {message && (
            <p
              className="product-detail-message"
              role="status"
            >
              {message}
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
