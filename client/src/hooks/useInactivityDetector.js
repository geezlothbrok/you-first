import { useEffect, useRef, useCallback, useState } from "react";
import { AppState, Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSettings } from "./settingsReader";

const CHECK_INTERVAL_MS  = 60 * 1000;  // check every 60 seconds
const RESPONSE_WINDOW_MS = 60 * 1000;  // 60 seconds to respond
const LAST_ACTIVE_KEY    = "last_activity_timestamp";

// ─── Critical notification ────────────────────────────────────────────────
const fireAreYouOkayNotification = async () => {
  try {
    // Check notification setting before firing
    const settings = await getSettings();
    if (!settings.inactivityAlerts) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🆘 Are You Okay?",
        body: "You haven't used your phone in a while. Tap to confirm you're safe — SOS will trigger soon.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "ARE_YOU_OKAY",
        ...(Platform.OS === "ios" && {
          interruptionLevel: "critical",
          sound: "default",
        }),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn("Inactivity notification error:", err);
  }
};

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

  const recordActivity = useCallback(async () => {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }, []);

  const showAreYouOkayAlert = useCallback(() => {
    if (alertShowing.current) return;
    alertShowing.current = true;

    // Fire critical notification — works even if app is backgrounded
    fireAreYouOkayNotification();

    let secondsLeft = 60;
    setCountdown(secondsLeft);

    countdownInterval.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);
      if (secondsLeft <= 0) clearInterval(countdownInterval.current);
    }, 1000);

    Alert.alert(
      "🆘 Are You Okay?",
      `You haven't been active for a while.\n\nIf you don't respond in 60 seconds, an SOS alert will be sent to all your emergency contacts automatically.`,
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

    responseTimer.current = setTimeout(async () => {
      clearInterval(countdownInterval.current);
      alertShowing.current = false;
      await recordActivity();
      onSOSTrigger?.(userName);
    }, RESPONSE_WINDOW_MS);

  }, [onSOSTrigger, userName, recordActivity]);

  const checkInactivity = useCallback(async () => {
    if (!enabled || alertShowing.current) return;
    try {
      // Read inactivity timer duration from settings
      const settings = await getSettings();
      const INACTIVITY_LIMIT_MS = settings.inactivityTimer * 60 * 1000;

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

  // Listen for "I'm Okay" notification action
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

  // App state changes
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