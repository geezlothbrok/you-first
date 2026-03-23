import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "app_settings";

export const DEFAULT_SETTINGS = {
  fallDetectionEnabled: true,
  sosConfirmation: true,
  inactivityTimer: 60,        // minutes
  medicationReminders: true,
  appointmentReminders: true,
  sosAlerts: true,
  inactivityAlerts: true,
  language: "English",
  region: "Netherlands",
};

// Read all settings — returns defaults for any missing keys
export const getSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// Read a single setting value
export const getSetting = async (key) => {
  const settings = await getSettings();
  return settings[key];
};