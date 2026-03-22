import React, { useState, useEffect, useRef } from "react";
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
  Alert,
  Dimensions,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/slices/authSlice";

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
  purple: "#7C3AED",
  purplePale: "#F5F3FF",
  blue: "#2563EB",
  bluePale: "#EFF6FF",
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

const API_URL = "http://localhost:3000/api/medications";
const CACHE_KEY = "medications_cache";
const TODAY_CACHE_KEY = "medications_today_cache";

const FREQUENCIES = [
  { key: "once_daily", label: "Once daily", times: 1 },
  { key: "twice_daily", label: "Twice daily", times: 2 },
  { key: "three_times_daily", label: "3× daily", times: 3 },
  { key: "four_times_daily", label: "4× daily", times: 4 },
  { key: "weekly", label: "Weekly", times: 1 },
  { key: "as_needed", label: "As needed", times: 1 },
];

const PILL_COLORS = [
  "#C0152A",
  "#E8394D",
  "#D97706",
  "#2EAF6F",
  "#7C3AED",
  "#2563EB",
  "#DB2777",
  "#0891B2",
];

const EMPTY_FORM = {
  name: "",
  dosage: "",
  frequency: "once_daily",
  times: ["08:00"],
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  instructions: "",
  color: "#C0152A",
  reminderEnabled: true,
};

// ─── Adherence ring ───────────────────────────────────────────────────────
function AdherenceRing({ taken, total }) {
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  const color = pct >= 80 ? C.emerald : pct >= 50 ? C.amber : C.crimson;
  return (
    <View style={styles.adherenceRing}>
      <View style={[styles.adherenceInner, { borderColor: color }]}>
        <Text style={[styles.adherencePct, { color }]}>{pct}%</Text>
        <Text style={styles.adherenceLabel}>today</Text>
      </View>
    </View>
  );
}

