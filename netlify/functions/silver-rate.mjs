
const API_KEY = process.env.METALCHARTS_API_KEY;

const CACHE_DURATION = 4 * 60 * 60 * 1000;

let cachedRate = null;
let lastFetched = 0;

export const handler = async () => {
  try {
    if (!API_KEY) {
      console.error("MetalCharts API key missing");

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Silver rate configuration missing",
        }),
      };
    }

    const now = Date.now();

    // Return cached rate if it is still valid
    if (cachedRate && now - lastFetched < CACHE_DURATION) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cachedRate),
      };
    }

    // Fetch live silver rate
    const response = await fetch(
      "https://api.metalcharts.org/v1/prices?symbols=XAG&currency=INR&unit=kg",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const details = await response.text();

      console.error("MetalCharts API:", response.status, details);

      if (cachedRate) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            ...cachedRate,
            stale: true,
          }),
        };
      }

      return {
        statusCode: 503,
        body: JSON.stringify({
          error: "MetalCharts API request failed",
        }),
      };
    }

    const result = await response.json();
    const silver = result?.data?.XAG;

    if (!silver || !Number.isFinite(silver.price)) {
      throw new Error("Invalid MetalCharts response");
    }

    cachedRate = {
      price: silver.price,
      timestamp: silver.timestamp || result.timestamp,
      stale: Boolean(silver.stale || result.isStale),
    };

    lastFetched = Date.now();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cachedRate),
    };

  } catch (error) {
    console.error("Silver rate error:", error);

    if (cachedRate) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ...cachedRate,
          stale: true,
        }),
      };
    }

    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "Silver rate currently unavailable",
      }),
    };
  }
};
