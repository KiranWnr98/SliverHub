
import { useEffect, useState } from "react";

type Props = {
  price: number | null;
  timestamp: string | null;
  stale?: boolean;
};

type HistoryPoint = {
  date: string;
  timestamp: string | number;
  price: number;
};

type HistoryResponse = {
  currency: string;
  unit: string;
  data: HistoryPoint[];
  count: number;
  stale: boolean;
};

const HISTORY_API = "/.netlify/functions/silver-history";

export default function SilverRateWidget({
  price,
  stale = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [grams, setGrams] = useState("10");

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyStale, setHistoryStale] = useState(false);

  const perGram = price !== null ? price / 1000 : 0;
  const weight = Math.max(0, Number(grams) || 0);
  const total = perGram * weight;

  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  // Fetch historical prices when the widget is expanded.
  useEffect(() => {
    if (!expanded) return;

    const controller = new AbortController();

    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch(HISTORY_API, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Historical silver API failed: ${response.status}`
          );
        }
        const result: HistoryResponse = await response.json();

        if (!Array.isArray(result.data) || result.data.length === 0) {
          throw new Error("No historical silver prices available");
        }

        const validHistory = result.data
          .filter(
            (item) =>
              item.date &&
              Number.isFinite(item.price) &&
              item.price > 0
          )
          .slice(-5);

        if (validHistory.length === 0) {
          throw new Error("Invalid historical silver prices");
        }

        if (!controller.signal.aborted) {
          setHistory(validHistory);
          setHistoryStale(Boolean(result.stale));
          setHistoryError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Unable to load silver price history"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    };

    fetchHistory();

    return () => controller.abort();
  }, [expanded]);

  // Calculate chart heights relative to the five prices.
  const prices = history.map((item) => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const firstPrice = history[0]?.price;
  const lastPrice = history[history.length - 1]?.price;

  const priceChange =
    firstPrice && lastPrice
      ? ((lastPrice - firstPrice) / firstPrice) * 100
      : 0;

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
              {/* CURRENT SILVER PRICE */}
              <div className="silver-compact-heading">
                <small>THE SILVER MARKET</small>

                <h2>Today's Silver Price</h2>

                <strong>{money(price)} / KG</strong>

                <p>{money(perGram)} per gram</p>

                {stale && (
                  <p className="silver-compact-warning">
                    Showing the last available rate.
                  </p>
                )}
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

              {/* LAST FIVE TRADING DAYS - 3D LINE CHART */}
              <div className="silver-history-chart">

                <div className="silver-history-heading">
                  <span>LAST 5 TRADING DAYS - SILVER PRICE</span>
                  <span>✧</span>
                </div>

                {historyLoading ? (
                  <p className="silver-history-message">
                    Loading historical silver prices...
                  </p>
                ) : historyError ? (
                  <p className="silver-history-message silver-history-error">
                    {historyError}
                  </p>
                ) : history.length > 0 ? (
                  <>
                    <div className="silver-history-summary">
                      <span>5-day price movement</span>

                      <strong
                        className={
                          priceChange >= 0
                            ? "silver-history-up"
                            : "silver-history-down"
                        }
                      >
                        {priceChange >= 0 ? "+" : ""}
                        {priceChange.toFixed(2)}%
                      </strong>
                    </div>

                    <div className="silver-3d-chart">

                      <svg
                        viewBox="0 0 340 155"
                        className="silver-3d-svg"
                        role="img"
                        aria-label="Silver price history over the last five trading days"
                      >
                        <defs>
                          <linearGradient
                            id="silverGoldLine"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#f8df9e" />
                            <stop offset="50%" stopColor="#c99a4e" />
                            <stop offset="100%" stopColor="#8f652e" />
                          </linearGradient>

                          <linearGradient
                            id="silverAreaFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#c99a4e"
                              stopOpacity="0.30"
                            />
                            <stop
                              offset="100%"
                              stopColor="#c99a4e"
                              stopOpacity="0.01"
                            />
                          </linearGradient>

                          <filter
                            id="silverGlow"
                            x="-100%"
                            y="-100%"
                            width="300%"
                            height="300%"
                          >
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* BACKGROUND GRID */}
                        {[30, 65, 100].map((y) => (
                          <line
                            key={y}
                            x1="12"
                            y1={y}
                            x2="328"
                            y2={y}
                            stroke="#e9dfd0"
                            strokeDasharray="4 5"
                            strokeWidth="1"
                          />
                        ))}

                        {/* AREA UNDER THE LINE */}
                        <polygon
                          points={[
                            `${history.map((item, index) => {
                              const x = 18 + index * 76;
                              const normalized =
                                priceRange === 0
                                  ? 0.5
                                  : (item.price - minPrice) / priceRange;

                              const y = 105 - normalized * 70;
                              return `${x},${y}`;
                            }).join(" ")}`,
                            "322,125 18,125",
                          ].join(" ")}
                          fill="url(#silverAreaFill)"
                        />

                        {/* SHADOW LINE FOR DEPTH */}
                        <polyline
                          points={history.map((item, index) => {
                            const x = 18 + index * 76;
                            const normalized =
                              priceRange === 0
                                ? 0.5
                                : (item.price - minPrice) / priceRange;

                            const y = 105 - normalized * 70;

                            return `${x + 2},${y + 5}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#7c5528"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.22"
                        />

                        {/* MAIN GOLD LINE */}
                        <polyline
                          points={history.map((item, index) => {
                            const x = 18 + index * 76;
                            const normalized =
                              priceRange === 0
                                ? 0.5
                                : (item.price - minPrice) / priceRange;

                            const y = 105 - normalized * 70;

                            return `${x},${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="url(#silverGoldLine)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#silverGlow)"
                        />

                        {/* PRICE POINTS */}
                        {history.map((item, index) => {
                          const x = 18 + index * 76;
                          const normalized =
                            priceRange === 0
                              ? 0.5
                              : (item.price - minPrice) / priceRange;

                          const y = 105 - normalized * 70;

                          return (
                            <g key={`${item.date}-${index}`}>
                              <title>
                                {formatDate(item.date)}: {money(item.price)} per kg
                              </title>

                              <circle
                                cx={x}
                                cy={y}
                                r="9"
                                fill="#c99a4e"
                                opacity="0.18"
                              />

                              <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#fff"
                                stroke="#bd8c43"
                                strokeWidth="3"
                              />

                              <circle
                                cx={x}
                                cy={y}
                                r="2"
                                fill="#bd8c43"
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* PRICE LABELS AND DATES */}
                      <div className="silver-3d-labels">
                        {history.map((item, index) => (
                          <div
                            className="silver-3d-label"
                            key={`${item.date}-${index}`}
                          >
                            <strong>{money(item.price)}</strong>
                            <small>{formatDate(item.date)}</small>
                          </div>
                        ))}
                      </div>

                    </div>

                    <p className="silver-history-unit">
                      Historical daily closing price · INR / KG
                    </p>

                    {historyStale && (
                      <p className="silver-compact-warning">
                        Showing previously cached historical prices.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="silver-history-message">
                    No historical prices available.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p>Silver rate is currently unavailable.</p>
          )}
        </div>
      )}
    </section>
  );
}

