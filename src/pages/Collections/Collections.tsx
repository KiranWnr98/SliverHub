
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gem,
  ShieldCheck,
  Truck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import { categories } from '../../data/categories';
import CategoryCard from '../../components/CategoryCard/CategoryCard';
import './Collections.css';

const curatedCollections = [
  {
    title: 'Everyday Elegance',
    description: 'Minimal, versatile pieces for your daily style.',
    category: 'Earrings',
  },
  {
    title: 'Traditional Classics',
    description: 'Beautiful traditional designs with timeless charm.',
    category: 'Bangles',
  },
  {
    title: 'Modern Minimal',
    description: 'Sleek and contemporary pieces for a refined look.',
    category: 'Rings',
  },
];

export default function Collections() {
  const findCategory = (name: string) =>
    categories.find(
      (category) =>
        category.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

  const featuredCategory =
    categories.find((category) =>
      category.name.toLowerCase().includes('necklace'),
    ) ?? categories[0];

  return (
    <main className="collections-page">

      {/* PAGE INTRODUCTION */}
      <section className="collections-hero">
        <span className="collections-eyebrow">
          <span />
          COLLECTIONS
          <span />
        </span>

        <h1>Our Collections</h1>

        <div className="collections-heading-decoration">
          <span />
          <Gem size={19} />
          <span />
        </div>

        <p>
          Discover thoughtfully curated silver jewellery for every
          style, occasion and you.
        </p>
      </section>

      {/* FEATURED COLLECTION */}
      {featuredCategory && (
        <section className="collections-featured">

          <div className="collections-featured-content">
            <span className="featured-label">
              <Sparkles size={15} />
              Featured Collection
            </span>

            <h2>Silver Elegance</h2>

            <p>
              Discover beautiful silver jewellery that brings
              together timeless tradition and modern grace.
            </p>

            <Link
              to={`/shop?category=${encodeURIComponent(
                featuredCategory.name,
              )}`}
              className="collections-gold-button"
            >
              Shop the Collection
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="collections-featured-image">
            <img
              src={featuredCategory.image}
              alt="Silver jewellery from the SilverHub featured collection"
              loading="eager"
            />
          </div>

        </section>
      )}

      {/* EXPLORE CATEGORIES */}
      <section className="collections-categories">

        <div className="collections-section-title">
          <span />
          <h2>Explore by Category</h2>
          <span />
        </div>

        <p className="collections-section-subtitle">
          Find the perfect piece that reflects your style.
        </p>

        <div className="collections-category-grid">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
            />
          ))}
        </div>

      </section>

      {/* FEATURED COLLECTIONS */}
      <section className="curated-collections">

        <div className="collections-section-title">
          <span />
          <h2>Featured Collections</h2>
          <span />
        </div>

        <p className="collections-section-subtitle">
          Handpicked styles for every occasion and personality.
        </p>

        <div className="curated-collections-grid">

          {curatedCollections.map((collection) => {
            const category = findCategory(collection.category);

            // Skip a collection if its category does not exist.
            if (!category) return null;

            const shopLink = `/shop?category=${encodeURIComponent(
              category.name,
            )}`;

            return (
              <article
                className="curated-collection-card"
                key={collection.title}
              >
                <Link
                  to={shopLink}
                  className="curated-collection-image"
                  aria-label={`Explore ${collection.title}`}
                >
                  <img
                    src={category.image}
                    alt={collection.title}
                    loading="lazy"
                  />

                  <span className="curated-image-arrow">
                    <ArrowRight size={20} />
                  </span>
                </Link>

                <div className="curated-collection-content">
                  <h3>{collection.title}</h3>

                  <p>{collection.description}</p>

                  <Link
                    to={shopLink}
                    className="curated-shop-link"
                  >
                    Shop Now
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}

        </div>
      </section>

      {/* SILVERHUB PROMISE */}
      <section className="collections-benefits">

        <div className="collections-benefits-heading">
          <span className="collections-benefits-eyebrow">
            WHY SILVERHUB
          </span>

          <h2>The SilverHub Promise</h2>

          <p>
            Thoughtful designs, trusted quality and lasting elegance.
          </p>
        </div>

        <div className="collections-benefits-grid">

          <div className="collections-benefit">
            <ShieldCheck />
            <h3>Quality Assured</h3>
            <p>
              Carefully selected jewellery and trusted quality.
            </p>
          </div>

          <div className="collections-benefit">
            <Gem />
            <h3>Exquisite Craftsmanship</h3>
            <p>
              Beautiful details and elegant designs.
            </p>
          </div>

          <div className="collections-benefit">
            <Truck />
            <h3>Free Shipping</h3>
            <p>
              Convenient delivery across India.
            </p>
          </div>

          <div className="collections-benefit">
            <RefreshCw />
            <h3>Easy Returns</h3>
            <p>
              Hassle-free returns within 7 days.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL SHOPPING CTA */}
      <section className="collections-final-cta">

        <div className="collections-final-cta-content">
          <span>THE SILVERHUB EXPERIENCE</span>

          <h2>Explore the Complete Collection</h2>

          <p>
            From everyday essentials to statement pieces, find
            your perfect silver jewellery at SilverHub.
          </p>

          <Link
            to="/shop"
            className="collections-gold-button"
          >
            Shop All Collections
            <ArrowRight size={17} />
          </Link>
        </div>

      </section>

    </main>
  );
}
