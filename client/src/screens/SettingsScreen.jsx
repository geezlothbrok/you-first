import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  StatusBar,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8F8",
  bgCard: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonPale: "#FDECEA",
  inputBorder: "#F0D0D4",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
  amber: "#D97706",
  amberPale: "#FFFBEB",
  textDark: "#1A0608",
  textMid: "#5C2D35",
  textMuted: "#9E7A7E",
  white: "#FFFFFF",
  shadow: "rgba(192,21,42,0.08)",
};

const F = {
  extraLight: "Manrope-ExtraLight",
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semiBold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extraBold: "Manrope-ExtraBold",
};

const SETTINGS_KEY = "app_settings";

const DEFAULT_SETTINGS = {
  // Safety
  fallDetectionEnabled: true,
  sosConfirmation: true,
  inactivityTimer: 60, // minutes

  // Notifications
  medicationReminders: true,
  appointmentReminders: true,
  sosAlerts: true,
  inactivityAlerts: true,

  // Region
  language: "English",
  region: "Netherlands",
};

const INACTIVITY_OPTIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Dutch",
  "French",
  "German",
  "Spanish",
  "Portuguese",
];

const REGION_OPTIONS = [
  "Netherlands",
  "Ghana",
  "United Kingdom",
  "United States",
  "Germany",
  "France",
  "Belgium",
  "South Africa",
  "Nigeria",
];

// ─── Privacy Policy content ───────────────────────────────────────────────
const PRIVACY_SECTIONS = [
  {
    title: "What data we collect",
    content:
      "VitaTrack collects your name, email, health profile information (blood type, conditions, allergies), medication schedules, appointment details, and emergency contact information. Activity data such as step counts is read from your device sensors and never uploaded to our servers.",
  },
  {
    title: "How your data is encrypted",
    content:
      "All data transmitted between your device and our servers is encrypted using TLS 1.3. Your authentication token is stored in your device's secure storage. Passwords are hashed using bcrypt with a salt factor of 10 — we never store plain-text passwords.",
  },
  {
    title: "Local-first architecture",
    content:
      "VitaTrack is designed to work offline. Your SOS contacts, health profile, and medication schedules are always cached locally on your device. Emergency alerts are triggered directly from your phone — not through our servers — so they work even without internet.",
  },
  {
    title: "Who we share data with",
    content:
      "We do not sell your data to third parties. Profile photos are stored on Cloudinary under a private bucket. We do not share your health information with insurance companies, employers, or advertisers.",
  },
  {
    title: "Your rights",
    content:
      "You can export, edit, or delete your data at any time from within the app. Deleting your account permanently removes all your data from our servers within 30 days. Local device data is cleared immediately upon account deletion.",
  },
  {
    title: "Contact",
    content:
      "For privacy concerns, contact us at privacy@vitatrack.app. We respond to all privacy requests within 72 hours.",
  },
];

// ─── Section wrapper ──────────────────────────────────────────────────────
function Section({ title, icon, children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </Animated.View>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────
function ToggleRow({ icon, label, hint, value, onChange, color }) {
  return (
    <View style={styles.toggleRow}>
      <View
        style={[
          styles.toggleIcon,
          { backgroundColor: `${color || C.crimson}18` },
        ]}>
        <Text style={styles.toggleIconText}>{icon}</Text>
      </View>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint && <Text style={styles.toggleHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.inputBorder, true: color || C.emerald }}
        thumbColor={C.white}
      />
    </View>
  );
}

// ─── Picker row ───────────────────────────────────────────────────────────
function PickerRow({ icon, label, value, onPress }) {
  return (
    <TouchableOpacity
      style={styles.pickerRow}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.toggleIcon, { backgroundColor: C.crimsonPale }]}>
        <Text style={styles.toggleIconText}>{icon}</Text>
      </View>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.pickerValue}>{value}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Option picker modal ──────────────────────────────────────────────────
