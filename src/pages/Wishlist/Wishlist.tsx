
import ProductCard from '../../components/ProductCard/ProductCard';
import { useWishlist } from '../../context/useWishlist';
import { useProducts } from '../../hooks/useProducts';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { visibleProducts } = useProducts();

  const savedProducts = visibleProducts.filter((product) =>
    wishlist.includes(product.id),
  );

  return (
    <section className="featured-section">
      <div className="section-heading">
        <h2>Your Wishlist</h2>
        <p>Your favourite silver jewellery in one place.</p>
      </div>

      {savedProducts.length === 0 ? (
        <p>You haven't added any products to your wishlist yet.</p>
      ) : (
        <div className="product-grid">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showCartControls={false}
            />
          ))}
        </div>
      )}
    </section>
  );
}
