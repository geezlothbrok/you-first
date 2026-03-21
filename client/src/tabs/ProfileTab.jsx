import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = { crimsonDeep: "#8B0F1E", bg: "#FFF8F8", crimsonPale: "#FDECEA" };
const F = {
  bold: "Manrope-Bold",
  regular: "Manrope-Regular",
  extraBold: "Manrope-ExtraBold",
};

export default function ProfileTab() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.iconRing}>
          <Text style={styles.icon}>👤</Text>
        </View>
        <Text style={styles.title}>Profile Screen</Text>
        <Text style={styles.subtitle}>Coming in Phase 2 — Health Profile</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.crimsonPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  icon: { fontSize: 36 },
  title: { fontFamily: F.extraBold, fontSize: 22, color: C.crimsonDeep },
  subtitle: { fontFamily: F.regular, fontSize: 14, color: "#9E7A7E" },
});
