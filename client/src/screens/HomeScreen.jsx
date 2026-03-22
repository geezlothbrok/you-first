import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DrawerContent from "../navigations/DrawerContent";
import HomeTab from "../tabs/HomeTab";
import SOSTab from "../tabs/SOSTab";
import ProfileTab from "../tabs/ProfileTab";
import HealthProfileScreen from "./HealthProfileScreen";
import EmergencyContactsScreen from "./EmergencyContactScreen";
import MedicationsScreen from "./MedicationsScreen";
import AppointmentsScreen from "./AppointmentsScreen";
import SettingsScreen from "./SettingsScreen";

// ─── Icon assets ──────────────────────────────────────────────────────────────
const ICONS = {
  house: require("../../assets/icons/house.png"),
  account: require("../../assets/icons/account.png"),
};

const C = {
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  white: "#FFFFFF",
  textMuted: "#9E7A7E",
};

const F = {
  medium: "Manrope-Medium",
  bold: "Manrope-Bold",
};

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
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
          // ── SOS center button
          if (route.name === "SOS") {
            return (
              <View
                style={[styles.sosTabBtn, focused && styles.sosTabBtnActive]}>
                <Text style={styles.sosTabIcon}>🆘</Text>
              </View>
            );
          }

          // ── Home
          if (route.name === "Home") {
            return (
              <View
                style={[
                  styles.tabIconWrap,
                  focused && styles.tabIconWrapActive,
                ]}>
                <Image
                  source={ICONS.house}
                  style={[
                    styles.tabIconImg,
                    { tintColor: focused ? C.crimson : C.textMuted },
                  ]}
                  resizeMode="contain"
                />
              </View>
            );
          }

          // ── Profile
          if (route.name === "Profile") {
            return (
              <View
                style={[
                  styles.tabIconWrap,
                  focused && styles.tabIconWrapActive,
                ]}>
                <Image
                  source={ICONS.account}
                  style={[
                    styles.tabIconImg,
                    { tintColor: focused ? C.crimson : C.textMuted },
                  ]}
                  resizeMode="contain"
                />
              </View>
            );
          }
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
      <Drawer.Screen name="Medications" component={MedicationsScreen} />
      <Drawer.Screen name="Appointments" component={AppointmentsScreen} />
      <Drawer.Screen
        name="EmergencyContacts"
        component={EmergencyContactsScreen}
      />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  tabLabel: {
    fontFamily: F.bold,
    fontSize: 12,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: { backgroundColor: "#FDECEA" },
  tabIconImg: { width: 22, height: 22 },
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
