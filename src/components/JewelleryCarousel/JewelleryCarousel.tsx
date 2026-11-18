
import { useEffect, useState } from "react";
import "./JewelleryCarousel.css";

const jewellery = [
  {
    name: "Silver Earrings",
    category: "EARRINGS",
    image: "photo-1535632066927-ab7c9ab60908",
  },
  {
    name: "Silver Necklace",
    category: "NECKLACES",
    image: "photo-1599643478518-a784e5dc4c8f",
  },
  {
    name: "Silver Ring",
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
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

export default function JewelleryCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((previous) => (previous + 1) % jewellery.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="jewellery-carousel-section">

      <div className="jewellery-carousel-heading">
        <span>THE BEAUTY OF SILVER</span>
        <h2>Discover Our Silver World</h2>
        <p>Explore jewellery crafted for your timeless elegance</p>
      </div>

      <div className="silver-carousel-stage">

        {/* Dynamic background */}
        <div className="silver-active-background" key={active}>
          <img
            src={imageUrl(jewellery[active].image)}
            alt=""
          />
        </div>

        <div className="silver-carousel">

          {jewellery.map((item, index) => {
            let offset =
              (index - active + jewellery.length) % jewellery.length;

            if (offset > jewellery.length / 2) {
              offset -= jewellery.length;
            }

            const distance = Math.abs(offset);

            const scale =
              distance === 0 ? 1.15 :
              distance === 1 ? 0.78 : 0.55;

            const opacity =
              distance === 2 ? 0.45 : 1;

            return (
              <button
                type="button"
                className={`silver-carousel-item ${
                  distance === 0 ? "active" : ""
                }`}
                key={item.name}
                onClick={() => setActive(index)}
                aria-label={`View ${item.name}`}
                aria-pressed={distance === 0}
                style={{
                  "--offset": offset,
                  "--scale": scale,
                  "--opacity": opacity,
                  "--layer": 10 - distance,
                } as React.CSSProperties}
              >
                <img
                  src={imageUrl(item.image)}
                  alt={item.name}
                />

                {distance === 0 && (
                  <div className="silver-carousel-caption">
                    <small>{item.category}</small>
                    <h3>{item.name}</h3>
                  </div>
                )}
              </button>
            );
          })}

        </div>

        {/* Navigation dots */}
        <div className="silver-carousel-dots">
          {jewellery.map((item, index) => (
            <button
              key={item.name}
              className={active === index ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show ${item.name}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
