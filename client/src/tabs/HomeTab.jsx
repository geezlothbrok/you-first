import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";



const { width } = Dimensions.get("window");

const C = {
  bg: "#FFF8F8",
  white: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonLight: "#E8394D",
  crimsonPale: "#FDECEA",
  inputBorder: "#F0D0D4",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
  amber: "#D97706",
  amberPale: "#FFFBEB",
  textDark: "#1A0608",
  textMid: "#5C2D35",
  textMuted: "#9E7A7E",
  cardShadow: "rgba(192,21,42,0.08)",
};

const F = {
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semiBold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extraBold: "Manrope-ExtraBold",
};

// ── Placeholder data (will be replaced by real data in Phase 2/3)
const ACTIVITY_STATS = [
  {
    icon: "👟",
    label: "Steps",
    value: "8,432",
    unit: "today",
    color: C.crimson,
    bg: C.crimsonPale,
  },
  {
    icon: "🔥",
    label: "Calories",
    value: "1,240",
    unit: "kcal",
    color: C.amber,
    bg: C.amberPale,
  },
  {
    icon: "😴",
    label: "Sleep",
    value: "7.2",
    unit: "hours",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: "❤️",
    label: "Heart Rate",
    value: "72",
    unit: "bpm",
    color: C.crimsonLight,
    bg: C.crimsonPale,
  },
];

const MEDICATIONS = [
  { name: "Metformin", dose: "500mg", time: "8:00 AM", taken: true },
  { name: "Lisinopril", dose: "10mg", time: "2:00 PM", taken: false },
  { name: "Vitamin D", dose: "1000IU", time: "8:00 PM", taken: false },
];

const APPOINTMENTS = [
  {
    doctor: "Dr. Mensah",
    type: "General Checkup",
    date: "Mon, Apr 7",
    time: "10:30 AM",
  },
  {
    doctor: "Dr. Asante",
    type: "Cardiology",
    date: "Wed, Apr 16",
    time: "2:00 PM",
  },
];

