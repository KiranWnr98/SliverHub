
import { useEffect, useState } from "react";
import type { SilverRate } from "../types/silver";

const API_URL = "/.netlify/functions/silver-rate";
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useSilverRate() {
  const [rate, setRate] = useState<SilverRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRate = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Silver API failed: ${response.status}`);
        }

        const data: SilverRate = await response.json();

        if (
          data.price == null ||
          !Number.isFinite(data.price)
        ) {
          throw new Error("Invalid silver rate received");
        }

        if (!cancelled) {
          setRate(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Silver rate currently unavailable"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRate();

    const interval = window.setInterval(
      fetchRate,
      REFRESH_INTERVAL
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return { rate, loading, error };
}
