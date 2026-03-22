import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import {
  useSOSTrigger,
  requestCriticalPermissions,
} from "../hooks/useSosTrigger";
import {
  useInactivityDetector,
  registerNotificationCategories,
} from "../hooks/useInactivityDetector";
import {
  useFallDetector,
  registerFallNotificationCategory,
} from "../hooks/useFallDetector";
// import {
//   useVoiceTrigger,
//   registerVoiceNotificationCategory,
// } from "../hooks/useVoiceTrigger";
import { registerBackgroundTask } from "../hooks/backgroundTask";

// ─── SafetyEngine ─────────────────────────────────────────────────────────
// Mount once inside HomeTab after authentication.
// Runs silently — no UI rendered.
// Manages all Phase 3 + Phase 4 safety systems:
//   - Inactivity detection (1 hour)
//   - Fall detection (accelerometer)
//   - Voice trigger (keyword detection)
//   - Background task (periodic safety check)

export default function SafetyEngine({ enabled = true }) {
  const user = useSelector(selectUser);
  const userName = user?.fullName || "VitaTrack User";
  const { triggerSOS } = useSOSTrigger();

  // ── One-time setup on mount ───────────────────────────────────────────
  useEffect(() => {
    const setup = async () => {
      // 1. Request critical alert permissions (bypasses silent/DND)
      await requestCriticalPermissions();

      // 2. Register notification action categories
      await registerNotificationCategories(); // "Are you okay?" → I'm Okay
      await registerFallNotificationCategory(); // Fall detected → I'm Okay
    //   await registerVoiceNotificationCategory(); // Voice keyword → I'm Okay

      // 3. Register background task (runs every ~15 min when app is closed)
      await registerBackgroundTask();
    };
    setup();
  }, []);

  // ── Inactivity detection ──────────────────────────────────────────────
  const { recordActivity } = useInactivityDetector({
    onSOSTrigger: triggerSOS,
    userName,
    enabled,
  });

  // ── Fall detection ────────────────────────────────────────────────────
  const { fallDetected } = useFallDetector({
    onFallDetected: () => console.log("[SafetyEngine] Fall detected"),
    onSOSTrigger: triggerSOS,
    userName,
    enabled,
  });

  // ── Voice trigger ─────────────────────────────────────────────────────
  // Note: isListening and isEnabled are exposed so UI can show
  // the microphone status indicator if needed
//   const { isListening, isEnabled: voiceEnabled } = useVoiceTrigger({
//     onSOSTrigger: triggerSOS,
//     userName,
//   });

  return null;
}
