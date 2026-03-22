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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import SafetyEngine from "../components/SafetyEngine";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2;

// ─── Design Tokens ────────────────────────────────────────────────────────
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
  purple: "#7C3AED",
  purplePale: "#F5F3FF",
  textDark: "#1A0608",
  textMid: "#5C2D35",
  textMuted: "#9E7A7E",
  cardShadow: "rgba(192,21,42,0.08)",
};

// ─── Font map ─────────────────────────────────────────────────────────────
const F = {
  extraLight: "Manrope-ExtraLight",
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semiBold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extraBold: "Manrope-ExtraBold",
};

// ─── Local icon assets ────────────────────────────────────────────────────
const ICONS = {
  bell: require("../../assets/icons/bell.png"),
  footprint: require("../../assets/icons/footprint.png"),
  calories: require("../../assets/icons/calories.png"),
  baby: require("../../assets/icons/baby.png"),
  heartRate: require("../../assets/icons/rate.png"),
  phone: require("../../assets/icons/call.png"),
  ambulanza: require("../../assets/icons/WH1221_DP_A.png"),
  calendars: require("../../assets/icons/calendar.png"),
  security: require("../../assets/icons/security.png"),
};

// ─── Placeholder data ─────────────────────────────────────────────────────
const STEPS = 8432;
const KM = (STEPS * 0.000762).toFixed(2); // avg stride ~76.2cm

