import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectToken, selectUser } from "../redux/slices/authSlice";

const { width } = Dimensions.get("window");

// ─── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8F8",
  bgCard: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonLight: "#E8394D",
  crimsonPale: "#FDECEA",
  inputBorder: "#F0D0D4",
  inputBg: "#FFF4F5",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
  amber: "#D97706",
  amberPale: "#FFFBEB",
  textDark: "#1A0608",
  textMid: "#5C2D35",
  textMuted: "#9E7A7E",
  textPlaceholder: "#C4A0A5",
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

const API_URL = "http://localhost:3000/api/health";
const CACHE_KEY = "healthProfile_cache";

const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "unknown",
];
const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const GENDER_LABELS = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

// ─── Section wrapper ──────────────────────────────────────────────────────
function Section({ title, icon, children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
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
                outputRange: [20, 0],
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

// ─── Labeled text input ───────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  maxLength,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          multiline && styles.fieldInputMulti,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={C.textPlaceholder}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={C.crimson}
        autoCorrect={false}
      />
    </View>
  );
}

// ─── Pill selector ────────────────────────────────────────────────────────
function PillSelector({ label, options, value, onChange, labelMap }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onChange(active ? null : opt)}
              activeOpacity={0.75}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {labelMap ? labelMap[opt] : opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Tag input (conditions, allergies, medications) ───────────────────────
function TagInput({ label, tags, onChange, placeholder }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => removeTag(tag)}>
              <Text style={styles.tagText}>{tag}</Text>
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.tagInputRow}>
        <TextInput
          style={styles.tagInput}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          placeholderTextColor={C.textPlaceholder}
          onSubmitEditing={addTag}
          returnKeyType="done"
          selectionColor={C.crimson}
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.tagAddBtn} onPress={addTag}>
          <Text style={styles.tagAddText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Completion bar ───────────────────────────────────────────────────────
function CompletionBar({ profile }) {
  const fields = [
    profile.dateOfBirth,
    profile.gender,
    profile.bloodType !== "unknown" && profile.bloodType,
    profile.height?.value,
    profile.weight?.value,
    profile.conditions?.length,
    profile.emergencyNotes,
    profile.primaryDoctor?.name,
    profile.insurance?.provider,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const color = pct < 40 ? C.crimson : pct < 75 ? C.amber : C.emerald;

  return (
    <View style={styles.completionWrapper}>
      <View style={styles.completionRow}>
        <Text style={styles.completionLabel}>Profile Completeness</Text>
        <Text style={[styles.completionPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.completionTrack}>
        <Animated.View
          style={[
            styles.completionFill,
            {
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {pct < 100 && (
        <Text style={styles.completionHint}>
          Complete your profile so first responders have accurate information.
        </Text>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function HealthProfileScreen({ navigation }) {
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  const [profile, setProfile] = useState({
    dateOfBirth: "",
    gender: null,
    bloodType: "unknown",
    height: { value: "", unit: "cm" },
    weight: { value: "", unit: "kg" },
    conditions: [],
    allergies: [],
    currentMedications: [],
    emergencyNotes: "",
    primaryDoctor: { name: "", phone: "", hospital: "" },
    insurance: { provider: "", policyNumber: "" },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const savedAnim = useRef(new Animated.Value(0)).current;

  // ── Load from cache first, then sync from API
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // 1. Show cached data immediately (offline-first)
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setProfile(JSON.parse(cached));
        setLoading(false);
      }

      // 2. Fetch fresh from API
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.profile) {
        const fresh = normalizeProfile(data.profile);
        setProfile(fresh);
        // Update cache with latest from server
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      }
    } catch {
      // Network failed — cached data already showing, no crash
    } finally {
      setLoading(false);
    }
  };

  // Normalize API response to local state shape
  const normalizeProfile = (p) => ({
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
    gender: p.gender || null,
    bloodType: p.bloodType || "unknown",
    height: {
      value: p.height?.value?.toString() || "",
      unit: p.height?.unit || "cm",
    },
    weight: {
      value: p.weight?.value?.toString() || "",
      unit: p.weight?.unit || "kg",
    },
    conditions: p.conditions || [],
    allergies: p.allergies || [],
    currentMedications: p.currentMedications || [],
    emergencyNotes: p.emergencyNotes || "",
    primaryDoctor: {
      name: p.primaryDoctor?.name || "",
      phone: p.primaryDoctor?.phone || "",
      hospital: p.primaryDoctor?.hospital || "",
    },
    insurance: {
      provider: p.insurance?.provider || "",
      policyNumber: p.insurance?.policyNumber || "",
    },
  });

  const setField = (path, value) => {
    setProfile((prev) => {
      const parts = path.split(".");
      if (parts.length === 1) return { ...prev, [path]: value };
      return {
        ...prev,
        [parts[0]]: { ...prev[parts[0]], [parts[1]]: value },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...profile,
        height: { value: parseFloat(profile.height.value) || null, unit: "cm" },
        weight: { value: parseFloat(profile.weight.value) || null, unit: "kg" },
        dateOfBirth: profile.dateOfBirth || null,
      };

      console.log("Saving body:", JSON.stringify(body));
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        // Cache the saved profile locally
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(profile));
        showSavedBadge();
      } else {
        Alert.alert("Save failed", data.message || "Please try again.");
      }
    } catch {
      // Save offline — cached locally, will sync when online
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(profile));
      showSavedBadge();
    } finally {
      setSaving(false);
    }
  };

  const showSavedBadge = () => {
    setSavedBadge(true);
    Animated.sequence([
      Animated.timing(savedAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(savedAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSavedBadge(false));
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={C.crimson} size="large" />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />

      {/* ── Static header ── */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Profile</Text>
          {/* Saved badge */}
          <Animated.View
            style={[
              styles.savedBadge,
              { opacity: savedAnim, transform: [{ scale: savedAnim }] },
            ]}>
            <Text style={styles.savedBadgeText}>✓ Saved</Text>
          </Animated.View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Completion bar */}
          <CompletionBar profile={profile} />

          {/* ── Basic Info ── */}
          <Section title="Basic Information" icon="👤" delay={60}>
            <Field
              label="Date of Birth"
              value={profile.dateOfBirth}
              onChangeText={(v) => setField("dateOfBirth", v)}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
            <PillSelector
              label="Gender"
              options={GENDERS}
              value={profile.gender}
              onChange={(v) => setField("gender", v)}
              labelMap={GENDER_LABELS}
            />
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Height (cm)"
                  value={profile.height.value}
                  onChangeText={(v) => setField("height.value", v)}
                  placeholder="175"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Weight (kg)"
                  value={profile.weight.value}
                  onChangeText={(v) => setField("weight.value", v)}
                  placeholder="70"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Section>

          {/* ── Medical Info ── */}
          <Section title="Medical Information" icon="🩺" delay={120}>
            <PillSelector
              label="Blood Type"
              options={BLOOD_TYPES}
              value={profile.bloodType}
              onChange={(v) => setField("bloodType", v || "unknown")}
            />
            <TagInput
              label="Medical Conditions"
              tags={profile.conditions}
              onChange={(v) => setField("conditions", v)}
              placeholder="e.g. Diabetes, Hypertension..."
            />
            <TagInput
              label="Allergies"
              tags={profile.allergies}
              onChange={(v) => setField("allergies", v)}
              placeholder="e.g. Penicillin, Peanuts..."
            />
            <TagInput
              label="Current Medications"
              tags={profile.currentMedications}
              onChange={(v) => setField("currentMedications", v)}
              placeholder="e.g. Metformin 500mg..."
            />
          </Section>

          {/* ── Emergency Notes ── */}
          <Section title="Emergency Notes" icon="🚨" delay={180}>
            <Text style={styles.emergencyHint}>
              This information is shown to first responders in an emergency. Be
              concise and accurate.
            </Text>
            <Field
              label="Notes for First Responders"
              value={profile.emergencyNotes}
              onChangeText={(v) => setField("emergencyNotes", v)}
              placeholder="e.g. Diabetic. Allergic to penicillin. Takes insulin..."
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {profile.emergencyNotes.length}/500
            </Text>
          </Section>

          {/* ── Primary Doctor ── */}
          <Section title="Primary Doctor" icon="👨‍⚕️" delay={240}>
            <Field
              label="Doctor's Name"
              value={profile.primaryDoctor.name}
              onChangeText={(v) => setField("primaryDoctor.name", v)}
              placeholder="Dr. Mensah"
            />
            <Field
              label="Phone Number"
              value={profile.primaryDoctor.phone}
              onChangeText={(v) => setField("primaryDoctor.phone", v)}
              placeholder="+233 20 000 0000"
              keyboardType="phone-pad"
            />
            <Field
              label="Hospital / Clinic"
              value={profile.primaryDoctor.hospital}
              onChangeText={(v) => setField("primaryDoctor.hospital", v)}
              placeholder="Korle Bu Teaching Hospital"
            />
          </Section>

          {/* ── Insurance ── */}
          <Section title="Insurance" icon="🏥" delay={300}>
            <Field
              label="Insurance Provider"
              value={profile.insurance.provider}
              onChangeText={(v) => setField("insurance.provider", v)}
              placeholder="NHIS / Company name"
            />
            <Field
              label="Policy Number"
              value={profile.insurance.policyNumber}
              onChangeText={(v) => setField("insurance.policyNumber", v)}
              placeholder="Policy number"
            />
          </Section>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}>
            {saving ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    gap: 12,
  },
  loadingText: { fontFamily: F.medium, fontSize: 14, color: C.textMuted },

  // Header
  headerSafe: { backgroundColor: C.crimsonDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.crimsonDeep,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backArrow: {
    fontSize: 28,
    color: C.white,
    fontFamily: F.light,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },
  savedBadge: {
    backgroundColor: C.emerald,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  savedBadgeText: { fontFamily: F.bold, fontSize: 12, color: C.white },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Completion bar
  completionWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  completionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  completionLabel: { fontFamily: F.bold, fontSize: 13, color: C.textDark },
  completionPct: { fontFamily: F.extraBold, fontSize: 18 },
  completionTrack: {
    height: 6,
    backgroundColor: C.inputBorder,
    borderRadius: 3,
    overflow: "hidden",
  },
  completionFill: { height: "100%", borderRadius: 3 },
  completionHint: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },

  // Section
  section: { marginTop: 20, marginHorizontal: 20 },
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
    gap: 4,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },

  // Field
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textMid,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldInput: {
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textDark,
  },
  fieldInputFocused: { borderColor: C.crimson },
  fieldInputMulti: { height: 100, textAlignVertical: "top", paddingTop: 12 },
  rowFields: { flexDirection: "row", gap: 12 },

  // Char count
  charCount: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    textAlign: "right",
    marginTop: 4,
  },

  // Emergency hint
  emergencyHint: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.amber,
    backgroundColor: C.amberPale,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    lineHeight: 19,
  },

  // Pills
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  pillActive: { backgroundColor: C.crimsonPale, borderColor: C.crimson },
  pillText: { fontFamily: F.semiBold, fontSize: 13, color: C.textMuted },
  pillTextActive: { color: C.crimson, fontFamily: F.bold },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.crimsonPale,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { fontFamily: F.semiBold, fontSize: 13, color: C.crimson },
  tagRemove: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.crimson,
    lineHeight: 18,
  },
  tagInputRow: { flexDirection: "row", gap: 8 },
  tagInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textDark,
  },
  tagAddBtn: {
    backgroundColor: C.crimson,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tagAddText: { fontFamily: F.bold, fontSize: 13, color: C.white },

  // Save button
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: C.crimson,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  saveBtnText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.3,
  },
});
