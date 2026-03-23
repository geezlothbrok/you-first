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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/slices/authSlice";
import { cancelAppointmentReminder, scheduleAppointmentReminder } from "../hooks/notificationScheduler";

const { width } = Dimensions.get("window");

const ICONS = {
  calendarImage: require("../../assets/icons/calendar-image.png"),
};

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

const API_URL = "http://localhost:3000/api/appointments";
const CACHE_KEY = "appointments_cache";

const APPOINTMENT_TYPES = [
  { key: "checkup", label: "Check-up", emoji: "🩺", color: C.crimson },
  { key: "follow_up", label: "Follow-up", emoji: "🔄", color: C.amber },
  { key: "consultation", label: "Consultation", emoji: "💬", color: C.blue },
  { key: "procedure", label: "Procedure", emoji: "⚕️", color: C.purple },
  { key: "lab_test", label: "Lab Test", emoji: "🧪", color: "#0891B2" },
  { key: "vaccination", label: "Vaccination", emoji: "💉", color: C.emerald },
  { key: "other", label: "Other", emoji: "📋", color: C.textMuted },
];

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", color: C.crimson, bg: C.crimsonPale },
  completed: { label: "Completed", color: C.emerald, bg: C.emeraldPale },
  cancelled: { label: "Cancelled", color: C.textMuted, bg: "#F3F4F6" },
};

const EMPTY_FORM = {
  doctorName: "",
  specialty: "",
  hospital: "",
  date: "",
  time: "",
  type: "checkup",
  notes: "",
  reminderEnabled: true,
};

// ─── Format date nicely ───────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDayAndMonth = (dateStr) => {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.toLocaleString("en", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleString("en", { weekday: "short" }),
  };
};

