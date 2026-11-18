
import { ArrowRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section className="promo-section">
      <div className="promo-content">
        <span>THE BEAUTY OF PURE SILVER</span>
        <h2>Elegance That Lasts Forever</h2>
        <p>Celebrate your special moments with timeless silver jewellery.</p>
        <a href="/collections" className="promo-button">
          Discover More <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
