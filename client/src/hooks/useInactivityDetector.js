import { useEffect, useRef, useCallback, useState } from "react";
import { AppState, Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const CHECK_INTERVAL_MS   = 60 * 1000;       // check every 60 seconds
const RESPONSE_WINDOW_MS  = 60 * 1000;       // 60 seconds to respond
const LAST_ACTIVE_KEY     = "last_activity_timestamp";

// ─── Fire critical "Are you okay?" notification ───────────────────────────
// This fires even on silent/DND because of criticalAlert (iOS)
// and max priority (Android)
const fireAreYouOkayNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🆘 Are You Okay?",
        body: "You haven't used your phone in over an hour. Tap to confirm you're safe — SOS will trigger in 60 seconds.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "ARE_YOU_OKAY", // for action buttons
        ...(Platform.OS === "ios" && {
          interruptionLevel: "critical", // bypasses DND + silent on iOS 15+
          sound: "default",
        }),
      },
      trigger: null, // immediate
    });
  } catch (err) {
    console.warn("Inactivity notification error:", err);
  }
};

// ─── Register notification category with "I'm Okay" action button ────────
export async function registerNotificationCategories() {
  await Notifications.setNotificationCategoryAsync("ARE_YOU_OKAY", [
    {
      identifier: "IM_OKAY",
      buttonTitle: "✅ I'm Okay",
      options: { opensAppToForeground: true },
    },
  ]);
}

export function useInactivityDetector({ onSOSTrigger, userName, enabled = true }) {
  const checkInterval    = useRef(null);
  const responseTimer    = useRef(null);
  const alertShowing     = useRef(false);
  const appState         = useRef(AppState.currentState);
  const [countdown, setCountdown] = useState(60);
  const countdownInterval = useRef(null);

  // ── Record activity
  const recordActivity = useCallback(async () => {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }, []);

  // ── Show "Are you okay?" — both in-app alert AND critical notification
  const showAreYouOkayAlert = useCallback(() => {
    if (alertShowing.current) return;
    alertShowing.current = true;

    // Fire critical notification — works even if app is backgrounded
    // and phone is on silent or DND
    fireAreYouOkayNotification();

    // Also show in-app alert if app is in foreground
    let secondsLeft = 60;
    setCountdown(secondsLeft);

    countdownInterval.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);
      if (secondsLeft <= 0) clearInterval(countdownInterval.current);
    }, 1000);

    Alert.alert(
      "🆘 Are You Okay?",
      `You haven't used your phone in over an hour.\n\nIf you don't respond in 60 seconds, an SOS alert will be sent to all your emergency contacts automatically.`,
      [
        {
          text: "✅ I'm Okay",
          style: "default",
          onPress: async () => {
            clearTimeout(responseTimer.current);
            clearInterval(countdownInterval.current);
            alertShowing.current = false;
            await recordActivity();
          },
        },
      ],
      { cancelable: false }
    );

    // Auto-trigger SOS if no response
    responseTimer.current = setTimeout(async () => {
      clearInterval(countdownInterval.current);
      alertShowing.current = false;
      await recordActivity();
      onSOSTrigger?.(userName);
    }, RESPONSE_WINDOW_MS);

  }, [onSOSTrigger, userName, recordActivity]);

  // ── Check inactivity
  const checkInactivity = useCallback(async () => {
    if (!enabled || alertShowing.current) return;
    try {
      const lastActiveRaw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      if (!lastActiveRaw) {
        await recordActivity();
        return;
      }
      const elapsed = Date.now() - parseInt(lastActiveRaw, 10);
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        showAreYouOkayAlert();
      }
    } catch {
      // Silent fail
    }
  }, [enabled, showAreYouOkayAlert, recordActivity]);

  // ── Listen for "I'm Okay" notification action response
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (response.actionIdentifier === "IM_OKAY") {
        clearTimeout(responseTimer.current);
        clearInterval(countdownInterval.current);
        alertShowing.current = false;
        await recordActivity();
      }
    });
    return () => sub.remove();
  }, [recordActivity]);

  // ── App state changes
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        await recordActivity();
        checkInactivity();
      }
      appState.current = nextState;
    });
    return () => sub?.remove();
  }, [checkInactivity, recordActivity]);

  // ── Start / stop
  const startMonitoring = useCallback(() => {
    if (checkInterval.current) return;
    recordActivity();
    checkInterval.current = setInterval(checkInactivity, CHECK_INTERVAL_MS);
  }, [checkInactivity, recordActivity]);

  const stopMonitoring = useCallback(() => {
    clearInterval(checkInterval.current);
    clearTimeout(responseTimer.current);
    clearInterval(countdownInterval.current);
    checkInterval.current = null;
    responseTimer.current = null;
    alertShowing.current = false;
  }, []);

  useEffect(() => {
    if (enabled) startMonitoring();
    else stopMonitoring();
    return () => stopMonitoring();
  }, [enabled]);

  return { recordActivity, countdown, startMonitoring, stopMonitoring };
}