const HEALTH_TIP =
  "Staying hydrated improves cognitive function by up to 30%. Aim for 8 glasses of water today.";

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ item, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: item.bg,
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
      <Text style={styles.statIcon}>{item.icon}</Text>
      <Text style={[styles.statValue, { color: item.color }]}>
        {item.value}
      </Text>
      <Text style={styles.statUnit}>{item.unit}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function HomeTab({ navigation }) {
  const user = useSelector(selectUser);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName?.split(" ")[0] || "there";

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}>
          {/* Hamburger */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.openDrawer()}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 16 }]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>

          {/* Notification bell */}
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Safety Status Card ── */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyLeft}>
            <View style={styles.safetyIconRing}>
              <Text style={styles.safetyIcon}>🛡️</Text>
            </View>
            <View>
              <Text style={styles.safetyTitle}>You're Protected</Text>
              <Text style={styles.safetySubtitle}>
                All safety features active
              </Text>
            </View>
          </View>
          <View style={styles.safetyBadge}>
            <View style={styles.safetyDot} />
            <Text style={styles.safetyBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* ── Activity Stats ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}>
          {ACTIVITY_STATS.map((item, i) => (
            <StatCard key={i} item={item} index={i} />
          ))}
        </ScrollView>

        {/* ── Emergency Actions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
        </View>
        <View style={styles.emergencyRow}>
          {/* SOS */}
          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: C.crimson }]}
            activeOpacity={0.85}>
            <Text style={styles.emergencyEmoji}>🆘</Text>
            <Text style={styles.emergencyLabel}>SOS</Text>
            <Text style={styles.emergencySubLabel}>Alert contacts</Text>
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: C.amber }]}
            activeOpacity={0.85}>
            <Text style={styles.emergencyEmoji}>🙏</Text>
            <Text style={styles.emergencyLabel}>Help</Text>
            <Text style={styles.emergencySubLabel}>Reach support</Text>
          </TouchableOpacity>

          {/* Ambulance */}
          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: C.emerald }]}
            activeOpacity={0.85}>
            <Text style={styles.emergencyEmoji}>🚑</Text>
            <Text style={styles.emergencyLabel}>Ambulance</Text>
            <Text style={styles.emergencySubLabel}>Call EMS</Text>
          </TouchableOpacity>
        </View>

        {/* ── Medications ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Medications</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {MEDICATIONS.map((med, i) => (
            <View
              key={i}
              style={[
                styles.medRow,
                i < MEDICATIONS.length - 1 && styles.medRowBorder,
              ]}>
              <View
                style={[
                  styles.medDot,
                  { backgroundColor: med.taken ? C.emerald : C.inputBorder },
                ]}
              />
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>
                  {med.dose} · {med.time}
                </Text>
              </View>
              <View
                style={[
                  styles.medStatus,
                  {
                    backgroundColor: med.taken ? C.emeraldPale : C.crimsonPale,
                  },
                ]}>
                <Text
                  style={[
                    styles.medStatusText,
                    { color: med.taken ? C.emerald : C.crimson },
                  ]}>
                  {med.taken ? "Taken ✓" : "Due"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Upcoming Appointments ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Add new</Text>
          </TouchableOpacity>
        </View>
        {APPOINTMENTS.map((apt, i) => (
          <View
            key={i}
            style={[
              styles.appointmentCard,
              { marginBottom: i < APPOINTMENTS.length - 1 ? 10 : 0 },
            ]}>
            <View style={styles.appointmentDateBox}>
              <Text style={styles.appointmentDateText}>
                {apt.date.split(",")[1]?.trim().split(" ")[1]}
              </Text>
              <Text style={styles.appointmentMonthText}>
                {apt.date.split(",")[1]?.trim().split(" ")[0]}
              </Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentDoctor}>{apt.doctor}</Text>
              <Text style={styles.appointmentType}>{apt.type}</Text>
              <Text style={styles.appointmentTime}>🕐 {apt.time}</Text>
            </View>
            <View style={styles.appointmentChevron}>
              <Text style={{ color: C.textMuted, fontSize: 20 }}>›</Text>
            </View>
          </View>
        ))}

        {/* ── Health Tip ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipLabel}>HEALTH TIP OF THE DAY</Text>
          </View>
          <Text style={styles.tipText}>{HEALTH_TIP}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: C.crimsonDeep,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: { width: 22, height: 2, backgroundColor: C.white, borderRadius: 2 },
  headerCenter: { flex: 1, alignItems: "center" },
  greeting: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  userName: { fontFamily: F.extraBold, fontSize: 18, color: C.white },
  bellBtn: { padding: 4, position: "relative" },
  bellIcon: { fontSize: 20 },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.emerald,
    borderWidth: 1.5,
    borderColor: C.crimsonDeep,
  },

  // Safety card
  safetyCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: C.emeraldPale,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  safetyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  safetyIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  safetyIcon: { fontSize: 20 },
  safetyTitle: { fontFamily: F.bold, fontSize: 14, color: C.emerald },
  safetySubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#059669",
    marginTop: 1,
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.emerald,
  },
  safetyBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.emerald,
    letterSpacing: 1,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: F.bold, fontSize: 16, color: C.textDark },
  sectionLink: { fontFamily: F.semiBold, fontSize: 13, color: C.crimson },

  // Stats
  statsRow: { paddingHorizontal: 20, gap: 12 },
  statCard: {
    width: 100,
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    gap: 2,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontFamily: F.extraBold, fontSize: 20 },
  statUnit: { fontFamily: F.regular, fontSize: 11, color: C.textMuted },
  statLabel: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  // Emergency
  emergencyRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  emergencyCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  emergencyEmoji: { fontSize: 24 },
  emergencyLabel: { fontFamily: F.bold, fontSize: 13, color: C.white },
  emergencySubLabel: {
    fontFamily: F.regular,
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },

  // Medications
  card: {
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  medRowBorder: { borderBottomWidth: 1, borderBottomColor: "#FFF0F1" },
  medDot: { width: 10, height: 10, borderRadius: 5 },
  medInfo: { flex: 1 },
  medName: { fontFamily: F.semiBold, fontSize: 14, color: C.textDark },
  medDose: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  medStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  medStatusText: { fontFamily: F.bold, fontSize: 11 },

  // Appointments
  appointmentCard: {
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  appointmentDateBox: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: C.crimsonPale,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentDateText: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.crimson,
  },
  appointmentMonthText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.crimson,
  },
  appointmentInfo: { flex: 1 },
  appointmentDoctor: { fontFamily: F.bold, fontSize: 14, color: C.textDark },
  appointmentType: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  appointmentTime: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMid,
    marginTop: 4,
  },
  appointmentChevron: { paddingLeft: 4 },

  // Tip
  tipCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: C.crimsonDeep,
    borderRadius: 16,
    padding: 18,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  tipEmoji: { fontSize: 16 },
  tipLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
  },
  tipText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
  },
});
