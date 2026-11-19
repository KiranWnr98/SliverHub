const API_KEY = process.env.METALCHARTS_API_KEY;

const CACHE_DURATION = 6 * 60 * 60 * 1000;
const RETAIL_ADJUSTMENT = 1.35736;

let cachedHistory = null;
let lastFetched = 0;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// Supports ISO dates, Unix seconds and Unix milliseconds
function parseTimestamp(value) {
  if (typeof value === "number") {
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const number = Number(value);
    return number < 1e12 ? number * 1000 : number;
  }

  return Date.parse(value);
}

export const handler = async () => {
  try {
    if (!API_KEY) {
      throw new Error("METALCHARTS_API_KEY is missing");
    }

    const now = Date.now();

    if (
      cachedHistory &&
      now - lastFetched < CACHE_DURATION
    ) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cachedHistory),
      };
    }

    const today = new Date();
    const startDate = new Date(today);

    startDate.setUTCDate(startDate.getUTCDate() - 14);

    const params = new URLSearchParams({
      start: formatDate(startDate),
      end: formatDate(today),
      interval: "1d",
      currency: "INR",
      unit: "kg",
    });

    const url =
      `https://api.metalcharts.org/v1/history/XAG?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "MetalCharts history API:",
        response.status,
        details
      );

      throw new Error(
        `MetalCharts API error ${response.status}: ${details}`
      );
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
      throw new Error(
        "Invalid history response: data array missing"
      );
    }

    const history = result.data
      .map((item) => {
        const timestamp = parseTimestamp(item.timestamp);
        const closePrice = Number(item.close ?? item.price);

        const date = new Date(timestamp);

        return {
          date: formatDate(date),
          timestamp: date.toISOString(),
          price: closePrice * RETAIL_ADJUSTMENT,
        };
      })
      .filter(
        (item) =>
          !Number.isNaN(Date.parse(item.timestamp)) &&
          Number.isFinite(item.price) &&
          item.price > 0
      )
      .sort(
        (a, b) =>
          Date.parse(a.timestamp) - Date.parse(b.timestamp)
      )
      .slice(-5);

    if (history.length === 0) {
      throw new Error("No valid historical silver prices found");
    }

    cachedHistory = {
      currency: "INR",
      unit: "kg",
      purity: 999,
      data: history,
      count: history.length,
      stale: false,
    };

    lastFetched = Date.now();

    console.log("Silver 999 historical data updated:", history);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cachedHistory),
    };

  } catch (error) {
    console.error("Silver history error:", error.message);

    if (cachedHistory) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cachedHistory,
          stale: true,
        }),
      };
    }

    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Historical silver prices unavailable",
        details: error.message,
      }),
    };
  }
};