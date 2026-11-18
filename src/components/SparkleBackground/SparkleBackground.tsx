import type { CSSProperties } from "react";

const particles = Array.from({ length: 240 }, (_, i) => {
  const random = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  return {
    id: i,
    left: random(i + 1) * 100,
    delay: -(random(i + 2) * 22),
    duration: 9 + random(i + 3) * 14,
    size: 1.5 + random(i + 4) * 4,
    drift: `${(random(i + 5) - 0.5) * 130}px`,
    rotation: `${random(i + 6) * 720}deg`,
    type: i % 11 === 0 ? "flash" : i % 3 === 0 ? "flake" : "dust",
    twinkleDelay: -(random(i + 7) * 5),
  };
});

export default function SparkleBackground() {
  return (
    <div className="sparkle-background" aria-hidden="true">
      {particles.map((particle) => {
        const style = {
          left: `${particle.left}%`,
          "--sparkle-size": `${particle.size}px`,
          "--fall-delay": `${particle.delay}s`,
          "--fall-duration": `${particle.duration}s`,
          "--drift": particle.drift,
          "--spin": particle.rotation,
          "--twinkle-delay": `${particle.twinkleDelay}s`,
        } as CSSProperties;

        return (
          <span
            key={particle.id}
            className={`silver-sparkle silver-${particle.type}`}
            style={style}
          />
        );
      })}
    </div>
  );
}