import type { CSSProperties } from "react";

const particles = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  top: (i * 61) % 100,
  delay: -((i * 0.37) % 12),
  duration: 7 + (i % 8),
  size: 2 + (i % 3),
  drift: `${((i * 17) % 70) - 35}px`,
}));

export default function SparkleBackground() {
  return (
    <div className="sparkle-background" aria-hidden="true">
      {particles.map((particle) => {
        const particleStyle = {
          left: `${particle.left}%`,
          top: `${particle.top}%`,
          animationDelay: `${particle.delay}s`,
          animationDuration: `${particle.duration}s`,
          "--sparkle-size": `${particle.size}px`,
          "--drift": particle.drift,
        } as CSSProperties;

        return (
          <span
            key={particle.id}
            className="silver-sparkle"
            style={particleStyle}
          />
        );
      })}
    </div>
  );
}