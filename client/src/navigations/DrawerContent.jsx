import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { logout, selectUser } from "../redux/slices/authSlice";

const { width } = Dimensions.get("window");

const C = {
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonLight: "#E8394D",
  crimsonPale: "#FDECEA",
  bg: "#FFF8F8",
  white: "#FFFFFF",
  textDark: "#1A0608",
  textMuted: "#9E7A7E",
  inputBorder: "#F0D0D4",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
};

const F = {
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semiBold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extraBold: "Manrope-ExtraBold",
};

const NAV_LINKS = [
  { icon: "👤", label: "Health Profile", screen: "HealthProfile" },
  { icon: "💊", label: "Medications", screen: "Medications" },
  { icon: "📅", label: "Appointments", screen: "Appointments" },
  { icon: "🆘", label: "Emergency Contacts", screen: "EmergencyContacts" },
];

export default function DrawerContent({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleLogout = () => {
    dispatch(logout());
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* ── Profile section ── */}
      <View style={styles.profileSection}>
        {/* Decorative background shape */}
        <View style={styles.profileBg} />

        {/* Avatar */}
        <View style={styles.avatarRing}>
          {user?.profilePhoto ? (
            <Image
              source={{ uri: user.profilePhoto }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {getInitials(user?.fullName)}
              </Text>
            </View>
          )}
        </View>

        {/* User info */}
        <Text style={styles.userName}>{user?.fullName || "User"}</Text>
        <Text style={styles.userEmail}>{user?.email || ""}</Text>

        {/* Status badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Protected</Text>
        </View>
      </View>

      {/* ── Nav links ── */}
      <ScrollView
        style={styles.linksSection}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>MENU</Text>

        {NAV_LINKS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate(item.screen);
            }}
            activeOpacity={0.7}>
            <View style={styles.navIconBox}>
              <Text style={styles.navIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.navLabel}>{item.label}</Text>
            <Text style={styles.navChevron}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>ACCOUNT</Text>

        {/* Settings placeholder */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            navigation.closeDrawer();
            navigation.navigate("Settings");
          }}
          activeOpacity={0.7}>
          <View style={styles.navIconBox}>
            <Text style={styles.navIcon}>⚙️</Text>
          </View>
          <Text style={styles.navLabel}>Settings</Text>
          <Text style={styles.navChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Logout ── */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.85}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },

  // Profile
  profileSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: "flex-start",
    position: "relative",
    overflow: "hidden",
  },
  profileBg: {
    position: "absolute",
    top: -40,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.crimsonPale,
    opacity: 0.8,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: C.crimson,
    padding: 2,
    marginBottom: 12,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 32 },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontFamily: F.bold, fontSize: 22, color: C.white },
  userName: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.textDark,
    marginBottom: 3,
  },
  userEmail: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textMuted,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.emeraldPale,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.emerald,
  },
  statusText: { fontFamily: F.semiBold, fontSize: 12, color: C.emerald },

  // Links
  linksSection: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 1.5,
    marginLeft: 8,
    marginBottom: 6,
    marginTop: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.crimsonPale,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: { fontSize: 16 },
  navLabel: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textDark,
  },
  navChevron: { fontSize: 20, color: C.textMuted, fontFamily: F.light },
  divider: {
    height: 1,
    backgroundColor: "#F0D0D4",
    marginVertical: 12,
    marginHorizontal: 8,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  logoutIcon: { fontSize: 16 },
  logoutText: { fontFamily: F.bold, fontSize: 15, color: C.crimson },
});
