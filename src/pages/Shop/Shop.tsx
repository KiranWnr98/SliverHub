
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import ProductCard from '../../components/ProductCard/ProductCard';
import { categories as catalogCategories } from '../../data/categories';
import { useProducts } from '../../hooks/useProducts';
import './Shop.css';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { visibleProducts } = useProducts();
  
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.trim() ?? '';
  const sort = searchParams.get('sort') ?? 'recommended';
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...catalogCategories.map((item) => item.name),
          ...visibleProducts.map((product) => product.category),
        ]),
      ).sort((left, right) => left.localeCompare(right)),
    [visibleProducts],
  );
  const filteredProducts = visibleProducts.filter((product) => {
    const matchesCategory =
      !category || product.category.toLowerCase() === category.toLowerCase();
    const searchableText = [
      product.name,
      product.sku ?? '',
      product.category,
      product.description ?? '',
    ].join(' ').toLowerCase();
    return matchesCategory && searchableText.includes(search.toLowerCase());
  });
  const products = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sort === 'price-low') sorted.sort((left, right) => left.price - right.price);
    if (sort === 'price-high') sorted.sort((left, right) => right.price - left.price);
    if (sort === 'name') sorted.sort((left, right) => left.name.localeCompare(right.name));
    return sorted;
  }, [filteredProducts, sort]);

  const updateQuery = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section className="featured-section">
      <div className="section-heading">
        <h2>{category || 'Shop All Jewellery'}</h2>
        <p>Explore our complete silver jewellery collection.</p>
      </div>
      <div className="shop-catalog-controls">
        <label>
          <span>Search products</span>
          <input
            type="search"
            value={search}
            onChange={(event) => updateQuery('search', event.target.value)}
            placeholder="Name, SKU or category"
            aria-label="Search products by name, SKU or category"
          />
        </label>
        <label>
          <span>Category</span>
          <select
            value={category ?? ''}
            onChange={(event) => updateQuery('category', event.target.value)}
            aria-label="Filter products by category"
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => updateQuery('sort', event.target.value)}
            aria-label="Sort products"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <p className="shop-results-count" role="status">
          Showing {products.length} of {visibleProducts.length} products
        </p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="shop-empty-state">No products match these filters.</p>
      )}
    </section>
  );
}
