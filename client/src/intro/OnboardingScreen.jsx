import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// ─── Design Tokens (matches SplashScreen palette) ─────────────────────────────
const C = {
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonLight: "#E8394D",
  crimsonBg: "#FFF5F5",
  white: "#FFFFFF",
  offWhite: "#FAFAFA",
  emerald: "#2EAF6F",
  emeraldLight: "#4DC98A",
  textDark: "#1A0A0C",
  textMid: "#6B3340",
  textMuted: "#9E6370",
  cardBg: "#FFFFFF",
  shadow: "rgba(192,21,42,0.18)",
};

// ─── Slide data ───────────────────────────────────────────────────────────────
const onboardingData = [
  {
    id: 1,
    tag: "SOS",
    tagColor: C.crimson,
    title: "One Tap Emergency\nAlert",
    description:
      "Instantly notify your emergency contacts with your live location. When every second counts, VitaTrack reaches the people who matter most — before help arrives.",
    image: require("../../assets/sos.png"),
    accent: C.crimson,
    bgShape: C.crimsonLight,
  },
  {
    id: 2,
    tag: "HELP",
    tagColor: "#D97706",
    title: "Reach Help\nAnywhere",
    description:
      "Connect directly to local support lines, crisis services, and community responders. VitaTrack bridges the gap between distress and the help you deserve.",
    image: require("../../assets/help.png"),
    accent: "#D97706",
    bgShape: "#F59E0B",
  },
  {
    id: 3,
    tag: "SAFETY",
    tagColor: C.emerald,
    title: "Ambulance at\nYour Fingertips",
    description:
      "Dispatch emergency medical services with a single gesture. Your vitals, location, and health profile are shared instantly so responders arrive prepared.",
    image: require("../../assets/ambulance.png"),
    accent: C.emerald,
    bgShape: C.emeraldLight,
  },
];

// ─── Animated slide content ───────────────────────────────────────────────────
function SlideContent({ item, isActive }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(30)).current;
  const imageScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (isActive) {
      // Reset
      fadeAnim.setValue(0);
      slideY.setValue(30);
      imageScale.setValue(0.85);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.spring(imageScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <View style={styles.slide}>
      {/* Image card */}
      <Animated.View
        style={[
          styles.imageCard,
          { transform: [{ scale: imageScale }] },
          { shadowColor: item.accent },
        ]}>
        {/* Background circle accent */}
        <View
          style={[
            styles.imageCircleBg,
            { backgroundColor: `${item.bgShape}22` },
          ]}
        />
        <View
          style={[styles.imageCircleRing, { borderColor: `${item.accent}30` }]}
        />
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* Text content */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: fadeAnim, transform: [{ translateY: slideY }] },
        ]}>
        {/* Feature tag */}
        <View style={[styles.tag, { backgroundColor: `${item.accent}18` }]}>
          <View style={[styles.tagDot, { backgroundColor: item.accent }]} />
          <Text style={[styles.tagText, { color: item.accent }]}>
            {item.tag}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const btnScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === onboardingData.length - 1;
  const currentItem = onboardingData[activeIndex];

  // Animate progress bar on index change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (activeIndex + 1) / onboardingData.length,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  const handleComplete = async () => {
    await AsyncStorage.setItem("hasOnboarded", "true");
    navigation.replace("Signup");
  };

  const handleNextPress = () => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    if (isLast) {
      handleComplete();
    } else {
      setActiveIndex((prev) => prev + 1); // ← drive via state, not ref
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.offWhite} />

      {/* Header row */}
      <View style={styles.header}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <View style={styles.logoMarkInner} />
        </View>

        <TouchableOpacity
          onPress={handleComplete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: currentItem.accent,
            },
          ]}
        />
      </View>

      {/* Swiper */}
      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={false}
        index={activeIndex} // ← controlled index
        onIndexChanged={(index) => setActiveIndex(index)}
        scrollEnabled={true}
        style={styles.swiper}>
        {onboardingData.map((item, index) => (
          <SlideContent
            key={item.id}
            item={item}
            isActive={activeIndex === index}
          />
        ))}
      </Swiper>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Step indicators */}
        <View style={styles.dotsRow}>
          {onboardingData.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => swiperRef.current?.scrollTo(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Animated.View
                style={[
                  styles.dot,
                  i === activeIndex && [
                    styles.dotActive,
                    { backgroundColor: currentItem.accent },
                  ],
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              styles.nextBtn,
              {
                backgroundColor: isLast ? C.emerald : C.crimson,
                shadowColor: isLast ? C.emerald : C.crimson,
              },
            ]}
            onPress={handleNextPress}
            activeOpacity={0.88}>
            <Text style={styles.nextText}>
              {isLast ? "Get Started →" : "Next"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Step counter */}
        <Text style={styles.stepCounter}>
          <Text style={{ color: currentItem.accent, fontWeight: "700" }}>
            {activeIndex + 1}
          </Text>
          {" / "}
          {onboardingData.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.offWhite,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.white,
    opacity: 0.9,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(192,21,42,0.08)",
  },
  skipText: {
    fontSize: 13,
    color: C.crimson,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Progress
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(192,21,42,0.1)",
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Swiper
  swiper: {
    flex: 1,
  },

  // Slide
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 28,
  },

  // Image card
  imageCard: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: 36,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
  },
  imageCircleBg: {
    position: "absolute",
    width: "130%",
    height: "130%",
    borderRadius: 9999,
    bottom: "-30%",
    right: "-30%",
  },
  imageCircleRing: {
    position: "absolute",
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  image: {
    width: width * 0.42,
    height: width * 0.42,
    zIndex: 2,
  },

  // Text block
  textBlock: {
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "center",
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.textDark,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 23,
    letterSpacing: 0.1,
    paddingHorizontal: 8,
  },

  // Bottom controls
  bottomControls: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    alignItems: "center",
    gap: 16,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(192,21,42,0.2)",
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    width: width - 56,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  stepCounter: {
    fontSize: 13,
    color: C.textMuted,
    letterSpacing: 0.5,
  },
});
