
import ProductCard from '../../components/ProductCard/ProductCard';
import { useProducts } from '../../hooks/useProducts';

export default function NewArrivals() {
  const { newArrivals } = useProducts();

  return (
    <section className="new-arrivals-section">
      <div className="section-heading">
        <h2>New Arrivals</h2>
        <p>Discover the latest additions to SilverHub.</p>
      </div>
      <div className="product-grid">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
