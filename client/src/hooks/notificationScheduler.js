import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSettings } from "./settingsReader";

// ─── Configure notification handler ──────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Request permissions ──────────────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: true,
    },
  });
  return status === "granted";
};

// ─── MEDICATION REMINDERS ─────────────────────────────────────────────────

// Schedule daily reminders for a single medication
// Called after adding or editing a medication
export const scheduleMedicationReminders = async (medication) => {
  try {
    const settings = await getSettings();
    if (!settings.medicationReminders) return;
    if (!medication.reminderEnabled) return;

    // Cancel existing notifications for this medication first
    await cancelMedicationReminders(medication._id);

    if (!medication.times || medication.times.length === 0) return;

    const scheduledIds = [];

    for (const timeStr of medication.times) {
      // Parse time string e.g. "08:00" or "2:30 PM"
      const { hours, minutes } = parseTimeString(timeStr);
      if (hours === null) continue;

      // Schedule repeating daily notification
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💊 Medication Reminder",
          body: `Time to take ${medication.name} — ${medication.dosage}`,
          sound: true,
          data: { type: "medication", medicationId: medication._id },
          ...(Platform.OS === "android" && {
            channelId: "medications",
            priority: Notifications.AndroidNotificationPriority.HIGH,
          }),
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true, // fires every day at this time
        },
      });
      scheduledIds.push(id);
    }

    // Store notification IDs so we can cancel them later
    await storeMedicationNotificationIds(medication._id, scheduledIds);

    console.log(`[Notifications] Scheduled ${scheduledIds.length} reminder(s) for ${medication.name}`);
    return scheduledIds;

  } catch (err) {
    console.warn("[Notifications] Failed to schedule medication reminder:", err);
  }
};

// Cancel all reminders for a specific medication
export const cancelMedicationReminders = async (medicationId) => {
  try {
    const ids = await getMedicationNotificationIds(medicationId);
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await removeMedicationNotificationIds(medicationId);
  } catch (err) {
    console.warn("[Notifications] Failed to cancel medication reminders:", err);
  }
};

// Reschedule all medications — call on app startup
export const rescheduleAllMedicationReminders = async (medications) => {
  try {
    const settings = await getSettings();
    if (!settings.medicationReminders) return;

    for (const med of medications) {
      if (med.isActive !== false && med.reminderEnabled) {
        await scheduleMedicationReminders(med);
      }
    }
    console.log(`[Notifications] Rescheduled reminders for ${medications.length} medication(s)`);
  } catch (err) {
    console.warn("[Notifications] Failed to reschedule medication reminders:", err);
  }
};

// ─── APPOINTMENT REMINDERS ────────────────────────────────────────────────

// Schedule a reminder 24 hours before an appointment
export const scheduleAppointmentReminder = async (appointment) => {
  try {
    const settings = await getSettings();
    if (!settings.appointmentReminders) return;
    if (!appointment.reminderEnabled) return;

    // Cancel existing reminder for this appointment
    await cancelAppointmentReminder(appointment._id);

    const appointmentDate = new Date(appointment.date);
    const { hours, minutes } = parseTimeString(appointment.time);

    if (hours !== null) {
      appointmentDate.setHours(hours, minutes, 0, 0);
    }

    // Schedule 24 hours before
    const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📅 Appointment Tomorrow",
        body: `${appointment.doctorName}${appointment.specialty ? ` — ${appointment.specialty}` : ""} at ${appointment.time}`,
        sound: true,
        data: { type: "appointment", appointmentId: appointment._id },
        ...(Platform.OS === "android" && {
          channelId: "appointments",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }),
      },
      trigger: {
        date: reminderTime,
      },
    });

    await storeAppointmentNotificationId(appointment._id, id);
    console.log(`[Notifications] Scheduled reminder for appointment with ${appointment.doctorName}`);
    return id;

  } catch (err) {
    console.warn("[Notifications] Failed to schedule appointment reminder:", err);
  }
};

