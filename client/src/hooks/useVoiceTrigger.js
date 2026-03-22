import { useEffect, useRef, useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import Voice from "@react-native-voice/voice";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VOICE_ENABLED_KEY = "voice_trigger_enabled";
const RESPONSE_WINDOW_MS = 30000; // 30 seconds to respond
const RESTART_DELAY_MS = 1000;    // restart listener after each result

// ─── Keywords that trigger the alert ─────────────────────────────────────
const TRIGGER_KEYWORDS = [
  "help",
  "emergency",
  "call someone",
  "call for help",
  "sos",
  "danger",
  "save me",
  "i need help",
];

const containsKeyword = (text) => {
  const lower = text.toLowerCase().trim();
  return TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
};

// ─── Critical notification for voice trigger ──────────────────────────────
const fireVoiceTriggerNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎤 Emergency Keyword Detected",
        body: "VitaTrack heard an emergency keyword. Tap 'I'm Okay' or SOS will trigger in 30 seconds.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "VOICE_TRIGGER",
        ...(Platform.OS === "ios" && {
          interruptionLevel: "critical",
          sound: "default",
        }),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn("Voice notification error:", err);
  }
};

export async function registerVoiceNotificationCategory() {
  await Notifications.setNotificationCategoryAsync("VOICE_TRIGGER", [
    {
      identifier: "IM_OKAY_VOICE",
      buttonTitle: "✅ I'm Okay",
      options: { opensAppToForeground: true },
    },
  ]);
}

// ─── Main hook ────────────────────────────────────────────────────────────
export function useVoiceTrigger({ onSOSTrigger, userName }) {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const responseTimer = useRef(null);
  const alertShowing  = useRef(false);
  const shouldRestart = useRef(false);

  // ── Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(VOICE_ENABLED_KEY).then((val) => {
      if (val === "true") setIsEnabled(true);
    });
  }, []);

  // ── Show "Are you okay?" alert after keyword detected
  const showKeywordAlert = useCallback(() => {
    if (alertShowing.current) return;
    alertShowing.current = true;

    fireVoiceTriggerNotification();

    Alert.alert(
      "🎤 Emergency Keyword Detected",
      `VitaTrack heard an emergency keyword.\n\nAre you okay? SOS will be sent to all your contacts in 30 seconds if you don't respond.`,
      [
        {
          text: "✅ I'm Okay",
          style: "default",
          onPress: () => {
            clearTimeout(responseTimer.current);
            alertShowing.current = false;
          },
        },
      ],
      { cancelable: false }
    );

    responseTimer.current = setTimeout(() => {
      alertShowing.current = false;
      onSOSTrigger?.(userName);
    }, RESPONSE_WINDOW_MS);
  }, [onSOSTrigger, userName]);

  // ── Handle speech results
  const handleSpeechResults = useCallback((event) => {
    const results = event.value || [];
    const transcript = results.join(" ");
    setLastHeard(transcript);

    if (containsKeyword(transcript) && !alertShowing.current) {
      showKeywordAlert();
    }

    // Restart listening after processing result
    if (shouldRestart.current) {
      setTimeout(() => startListening(), RESTART_DELAY_MS);
    }
  }, [showKeywordAlert]);

  const handleSpeechError = useCallback((error) => {
    // Restart on error — common when no speech detected
    if (shouldRestart.current && isEnabled) {
      setTimeout(() => startListening(), RESTART_DELAY_MS * 2);
    }
    setIsListening(false);
  }, [isEnabled]);

  const handleSpeechEnd = useCallback(() => {
    setIsListening(false);
    // Restart so it keeps listening continuously
    if (shouldRestart.current && isEnabled) {
      setTimeout(() => startListening(), RESTART_DELAY_MS);
    }
  }, [isEnabled]);

  // ── Start listening
  const startListening = useCallback(async () => {
    try {
      await Voice.start("en-US");
      setIsListening(true);
    } catch (err) {
      console.warn("Voice start error:", err);
      setIsListening(false);
    }
  }, []);

  // ── Stop listening
  const stopListening = useCallback(async () => {
    try {
      shouldRestart.current = false;
      await Voice.stop();
      await Voice.destroy();
      setIsListening(false);
    } catch (err) {
      console.warn("Voice stop error:", err);
    }
  }, []);

  // ── Toggle voice trigger on/off
  const toggleVoice = useCallback(async () => {
    const newVal = !isEnabled;
    setIsEnabled(newVal);
    await AsyncStorage.setItem(VOICE_ENABLED_KEY, newVal.toString());

    if (newVal) {
      shouldRestart.current = true;
      await startListening();
    } else {
      await stopListening();
    }
  }, [isEnabled, startListening, stopListening]);

  // ── Register Voice event listeners
  useEffect(() => {
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;
    Voice.onSpeechEnd = handleSpeechEnd;

    return () => {
      Voice.onSpeechResults = null;
      Voice.onSpeechError = null;
      Voice.onSpeechEnd = null;
      Voice.destroy().catch(() => {});
    };
  }, [handleSpeechResults, handleSpeechError, handleSpeechEnd]);

  // ── Listen for "I'm Okay" from notification action
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier === "IM_OKAY_VOICE") {
        clearTimeout(responseTimer.current);
        alertShowing.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  // ── Auto-start if was enabled before
  useEffect(() => {
    if (isEnabled) {
      shouldRestart.current = true;
      startListening();
    }
    return () => {
      shouldRestart.current = false;
      Voice.destroy().catch(() => {});
    };
  }, [isEnabled]);

  return {
    isListening,
    isEnabled,
    lastHeard,
    toggleVoice,
  };
}