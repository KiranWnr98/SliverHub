
import { useState } from "react";

type Props = {
  price: number | null;
  timestamp: string | null;
  stale?: boolean;
};

export default function SilverRateWidget({
  price,
  stale = false,
}: Props) {
  // Start collapsed whenever the website loads.
  const [expanded, setExpanded] = useState(false);
  const [grams, setGrams] = useState("10");

  const perGram = price !== null ? price / 1000 : 0;
  const weight = Math.max(0, Number(grams) || 0);
  const total = perGram * weight;

  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const chart = [1, 10, 100, 500, 1000];

  return (
    <section
      className={`silver-compact ${
        expanded ? "is-expanded" : "is-collapsed"
      }`}
    >
      {/* COMPACT LIVE RATE BAR */}
      <button
        type="button"
        className="silver-compact-trigger"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        aria-controls="silver-calculator-panel"
      >
        <span className="silver-compact-icon">⌁</span>

        <span className="silver-compact-info">
          <small>LIVE SILVER RATE</small>
          <strong>
            {price !== null
              ? `${money(perGram)} / g`
              : "Rate unavailable"}
          </strong>
        </span>

        <span className="silver-compact-graph">▁▃▅▇</span>

        <span className="silver-compact-arrow">
          {expanded ? "⌃" : "⌄"}
        </span>
      </button>

      {/* EXPANDABLE CALCULATOR */}
      {expanded && (
        <div
          id="silver-calculator-panel"
          className="silver-compact-panel"
        >
          {price !== null ? (
            <>
              {/* SILVER PRICE */}
              <div className="silver-compact-heading">
                <small>THE SILVER MARKET</small>

                <h2>Today's Silver Price</h2>

                <strong>{money(price)} / KG</strong>

                <p>{money(perGram)} per gram</p>
              </div>

              {/* WEIGHT CALCULATOR */}
              <div className="silver-compact-calculator">
                <label htmlFor="silver-weight">
                  Enter weight in grams
                </label>

                <div className="silver-compact-input">
                  <input
                    id="silver-weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                  />

                  <span>GRAMS</span>
                </div>

                {/* WEIGHT PRESETS */}
                <div className="silver-compact-presets">
                  {[1, 5, 10, 20, 50, 100].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={weight === n ? "selected" : ""}
                      onClick={() => setGrams(String(n))}
                    >
                      {n}g
                    </button>
                  ))}
                </div>

                {/* TOTAL VALUE */}
                <div className="silver-compact-total">
                  <small>YOUR SILVER VALUE</small>
                  <strong>{money(total)}</strong>
                </div>
              </div>

              {/* PRICE GRAPH */}
              <div className="silver-mini-chart">
                <div className="silver-mini-chart-title">
                  <span>WEIGHT PRICE GRAPH</span>
                  <span>✧</span>
                </div>

                <div className="silver-mini-bars">
                  {chart.map((g) => (
                    <div className="silver-mini-column" key={g}>
                      <div className="silver-mini-track">
                        <div
                          className="silver-mini-bar"
                          style={{
                            height: `${(g / 1000) * 100}%`,
                          }}
                        />
                      </div>

                      <small>
                        {g >= 1000 ? "1kg" : `${g}g`}
                      </small>

                      <small className="silver-chart-price">
                        {money(perGram * g)}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {/* STALE RATE WARNING */}
              {stale && (
                <p className="silver-compact-warning">
                  Showing the last available rate.
                </p>
              )}
            </>
          ) : (
            <p>Silver rate is currently unavailable.</p>
          )}
        </div>
      )}
    </section>
  );
}
