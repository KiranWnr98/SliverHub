
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Check } from 'lucide-react';

import type { Product } from '../../types';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [addedCount, setAddedCount] = useState(0);

  const saved = isWishlisted(product.id);

  const handleAddToBox = () => {
    addToCart(product);
    setAddedCount((count) => count + 1);
  };

  return (
    <motion.article
      className="product-card"
      whileHover={{ y: -7 }}
    >
      <div className="product-image">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />

        <span className="sale-label">
          {product.isNew ? 'NEW ARRIVAL' : 'SPECIAL PRICE'}
        </span>

        <button
          type="button"
          className={`product-heart ${saved ? 'saved' : ''}`}
          onClick={() => toggleWishlist(product.id)}
          aria-label="Toggle wishlist"
        >
          <Heart
            size={22}
            fill={saved ? 'currentColor' : 'none'}
          />
        </button>
      </div>

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

        <button
          type="button"
          className={`add-cart-button ${addedCount > 0 ? 'added' : ''}`}
          onClick={handleAddToBox}
        >
          {addedCount > 0 ? (
            <>
              <Check size={18} />
              Added to Box (+{addedCount})
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              Add to Box
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}