// Cancel reminder for a specific appointment
export const cancelAppointmentReminder = async (appointmentId) => {
  try {
    const id = await getAppointmentNotificationId(appointmentId);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await removeAppointmentNotificationId(appointmentId);
    }
  } catch (err) {
    console.warn("[Notifications] Failed to cancel appointment reminder:", err);
  }
};

// Reschedule all appointment reminders — call on app startup
export const rescheduleAllAppointmentReminders = async (appointments) => {
  try {
    const settings = await getSettings();
    if (!settings.appointmentReminders) return;

    for (const apt of appointments) {
      if (apt.isActive !== false && apt.status === "upcoming") {
        await scheduleAppointmentReminder(apt);
      }
    }
    console.log(`[Notifications] Rescheduled reminders for ${appointments.length} appointment(s)`);
  } catch (err) {
    console.warn("[Notifications] Failed to reschedule appointment reminders:", err);
  }
};

// ─── Android notification channels ───────────────────────────────────────
export const setupNotificationChannels = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medications", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync("appointments", {
      name: "Appointment Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
    });
    await Notifications.setNotificationChannelAsync("safety", {
      name: "Safety Alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: true,
      bypassDnd: true,
    });
  }
};

// ─── Time parser ──────────────────────────────────────────────────────────
// Handles formats: "08:00", "8:00", "2:30 PM", "14:30"
const parseTimeString = (timeStr) => {
  if (!timeStr) return { hours: null, minutes: null };

  try {
    const str = timeStr.trim().toUpperCase();

    // Check for AM/PM format
    const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const period = ampmMatch[3];
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return { hours, minutes };
    }

    // 24-hour format
    const militaryMatch = str.match(/^(\d{1,2}):(\d{2})$/);
    if (militaryMatch) {
      return {
        hours: parseInt(militaryMatch[1], 10),
        minutes: parseInt(militaryMatch[2], 10),
      };
    }

    return { hours: null, minutes: null };
  } catch {
    return { hours: null, minutes: null };
  }
};

// ─── AsyncStorage helpers for notification IDs ────────────────────────────
import AsyncStorage from "@react-native-async-storage/async-storage";

const MED_NOTIF_KEY = "med_notification_ids";
const APT_NOTIF_KEY = "apt_notification_ids";

const storeMedicationNotificationIds = async (medId, ids) => {
  const raw = await AsyncStorage.getItem(MED_NOTIF_KEY);
  const map = raw ? JSON.parse(raw) : {};
  map[medId] = ids;
  await AsyncStorage.setItem(MED_NOTIF_KEY, JSON.stringify(map));
};

const getMedicationNotificationIds = async (medId) => {
  const raw = await AsyncStorage.getItem(MED_NOTIF_KEY);
  if (!raw) return [];
  const map = JSON.parse(raw);
  return map[medId] || [];
};

const removeMedicationNotificationIds = async (medId) => {
  const raw = await AsyncStorage.getItem(MED_NOTIF_KEY);
  if (!raw) return;
  const map = JSON.parse(raw);
  delete map[medId];
  await AsyncStorage.setItem(MED_NOTIF_KEY, JSON.stringify(map));
};

const storeAppointmentNotificationId = async (aptId, id) => {
  const raw = await AsyncStorage.getItem(APT_NOTIF_KEY);
  const map = raw ? JSON.parse(raw) : {};
  map[aptId] = id;
  await AsyncStorage.setItem(APT_NOTIF_KEY, JSON.stringify(map));
};

const getAppointmentNotificationId = async (aptId) => {
  const raw = await AsyncStorage.getItem(APT_NOTIF_KEY);
  if (!raw) return null;
  return JSON.parse(raw)[aptId] || null;
};

const removeAppointmentNotificationId = async (aptId) => {
  const raw = await AsyncStorage.getItem(APT_NOTIF_KEY);
  if (!raw) return;
  const map = JSON.parse(raw);
  delete map[aptId];
  await AsyncStorage.setItem(APT_NOTIF_KEY, JSON.stringify(map));
};