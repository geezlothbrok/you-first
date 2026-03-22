import { useState, useEffect } from "react";
import { Pedometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STEPS_CACHE_KEY = "pedometer_steps_cache";
const STEPS_DATE_KEY  = "pedometer_steps_date";

// ─── Steps → km conversion ────────────────────────────────────────────────
// Average stride length ~76.2cm
export const stepsToKm = (steps) => (steps * 0.000762).toFixed(2);

// ─── usePedometer ─────────────────────────────────────────────────────────
// Reads today's step count from the device's built-in pedometer.
// Works in Expo Go on both iOS and Android.
// Falls back to cached value if sensor is unavailable.

export function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    const start = async () => {
      try {
        // Load cached steps immediately (offline-first)
        const cachedSteps = await AsyncStorage.getItem(STEPS_CACHE_KEY);
        const cachedDate  = await AsyncStorage.getItem(STEPS_DATE_KEY);
        const today       = new Date().toDateString();

        if (cachedSteps && cachedDate === today) {
          setSteps(parseInt(cachedSteps, 10));
        }

        // Check if pedometer is available on this device
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);

        if (!available) {
          setIsLoading(false);
          return;
        }

        // Get steps from start of today
        const now       = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        // Get historical steps for today so far
        const { steps: historicalSteps } = await Pedometer.getStepCountAsync(startOfDay, now);
        setSteps(historicalSteps);
        await cacheSteps(historicalSteps);

        // Subscribe to live step updates
        subscription = Pedometer.watchStepCount(async (result) => {
          // result.steps is the count since subscription started
          // Add to historical to get total for the day
          const total = historicalSteps + result.steps;
          setSteps(total);
          await cacheSteps(total);
        });

      } catch (err) {
        console.warn("[Pedometer] Error:", err.message);
        // Fall back to cached value silently
      } finally {
        setIsLoading(false);
      }
    };

    start();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { steps, isAvailable, isLoading };
}

// ─── Cache steps with today's date ───────────────────────────────────────
const cacheSteps = async (steps) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STEPS_CACHE_KEY, steps.toString()),
      AsyncStorage.setItem(STEPS_DATE_KEY, new Date().toDateString()),
    ]);
  } catch {
    // Silent fail
  }
};