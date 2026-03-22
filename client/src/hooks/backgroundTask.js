import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_TASK_NAME = "VITATRACK_SAFETY_CHECK";
const LAST_ACTIVE_KEY = "last_activity_timestamp";
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour

// ─── Define the background task ───────────────────────────────────────────
// This runs periodically even when the app is closed
// It checks inactivity and fires a critical notification if needed
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const lastActiveRaw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    if (!lastActiveRaw) return BackgroundFetch.BackgroundFetchResult.NoData;

    const lastActive = parseInt(lastActiveRaw, 10);
    const elapsed = Date.now() - lastActive;

    if (elapsed >= INACTIVITY_LIMIT_MS) {
      // Fire critical notification — app is in background so no Alert possible
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🆘 Are You Okay?",
          body: "VitaTrack hasn't detected activity in over an hour. Open the app to confirm you're safe.",
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

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error("Background task error:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Register the background task ────────────────────────────────────────
export async function registerBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60,  // minimum 15 minutes (OS may run less frequently)
      stopOnTerminate: false,    // keep running after app is closed
      startOnBoot: true,         // restart after phone reboot
    });

    console.log("[BackgroundTask] Safety check task registered");
  } catch (err) {
    console.warn("[BackgroundTask] Registration failed:", err);
  }
}

// ─── Unregister the background task ──────────────────────────────────────
export async function unregisterBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log("[BackgroundTask] Safety check task unregistered");
    }
  } catch (err) {
    console.warn("[BackgroundTask] Unregister failed:", err);
  }
}

// ─── Check background fetch status ───────────────────────────────────────
export async function getBackgroundTaskStatus() {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);

  const statusMap = {
    [BackgroundFetch.BackgroundFetchStatus.Restricted]: "restricted",
    [BackgroundFetch.BackgroundFetchStatus.Denied]: "denied",
    [BackgroundFetch.BackgroundFetchStatus.Available]: "available",
  };

  return {
    status: statusMap[status] || "unknown",
    isRegistered,
  };
}