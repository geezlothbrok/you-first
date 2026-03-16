import 'react-native-gesture-handler'; // Must be first import

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './src/intro/SplashScreen';
import OnboardingScreen from './src/intro/OnboardingScreen';
import SignupScreen from './src/screens/SignupScreen';


const Stack = createNativeStackNavigator();

// ─── Route resolution ─────────────────────────────────────────────────────────
// initialRoute logic:
//   authenticated  → skip splash & onboarding → go straight to Home
//   hasOnboarded   → skip onboarding           → go to Signup/Login
//   neither        → full flow: Onboarding → Signup
// async function resolveInitialRoute() {
//   const [token, hasOnboarded] = await Promise.all([
//     AsyncStorage.getItem('authToken'),     // set this key on login/signup success
//     AsyncStorage.getItem('hasOnboarded'),
//   ]);

//   if (token) return 'Home';               // already authenticated
//   if (hasOnboarded === 'true') return 'Signup'; // seen onboarding, not logged in
//   return 'Onboarding';                    // brand new user
// }

async function resolveInitialRoute() {
  // TEMP: force onboarding during development — remove before release
  await AsyncStorage.multiRemove(['authToken', 'hasOnboarded']);
  
  const [token, hasOnboarded] = await Promise.all([
    AsyncStorage.getItem('authToken'),
    AsyncStorage.getItem('hasOnboarded'),
  ]);

  if (token) return 'Home';
  if (hasOnboarded === 'true') return 'Signup';
  return 'Onboarding';
}

// ─── App Navigator ────────────────────────────────────────────────────────────
function AppNavigator({ initialRoute }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        {/* Uncomment these as you build them: */}
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={SignupScreen} />
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState('loading'); // 'loading' | 'splash' | 'app'
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    resolveInitialRoute().then((route) => {
      setInitialRoute(route);

      if (route === 'Home') {
        // Authenticated user — skip splash entirely, go straight to app
        setAppState('app');
      } else {
        // New or returning-unauthenticated user — show splash first
        setAppState('splash');
      }
    });
  }, []);

  const handleSplashFinish = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => setAppState('app'));
  };

  if (appState === 'loading') {
    // Blank screen while AsyncStorage resolves (usually < 100ms)
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      {appState === 'app' && <AppNavigator initialRoute={initialRoute} />}

      {appState === 'splash' && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <SplashScreen onFinish={handleSplashFinish} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});