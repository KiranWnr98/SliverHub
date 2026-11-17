
import ProductCard from '../components/ProductCard';
import { newArrivals } from '../data/collections';

export default function NewArrivals() {
  return (
    <section className="new-arrivals-section">
      <div className="section-heading">
        <h2>New Arrivals</h2>
        <p>Discover the latest additions to SilverAura.</p>
      </div>
      <div className="product-grid">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
