import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import { useSOSTrigger } from "../hooks/useSosTrigger";
// import { useVoiceTrigger } from "../hooks/useVoiceTrigger";

const { width } = Dimensions.get("window");

const C = {
  bg: "#FFF8F8",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonPale: "#FDECEA",
  crimsonLight: "#E8394D",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
  amber: "#D97706",
  amberPale: "#FFFBEB",
  white: "#FFFFFF",
  textDark: "#1A0608",
  textMuted: "#9E7A7E",
  inputBorder: "#F0D0D4",
  inputBg: "#FFF4F5",
};

const F = {
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semiBold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extraBold: "Manrope-ExtraBold",
};

// ─── Pulsing SOS button ───────────────────────────────────────────────────
function SOSButton({ onPress }) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createPulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.8,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(1800),
        ]),
      );
    createPulse(pulse1, 0).start();
    createPulse(pulse2, 400).start();
    createPulse(pulse3, 800).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };

  const pulseStyle = (anim) => ({
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.crimson,
    opacity: anim.interpolate({ inputRange: [1, 1.8], outputRange: [0.25, 0] }),
    transform: [{ scale: anim }],
  });

  return (
    <View style={styles.sosButtonWrapper}>
      <Animated.View style={pulseStyle(pulse1)} />
      <Animated.View style={pulseStyle(pulse2)} />
      <Animated.View style={pulseStyle(pulse3)} />
      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handlePress}
          activeOpacity={0.9}>
          <Text style={styles.sosButtonLabel}>SOS</Text>
          <Text style={styles.sosButtonSub}>Tap to send alert</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Mic pulse animation ──────────────────────────────────────────────────
function MicPulse() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={[styles.micPulse, { transform: [{ scale: pulse }] }]}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function SOSTab() {
  const user = useSelector(selectUser);
  const { triggerManualSOS, triggerSOS } = useSOSTrigger();
  const userName = user?.fullName || "VitaTrack User";

  // const {
  //   isListening,
  //   isEnabled: voiceEnabled,
  //   toggleVoice,
  //   lastHeard,
  // } = useVoiceTrigger({
  //   onSOSTrigger: triggerSOS,
  //   userName,
  // });
  const isListening = false;
  const voiceEnabled = false;
  const toggleVoice = () => {};
  const lastHeard = "";

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Emergency SOS</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          {/* Status row */}
          <View style={styles.statusRow}>
            <View style={styles.statusCard}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Monitoring active</Text>
            </View>
            {isListening && (
              <View style={styles.micStatusCard}>
                <MicPulse />
                <Text style={styles.micStatusText}>🎤 Listening</Text>
              </View>
            )}
          </View>

          {/* SOS button */}
          <SOSButton onPress={() => triggerManualSOS(userName)} />

          <Text style={styles.sosHint}>
            Tap to send an emergency SMS to all contacts and call each of them
          </Text>

          {/* What happens cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>💬</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>SMS to All Contacts</Text>
                <Text style={styles.infoDesc}>
                  Sent simultaneously with your live location
                </Text>
              </View>
            </View>
            <View style={[styles.infoCard, styles.infoCardBorder]}>
              <Text style={styles.infoEmoji}>📞</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Calls Everyone</Text>
                <Text style={styles.infoDesc}>
                  Each contact called 30 seconds apart by priority
                </Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>📍</Text>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Live Location</Text>
                <Text style={styles.infoDesc}>
                  GPS coordinates included in every alert
                </Text>
              </View>
            </View>
          </View>

          {/* Voice trigger toggle */}
          <View style={styles.voiceCard}>
            <View style={styles.voiceCardHeader}>
              <Text style={styles.voiceEmoji}>🎤</Text>
              <View style={styles.voiceCardInfo}>
                <Text style={styles.voiceCardTitle}>Voice Trigger</Text>
                <Text style={styles.voiceCardSubtitle}>
                  Say "Help", "Emergency" or "SOS" to trigger an alert
                </Text>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={toggleVoice}
                trackColor={{ false: C.inputBorder, true: C.emerald }}
                thumbColor={C.white}
              />
            </View>

            {voiceEnabled && (
              <View style={styles.voiceStatus}>
                <View
                  style={[
                    styles.voiceStatusDot,
                    { backgroundColor: isListening ? C.emerald : C.amber },
                  ]}
                />
                <Text style={styles.voiceStatusText}>
                  {isListening
                    ? "Listening for keywords..."
                    : "Starting microphone..."}
                </Text>
              </View>
            )}

            {voiceEnabled && lastHeard ? (
              <Text style={styles.lastHeard} numberOfLines={1}>
                Last heard: "{lastHeard}"
              </Text>
            ) : null}

            <View style={styles.keywordsRow}>
              {["Help", "Emergency", "SOS", "Danger", "Save me"].map((kw) => (
                <View key={kw} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Auto-trigger info */}
          <View style={styles.autoCard}>
            <Text style={styles.autoTitle}>⚡ Auto-triggers active</Text>
            <Text style={styles.autoDesc}>
              SOS fires automatically after 1 hour of inactivity, a detected
              fall, or an emergency voice keyword — even on silent or DND.
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerSafe: { backgroundColor: C.crimsonDeep },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.crimsonDeep,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },

  container: { flex: 1 },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },

  // Status
  statusRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.emeraldPale,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.emerald,
  },
  statusText: { fontFamily: F.semiBold, fontSize: 13, color: C.emerald },
  micStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.crimsonPale,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  micPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.crimson,
  },
  micStatusText: { fontFamily: F.semiBold, fontSize: 13, color: C.crimson },

  // SOS Button
  sosButtonWrapper: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  sosButtonLabel: {
    fontFamily: F.extraBold,
    fontSize: 36,
    color: C.white,
    letterSpacing: 2,
  },
  sosButtonSub: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  sosHint: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  // Info cards
  infoCards: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: 16,
    shadowColor: "rgba(192,21,42,0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 14,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  infoCardBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#FFF0F1",
  },
  infoEmoji: { fontSize: 24 },
  infoText: { flex: 1 },
  infoTitle: { fontFamily: F.bold, fontSize: 14, color: C.textDark },
  infoDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  // Voice card
  voiceCard: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "rgba(192,21,42,0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 14,
    gap: 12,
  },
  voiceCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  voiceEmoji: { fontSize: 24 },
  voiceCardInfo: { flex: 1 },
  voiceCardTitle: { fontFamily: F.bold, fontSize: 14, color: C.textDark },
  voiceCardSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  voiceStatus: { flexDirection: "row", alignItems: "center", gap: 8 },
  voiceStatusDot: { width: 8, height: 8, borderRadius: 4 },
  voiceStatusText: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  lastHeard: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: "italic",
  },
  keywordsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  keywordBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.crimsonPale,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  keywordText: { fontFamily: F.semiBold, fontSize: 12, color: C.crimson },

  // Auto card
  autoCard: {
    width: "100%",
    backgroundColor: C.crimsonDeep,
    borderRadius: 14,
    padding: 16,
  },
  autoTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.white,
    marginBottom: 6,
  },
  autoDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 19,
  },
});
