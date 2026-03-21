import 'react-native-gesture-handler'; // Must be first import

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreenExpo from 'expo-splash-screen';

import SplashScreen from './src/intro/SplashScreen';
import OnboardingScreen from './src/intro/OnboardingScreen';
import SignupScreen from './src/screens/SignupScreen';
import SigninScreen from './src/screens/SigninScreen';
import HomeScreen from './src/screens/HomeScreen';

// Keep native splash visible while fonts load
SplashScreenExpo.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

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

function AppNavigator({ initialRoute }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={SigninScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [appState, setAppState] = useState('loading');
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ── Load all Manrope weights once — available everywhere in the app
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

    resolveInitialRoute().then((route) => {
      setInitialRoute(route);
      setAppState(route === 'Home' ? 'app' : 'splash');
    });
  }, [fontsLoaded]);

  const handleSplashFinish = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => setAppState('app'));
  };

  if (!fontsLoaded || appState === 'loading') {
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