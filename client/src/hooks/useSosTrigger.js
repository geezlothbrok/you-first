import { useCallback } from "react";
import { Linking, Alert, Platform } from "react-native";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSettings } from "./settingsReader";

const CONTACTS_CACHE_KEY = "sosContacts_cache";
const CALL_INTERVAL_MS   = 30 * 1000;

// ─── Request critical permissions ────────────────────────────────────────
export async function requestCriticalPermissions() {
  if (Platform.OS === "ios") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: true,
        allowCriticalAlerts: true,
      },
    });
    return status === "granted";
  } else {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }
}

// ─── Critical SOS notification ────────────────────────────────────────────
const fireCriticalNotification = async (title, body) => {
  try {
    const settings = await getSettings();
    if (!settings.sosAlerts) return; // respect notification setting

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "ios" && {
          interruptionLevel: "critical",
          sound: "default",
        }),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn("SOS notification error:", err);
  }
};

// ─── Build SMS message ────────────────────────────────────────────────────
const buildMessage = (userName, location, customMessage) => {
  if (customMessage) return customMessage;
  let msg = `🆘 EMERGENCY ALERT\n\n${userName || "Someone"} may be in danger and needs immediate help.`;
  if (location) {
    msg += `\n\n📍 Last known location:\nhttps://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
  }
  msg += `\n\nThis alert was sent automatically by VitaTrack. Please respond immediately.`;
  return msg;
};

// ─── Get location ─────────────────────────────────────────────────────────
const getLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 5000,
    });
  } catch {
    return null;
  }
};

// ─── Call all contacts 30 seconds apart ──────────────────────────────────
const callAllContacts = (contacts) => {
  const sorted = [...contacts].sort((a, b) => a.priority - b.priority);
  sorted.forEach((contact, index) => {
    setTimeout(async () => {
      try {
        const canCall = await Linking.canOpenURL(`tel:${contact.phone}`);
        if (canCall) await Linking.openURL(`tel:${contact.phone}`);
      } catch {
        // Silent fail — try next
      }
    }, index * CALL_INTERVAL_MS);
  });
};

// ─── Core SOS trigger (no confirmation) ──────────────────────────────────
const executeSOS = async (userName) => {
  try {
    const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
    if (!cached) {
      Alert.alert("No SOS Contacts", "Please add emergency contacts before using SOS.");
      return;
    }

    const contacts = JSON.parse(cached);
    const activeContacts = contacts.filter((c) => c.isActive !== false);

    if (activeContacts.length === 0) {
      Alert.alert("No Active Contacts", "Please add at least one SOS contact.");
      return;
    }

    // Fire critical notification
    await fireCriticalNotification(
      "🆘 SOS ALERT TRIGGERED",
      `Emergency alert being sent to ${activeContacts.length} contact${activeContacts.length > 1 ? "s" : ""}...`
    );

    // Get location
    const location = await getLocation();

    // Send SMS to all contacts simultaneously
    const isSMSAvailable = await SMS.isAvailableAsync();
    if (isSMSAvailable) {
      const phoneNumbers = activeContacts.map((c) => c.phone);
      const message = buildMessage(userName, location, null);
      await SMS.sendSMSAsync(phoneNumbers, message);
    }

    // Call all contacts 30 seconds apart
    setTimeout(() => callAllContacts(activeContacts), 1500);

    // Log SOS event
    await logSOSEvent(userName, location, activeContacts);

  } catch (error) {
    console.error("SOS trigger error:", error);
    // Last resort — call from cache
    try {
      const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
      if (cached) callAllContacts(JSON.parse(cached));
    } catch {
      // Silent fail
    }
  }
};

// ─── Main hook ────────────────────────────────────────────────────────────
export function useSOSTrigger() {

  // Auto-trigger — used by fall detection and inactivity (no confirmation)
  const triggerSOS = useCallback(async (userName) => {
    await executeSOS(userName);
  }, []);

  // Manual trigger — checks SOS confirmation setting
  const triggerManualSOS = useCallback(async (userName) => {
    const settings = await getSettings();

    if (settings.sosConfirmation) {
      // Show confirmation alert before sending
      Alert.alert(
        "🆘 Send SOS Alert?",
        "This will send an emergency SMS to ALL your contacts and call each of them 30 seconds apart.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send SOS",
            style: "destructive",
            onPress: () => executeSOS(userName),
          },
        ]
      );
    } else {
      // Fire immediately — user disabled confirmation in settings
      await executeSOS(userName);
    }
  }, []);

  return { triggerSOS, triggerManualSOS };
}

// ─── Log SOS event ────────────────────────────────────────────────────────
const logSOSEvent = async (userName, location, contacts) => {
  try {
    const logsRaw = await AsyncStorage.getItem("sos_logs");
    const logs = logsRaw ? JSON.parse(logsRaw) : [];
    logs.unshift({
      triggeredAt: new Date().toISOString(),
      userName,
      location: location
        ? { lat: location.coords.latitude, lng: location.coords.longitude }
        : null,
      contactsAlerted: contacts.map((c) => ({ name: c.name, phone: c.phone })),
    });
    await AsyncStorage.setItem("sos_logs", JSON.stringify(logs.slice(0, 50)));
  } catch {
    // Log failure shouldn't affect SOS
  }
};