import 'react-native-gesture-handler';

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useFonts } from 'expo-font';
import * as SplashScreenExpo from 'expo-splash-screen';
import { selectIsAuthenticated } from './src/redux/slices/authSlice';

import OnboardingScreen from './src/intro/OnboardingScreen';
import SignupScreen from './src/screens/SignupScreen';
import SigninScreen from './src/screens/SigninScreen';
import SplashScreen from './src/intro/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HealthProfileScreen from './src/screens/HealthProfileScreen';

import {
  setupNotificationChannels,
  rescheduleAllMedicationReminders,
  rescheduleAllAppointmentReminders,
  requestNotificationPermissions,
} from "./src/hooks/notificationScheduler";
import AsyncStorage from "@react-native-async-storage/async-storage";



SplashScreenExpo.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// ─── Navigator — driven purely by Redux auth state ────────────────────────────
function AppNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {isAuthenticated ? (
          // Authenticated — go straight to Home, stays forever until logout
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // Unauthenticated — onboarding → signup/login
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Login" component={SigninScreen} />
            <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Root — handles fonts + splash ───────────────────────────────────────────
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    'Manrope-ExtraLight': require('./assets/fonts/Manrope-ExtraLight.ttf'),
    'Manrope-Light':      require('./assets/fonts/Manrope-Light.ttf'),
    'Manrope-Regular':    require('./assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium':     require('./assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold':   require('./assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold':       require('./assets/fonts/Manrope-Bold.ttf'),
    'Manrope-ExtraBold':  require('./assets/fonts/Manrope-ExtraBold.ttf'),
  });

  useEffect(() => {
  if (!fontsLoaded) return;
  SplashScreenExpo.hideAsync();

  const init = async () => {
    await requestNotificationPermissions();
    await setupNotificationChannels();

    // Reschedule from cache — works offline
    const [medsRaw, aptsRaw] = await Promise.all([
      AsyncStorage.getItem("medications_cache"),
      AsyncStorage.getItem("appointments_cache_upcoming"),
    ]);
    if (medsRaw) await rescheduleAllMedicationReminders(JSON.parse(medsRaw));
    if (aptsRaw) await rescheduleAllAppointmentReminders(JSON.parse(aptsRaw));
  };
  init();
}, [fontsLoaded]);

  const handleSplashFinish = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => setSplashDone(true));
  };

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {splashDone && <AppNavigator />}
        {!splashDone && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
            <SplashScreen onFinish={handleSplashFinish} />
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}



const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});