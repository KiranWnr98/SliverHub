import { useContext } from 'react';
import { ArrowRight, Star } from 'lucide-react';

import Hero from '../../components/Hero/Hero';
import Benefits from '../../components/Benefits/Benefits';
import ProductCard from '../../components/ProductCard/ProductCard';
import PromoBanner from '../../components/PromoBanner/PromoBanner';
import Newsletter from '../../components/Newsletter/Newsletter';

import { ProductContext } from '../../context/ProductContextValue';
import { useSilverRate } from '../../hooks/useSilverRate';
import { useProducts } from '../../hooks/useProducts';

export default function Home() {
  const { products, newArrivals } = useProducts();
  const productContext = useContext(ProductContext);

  // Only categories that are active, visible, and marked as featured
  // in Admin > Categories are displayed in this section.
  const featuredCategories = (productContext?.categories ?? [])
    .filter(
      (category) =>
        category.isActive !== false &&
        category.isDeleted !== true &&
        category.isFeatured === true,
    )
    .sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

  // Count active products assigned to each category.
  // ProductContext.products is used so this count is not limited
  // to only the featured products returned by useProducts().
  const getCategoryProductCount = (categoryName: string) =>
    (productContext?.products ?? []).filter(
      (product) =>
        product.category === categoryName &&
        product.isDeleted !== true,
    ).length;

  // Fetch live silver rate from MetalCharts.
  const { rate, loading, error } = useSilverRate();

  return (
    <>
      {/* HERO WITH LIVE SILVER RATE */}
      <Hero
        price={rate?.price ?? null}
        timestamp={rate?.timestamp ?? null}
        stale={rate?.stale ?? false}
        loading={loading}
        error={error}
      />

      {/* BENEFITS SECTION */}
      <Benefits />

      {/* FEATURED CATEGORIES — MANAGED FROM ADMIN */}
      {featuredCategories.length > 0 && (
        <section
          className="featured-categories-section"
          id="featured-categories"
          aria-labelledby="featured-categories-title"
        >
          <div className="featured-categories-heading">
            <div className="featured-eyebrow">
              <span aria-hidden="true" />
              <span>CURATED FOR YOU</span>
              <span aria-hidden="true" />
            </div>

            <h2 id="featured-categories-title">Featured Categories</h2>

            <p>
              Explore our handpicked silver jewellery collections.
            </p>
          </div>

          <div className="featured-category-grid">
            {featuredCategories.map((category) => (
              <article
                className="featured-category-card"
                key={category.id}
              >
                <a
                  className="featured-category-link"
                  href={`/shop?category=${encodeURIComponent(category.name)}`}
                  aria-label={`Explore ${category.name}`}
                >
                  <div className="featured-category-image">
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                    />

                    <span className="featured-category-badge">
                      <Star size={13} fill="currentColor" aria-hidden="true" />
                      Featured
                    </span>

                    <div className="featured-category-overlay">
                      <span>Explore Collection</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </div>
                  </div>

                  <div className="featured-category-info">
                    <div>
                      <h3>{category.name}</h3>
                      <p>{category.subtitle}</p>
                      <span>
                        {getCategoryProductCount(category.name)} Products
                      </span>
                    </div>

                    <div
                      className="featured-category-arrow"
                      aria-hidden="true"
                    >
                      <ArrowRight size={19} />
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="featured-section" id="collections">
        <div className="section-heading">
          <div className="heading-title">
            <span />
            <h2>Our Featured Collection</h2>
            <span />
          </div>

          <p>Discover jewellery that speaks your style</p>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section
        className="new-arrivals-section"
        id="new-arrivals"
      >
        <div className="section-heading">
          <div className="heading-title">
            <span />
            <h2>Just Arrived</h2>
            <span />
          </div>

          <p>Discover our latest additions to SilverHub</p>
        </div>

        <div className="product-grid">
          {newArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>

      {/* PROMOTIONAL BANNER */}
      <PromoBanner />

      {/* WHY SILVERHUB */}
      <section className="why-section" id="about">
        <div className="section-heading">
          <div className="heading-title">
            <span />
            <h2>Why SILVERHUB?</h2>
            <span />
          </div>

          <p>
            More than jewellery, a promise of elegance and trust.
          </p>
        </div>

        <div className="why-grid">
          <div>
            <h3>Pure Silver</h3>
            <p>Beautifully selected silver jewellery.</p>
          </div>

          <div>
            <h3>Quality Assured</h3>
            <p>Carefully checked for quality and finish.</p>
          </div>

          <div>
            <h3>Reliable Delivery</h3>
            <p>Convenient delivery across India.</p>
          </div>

          <div>
            <h3>Made with Love</h3>
            <p>Designed to make every occasion special.</p>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="reviews-section">
        <div className="section-heading">
          <div className="heading-title">
            <span />
            <h2>Customer Love</h2>
            <span />
          </div>

          <p>
            Beautiful moments deserve beautiful jewellery.
          </p>
        </div>

        <div className="reviews-grid">
          {[
            'Beautiful design and lovely finishing. I absolutely love it!',
            'The jewellery looks elegant and the packaging was lovely.',
            'A beautiful collection for gifting and special occasions.',
          ].map((review, index) => (
            <article key={index}>
              <div className="review-stars">★★★★★</div>
              <p>"{review}"</p>
              <h4>Sample Customer</h4>
            </article>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <Newsletter />
    </>
  );
}
