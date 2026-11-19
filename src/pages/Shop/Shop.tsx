
import ProductCard from '../../components/ProductCard/ProductCard';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';

export default function Shop() {
  const [searchParams] = useSearchParams();
  const { visibleProducts } = useProducts();
  const category = searchParams.get('category');
  const products = category
    ? visibleProducts.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase(),
      )
    : visibleProducts;

  return (
    <section className="featured-section">
      <div className="section-heading">
        <h2>{category || 'Shop All Jewellery'}</h2>
        <p>Explore our complete silver jewellery collection.</p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && <p>No products are currently available in this category.</p>}
    </section>
  );
}
