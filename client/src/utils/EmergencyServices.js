import { Linking, Alert, Platform } from "react-native";
import * as Localization from "expo-localization";

// ─── Emergency numbers by country code ───────────────────────────────────
// Sources: ITU, Wikipedia Emergency telephone numbers
const EMERGENCY_NUMBERS = {
  // Europe
  NL: { ambulance: "112", police: "112", fire: "112" }, // Netherlands
  GB: { ambulance: "999", police: "999", fire: "999" },
  DE: { ambulance: "112", police: "110", fire: "112" },
  FR: { ambulance: "15",  police: "17",  fire: "18"  },
  ES: { ambulance: "112", police: "112", fire: "112" },
  IT: { ambulance: "118", police: "113", fire: "115" },
  BE: { ambulance: "112", police: "101", fire: "100" },
  CH: { ambulance: "144", police: "117", fire: "118" },
  AT: { ambulance: "144", police: "133", fire: "122" },
  SE: { ambulance: "112", police: "112", fire: "112" },
  NO: { ambulance: "113", police: "112", fire: "110" },
  DK: { ambulance: "112", police: "112", fire: "112" },
  FI: { ambulance: "112", police: "112", fire: "112" },
  PT: { ambulance: "112", police: "112", fire: "112" },
  GR: { ambulance: "166", police: "100", fire: "199" },
  PL: { ambulance: "999", police: "997", fire: "998" },

  // Africa
  GH: { ambulance: "193", police: "191", fire: "192" }, // Ghana
  NG: { ambulance: "112", police: "112", fire: "112" },
  ZA: { ambulance: "10177",police: "10111",fire: "10177"},
  KE: { ambulance: "999", police: "999", fire: "999" },
  EG: { ambulance: "123", police: "122", fire: "180" },

  // Americas
  US: { ambulance: "911", police: "911", fire: "911" },
  CA: { ambulance: "911", police: "911", fire: "911" },
  MX: { ambulance: "065", police: "060", fire: "068" },
  BR: { ambulance: "192", police: "190", fire: "193" },

  // Asia & Oceania
  AU: { ambulance: "000", police: "000", fire: "000" },
  NZ: { ambulance: "111", police: "111", fire: "111" },
  IN: { ambulance: "108", police: "100", fire: "101" },
  CN: { ambulance: "120", police: "110", fire: "119" },
  JP: { ambulance: "119", police: "110", fire: "119" },
  SG: { ambulance: "995", police: "999", fire: "995" },
  AE: { ambulance: "998", police: "999", fire: "997" },
  SA: { ambulance: "911", police: "911", fire: "911" },

  // Universal fallback (EU standard)
  DEFAULT: { ambulance: "112", police: "112", fire: "112" },
};

// ─── Get country code from device locale ─────────────────────────────────
const getCountryCode = () => {
  try {
    const locale = Localization.locale || "en-NL";
    // locale format: "en-US", "nl-NL", "en-GB" etc.
    const parts = locale.split("-");
    if (parts.length >= 2) {
      return parts[parts.length - 1].toUpperCase();
    }
    return "DEFAULT";
  } catch {
    return "DEFAULT";
  }
};

// ─── Get emergency numbers for current device locale ─────────────────────
export const getEmergencyNumbers = () => {
  const countryCode = getCountryCode();
  return EMERGENCY_NUMBERS[countryCode] || EMERGENCY_NUMBERS.DEFAULT;
};

// ─── Call ambulance ───────────────────────────────────────────────────────
export const callAmbulance = async () => {
  const numbers = getEmergencyNumbers();
  const number  = numbers.ambulance;
  const phoneUrl = `tel:${number}`;

  Alert.alert(
    "🚑 Call Ambulance?",
    `This will call emergency services (${number}) immediately.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: `Call ${number}`,
        style: "destructive",
        onPress: async () => {
          try {
            const canCall = await Linking.canOpenURL(phoneUrl);
            if (canCall) {
              await Linking.openURL(phoneUrl);
            } else {
              Alert.alert("Error", "Unable to make phone calls on this device.");
            }
          } catch (err) {
            Alert.alert("Error", "Could not connect the call. Please dial manually.");
          }
        },
      },
    ]
  );
};

// ─── Call police ──────────────────────────────────────────────────────────
export const callPolice = async () => {
  const numbers  = getEmergencyNumbers();
  const number   = numbers.police;
  const phoneUrl = `tel:${number}`;

  Alert.alert(
    "🚔 Call Police?",
    `This will call the police (${number}) immediately.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: `Call ${number}`,
        style: "destructive",
        onPress: () => Linking.openURL(phoneUrl),
      },
    ]
  );
};