import { useEffect, useRef, useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Notifications from "expo-notifications";

const FREE_FALL_THRESHOLD = 0.4;
const IMPACT_THRESHOLD    = 2.5;
const FALL_WINDOW_MS      = 1000;
const RESPONSE_WINDOW_MS  = 30000;
const COOLDOWN_MS         = 10000;

const getMagnitude = ({ x, y, z }) => Math.sqrt(x * x + y * y + z * z);

const fireFallNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Fall Detected!",
        body: "It looks like you may have fallen. Tap to confirm you're okay — SOS triggers in 30 seconds.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "FALL_DETECTED",
        ...(Platform.OS === "ios" && {
          interruptionLevel: "critical",
          sound: "default",
        }),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn("Fall notification error:", err);
  }
};

export async function registerFallNotificationCategory() {
  await Notifications.setNotificationCategoryAsync("FALL_DETECTED", [
    {
      identifier: "IM_OKAY_FALL",
      buttonTitle: "✅ I'm Okay",
      options: { opensAppToForeground: true },
    },
  ]);
}

export function useFallDetector({ onFallDetected, onSOSTrigger, userName, enabled = true }) {
  const freeFallTime  = useRef(null);
  const lastFallTime  = useRef(null);
  const responseTimer = useRef(null);
  const alertShowing  = useRef(false);
  const subscription  = useRef(null);
  const [fallDetected, setFallDetected] = useState(false);

  const handleFall = useCallback(() => {
    if (alertShowing.current) return;
    alertShowing.current = true;
    setFallDetected(true);
    onFallDetected?.();

    // Critical notification — bypasses silent/DND
    fireFallNotification();

    // In-app alert
    Alert.alert(
      "⚠️ Fall Detected",
      `It looks like you may have fallen.\n\nAre you okay? SOS will be sent to ALL your contacts in 30 seconds if you don't respond.`,
      [
        {
          text: "✅ I'm Okay",
          style: "default",
          onPress: () => {
            clearTimeout(responseTimer.current);
            alertShowing.current = false;
            setFallDetected(false);
          },
        },
      ],
      { cancelable: false }
    );

    responseTimer.current = setTimeout(() => {
      alertShowing.current = false;
      setFallDetected(false);
      onSOSTrigger?.(userName);
    }, RESPONSE_WINDOW_MS);

  }, [onFallDetected, onSOSTrigger, userName]);

  // Listen for "I'm Okay" from notification action button
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier === "IM_OKAY_FALL") {
        clearTimeout(responseTimer.current);
        alertShowing.current = false;
        setFallDetected(false);
      }
    });
    return () => sub.remove();
  }, []);

  const handleAccelerometer = useCallback(({ x, y, z }) => {
    if (!enabled || alertShowing.current) return;
    const magnitude = getMagnitude({ x, y, z });
    const now = Date.now();

    if (lastFallTime.current && now - lastFallTime.current < COOLDOWN_MS) return;

    if (magnitude < FREE_FALL_THRESHOLD) {
      freeFallTime.current = now;
      return;
    }

    if (
      freeFallTime.current &&
      magnitude > IMPACT_THRESHOLD &&
      now - freeFallTime.current <= FALL_WINDOW_MS
    ) {
      freeFallTime.current = null;
      lastFallTime.current = now;
      handleFall();
    }
  }, [enabled, handleFall]);

  const startDetecting = useCallback(() => {
    Accelerometer.setUpdateInterval(100);
    subscription.current = Accelerometer.addListener(handleAccelerometer);
  }, [handleAccelerometer]);

  const stopDetecting = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
    clearTimeout(responseTimer.current);
    alertShowing.current = false;
  }, []);

  useEffect(() => {
    if (enabled) startDetecting();
    else stopDetecting();
    return () => stopDetecting();
  }, [enabled, startDetecting, stopDetecting]);

  return { fallDetected, startDetecting, stopDetecting };
}