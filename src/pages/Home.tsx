
import Hero from '../components/Hero';
import Benefits from '../components/Benefits';
import ProductCard from '../components/ProductCard';
import PromoBanner from '../components/PromoBanner';
import Newsletter from '../components/Newsletter';

import { products } from '../data/products';
import { newArrivals } from '../data/collections';

import { useSilverRate } from '../hooks/useSilverRate';

export default function Home() {
  // Fetch live silver rate from MetalCharts
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

      {/* FEATURED COLLECTION */}
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

          <p>Discover our latest additions to SilverAura</p>
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

      {/* WHY SILVERAURA */}
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