function OptionModal({ visible, title, options, selected, onSelect, onClose }) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.optionSheet,
          { transform: [{ translateY: slideAnim }] },
        ]}>
        <View style={styles.modalHandle} />
        <Text style={styles.optionTitle}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            const isSelected = selected === val;
            return (
              <TouchableOpacity
                key={String(val)}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemActive,
                ]}
                onPress={() => {
                  onSelect(val);
                  onClose();
                }}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelActive,
                  ]}>
                  {lbl}
                </Text>
                {isSelected && <Text style={styles.optionCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Privacy Policy Modal ─────────────────────────────────────────────────
function PrivacyModal({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.privacySheet,
          { transform: [{ translateY: slideAnim }] },
        ]}>
        <View style={styles.modalHandle} />
        <View style={styles.privacyHeader}>
          <Text style={styles.privacyTitle}>Privacy Policy</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.privacyClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.privacySubtitle}>
          Last updated: March 2026 · VitaTrack takes your privacy seriously.
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {PRIVACY_SECTIONS.map((s, i) => (
            <View key={i} style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>{s.title}</Text>
              <Text style={styles.privacySectionContent}>{s.content}</Text>
            </View>
          ))}
          <View style={styles.encryptionBadge}>
            <Text style={styles.encryptionIcon}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.encryptionTitle}>End-to-end encryption</Text>
              <Text style={styles.encryptionDesc}>
                TLS 1.3 · bcrypt passwords · Local-first SOS
              </Text>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Modals
  const [inactivityModal, setInactivityModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const [regionModal, setRegionModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);

  // Load persisted settings
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      setLoaded(true);
    });
  }, []);

  // Save settings whenever they change
  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  if (!loaded) return <View style={styles.root} />;

  const inactivityLabel =
    INACTIVITY_OPTIONS.find((o) => o.value === settings.inactivityTimer)
      ?.label || "1 hour";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />

      {/* Static header */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Safety Engine ── */}
        <Section title="Safety Engine" icon="🛡️" delay={0}>
          <ToggleRow
            icon="🤸"
            label="Fall Detection"
            hint="Detects sudden falls using accelerometer"
            value={settings.fallDetectionEnabled}
            onChange={(v) => updateSetting("fallDetectionEnabled", v)}
            color={C.emerald}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="⚠️"
            label="SOS Confirmation"
            hint="Show confirmation before sending alert"
            value={settings.sosConfirmation}
            onChange={(v) => updateSetting("sosConfirmation", v)}
            color={C.amber}
          />
          <View style={styles.divider} />
          <PickerRow
            icon="⏱️"
            label="Inactivity Timer"
            value={inactivityLabel}
            onPress={() => setInactivityModal(true)}
          />
          {!settings.sosConfirmation && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠️ SOS will fire immediately without confirmation. Make sure
                your contacts are set up.
              </Text>
            </View>
          )}
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" icon="🔔" delay={80}>
          <ToggleRow
            icon="💊"
            label="Medication Reminders"
            hint="Get notified when it's time to take medication"
            value={settings.medicationReminders}
            onChange={(v) => updateSetting("medicationReminders", v)}
            color={C.emerald}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="📅"
            label="Appointment Reminders"
            hint="24 hours before each appointment"
            value={settings.appointmentReminders}
            onChange={(v) => updateSetting("appointmentReminders", v)}
            color={C.emerald}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="🆘"
            label="SOS Alert Notifications"
            hint="Critical alerts — bypass silent mode"
            value={settings.sosAlerts}
            onChange={(v) => updateSetting("sosAlerts", v)}
            color={C.crimson}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="🕐"
            label="Inactivity Alerts"
            hint="Alert when no activity detected"
            value={settings.inactivityAlerts}
            onChange={(v) => updateSetting("inactivityAlerts", v)}
            color={C.amber}
          />
        </Section>

        {/* ── Language & Region ── */}
        <Section title="Language & Region" icon="🌍" delay={160}>
          <PickerRow
            icon="🗣️"
            label="Language"
            value={settings.language}
            onPress={() => setLanguageModal(true)}
          />
          <View style={styles.divider} />
          <PickerRow
            icon="📍"
            label="Region"
            value={settings.region}
            onPress={() => setRegionModal(true)}
          />
          <View style={styles.regionNote}>
            <Text style={styles.regionNoteText}>
              Region determines which emergency number is called when you tap
              Ambulance.
            </Text>
          </View>
        </Section>

        {/* ── Privacy & Legal ── */}
        <Section title="Privacy & Legal" icon="🔐" delay={240}>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => setPrivacyModal(true)}
            activeOpacity={0.7}>
            <View
              style={[styles.toggleIcon, { backgroundColor: C.crimsonPale }]}>
              <Text style={styles.toggleIconText}>📋</Text>
            </View>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Privacy Policy</Text>
              <Text style={styles.toggleHint}>
                How your data is collected and protected
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => Linking.openURL("https://vitatrack.app/terms")}
            activeOpacity={0.7}>
            <View
              style={[styles.toggleIcon, { backgroundColor: C.crimsonPale }]}>
              <Text style={styles.toggleIconText}>📜</Text>
            </View>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Terms of Service</Text>
              <Text style={styles.toggleHint}>Opens in browser</Text>
            </View>
            <Text style={styles.chevron}>↗</Text>
          </TouchableOpacity>

          {/* Encryption badge */}
          <View style={styles.encryptionCard}>
            <Text style={styles.encryptionCardIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.encryptionCardTitle}>
                Your data is encrypted
              </Text>
              <Text style={styles.encryptionCardDesc}>
                TLS 1.3 in transit · bcrypt hashed passwords · SOS works offline
              </Text>
            </View>
          </View>
        </Section>

        {/* ── About ── */}
        <Section title="About" icon="ℹ️" delay={320}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2026.03</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.aboutRow}
            onPress={() => Linking.openURL("mailto:support@vitatrack.app")}>
            <Text style={styles.aboutLabel}>Contact Support</Text>
            <Text style={[styles.aboutValue, { color: C.crimson }]}>
              support@vitatrack.app
            </Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <OptionModal
        visible={inactivityModal}
        title="Inactivity Timer"
        options={INACTIVITY_OPTIONS}
        selected={settings.inactivityTimer}
        onSelect={(v) => updateSetting("inactivityTimer", v)}
        onClose={() => setInactivityModal(false)}
      />
      <OptionModal
        visible={languageModal}
        title="Language"
        options={LANGUAGE_OPTIONS}
        selected={settings.language}
        onSelect={(v) => updateSetting("language", v)}
        onClose={() => setLanguageModal(false)}
      />
      <OptionModal
        visible={regionModal}
        title="Region"
        options={REGION_OPTIONS}
        selected={settings.region}
        onSelect={(v) => updateSetting("region", v)}
        onClose={() => setRegionModal(false)}
      />
      <PrivacyModal
        visible={privacyModal}
        onClose={() => setPrivacyModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  headerSafe: { backgroundColor: C.crimsonDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.crimsonDeep,
  },
  backBtn: { padding: 4, width: 40 },
  backArrow: {
    fontSize: 28,
    color: C.white,
    fontFamily: F.light,
    lineHeight: 32,
  },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Section
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontFamily: F.extraBold, fontSize: 15, color: C.textDark },
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  divider: { height: 1, backgroundColor: "#FFF0F1", marginVertical: 4 },

  // Toggle row
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleIconText: { fontSize: 16 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontFamily: F.semiBold, fontSize: 14, color: C.textDark },
  toggleHint: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  // Picker row
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  pickerValue: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.crimson,
    marginTop: 2,
  },
  chevron: { fontSize: 20, color: C.textMuted, fontFamily: F.light },

  // Warning banner
  warningBanner: {
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 8,
  },
  warningText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.amber,
    lineHeight: 18,
  },

  // Region note
  regionNote: {
    backgroundColor: C.crimsonPale,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  regionNoteText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMid,
    lineHeight: 18,
  },

  // Legal rows
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },

  // Encryption card
  encryptionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.emeraldPale,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  encryptionCardIcon: { fontSize: 22 },
  encryptionCardTitle: { fontFamily: F.bold, fontSize: 13, color: C.emerald },
  encryptionCardDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: "#059669",
    marginTop: 2,
  },

  // About rows
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  aboutLabel: { fontFamily: F.semiBold, fontSize: 14, color: C.textDark },
  aboutValue: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },

  // Option modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,6,8,0.5)",
  },
  optionSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "60%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.inputBorder,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  optionTitle: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.textDark,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF0F1",
  },
  optionItemActive: {
    backgroundColor: C.crimsonPale,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionLabel: { fontFamily: F.semiBold, fontSize: 15, color: C.textDark },
  optionLabelActive: { color: C.crimson, fontFamily: F.bold },
  optionCheck: { fontSize: 16, color: C.crimson, fontFamily: F.bold },

  // Privacy modal
  privacySheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    height: "90%",
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  privacyTitle: { fontFamily: F.extraBold, fontSize: 20, color: C.textDark },
  privacyClose: {
    fontSize: 18,
    color: C.textMuted,
    fontFamily: F.bold,
    padding: 4,
  },
  privacySubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  privacySection: { marginBottom: 20 },
  privacySectionTitle: {
    fontFamily: F.extraBold,
    fontSize: 14,
    color: C.crimsonDeep,
    marginBottom: 6,
  },
  privacySectionContent: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textMid,
    lineHeight: 21,
  },
  encryptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.emeraldPale,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  encryptionIcon: { fontSize: 28 },
  encryptionTitle: { fontFamily: F.bold, fontSize: 14, color: C.emerald },
  encryptionDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
  },
});
