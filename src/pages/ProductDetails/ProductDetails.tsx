
import { useEffect, useMemo, useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const galleryImages = useProductGallery(product?.media);
  const fallbackImage = useProductImage(product?.image ?? '');

  const selectedImage = useMemo(() => {
    return (
      galleryImages.find((image) => image.id === selectedImageId) ??
      galleryImages.find((image) => image.id === product?.primaryMediaId) ??
      galleryImages.find(
        (image) =>
          image.url === fallbackImage ||
          image.id ===
            (product?.image.startsWith('indexeddb:')
              ? product.image.slice('indexeddb:'.length)
              : ''),
      ) ??
      galleryImages[0] ??
      null
    );
  }, [
    galleryImages,
    selectedImageId,
    product?.primaryMediaId,
    product?.image,
    fallbackImage,
  ]);

  const mainImageUrl = selectedImage?.url ?? fallbackImage;

  useEffect(() => {
    setSelectedImageId(null);
    setFailedImageUrl(null);
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
        <div className="product-detail-gallery">
          <div className="product-detail-image">
            {mainImageUrl && failedImageUrl !== mainImageUrl ? (
              <img
                src={mainImageUrl}
                alt={selectedImage?.name || product.name}
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

          {galleryImages.length > 1 && (
            <div
              className="product-detail-thumbnails"
              aria-label="Product images"
            >
              {galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={`product-detail-thumbnail${
                    selectedImage?.id === image.id ? ' is-active' : ''
                  }`}
                  onClick={() => {
                    setSelectedImageId(image.id);
                    setFailedImageUrl(null);
                  }}
                  aria-label={`View ${image.name || `image ${index + 1}`}`}
                  aria-pressed={selectedImage?.id === image.id}
                >
                  <img src={image.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-copy">
          <span className="product-detail-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          {product.sku && (
            <p className="product-detail-sku">SKU {product.sku}</p>
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
            className={`product-detail-stock${
              isAvailable ? '' : ' is-unavailable'
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
              className={`product-detail-wishlist${
                saved ? ' is-saved' : ''
              }`}
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={saved}
            >
              <Heart
                size={18}
                fill={saved ? 'currentColor' : 'none'}
              />
              {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          {message && (
            <p className="product-detail-message" role="status">
              {message}
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
