import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  crimson: '#C0152A',       // Primary red
  crimsonDeep: '#8B0F1E',   // Darker red for depth
  crimsonLight: '#E8394D',  // Lighter red for glow
  white: '#FFFFFF',
  offWhite: '#FFF5F5',      // Warm white tinted with red
  emerald: '#2EAF6F',       // Health green accent
  emeraldLight: '#4DC98A',
  textMuted: 'rgba(255,255,255,0.65)',
};

// ─── Animated ring component ──────────────────────────────────────────────────
function PulseRing({ delay, size, color }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    />
  );
}

// ─── Heartbeat bar ────────────────────────────────────────────────────────────
function HeartbeatBar() {
  const bars = [0.3, 0.6, 1, 0.6, 0.3, 0.5, 0.8, 0.4, 0.7, 0.9, 0.5, 0.3];
  const anims = useRef(bars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.heartbeatContainer}>
      {bars.map((baseHeight, i) => (
        <Animated.View
          key={i}
          style={[
            styles.heartbeatBar,
            {
              height: 28 * baseHeight,
              transform: [{ scaleY: anims[i] }],
              backgroundColor:
                i === 4 || i === 8
                  ? COLORS.emerald
                  : i % 3 === 0
                  ? COLORS.crimsonLight
                  : COLORS.white,
              opacity: 0.85,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Splash ──────────────────────────────────────────────────────────────
export default function SplashScreen({ onFinish }) {
  // Entry animations
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barOpacity = useRef(new Animated.Value(0)).current;
  const dotProgress = useRef(new Animated.Value(0)).current;

  // Logo heartbeat after entrance
  const logoBeat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Heartbeat logo loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoBeat, { toValue: 1.08, duration: 200, useNativeDriver: true }),
          Animated.timing(logoBeat, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(logoBeat, { toValue: 1.06, duration: 150, useNativeDriver: true }),
          Animated.timing(logoBeat, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.delay(1000),
        ])
      ).start();
    });

    // 3. Text reveals
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(750),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(barOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // 4. Progress dots
    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(dotProgress, {
        toValue: 1,
        duration: 2800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    // 5. Auto-dismiss
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 4200);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = dotProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Decorative circle accents */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />
      <View style={[styles.decorCircle, styles.decorCircle3]} />

      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Logo with pulse rings */}
        <View style={styles.logoWrapper}>
          <PulseRing delay={0} size={160} color={COLORS.crimsonLight} />
          <PulseRing delay={600} size={160} color="rgba(255,255,255,0.3)" />

          <Animated.View
            style={[
              styles.logoCircle,
              {
                opacity: logoOpacity,
                transform: [{ scale: Animated.multiply(logoScale, logoBeat) }],
              },
            ]}
          >
            <Image
              source={require('../../assets/heart-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.Text
          style={[
            styles.appName,
            { opacity: textOpacity, transform: [{ translateY: textY }] },
          ]}
        >
          VitaTrack
        </Animated.Text>

        {/* Tagline with green accent */}
        <Animated.View style={[styles.taglineRow, { opacity: taglineOpacity }]}>
          <View style={styles.greenDot} />
          <Text style={styles.tagline}>Your health, beautifully measured</Text>
        </Animated.View>

        {/* Animated heartbeat bars */}
        <Animated.View style={{ opacity: barOpacity }}>
          <HeartbeatBar />
        </Animated.View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Brand footer */}
        <Text style={styles.footerText}>Powered by <Text style={styles.footerBold}>VitaHealth</Text></Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.crimsonDeep,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 52,
    paddingTop: 60,
    overflow: 'hidden',
  },

  // Background layers
  bgTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: width * 1.2,
    height: height * 0.55,
    backgroundColor: COLORS.crimson,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width * 0.3,
    opacity: 0.6,
  },
  bgBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: width * 0.9,
    height: height * 0.35,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopLeftRadius: width,
    borderTopRightRadius: 0,
  },

  // Decorative circles
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 320,
    height: 320,
    top: height * 0.12,
    left: -90,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  decorCircle2: {
    width: 200,
    height: 200,
    bottom: height * 0.2,
    right: -50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle3: {
    width: 80,
    height: 80,
    top: height * 0.08,
    right: 30,
    backgroundColor: COLORS.emerald,
    opacity: 0.18,
    borderWidth: 0,
  },

  // Logo
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: COLORS.crimsonLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 20,
  },
  logo: {
    width: 64,
    height: 64,
    tintColor: COLORS.white,
  },

  // Text
  appName: {
    fontFamily: 'System',
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -4,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.emeraldLight,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },

  // Heartbeat bars
  heartbeatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    marginTop: 20,
  },
  heartbeatBar: {
    width: 4,
    borderRadius: 3,
  },

  // Bottom
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 48,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.emerald,
    borderRadius: 2,
    shadowColor: COLORS.emerald,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  footerBold: {
    color: COLORS.white,
    fontWeight: '700',
  },
});