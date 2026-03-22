import { useCallback } from "react";
import { Linking, Alert, Platform } from "react-native";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONTACTS_CACHE_KEY = "sosContacts_cache";
const CALL_INTERVAL_MS = 30 * 1000; // 30 seconds between calls

// ─── Configure notifications to bypass silent/DND ────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// ─── Request critical alert permissions (iOS) ────────────────────────────
export async function requestCriticalPermissions() {
  if (Platform.OS === "ios") {
    const { status, ios } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: true,
        allowCriticalAlerts: true, // bypasses silent + DND on iOS
      },
    });
    return status === "granted";
  } else {
    // Android
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }
}

// ─── Fire a critical alert notification (bypasses silent/DND) ────────────
const fireCriticalNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === "ios" && {
          sound: "default",
          _displayInForeground: true,
          interruptionLevel: "critical", // iOS 15+ — bypasses DND and silent
        }),
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn("Notification error:", err);
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

// ─── Get GPS location (non-blocking) ─────────────────────────────────────
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

// ─── Call all contacts sequentially, 30 seconds apart ────────────────────
const callAllContacts = (contacts) => {
  const sorted = [...contacts].sort((a, b) => a.priority - b.priority);

  sorted.forEach((contact, index) => {
    setTimeout(async () => {
      const phoneUrl = `tel:${contact.phone}`;
      try {
        const canCall = await Linking.canOpenURL(phoneUrl);
        if (canCall) {
          await Linking.openURL(phoneUrl);
        }
      } catch {
        // Silent fail — try next contact
      }
    }, index * CALL_INTERVAL_MS);
  });
};

// ─── Main hook ────────────────────────────────────────────────────────────
export function useSOSTrigger() {

  const triggerSOS = useCallback(async (userName) => {
    try {
      // 1. Load contacts from cache — works fully offline
      const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
      if (!cached) {
        Alert.alert(
          "No SOS Contacts",
          "Please add emergency contacts before using SOS.",
          [{ text: "OK" }]
        );
        return;
      }

      const contacts = JSON.parse(cached);
      const activeContacts = contacts.filter((c) => c.isActive !== false);

      if (activeContacts.length === 0) {
        Alert.alert("No Active Contacts", "Please add at least one SOS contact.");
        return;
      }

      // 2. Fire critical notification immediately — bypasses silent/DND
      await fireCriticalNotification(
        "SOS ALERT TRIGGERED",
        `Emergency alert being sent to ${activeContacts.length} contact${activeContacts.length > 1 ? "s" : ""}...`
      );

      // 3. Get location (non-blocking)
      const location = await getLocation();

      // 4. Send SMS to ALL contacts simultaneously
      const isSMSAvailable = await SMS.isAvailableAsync();
      if (isSMSAvailable) {
        const phoneNumbers = activeContacts.map((c) => c.phone);
        const message = buildMessage(userName, location, null);
        await SMS.sendSMSAsync(phoneNumbers, message);
      }

      // 5. Call ALL contacts — 30 seconds apart, starting after SMS
      setTimeout(() => {
        callAllContacts(activeContacts);
      }, 1500); // slight delay to let SMS send first

      // 6. Log the SOS event
      await logSOSEvent(userName, location, activeContacts);

    } catch (error) {
      console.error("SOS trigger error:", error);
      // Last resort — try calling from cache directly
      try {
        const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
        if (cached) {
          const contacts = JSON.parse(cached);
          callAllContacts(contacts);
        }
      } catch {
        // Silent fail
      }
    }
  }, []);

  // Manual SOS with confirmation
  const triggerManualSOS = useCallback(async (userName) => {
    Alert.alert(
      "🆘 Send SOS Alert?",
      "This will send an emergency SMS to ALL your contacts and call each of them 30 seconds apart.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: () => triggerSOS(userName),
        },
      ]
    );
  }, [triggerSOS]);

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