const isToday = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isTomorrow = (dateStr) => {
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

const getDayLabel = (dateStr) => {
  if (isToday(dateStr)) return "Today";
  if (isTomorrow(dateStr)) return "Tomorrow";
  return formatDate(dateStr);
};

// ─── Appointment card ─────────────────────────────────────────────────────
function AppointmentCard({ apt, onEdit, onDelete, onStatusChange, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  const typeConfig =
    APPOINTMENT_TYPES.find((t) => t.key === apt.type) || APPOINTMENT_TYPES[6];
  const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.upcoming;
  const { day, month, weekday } = getDayAndMonth(apt.date);
  const dayLabel = getDayLabel(apt.date);
  const isUpcoming = apt.status === "upcoming";

  return (
    <Animated.View
      style={[
        styles.aptCard,
        apt.status === "cancelled" && styles.aptCardCancelled,
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
      {/* Top accent bar */}
      <View style={[styles.aptAccent, { backgroundColor: typeConfig.color }]} />

      <View style={styles.aptContent}>
        {/* Left — date box */}
        <View
          style={[
            styles.dateBox,
            { backgroundColor: `${typeConfig.color}15` },
          ]}>
          <Text style={[styles.dateDay, { color: typeConfig.color }]}>
            {day}
          </Text>
          <Text style={[styles.dateMonth, { color: typeConfig.color }]}>
            {month}
          </Text>
          <Text style={styles.dateWeekday}>{weekday}</Text>
        </View>

        {/* Center — info */}
        <View style={styles.aptInfo}>
          {/* Day label badge */}
          {(isToday(apt.date) || isTomorrow(apt.date)) && isUpcoming && (
            <View
              style={[
                styles.dayLabelBadge,
                {
                  backgroundColor: isToday(apt.date)
                    ? C.crimsonPale
                    : C.amberPale,
                },
              ]}>
              <Text
                style={[
                  styles.dayLabelText,
                  { color: isToday(apt.date) ? C.crimson : C.amber },
                ]}>
                {dayLabel}
              </Text>
            </View>
          )}

          <Text style={styles.aptDoctor}>{apt.doctorName}</Text>

          {apt.specialty && (
            <Text style={styles.aptSpecialty}>{apt.specialty}</Text>
          )}

          <View style={styles.aptMetaRow}>
            <Text style={styles.aptTypeEmoji}>{typeConfig.emoji}</Text>
            <Text style={styles.aptTypeName}>{typeConfig.label}</Text>
            <Text style={styles.aptDot}>·</Text>
            <Image
              source={require("../../assets/icons/calendar-image.png")}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
            <Text style={styles.aptTime}>{apt.time}</Text>
          </View>

          {apt.hospital && (
            <Text style={styles.aptHospital} numberOfLines={1}>
              🏥 {apt.hospital}
            </Text>
          )}

          {/* Status badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Right — actions */}
        <View style={styles.aptActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(apt)}>
            <Text style={styles.actionEdit}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(apt)}>
            <Text>🗑️</Text>
          </TouchableOpacity>
          {isUpcoming && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onStatusChange(apt, "completed")}>
              <Text>✅</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────
function AppointmentModal({ visible, appointment, onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      if (appointment) {
        setForm({
          doctorName: appointment.doctorName,
          specialty: appointment.specialty || "",
          hospital: appointment.hospital || "",
          date: appointment.date?.split("T")[0] || "",
          time: appointment.time,
          type: appointment.type,
          notes: appointment.notes || "",
          reminderEnabled: appointment.reminderEnabled,
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
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, appointment]);

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

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
              {appointment ? "Edit Appointment" : "New Appointment"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Doctor */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Doctor's Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.doctorName}
                onChangeText={(v) => setField("doctorName", v)}
                placeholder="Dr. Mensah"
                placeholderTextColor={C.textPlaceholder}
                autoCapitalize="words"
                selectionColor={C.crimson}
              />
            </View>

            {/* Specialty + Hospital row */}
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Specialty</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.specialty}
                  onChangeText={(v) => setField("specialty", v)}
                  placeholder="Cardiology"
                  placeholderTextColor={C.textPlaceholder}
                  autoCapitalize="words"
                  selectionColor={C.crimson}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Hospital</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.hospital}
                  onChangeText={(v) => setField("hospital", v)}
                  placeholder="Korle Bu"
                  placeholderTextColor={C.textPlaceholder}
                  autoCapitalize="words"
                  selectionColor={C.crimson}
                />
              </View>
            </View>

            {/* Date + Time row */}
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Date *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.date}
                  onChangeText={(v) => setField("date", v)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textPlaceholder}
                  keyboardType="numbers-and-punctuation"
                  selectionColor={C.crimson}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Time *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.time}
                  onChangeText={(v) => setField("time", v)}
                  placeholder="10:30 AM"
                  placeholderTextColor={C.textPlaceholder}
                  selectionColor={C.crimson}
                />
              </View>
            </View>

            {/* Type */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Appointment Type</Text>
              <View style={styles.typeGrid}>
                {APPOINTMENT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeBtn,
                      form.type === t.key && [
                        styles.typeBtnActive,
                        {
                          borderColor: t.color,
                          backgroundColor: `${t.color}12`,
                        },
                      ],
                    ]}
                    onPress={() => setField("type", t.key)}>
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        form.type === t.key && {
                          color: t.color,
                          fontFamily: F.bold,
                        },
                      ]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMulti]}
                value={form.notes}
                onChangeText={(v) => setField("notes", v)}
                placeholder="Any preparation notes, questions to ask..."
                placeholderTextColor={C.textPlaceholder}
                multiline
                maxLength={500}
                selectionColor={C.crimson}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{form.notes.length}/500</Text>
            </View>

            {/* Reminder */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Reminder Notification</Text>
                <Text style={styles.toggleHint}>
                  Get reminded 24 hours before
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
              style={[styles.saveBtn, saving && { opacity: 0.8 }]}
              onPress={() => onSave(form)}
              disabled={saving}
              activeOpacity={0.88}>
              {saving ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {appointment ? "Save Changes" : "Add Appointment"}
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
export default function AppointmentsScreen({ navigation }) {
  const token = useSelector(selectToken);
  const [tab, setTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApt, setEditingApt] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [tab]);

  const loadAppointments = async () => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${tab}`);
      if (cached) {
        setAppointments(JSON.parse(cached));
        setLoading(false);
      }

      const endpoint =
        tab === "upcoming" ? `${API_URL}/upcoming` : `${API_URL}/`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setAppointments(data.appointments);
        await AsyncStorage.setItem(
          `${CACHE_KEY}_${tab}`,
          JSON.stringify(data.appointments),
        );
      }
    } catch {
      // Use cached data
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    if (!form.doctorName.trim() || !form.date || !form.time.trim()) {
      Alert.alert("Required", "Doctor name, date and time are required.");
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!editingApt;
      const url = isEditing ? `${API_URL}/${editingApt._id}` : `${API_URL}/`;
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          specialty: form.specialty.trim() || null,
          hospital: form.hospital.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to save.");
        return;
      }
      await scheduleAppointmentReminder(data.appointment);
      await loadAppointments();
      setModalVisible(false);
      setEditingApt(null);
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (apt, status) => {
    try {
      await fetch(`${API_URL}/${apt._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      await loadAppointments();
    } catch {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleDelete = (apt) => {
    Alert.alert(
      "Remove Appointment",
      `Remove appointment with ${apt.doctorName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_URL}/${apt._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              await cancelAppointmentReminder(apt._id);
              await loadAppointments();
            } catch {
              Alert.alert("Error", "Failed to remove appointment.");
            }
          },
        },
      ],
    );
  };

  // Group appointments by month
  const groupedAppointments = appointments.reduce((groups, apt) => {
    const date = new Date(apt.date);
    const key = date.toLocaleString("en", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(apt);
    return groups;
  }, {});

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
          <Text style={styles.headerTitle}>Appointments</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setEditingApt(null);
              setModalVisible(true);
            }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {["upcoming", "all"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "upcoming" ? "Upcoming" : "All"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={C.crimson} size="large" />
          <Text style={styles.loadingText}>Loading appointments…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
             <Image
  source={require("../../assets/icons/calendar-image.png")}
  style={styles.emptyIconImg}
  resizeMode="contain"
/>
              <Text style={styles.emptyTitle}>No Appointments</Text>
              <Text style={styles.emptySubtitle}>
                {tab === "upcoming"
                  ? "You have no upcoming appointments. Stay on top of your health!"
                  : "No appointments recorded yet."}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.emptyAddBtnText}>Add Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            Object.entries(groupedAppointments).map(([month, apts]) => (
              <View key={month} style={styles.group}>
                <Text style={styles.groupLabel}>{month}</Text>
                {apts.map((apt, i) => (
                  <AppointmentCard
                    key={apt._id}
                    apt={apt}
                    index={i}
                    onEdit={(a) => {
                      setEditingApt(a);
                      setModalVisible(true);
                    }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <AppointmentModal
        visible={modalVisible}
        appointment={editingApt}
        onClose={() => {
          setModalVisible(false);
          setEditingApt(null);
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
  calendarIcon: { width: 14, height: 14 },

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
  tabText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  tabTextActive: { color: C.crimson, fontFamily: F.bold },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Groups
  group: { marginTop: 20 },
  groupLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Appointment card
  aptCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  aptCardCancelled: { opacity: 0.6 },
  aptAccent: { height: 4 },
  aptContent: { flexDirection: "row", padding: 14, gap: 12 },

  // Date box
  dateBox: {
    width: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 1,
  },
  dateDay: { fontFamily: F.extraBold, fontSize: 22, lineHeight: 26 },
  dateMonth: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.5 },
  dateWeekday: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },

  // Apt info
  aptInfo: { flex: 1, gap: 4 },
  dayLabelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 2,
  },
  dayLabelText: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.3 },
  aptDoctor: { fontFamily: F.extraBold, fontSize: 16, color: C.textDark },
  aptSpecialty: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  aptMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  aptTypeEmoji: { fontSize: 12 },
  aptTypeName: { fontFamily: F.semiBold, fontSize: 13, color: C.textMid },
  aptDot: { color: C.textMuted, fontSize: 12 },
  aptTime: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  aptHospital: { fontFamily: F.regular, fontSize: 13, color: C.textMuted },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  statusText: { fontFamily: F.bold, fontSize: 11 },

  // Apt actions
  aptActions: { gap: 2, justifyContent: "center" },
  actionBtn: { padding: 6 },
  actionEdit: { fontSize: 14 },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  
  emptyTitle: {
    fontFamily: F.extraBold,
    fontSize: 25,
    color: C.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyAddBtn: {
  backgroundColor: C.crimson,
  paddingVertical: 16,
  borderRadius: 14,
  alignSelf: "stretch",   // ← full width
  alignItems: "center",
  shadowColor: C.crimson,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: 6,
},
  emptyAddBtnText: { fontFamily: F.bold, fontSize: 17, color: C.white },

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
  modalClose: {
    fontSize: 16,
    color: C.textMuted,
    fontFamily: F.bold,
    padding: 4,
  },
  modalField: { marginBottom: 16 },
  modalLabel: {
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
  modalInputMulti: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  charCount: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  rowFields: { flexDirection: "row", gap: 12, marginBottom: 16 },

  // Type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  typeBtnActive: {},
  typeEmoji: { fontSize: 14 },
  typeLabel: { fontFamily: F.semiBold, fontSize: 12, color: C.textMuted },

  // Toggle
  toggleRow: {
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
  toggleLabel: { fontFamily: F.bold, fontSize: 13, color: C.textDark },
  toggleHint: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  // Save
  saveBtn: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    paddingVertical: 18, // slightly taller
    alignItems: "center",
    marginTop: 8,
    width: "100%", // full width
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    fontFamily: F.extraBold, // already bold
    fontSize: 18, // was 16
    color: C.white,
    letterSpacing: 0.5,
  },
});
