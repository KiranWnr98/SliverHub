
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3001;

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

const API_KEY = process.env.METALCHARTS_API_KEY;

if (!API_KEY) {
  console.error("MetalCharts API key missing!");
  process.exit(1);
}

let cachedRate = null;
let lastFetched = 0;

const CACHE_DURATION = 4 * 60 * 60 * 1000;

app.get("/api/silver-rate", async (req, res) => {
  try {
    const now = Date.now();

    if (cachedRate && now - lastFetched < CACHE_DURATION) {
      return res.json(cachedRate);
    }

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
      console.error("MetalCharts:", response.status, details);

      return res.status(response.status).json({
        error: "MetalCharts API request failed",
      });
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

    lastFetched = now;

    return res.json(cachedRate);

  } catch (error) {
    console.error("Silver rate error:", error);

    if (cachedRate) {
      return res.json({
        ...cachedRate,
        stale: true,
      });
    }

    return res.status(503).json({
      error: "Silver rate currently unavailable",
    });
  }
});

app.listen(PORT, () => {
  console.log(`SilverAura API running at http://localhost:${PORT}`);
});
