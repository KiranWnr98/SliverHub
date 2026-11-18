
import { ArrowRight } from 'lucide-react';

export default function Newsletter() {
  return (
    <section className="newsletter-section">
      <div>
        <span>STAY CONNECTED</span>
        <h2>A Little Silver Inspiration</h2>
        <p>Subscribe to hear about new collections and special offers.</p>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        alert('Newsletter integration will be connected soon!');
      }}>
        <input
          type="email"
          placeholder="Enter your email address"
          required
        />
        <button type="submit">
          Subscribe <ArrowRight size={17} />
        </button>
      </form>
    </section>
  );
}