// ─── Medication card (today view) ─────────────────────────────────────────
function TodayCard({ med, onTaken, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTaken = () => {
    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(checkScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => onTaken(med));
  };

  return (
    <Animated.View
      style={[
        styles.todayCard,
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
        med.takenToday && styles.todayCardTaken,
      ]}>
      {/* Color strip */}
      <View
        style={[styles.colorStrip, { backgroundColor: med.color || C.crimson }]}
      />

      <View style={styles.todayCardContent}>
        <View style={styles.todayCardLeft}>
          {/* Pill icon */}
          <View
            style={[
              styles.pillIcon,
              { backgroundColor: `${med.color || C.crimson}18` },
            ]}>
            <Text style={styles.pillEmoji}>💊</Text>
          </View>
          <View style={styles.todayCardInfo}>
            <Text
              style={[styles.todayMedName, med.takenToday && styles.takenText]}>
              {med.name}
            </Text>
            <Text style={styles.todayMedDosage}>{med.dosage}</Text>
            <View style={styles.timesRow}>
              {med.times.map((t, i) => (
                <View key={i} style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>🕐 {t}</Text>
                </View>
              ))}
            </View>
            {med.instructions && (
              <Text style={styles.todayInstructions}>
                📋 {med.instructions}
              </Text>
            )}
          </View>
        </View>

        {/* Taken button */}
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <TouchableOpacity
            style={[styles.takenBtn, med.takenToday && styles.takenBtnDone]}
            onPress={handleTaken}
            disabled={med.takenToday}
            activeOpacity={0.8}>
            <Text style={styles.takenBtnIcon}>
              {med.takenToday ? "✓" : "○"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── All medications card ─────────────────────────────────────────────────
function MedCard({ med, onEdit, onDelete, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  const freq = FREQUENCIES.find((f) => f.key === med.frequency);

  return (
    <Animated.View
      style={[
        styles.medCard,
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
      <View
        style={[
          styles.medCardAccent,
          { backgroundColor: med.color || C.crimson },
        ]}
      />
      <View style={styles.medCardContent}>
        <View style={styles.medCardLeft}>
          <Text style={styles.medCardName}>{med.name}</Text>
          <Text style={styles.medCardDosage}>
            {med.dosage} · {freq?.label}
          </Text>
          <View style={styles.timesRow}>
            {med.times.slice(0, 3).map((t, i) => (
              <View
                key={i}
                style={[
                  styles.timeBadge,
                  {
                    borderColor: `${med.color || C.crimson}40`,
                    backgroundColor: `${med.color || C.crimson}10`,
                  },
                ]}>
                <Text
                  style={[
                    styles.timeBadgeText,
                    { color: med.color || C.crimson },
                  ]}>
                  {t}
                </Text>
              </View>
            ))}
            {med.times.length > 3 && (
              <Text style={styles.moreTimesText}>
                +{med.times.length - 3} more
              </Text>
            )}
          </View>
          {med.instructions && (
            <Text style={styles.medCardInstructions} numberOfLines={1}>
              {med.instructions}
            </Text>
          )}
        </View>
        <View style={styles.medCardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(med)}>
            <Text style={styles.actionEdit}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(med)}>
            <Text style={styles.actionDelete}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Time picker row ──────────────────────────────────────────────────────
function TimePicker({ times, onChange }) {
  const updateTime = (index, value) => {
    const updated = [...times];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <View style={styles.timePickerWrapper}>
      {times.map((t, i) => (
        <View key={i} style={styles.timePickerRow}>
          <Text style={styles.timePickerLabel}>Dose {i + 1}</Text>
          <TextInput
            style={styles.timePickerInput}
            value={t}
            onChangeText={(v) => updateTime(i, v)}
            placeholder="08:00"
            placeholderTextColor={C.textPlaceholder}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            selectionColor={C.crimson}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────
function MedModal({ visible, medication, onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      if (medication) {
        setForm({
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          times: medication.times,
          startDate: medication.startDate?.split("T")[0] || "",
          endDate: medication.endDate?.split("T")[0] || "",
          instructions: medication.instructions || "",
          color: medication.color || "#C0152A",
          reminderEnabled: medication.reminderEnabled,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, medication]);

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleFrequencyChange = (freq) => {
    const freqObj = FREQUENCIES.find((f) => f.key === freq);
    const defaultTimes = ["08:00", "14:00", "20:00", "22:00"];
    const newTimes = Array.from(
      { length: freqObj.times },
      (_, i) => defaultTimes[i] || "08:00",
    );
    setForm((p) => ({ ...p, frequency: freq, times: newTimes }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {medication ? "Edit Medication" : "Add Medication"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Name */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Medication Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(v) => setField("name", v)}
                placeholder="e.g. Metformin"
                placeholderTextColor={C.textPlaceholder}
                autoCapitalize="words"
                selectionColor={C.crimson}
              />
            </View>

            {/* Dosage */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Dosage *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.dosage}
                onChangeText={(v) => setField("dosage", v)}
                placeholder="e.g. 500mg, 2 tablets"
                placeholderTextColor={C.textPlaceholder}
                selectionColor={C.crimson}
              />
            </View>

            {/* Frequency */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Frequency *</Text>
              <View style={styles.freqGrid}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.freqBtn,
                      form.frequency === f.key && styles.freqBtnActive,
                    ]}
                    onPress={() => handleFrequencyChange(f.key)}>
                    <Text
                      style={[
                        styles.freqBtnText,
                        form.frequency === f.key && styles.freqBtnTextActive,
                      ]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Times */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Time(s) to take *</Text>
              <TimePicker
                times={form.times}
                onChange={(v) => setField("times", v)}
              />
            </View>

            {/* Dates row */}
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Start Date *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.startDate}
                  onChangeText={(v) => setField("startDate", v)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textPlaceholder}
                  keyboardType="numbers-and-punctuation"
                  selectionColor={C.crimson}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>End Date</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.endDate}
                  onChangeText={(v) => setField("endDate", v)}
                  placeholder="Ongoing"
                  placeholderTextColor={C.textPlaceholder}
                  keyboardType="numbers-and-punctuation"
                  selectionColor={C.crimson}
                />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>
                Instructions (optional)
              </Text>
              <TextInput
                style={styles.modalInput}
                value={form.instructions}
                onChangeText={(v) => setField("instructions", v)}
                placeholder="e.g. Take with food, avoid alcohol..."
                placeholderTextColor={C.textPlaceholder}
                maxLength={200}
                selectionColor={C.crimson}
              />
            </View>

            {/* Color picker */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Pill Color</Text>
              <View style={styles.colorRow}>
                {PILL_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorDot,
                      { backgroundColor: col },
                      form.color === col && styles.colorDotActive,
                    ]}
                    onPress={() => setField("color", col)}
                  />
                ))}
              </View>
            </View>

            {/* Reminder toggle */}
            <View style={styles.modalToggleRow}>
              <View>
                <Text style={styles.modalToggleLabel}>
                  Reminder Notifications
                </Text>
                <Text style={styles.modalToggleHint}>
                  Get notified when it's time to take this
                </Text>
              </View>
              <Switch
                value={form.reminderEnabled}
                onValueChange={(v) => setField("reminderEnabled", v)}
                trackColor={{ false: C.inputBorder, true: C.emerald }}
                thumbColor={C.white}
              />
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && { opacity: 0.8 }]}
              onPress={() => onSave(form)}
              disabled={saving}
              activeOpacity={0.88}>
              {saving ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>
                  {medication ? "Save Changes" : "Add Medication"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function MedicationsScreen({ navigation }) {
  const token = useSelector(selectToken);
  const [tab, setTab] = useState("today"); // "today" | "all"
  const [todayMeds, setTodayMeds] = useState([]);
  const [allMeds, setAllMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      // Load from cache first
      const [cachedToday, cachedAll] = await Promise.all([
        AsyncStorage.getItem(TODAY_CACHE_KEY),
        AsyncStorage.getItem(CACHE_KEY),
      ]);
      if (cachedToday) setTodayMeds(JSON.parse(cachedToday));
      if (cachedAll) setAllMeds(JSON.parse(cachedAll));
      if (cachedToday || cachedAll) setLoading(false);

      // Fetch fresh
      const [todayRes, allRes] = await Promise.all([
        fetch(`${API_URL}/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [todayData, allData] = await Promise.all([
        todayRes.json(),
        allRes.json(),
      ]);

      if (todayRes.ok) {
        setTodayMeds(todayData.medications);
        await AsyncStorage.setItem(
          TODAY_CACHE_KEY,
          JSON.stringify(todayData.medications),
        );
      }
      if (allRes.ok) {
        setAllMeds(allData.medications);
        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify(allData.medications),
        );
      }
    } catch {
      // Use cached data
    } finally {
      setLoading(false);
    }
  };

  const handleTaken = async (med) => {
    if (med.takenToday) return;
    try {
      await fetch(`${API_URL}/${med._id}/taken`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic update
      const updated = todayMeds.map((m) =>
        m._id === med._id ? { ...m, takenToday: true } : m,
      );
      setTodayMeds(updated);
      await AsyncStorage.setItem(TODAY_CACHE_KEY, JSON.stringify(updated));
    } catch {
      Alert.alert("Error", "Could not mark as taken. Try again.");
    }
  };

  const handleSave = async (form) => {
    if (!form.name.trim() || !form.dosage.trim() || !form.startDate) {
      Alert.alert("Required", "Name, dosage and start date are required.");
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!editingMed;
      const url = isEditing ? `${API_URL}/${editingMed._id}` : `${API_URL}/`;
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          endDate: form.endDate || null,
          instructions: form.instructions.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to save.");
        return;
      }
      await loadAll();
      setModalVisible(false);
      setEditingMed(null);
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (med) => {
    Alert.alert(
      "Remove Medication",
      `Remove ${med.name} from your medications?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_URL}/${med._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadAll();
            } catch {
              Alert.alert("Error", "Failed to remove medication.");
            }
          },
        },
      ],
    );
  };

  const takenCount = todayMeds.filter((m) => m.takenToday).length;

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
          <Text style={styles.headerTitle}>Medications</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setEditingMed(null);
              setModalVisible(true);
            }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {["today", "all"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}>
              <Text
                style={[
                  styles.tabBtnText,
                  tab === t && styles.tabBtnTextActive,
                ]}>
                {t === "today" ? "Today" : "All Medications"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={C.crimson} size="large" />
          <Text style={styles.loadingText}>Loading medications…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {tab === "today" ? (
            <>
              {/* Adherence summary */}
              {todayMeds.length > 0 && (
                <View style={styles.adherenceSummary}>
                  <AdherenceRing taken={takenCount} total={todayMeds.length} />
                  <View style={styles.adherenceInfo}>
                    <Text style={styles.adherenceTitle}>
                      {takenCount === todayMeds.length
                        ? "All done for today! 🎉"
                        : `${todayMeds.length - takenCount} remaining`}
                    </Text>
                    <Text style={styles.adherenceSubtitle}>
                      {takenCount} of {todayMeds.length} medications taken
                    </Text>
                  </View>
                </View>
              )}

              {todayMeds.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>💊</Text>
                  <Text style={styles.emptyTitle}>No Medications Today</Text>
                  <Text style={styles.emptySubtitle}>
                    Add medications to track your daily adherence.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => setModalVisible(true)}>
                    <Text style={styles.emptyAddBtnText}>Add Medication</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.list}>
                  {todayMeds.map((med, i) => (
                    <TodayCard
                      key={med._id}
                      med={med}
                      onTaken={handleTaken}
                      index={i}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {allMeds.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyTitle}>No Medications Added</Text>
                  <Text style={styles.emptySubtitle}>
                    Track your medications and never miss a dose.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => setModalVisible(true)}>
                    <Text style={styles.emptyAddBtnText}>
                      Add First Medication
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.list}>
                  {allMeds.map((med, i) => (
                    <MedCard
                      key={med._id}
                      med={med}
                      index={i}
                      onEdit={(m) => {
                        setEditingMed(m);
                        setModalVisible(true);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <MedModal
        visible={modalVisible}
        medication={editingMed}
        onClose={() => {
          setModalVisible(false);
          setEditingMed(null);
        }}
        onSave={handleSave}
        saving={saving}
      />
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
    paddingBottom: 12,
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
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { fontFamily: F.bold, fontSize: 13, color: C.white },

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabBtnActive: { backgroundColor: C.white },
  tabBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  tabBtnTextActive: { color: C.crimson, fontFamily: F.bold },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  list: { paddingHorizontal: 20, gap: 12, paddingTop: 16 },

  // Adherence summary
  adherenceSummary: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  adherenceRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  adherenceInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  adherencePct: { fontFamily: F.extraBold, fontSize: 14 },
  adherenceLabel: { fontFamily: F.regular, fontSize: 9, color: C.textMuted },
  adherenceInfo: { flex: 1 },
  adherenceTitle: { fontFamily: F.extraBold, fontSize: 15, color: C.textDark },
  adherenceSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },

  // Today card
  todayCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  todayCardTaken: { opacity: 0.65 },
  colorStrip: { width: 5 },
  todayCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  todayCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pillEmoji: { fontSize: 20 },
  todayCardInfo: { flex: 1 },
  todayMedName: {
    fontFamily: F.extraBold,
    fontSize: 15,
    color: C.textDark,
    marginBottom: 2,
  },
  takenText: { textDecorationLine: "line-through", color: C.textMuted },
  todayMedDosage: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 6,
  },
  timesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  timeBadgeText: { fontFamily: F.semiBold, fontSize: 11, color: C.textMid },
  todayInstructions: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 5,
  },
  takenBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  takenBtnDone: { backgroundColor: C.emerald, borderColor: C.emerald },
  takenBtnIcon: { fontFamily: F.extraBold, fontSize: 16, color: C.textMuted },

  // All meds card
  medCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  medCardAccent: { height: 4 },
  medCardContent: { flexDirection: "row", alignItems: "center", padding: 14 },
  medCardLeft: { flex: 1 },
  medCardName: {
    fontFamily: F.extraBold,
    fontSize: 15,
    color: C.textDark,
    marginBottom: 2,
  },
  medCardDosage: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 6,
  },
  moreTimesText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    alignSelf: "center",
  },
  medCardInstructions: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
  },
  medCardActions: { gap: 4 },
  actionBtn: { padding: 8 },
  actionEdit: { fontSize: 16 },
  actionDelete: { fontSize: 16 },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 52,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontFamily: F.extraBold,
    fontSize: 20,
    color: C.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: C.crimson,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyAddBtnText: { fontFamily: F.bold, fontSize: 15, color: C.white },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,6,8,0.5)",
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.inputBorder,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalTitle: {
    flex: 1,
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.textDark,
  },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { fontSize: 16, color: C.textMuted, fontFamily: F.bold },
  modalField: { marginBottom: 16 },
  modalFieldLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textMid,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalInput: {
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
  rowFields: { flexDirection: "row", gap: 12, marginBottom: 16 },

  // Frequency grid
  freqGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  freqBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  freqBtnActive: { backgroundColor: C.crimsonPale, borderColor: C.crimson },
  freqBtnText: { fontFamily: F.semiBold, fontSize: 12, color: C.textMuted },
  freqBtnTextActive: { color: C.crimson, fontFamily: F.bold },

  // Time picker
  timePickerWrapper: { gap: 8 },
  timePickerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timePickerLabel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textMuted,
    width: 50,
  },
  timePickerInput: {
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

  // Color picker
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: C.textDark },

  // Toggle
  modalToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: C.inputBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  modalToggleLabel: { fontFamily: F.bold, fontSize: 13, color: C.textDark },
  modalToggleHint: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  // Save button
  modalSaveBtn: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalSaveBtnText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.3,
  },
});
