
import ProductCard from '../../components/ProductCard/ProductCard';
import { products } from '../../data/products';

export default function Shop() {
  return (
    <section className="featured-section">
      <div className="section-heading">
        <h2>Shop All Jewellery</h2>
        <p>Explore our complete silver jewellery collection.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
