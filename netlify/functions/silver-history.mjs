
const API_KEY = process.env.METALCHARTS_API_KEY;

const CACHE_DURATION = 6 * 60 * 60 * 1000;

let cachedHistory = null;
let lastFetched = 0;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export const handler = async () => {
  try {
    if (!API_KEY) {
      console.error("MetalCharts API key missing");

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Historical silver API configuration missing",
        }),
      };
    }

    const now = Date.now();

    // Reuse historical data for six hours
    if (
      cachedHistory &&
      now - lastFetched < CACHE_DURATION
    ) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cachedHistory),
      };
    }

    // Exclude today's potentially incomplete daily candle
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    // Fetch 14 days to account for weekends and market holidays
    const startDate = new Date(yesterday);
    startDate.setUTCDate(startDate.getUTCDate() - 13);

    const params = new URLSearchParams({
      start: formatDate(startDate),
      end: formatDate(yesterday),
      interval: "1d",
      currency: "INR",
      unit: "kg",
    });

    const url =
      `https://api.metalcharts.org/v1/history/XAG?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "MetalCharts history error:",
        response.status,
        details
      );

      if (cachedHistory) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            ...cachedHistory,
            stale: true,
          }),
        };
      }

      return {
        statusCode: 503,
        body: JSON.stringify({
          error: "Historical silver prices unavailable",
        }),
      };
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
      throw new Error("Invalid historical API response");
    }

    // Use actual daily closing prices
    const history = result.data
      .map((item) => ({
        date: formatDate(new Date(item.timestamp)),
        timestamp: item.timestamp,
        price: Number(item.close ?? item.price),
      }))
      .filter(
        (item) =>
          item.timestamp &&
          Number.isFinite(item.price) &&
          !Number.isNaN(Date.parse(item.timestamp))
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp) - new Date(b.timestamp)
      )
      .slice(-5);

    if (history.length === 0) {
      throw new Error("No historical silver prices returned");
    }

    cachedHistory = {
      currency: "INR",
      unit: "kg",
      data: history,
      count: history.length,
      stale: false,
    };

    lastFetched = Date.now();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cachedHistory),
    };

  } catch (error) {
    console.error("Silver history error:", error);

    if (cachedHistory) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ...cachedHistory,
          stale: true,
        }),
      };
    }

    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "Unable to fetch historical silver prices",
      }),
    };
  }
};
