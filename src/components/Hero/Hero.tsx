
import { useEffect, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import SilverRateWidget from "../SilverRateWidget/SilverRateWidget";
import "./Hero.css";

type HeroProps = {
  price: number | null;
  timestamp: string | null;
  stale?: boolean;
  loading?: boolean;
  error?: string | null;
};

const jewellery = [
  {
    name: "Traditional Silver Jhumkas",
    category: "EARRINGS",
    image: "photo-1535632066927-ab7c9ab60908",
  },
  {
    name: "Elegant Silver Necklace",
    category: "NECKLACES",
    image: "photo-1599643478518-a784e5dc4c8f",
  },
  {
    name: "Classic Silver Ring",
    category: "RINGS",
    image: "photo-1605100804763-247f67b3557e",
  },
  {
    name: "Silver Bracelet",
    category: "BRACELETS",
    image: "photo-1611591437281-460bfbe1220a",
  },
  {
    name: "Silver Collection",
    category: "COLLECTION",
    image: "photo-1617038220319-276d3cfab638",
  },
];

const imageUrl = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=90`;

export default function Hero({
  price,
  timestamp,
  stale = false,
  loading = false,
  error = null,
}: HeroProps) {
  const [active, setActive] = useState(0);

  // Automatic jewellery slideshow
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((previous) => (previous + 1) % jewellery.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  const selectSlide = (index: number) => {
    setActive(index);
  };

  return (
    <section className="sa-hero">

      {/* DYNAMIC FULL-WIDTH BACKGROUND */}
      <div className="sa-hero-background">
        <AnimatePresence mode="sync">
          <motion.img
            key={active}
            src={imageUrl(jewellery[active].image)}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.1,
              ease: "easeInOut",
            }}
          />
        </AnimatePresence>
      </div>

      {/* CREAM BACKGROUND OVERLAY */}
      <div className="sa-hero-overlay" />

      {/* LEFT HERO CONTENT */}
      <div className="sa-hero-content">
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="sa-eyebrow">
            <span />
            TIMELESS ELEGANCE
            <span />
          </div>

          <h1>
            The Art of
            <br />
            <em>Silver Elegance</em>
          </h1>

          <p>
            Discover exquisite silver ornaments crafted
            to make every moment unforgettable.
          </p>

          {/* HERO BUTTONS */}
          <div className="sa-hero-buttons">

            {/* EXPLORE COLLECTION */}
            <a
              href="#collections"
              className="sa-primary-button"
            >
              Explore Collection
              <ArrowRight size={18} />
            </a>

            {/* SHOP NOW - REACT ROUTER NAVIGATION */}
            <Link
              to="/shop"
              className="sa-secondary-button"
            >
              Shop Now
            </Link>

          </div>

          {/* HERO PROGRESS DOTS */}
          <div className="sa-hero-progress">
            {jewellery.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={active === index ? "active" : ""}
                onClick={() => selectSlide(index)}
                aria-label={`Show ${item.name}`}
                aria-pressed={active === index}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* MIDDLE JEWELLERY CAROUSEL */}
      <div className="sa-hero-carousel">
        <div className="sa-carousel-track">
          {jewellery.map((item, index) => {
            let offset =
              (index - active + jewellery.length) % jewellery.length;

            if (offset > jewellery.length / 2) {
              offset -= jewellery.length;
            }

            const distance = Math.abs(offset);

            const scale =
              distance === 0 ? 1.15 :
              distance === 1 ? 0.85 : 0.68;

            const opacity = distance >= 2 ? 0.7 : 1;

            const x = offset * 145;

            return (
              <motion.button
                type="button"
                key={item.name}
                className={`sa-carousel-card ${
                  distance === 0 ? "active" : ""
                }`}
                onClick={() => selectSlide(index)}
                aria-label={`View ${item.name}`}
                aria-pressed={distance === 0}
                style={{
                  "--layer": 10 - distance,
                } as CSSProperties}
                animate={{
                  x,
                  scale,
                  opacity,
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <img
                  src={imageUrl(item.image)}
                  alt={item.name}
                />

                {distance === 0 && (
                  <motion.div
                    className="sa-card-caption"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <small>{item.category}</small>
                    <h3>{item.name}</h3>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* CAROUSEL NAVIGATION */}
        <div className="sa-carousel-dots">
          {jewellery.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={active === index ? "active" : ""}
              onClick={() => selectSlide(index)}
              aria-label={`Select ${item.name}`}
              aria-pressed={active === index}
            />
          ))}
        </div>
      </div>

      {/* RIGHT LIVE SILVER RATE PANEL */}
      <div className="sa-hero-rate">
        <SilverRateWidget
          price={price}
          timestamp={timestamp}
          stale={stale}
        />

        {loading && price === null && (
          <p className="silver-rate-status">
            Fetching today's silver rate...
          </p>
        )}

        {error && price === null && (
          <p className="silver-rate-status">
            Live silver rate is temporarily unavailable.
          </p>
        )}
      </div>

    </section>
  );
}
