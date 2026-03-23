import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import { useSOSTrigger, requestCriticalPermissions } from "../hooks/useSosTrigger";
import { useInactivityDetector, registerNotificationCategories } from "../hooks/useInactivityDetector";
import { useFallDetector, registerFallNotificationCategory } from "../hooks/useFallDetector";
import { registerBackgroundTask } from "../hooks/backgroundTask";
import { getSettings } from "../hooks/settingsReader";

// ─── SafetyEngine ─────────────────────────────────────────────────────────
// Reads settings from AsyncStorage on mount and whenever app comes
// back to foreground — so changes in Settings screen take effect immediately.

export default function SafetyEngine({ enabled = true }) {
  const user = useSelector(selectUser);
  const userName = user?.fullName || "VitaTrack User";
  const { triggerSOS } = useSOSTrigger();

  // Live settings state
  const [fallDetectionOn, setFallDetectionOn] = useState(true);

  // Load settings on mount and on app foreground
  const loadSettings = async () => {
    const settings = await getSettings();
    setFallDetectionOn(settings.fallDetectionEnabled);
  };

  useEffect(() => {
    loadSettings();

    // Reload settings whenever app comes back to foreground
    // This ensures Settings screen changes take effect immediately
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadSettings();
    });

    return () => sub?.remove();
  }, []);

  // One-time setup
  useEffect(() => {
    const setup = async () => {
      await requestCriticalPermissions();
      await registerNotificationCategories();
      await registerFallNotificationCategory();
      await registerBackgroundTask();
    };
    setup();
  }, []);

  // Inactivity detection — always on when app enabled
  // Timer duration is read from settings inside the hook itself
  const { recordActivity } = useInactivityDetector({
    onSOSTrigger: triggerSOS,
    userName,
    enabled,
  });

  // Fall detection — toggled by settings
  const { fallDetected } = useFallDetector({
    onFallDetected: () => console.log("[SafetyEngine] Fall detected"),
    onSOSTrigger: triggerSOS,
    userName,
    enabled: enabled && fallDetectionOn, // ← respects setting
  });

  return null;
}