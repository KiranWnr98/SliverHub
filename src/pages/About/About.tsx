
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gem,
  ShieldCheck,
  Heart,
  Truck,
  RefreshCw,
  Sparkles,
  Award,
} from 'lucide-react';

import './About.css';

const values = [
  {
    icon: <Gem />,
    title: 'Timeless Design',
    description:
      'Elegant jewellery designed to complement everyday moments and special occasions.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Quality Assured',
    description:
      'We focus on thoughtful designs, attention to detail and quality you can trust.',
  },
  {
    icon: <Heart />,
    title: 'Made with Care',
    description:
      'Every piece is selected with an appreciation for beauty, detail and individuality.',
  },
];

const benefits = [
  {
    icon: <Award />,
    title: 'Thoughtful Craftsmanship',
    description: 'Beautiful details and carefully selected designs.',
  },
  {
    icon: <Truck />,
    title: 'Free Shipping',
    description: 'Convenient delivery across India.',
  },
  {
    icon: <RefreshCw />,
    title: 'Easy Returns',
    description: 'Hassle-free returns within 7 days.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Customer First',
    description: 'A shopping experience built around your needs.',
  },
];

export default function About() {
  return (
    <main className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-eyebrow">
            <span />
            THE STORY OF SILVERHUB
            <span />
          </span>

          <h1>Where Elegance Meets Everyday Beauty</h1>

          <div className="about-heading-decoration">
            <span />
            <Gem size={19} />
            <span />
          </div>

          <p>
            Discover the beauty of thoughtfully selected silver
            jewellery, created to make every moment feel special.
          </p>

          <Link to="/shop" className="about-gold-button">
            Explore Our Jewellery
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* STORY */}
      <section className="about-story">
        <div className="about-story-image">
          <img
            src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1100&q=85"
            alt="Elegant jewellery details"
          />
          <div className="about-image-caption">
            <Sparkles size={16} />
            Elegance in Every Detail
          </div>
        </div>

        <div className="about-story-content">
          <span className="about-section-eyebrow">
            GET TO KNOW US
          </span>

          <h2>Our Story</h2>

          <div className="about-small-divider">
            <span />
            <Gem size={15} />
            <span />
          </div>

          <p>
            At SilverHub, we celebrate the beauty of silver through
            elegant jewellery designs that bring together timeless
            style and modern expression.
          </p>

          <p>
            We believe jewellery is more than an accessory. It is
            a reflection of personality, memories and the moments
            that matter.
          </p>

          <p>
            Our goal is to make discovering beautiful jewellery
            simple, enjoyable and memorable.
          </p>

          <Link to="/collections" className="about-text-link">
            Discover Our Collections
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* MISSION */}
      <section className="about-mission">
        <span className="about-section-eyebrow">
          WHAT WE BELIEVE
        </span>

        <h2>Our Promise</h2>

        <div className="about-small-divider">
          <span />
          <Gem size={15} />
          <span />
        </div>

        <p>
          We aim to deliver quality, style and a memorable shopping
          experience through thoughtfully selected jewellery and
          customer-focused service.
        </p>
      </section>

      {/* VALUES */}
      <section className="about-values">
        <div className="about-section-heading">
          <span className="about-section-eyebrow">
            THE SILVERHUB DIFFERENCE
          </span>

          <h2>What Makes Us Special</h2>

          <p>
            The values behind every SilverHub experience.
          </p>
        </div>

        <div className="about-values-grid">
          {values.map((value) => (
            <article className="about-value-card" key={value.title}>
              <div className="about-value-icon">
                {value.icon}
              </div>

              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="about-benefits">
        <div className="about-section-heading">
          <span className="about-section-eyebrow">
            WHY SHOP WITH US
          </span>

          <h2>The SilverHub Experience</h2>

          <p>
            Thoughtful service and beautiful details at every step.
          </p>
        </div>

        <div className="about-benefits-grid">
          {benefits.map((benefit) => (
            <article className="about-benefit" key={benefit.title}>
              <div className="about-benefit-icon">
                {benefit.icon}
              </div>

              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-cta-content">
          <span>YOUR STYLE. YOUR STORY.</span>

          <h2>Find Something Beautiful</h2>

          <p>
            Explore our jewellery collection and discover pieces
            that feel uniquely yours.
          </p>

          <Link to="/shop" className="about-gold-button">
            Shop SilverHub
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

    </main>
  );
}