const ACTIVITY_STATS = [
  {
    key: "steps",
    icon: ICONS.footprint,
    label: "Steps",
    value: STEPS.toLocaleString(),
    sub: `${KM} km`,
    color: C.crimson,
    bg: C.crimsonPale,
    large: true,
  },
  {
    key: "calories",
    icon: ICONS.calories,
    label: "Calories",
    value: "1,240",
    sub: "kcal",
    color: C.amber,
    bg: C.amberPale,
    large: false,
  },
  {
    key: "sleep",
    icon: ICONS.baby,
    label: "Sleep",
    value: "7.2",
    sub: "hours",
    color: C.purple,
    bg: C.purplePale,
    large: false,
  },
  {
    key: "heart",
    icon: ICONS.heartRate,
    label: "Heart Rate",
    value: "72",
    sub: "bpm",
    color: C.crimsonLight,
    bg: C.crimsonPale,
    large: false,
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

// ─── Section header ───────────────────────────────────────────────────────
function SectionHeader({ title, link, onLink }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {link && (
        <TouchableOpacity onPress={onLink}>
          <Text style={styles.sectionLink}>{link}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Activity grid ────────────────────────────────────────────────────────
function ActivityGrid() {
  const anims = ACTIVITY_STATS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.stagger(
      80,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, []);

  // Layout: steps takes full left column (2 rows), right column has 3 small cards stacked
  // We'll do a proper 2x2 where steps spans left col
  const [steps, calories, sleep, heart] = ACTIVITY_STATS;
  const smallCards = [calories, sleep, heart];

  return (
    <View style={styles.activityGrid}>
      {/* Left — Steps (large, spans height of 2 small cards) */}
      <Animated.View
        style={[
          styles.statCardLarge,
          {
            backgroundColor: steps.bg,
            opacity: anims[0],
            transform: [
              {
                translateY: anims[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}>
        <Image
          source={steps.icon}
          style={[styles.statIconImg, { tintColor: steps.color }]}
          resizeMode="contain"
        />
        <Text style={[styles.statValueLarge, { color: steps.color }]}>
          {steps.value}
        </Text>
        <Text style={styles.statSubLarge}>{steps.sub}</Text>
        <Text style={styles.statLabelLarge}>{steps.label}</Text>
      </Animated.View>

      {/* Right — 2x2 grid of small cards */}
      <View style={styles.activityRight}>
        {[calories, sleep, heart].map((item, i) => (
          <Animated.View
            key={item.key}
            style={[
              styles.statCardSmall,
              {
                backgroundColor: item.bg,
                opacity: anims[i + 1],
                transform: [
                  {
                    translateY: anims[i + 1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}>
            <Image
              source={item.icon}
              style={[styles.statIconSmall, { tintColor: item.color }]}
              resizeMode="contain"
            />
            <Text style={[styles.statValueSmall, { color: item.color }]}>
              {item.value}
            </Text>
            <Text style={styles.statSubSmall}>{item.sub}</Text>
            <Text style={styles.statLabelSmall}>{item.label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function HomeTab({ navigation }) {
  const user = useSelector(selectUser);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <View style={styles.root}>
      {/* Safety Engine — silent, no UI */}
      <SafetyEngine enabled={true} />

      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />

      {/* Static header */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
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

          <TouchableOpacity style={styles.bellBtn}>
            <Image
              source={ICONS.bell}
              style={styles.bellImg}
              resizeMode="contain"
            />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Safety Status */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyLeft}>
            <View style={styles.safetyIconRing}>
              <Image
                source={ICONS.security}
                style={styles.safetyIconImg}
                resizeMode="contain"
              />
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

        {/* Activity Stats */}
        <SectionHeader title="Today's Activity" link="View all" />
        <ActivityGrid />

        {/* Emergency Actions */}
        <SectionHeader title="Emergency Actions" />
        <View style={styles.emergencyRow}>
          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: C.white }]}
            activeOpacity={0.85}>
            <Image
              source={ICONS.phone}
              style={styles.emergencyIcon}
              resizeMode="contain"
            />
            <Text style={[styles.emergencyLabel, { color: C.crimson }]}>
              SOS
            </Text>
            <Text style={[styles.emergencySubLabel, { color: C.textMuted }]}>
              Alert contacts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.emergencyCard, { backgroundColor: C.white }]}
            activeOpacity={0.85}>
            <Image
              source={ICONS.ambulanza}
              style={styles.emergencyIcon}
              resizeMode="contain"
            />
            <Text style={[styles.emergencyLabel, { color: C.emerald }]}>
              Ambulance
            </Text>
            <Text style={[styles.emergencySubLabel, { color: C.textMuted }]}>
              Call EMS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Medications */}
        <SectionHeader title="Today's Medications" link="View all" />
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

        {/* Appointments */}
        <SectionHeader title="Upcoming Appointments" link="Add new" />
        <View style={styles.appointmentsWrapper}>
          {APPOINTMENTS.map((apt, i) => (
            <View
              key={i}
              style={[
                styles.appointmentCard,
                i < APPOINTMENTS.length - 1 && { marginBottom: 10 },
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
                <View style={styles.appointmentTimeRow}>
                  <Image
                    source={ICONS.calendars}
                    style={styles.calendarIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.appointmentTime}>{apt.time}</Text>
                </View>
              </View>
              <Text style={styles.appointmentChevron}>›</Text>
            </View>
          ))}
        </View>

        {/* Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipLabel}>HEALTH TIP OF THE DAY</Text>
          </View>
          <Text style={styles.tipText}>{HEALTH_TIP}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Static header
  headerSafe: { backgroundColor: C.crimsonDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.crimsonDeep,
  },
  menuBtn: { gap: 5, padding: 4 },
  menuLine: {
    width: 22,
    height: 2.5,
    backgroundColor: C.white,
    borderRadius: 2,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  greeting: {
    fontFamily: F.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  userName: {
    fontFamily: F.extraBold,
    fontSize: 19,
    color: C.white,
    letterSpacing: -0.3,
  },
  bellBtn: { padding: 4, position: "relative" },
  bellImg: { width: 30, height: 30, tintColor: C.white },
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

  // Scrollable
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Safety
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  safetyIconImg: { width: 22, height: 22, tintColor: C.emerald },
  safetyTitle: { fontFamily: F.extraBold, fontSize: 14, color: C.emerald },
  safetySubtitle: {
    fontFamily: F.medium,
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

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: F.extraBold, fontSize: 16, color: C.textDark },
  sectionLink: { fontFamily: F.bold, fontSize: 13, color: C.crimson },

  // Activity grid
  activityGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },
  statCardLarge: {
    width: CARD_WIDTH,
    borderRadius: 18,
    padding: 16,
    justifyContent: "flex-end",
    minHeight: 210,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconImg: { width: 36, height: 36, marginBottom: 12 },
  statValueLarge: {
    fontFamily: F.extraBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  statSubLarge: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  statLabelLarge: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textMid,
    marginTop: 4,
  },

  activityRight: {
    flex: 1,
    gap: CARD_GAP,
  },
  statCardSmall: {
    borderRadius: 16,
    padding: 12,
    flex: 1,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconSmall: { width: 22, height: 22, marginBottom: 6 },
  statValueSmall: {
    fontFamily: F.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  statSubSmall: { fontFamily: F.medium, fontSize: 10, color: C.textMuted },
  statLabelSmall: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: C.textMid,
    marginTop: 2,
  },

  // Emergency
  emergencyRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12 },
  emergencyCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.inputBorder, // ← subtle red-tinted border
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  emergencyIcon: { width: 36, height: 36 },
  emergencyLabel: { fontFamily: F.extraBold, fontSize: 15, color: C.white },
  emergencySubLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
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
    paddingVertical: 11,
  },
  medRowBorder: { borderBottomWidth: 1, borderBottomColor: "#FFF0F1" },
  medDot: { width: 10, height: 10, borderRadius: 5 },
  medInfo: { flex: 1 },
  medName: { fontFamily: F.bold, fontSize: 14, color: C.textDark },
  medDose: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  medStatus: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  medStatusText: { fontFamily: F.bold, fontSize: 11 },

  // Appointments
  appointmentsWrapper: { gap: 0 },
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
    width: 50,
    height: 54,
    borderRadius: 13,
    backgroundColor: C.crimsonPale,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentDateText: {
    fontFamily: F.extraBold,
    fontSize: 20,
    color: C.crimson,
  },
  appointmentMonthText: { fontFamily: F.bold, fontSize: 10, color: C.crimson },
  appointmentInfo: { flex: 1 },
  appointmentDoctor: {
    fontFamily: F.extraBold,
    fontSize: 14,
    color: C.textDark,
  },
  appointmentType: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  appointmentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  calendarIcon: { width: 13, height: 13, tintColor: C.textMid },
  appointmentTime: { fontFamily: F.semiBold, fontSize: 12, color: C.textMid },
  appointmentChevron: { fontSize: 22, color: C.textMuted, fontFamily: F.light },

  // Tip
  tipCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: C.crimsonDeep,
    borderRadius: 18,
    padding: 20,
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
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.8,
  },
  tipText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 23,
  },
});
