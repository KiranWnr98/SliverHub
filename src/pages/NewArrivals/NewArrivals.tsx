
import { useMemo, useState } from 'react';
import {
  Layers,
  Gem,
  Footprints,
  Circle,
  Sparkles,
  Link2,
  Search,
  ChevronDown,
} from 'lucide-react';

import ProductCard from '../../components/ProductCard/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { categories } from '../../data/categories';

import './NewArrivals.css';

export default function NewArrivals() {
  const { newArrivals } = useProducts();

  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const categoryIcons: Record<string, React.ElementType> = {
    Anklets: Footprints,
    Bangles: Circle,
    Earrings: Sparkles,
    Necklaces: Link2,
    Rings: Circle,
  };

  const filteredProducts = useMemo(() => {
    let result = [...newArrivals];

    if (selectedCategory !== 'All Categories') {
      result = result.filter(
        (product) =>
          product.category?.toLowerCase() ===
          selectedCategory.toLowerCase(),
      );
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter(
        (product) =>
          product.name?.toLowerCase().includes(search) ||
          product.category?.toLowerCase().includes(search),
      );
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [newArrivals, selectedCategory, searchTerm, sortBy]);

  const getCategoryCount = (categoryName: string) => {
    if (categoryName === 'All Categories') {
      return newArrivals.length;
    }

    return newArrivals.filter(
      (product) =>
        product.category?.toLowerCase() ===
        categoryName.toLowerCase(),
    ).length;
  };

  return (
    <main className="new-arrivals-section">
      {/* PAGE HEADING */}
      <section className="new-arrivals-heading">
        <h1>New Arrivals</h1>

        <div className="new-arrivals-decoration">
          <span />
          <Gem size={18} />
          <span />
        </div>

        
      </section>

      {/* PRODUCTS AREA */}
      <section className="new-arrivals-layout">

        {/* CATEGORY SIDEBAR */}
        <aside className="new-arrivals-sidebar">
          <div className="new-arrivals-sidebar-heading">
            <Layers size={20} />
            <h2>Categories</h2>
          </div>

          <div className="new-arrivals-category-list">
            <button
              type="button"
              className={`new-arrivals-category-item ${
                selectedCategory === 'All Categories' ? 'active' : ''
              }`}
              onClick={() => setSelectedCategory('All Categories')}
            >
              <Layers size={18} />
              <span>All Categories</span>
              <strong>{newArrivals.length}</strong>
            </button>

            {categories.map((category) => {
              const Icon =
                categoryIcons[category.name] ?? Gem;

              return (
                <button
                  type="button"
                  key={category.id}
                  className={`new-arrivals-category-item ${
                    selectedCategory === category.name ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <Icon size={18} />
                  <span>{category.name}</span>
                  <strong>{getCategoryCount(category.name)}</strong>
                </button>
              );
            })}
          </div>
        </aside>

        {/* PRODUCTS CONTENT */}
        <div className="new-arrivals-content">

          {/* TOOLBAR */}
          <div className="new-arrivals-toolbar">
            <p className="new-arrivals-count">
              Showing <strong>{filteredProducts.length}</strong> of{' '}
              <strong>{newArrivals.length}</strong> products
            </p>

            <div className="new-arrivals-controls">
              <div className="new-arrivals-search">
                <Search size={18} />

                <input
                  type="search"
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search new arrivals"
                />
              </div>

              <label className="new-arrivals-sort">
                <span>Sort by:</span>

                <div className="new-arrivals-select">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    aria-label="Sort new arrivals"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>

                  <ChevronDown size={16} />
                </div>
              </label>
            </div>
          </div>

          {/* MOBILE CATEGORY FILTER */}
          <div className="new-arrivals-mobile-categories">
            <button
              type="button"
              className={
                selectedCategory === 'All Categories' ? 'active' : ''
              }
              onClick={() => setSelectedCategory('All Categories')}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={
                  selectedCategory === category.name ? 'active' : ''
                }
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* PRODUCT GRID */}
          {filteredProducts.length > 0 ? (
            <div className="new-arrivals-product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="new-arrivals-empty">
              <Gem size={35} />
              <h3>No new arrivals found</h3>
              <p>
                Try another category or search for a different product.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSearchTerm('');
                  setSortBy('recommended');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
