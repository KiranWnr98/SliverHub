const API_KEY = process.env.METALCHARTS_API_KEY;

const CACHE_DURATION = 10 * 60 * 1000;
const RETAIL_ADJUSTMENT = 1.35736;

let cachedRate = null;
let lastFetched = 0;

export const handler = async () => {
  try {
    if (!API_KEY) {
      throw new Error("METALCHARTS_API_KEY is missing");
    }

    const now = Date.now();

    if (cachedRate && now - lastFetched < CACHE_DURATION) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cachedRate),
      };
    }

    // Fetch 999 silver spot price in INR per gram
    const url =
      "https://api.metalcharts.org/v1/prices/?symbols=XAG&currency=INR&unit=g";

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(20000),
    });

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message ||
        result.error ||
        `MetalCharts API error: ${response.status}`
      );
    }

    const silver = result.data?.XAG;
    const price999 = Number(silver?.price);

    if (!Number.isFinite(price999) || price999 <= 0) {
      throw new Error("Invalid silver price from MetalCharts");
    }

    // 999 silver estimated retail rate
    const price999Retail = price999 * RETAIL_ADJUSTMENT;

    cachedRate = {
      price: price999Retail * 1000,
      pricePerGram: price999Retail,
      price999PerGram: price999,
      purity: 999,
      currency: "INR",
      unit: "kg",
      timestamp: silver.timestamp || result.timestamp,
      stale: Boolean(silver.stale || result.isStale),
    };

    lastFetched = Date.now();

    console.log("Silver 999 rate updated:", price999Retail);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cachedRate),
    };

  } catch (error) {
    console.error("MetalCharts silver rate error:", error.message);

    if (cachedRate) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cachedRate,
          stale: true,
        }),
      };
    }

    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Silver rate currently unavailable",
        details: error.message,
      }),
    };
  }
};