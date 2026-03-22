import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DrawerContent from "../navigations/DrawerContent";
import HomeTab from "../tabs/HomeTab";
import SOSTab from "../tabs/SOSTab";
import ProfileTab from "../tabs/ProfileTab";
import HealthProfileScreen from "./HealthProfileScreen";
import EmergencyContactsScreen from "./EmergencyContactScreen";


// ── Placeholder screens for drawer links (build out in Phase 2)
const PlaceholderScreen = ({ route }) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFF8F8",
    }}>
    <Text
      style={{
        fontFamily: "Manrope-ExtraBold",
        fontSize: 20,
        color: "#8B0F1E",
      }}>
      {route.name}
    </Text>
    <Text
      style={{
        fontFamily: "Manrope-Regular",
        fontSize: 14,
        color: "#9E7A7E",
        marginTop: 8,
      }}>
      Coming soon
    </Text>
  </View>
);

const C = {
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  white: "#FFFFFF",
  textMuted: "#9E7A7E",
};
const F = { medium: "Manrope-Medium" };

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.crimson,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icons = { Home: "🏠", SOS: "🆘", Profile: "👤" };
          if (route.name === "SOS") {
            return (
              <View
                style={[styles.sosTabBtn, focused && styles.sosTabBtnActive]}>
                <Text style={styles.sosTabIcon}>🆘</Text>
              </View>
            );
          }
          return (
            <View
              style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={styles.tabIcon}>{icons[route.name]}</Text>
            </View>
          );
        },
      })}>
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen
        name="SOS"
        component={SOSTab}
        options={{ tabBarLabel: () => null }}
      />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
const Drawer = createDrawerNavigator();

export default function HomeScreen() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        drawerPosition: "left",
        swipeEnabled: true,
        swipeEdgeWidth: 60,
        overlayColor: "rgba(26,6,8,0.5)",
        drawerStyle: { width: "78%", backgroundColor: C.white },
      }}>
      <Drawer.Screen name="MainTabs" component={BottomTabs} />
      <Drawer.Screen name="HealthProfile" component={HealthProfileScreen} />
      <Drawer.Screen name="Medications" component={PlaceholderScreen} />
      <Drawer.Screen name="Appointments" component={PlaceholderScreen} />
      <Drawer.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Drawer.Screen name="Settings" component={PlaceholderScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: "#FDE8EA",
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    shadowColor: "rgba(192,21,42,0.1)",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: { fontFamily: F.medium, fontSize: 11 },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: { backgroundColor: "#FDECEA" },
  tabIcon: { fontSize: 20 },
  sosTabBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sosTabBtnActive: { backgroundColor: C.crimsonDeep },
  sosTabIcon: { fontSize: 22 },
});
