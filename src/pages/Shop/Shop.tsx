import { useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers3,
  Gem,
  Circle,
  CircleDot,
  Link as LinkIcon,
  Sparkles,
  Footprints,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import ProductCard from '../../components/ProductCard/ProductCard';
import { ProductContext } from '../../context/ProductContextValue';
import { useProducts } from '../../hooks/useProducts';
import './Shop.css';

// Icons are selected by category name. Include singular/plural aliases
// because category names may differ between the catalogue and imported products.
const categoryIcons: Record<string, typeof Gem> = {
  anklet: Footprints,
  anklets: Footprints,
  earring: Sparkles,
  earrings: Sparkles,
  bangle: CircleDot,
  bangles: CircleDot,
  necklace: LinkIcon,
  necklaces: LinkIcon,
  bracelet: LinkIcon,
  bracelets: LinkIcon,
  ring: Circle,
  rings: Circle,
  pendant: Gem,
  pendants: Gem,
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { visibleProducts } = useProducts();
  const productContext = useContext(ProductContext);
  const activeCategories = (productContext?.categories ?? []).filter(
    (item) => item.isActive !== false && item.isDeleted !== true,
  );

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const sort = searchParams.get('sort') ?? 'recommended';

  // Use the same category records managed by the Admin Categories page.
  // Newly added and duplicated categories appear even when they have zero products.
  const categoryOptions = useMemo(
    () =>
      [...activeCategories]
        .sort(
          (left, right) =>
            (left.sortOrder ?? left.id) - (right.sortOrder ?? right.id),
        )
        .map((item) => item.name),
    [activeCategories],
  );

  // Calculate live product counts for each category.
  const categoryCounts = useMemo(
    () =>
      categoryOptions.map((name) => ({
        name,
        count: visibleProducts.filter(
          (product) =>
            product.category.toLowerCase() === name.toLowerCase(),
        ).length,
      })),
    [categoryOptions, visibleProducts],
  );

  // Filter products by selected category and search.
  const filteredProducts = useMemo(
    () =>
      visibleProducts.filter((product) => {
        const matchesCategory =
          !category ||
          product.category.toLowerCase() === category.toLowerCase();

        const searchableText = [
          product.name,
          product.sku ?? '',
          product.category,
          product.description ?? '',
        ]
          .join(' ')
          .toLowerCase();

        return (
          matchesCategory &&
          searchableText.includes(search.toLowerCase())
        );
      }),
    [visibleProducts, category, search],
  );

  // Sort the filtered products.
  const products = useMemo(() => {
    const sorted = [...filteredProducts];

    if (sort === 'price-low') {
      sorted.sort((left, right) => left.price - right.price);
    }

    if (sort === 'price-high') {
      sorted.sort((left, right) => right.price - left.price);
    }

    if (sort === 'name') {
      sorted.sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    }

    return sorted;
  }, [filteredProducts, sort]);

  // Update URL search parameters.
  const updateQuery = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    setSearchParams(nextParams, { replace: true });
  };

  // Clear category and search, but preserve sorting.
  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete('category');
    nextParams.delete('search');

    setSearchParams(nextParams, { replace: true });
  };

  // All Categories dropdown behaviour.
  const handleAllCategories = () => {
    clearFilters();
    setCategoriesExpanded((previous) => !previous);
  };

  const selectedCategoryCount = category
    ? categoryCounts.find(
        (item) =>
          item.name.toLowerCase() === category.toLowerCase(),
      )?.count ?? 0
    : visibleProducts.length;

  return (
    <section className="featured-section shop-page">
      {/* Page heading */}
      <div className="section-heading shop-heading">
        <h2>Shop All Jewellery</h2>

        <div className="shop-heading-decoration">
          <span />
          <Gem size={15} />
          <span />
        </div>

        <p>Explore our complete silver jewellery collection.</p>
      </div>

      <div className="shop-layout">

        {/* LEFT CATEGORY SIDEBAR */}
        <aside className="shop-sidebar">

          <div className="shop-sidebar-heading">
            <Layers3 size={21} />
            <h3>Categories</h3>
          </div>

          <nav
            className="shop-category-list"
            aria-label="Product categories"
          >

            {/* ALL CATEGORIES DROPDOWN */}
            <button
              type="button"
              className={`shop-category-item shop-all-category ${
                !category ? 'is-active' : ''
              }`}
              onClick={handleAllCategories}
              aria-expanded={categoriesExpanded}
            >
              <Layers3 size={19} />

              <span>All Categories</span>

              <span className="shop-category-count">
                {visibleProducts.length}
              </span>

              {categoriesExpanded ? (
                <ChevronUp size={17} className="shop-category-chevron" />
              ) : (
                <ChevronDown size={17} className="shop-category-chevron" />
              )}
            </button>

            {/* EXPANDABLE CATEGORY OPTIONS */}
            {categoriesExpanded && (
              <div className="shop-category-options">
                {categoryCounts.map((item) => {
                  const Icon =
                    categoryIcons[item.name.toLowerCase()] ?? Gem;

                  const active =
                    category.toLowerCase() ===
                    item.name.toLowerCase();

                  return (
                    <button
                      type="button"
                      key={item.name}
                      className={`shop-category-item ${
                        active ? 'is-active' : ''
                      }`}
                      onClick={() =>
                        updateQuery(
                          'category',
                          active ? '' : item.name,
                        )
                      }
                      aria-pressed={active}
                    >
                      <Icon size={19} />

                      <span>{item.name}</span>

                      <span className="shop-category-count">
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          </nav>
        </aside>

        {/* RIGHT PRODUCT CONTENT */}
        <main className="shop-main">

          {/* SEARCH, SORT AND VIEW CONTROLS */}
          <div className="shop-toolbar">

            <p className="shop-results-count" role="status">
              Showing {products.length} of {selectedCategoryCount} products
            </p>

            <div className="shop-toolbar-controls">

              <label className="shop-search-control">
                <Search size={18} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    updateQuery('search', event.target.value)
                  }
                  placeholder="Search products by name or SKU..."
                  aria-label="Search products by name or SKU"
                />
              </label>

              <label className="shop-sort-control">
                <span>Sort by:</span>

                <select
                  value={sort}
                  onChange={(event) =>
                    updateQuery('sort', event.target.value)
                  }
                  aria-label="Sort products"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to high</option>
                  <option value="price-high">Price: High to low</option>
                  <option value="name">Name</option>
                </select>
              </label>

              {/* GRID / LIST TOGGLE */}
              <div className="shop-view-toggle" aria-label="Product view">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid2X2 size={19} />
                </button>

                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List size={19} />
                </button>
              </div>

            </div>
          </div>

          {/* ACTIVE FILTERS */}
          {(category || search) && (
            <div className="shop-active-filters">

              {category && (
                <span>Category: {category}</span>
              )}

              {search && (
                <span>Search: {search}</span>
              )}

              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>

            </div>
          )}

          {/* PRODUCT GRID */}
          {products.length > 0 ? (
            <div
              className={`product-grid shop-product-grid ${
                viewMode === 'list' ? 'is-list-view' : ''
              }`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="shop-empty-state">
              <SlidersHorizontal size={30} />

              <h3>No jewellery found</h3>

              <p>
                Try changing your search or selecting another category.
              </p>

              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

        </main>
      </div>
    </section>
  );
}
