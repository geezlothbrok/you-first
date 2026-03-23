import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slices/authSlice";

const { width, height } = Dimensions.get("window");

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8F8",
  bgCard: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonLight: "#E8394D",
  crimsonPale: "#FDECEA",
  inputBg: "#FFF4F5",
  inputBorder: "#F0D0D4",
  emerald: "#2EAF6F",
  textDark: "#1A0608",
  textMuted: "#9E7A7E",
  textPlaceholder: "#C4A0A5",
  white: "#FFFFFF",
  error: "#E8394D",
};

const F = {
  extraLight: "Manrope-ExtraLight",
  light: "Manrope-Light",
  regular: "Manrope-Regular",
  medium: "Manrope-Medium",
  semiBold: "Manrope-SemiBold",
  bold: "Manrope-Bold",
  extraBold: "Manrope-ExtraBold",
};

const API_URL = "http://localhost:3000/api/auth";

// ─── Floating Label Input ───────────────────────────────────────────────────
function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  rightElement,
  delay = 0,
}) {
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (!value)
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
  };

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [17, 6],
  });
  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11],
  });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.textPlaceholder, error ? C.error : C.crimson],
  });
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.error : C.inputBorder, error ? C.error : C.crimson],
  });

  return (
    <Animated.View
      style={[
        styles.inputWrapper,
        {
          opacity: mountAnim,
          transform: [
            {
              translateY: mountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        },
      ]}>
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        <Animated.Text
          style={[
            styles.floatingLabel,
            { top: labelTop, fontSize: labelSize, color: labelColor },
          ]}>
          {label}
        </Animated.Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "none"}
          autoCorrect={false}
          selectionColor={C.crimson}
        />
        {rightElement && <View style={styles.inputRight}>{rightElement}</View>}
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function SigninScreen({ navigation }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const headerAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Shake animation for wrong credentials
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const setField = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiError("");

    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Login failed. Please try again.");
        triggerShake(); // shake the card on wrong credentials
        return;
      }

      // Dispatch to Redux — persist handles caching automatically
      dispatch(setCredentials({ user: data.user, token: data.token }));

      // AppNavigator watches isAuthenticated and routes to Home automatically
    } catch (error) {
      setApiError("Network error. Check your connection and try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* ── Header ── */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}>
            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <View style={styles.brandMarkInner} />
              </View>
              <Text style={styles.brandName}>VitaTrack</Text>
            </View>

            {/* Welcome back illustration area */}
            <View style={styles.welcomeBlock}>
              <View style={styles.welcomeIconRing}>
                <View style={styles.welcomeIconInner}>
                  <Text style={styles.welcomeEmoji}>👋</Text>
                </View>
              </View>
              <Text style={styles.headingLight}>Welcome</Text>
              <Text style={styles.headingBold}>back</Text>
              <Text style={styles.subheading}>
                Sign in to continue tracking your health journey.
              </Text>
            </View>
          </Animated.View>

          {/* ── Form card with shake animation ── */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <FloatingInput
              label="Email Address"
              value={form.email}
              onChangeText={(v) => setField("email", v)}
              keyboardType="email-address"
              error={errors.email}
              delay={80}
            />
            <FloatingInput
              label="Password"
              value={form.password}
              onChangeText={(v) => setField("password", v)}
              secureTextEntry={!showPassword}
              error={errors.password}
              delay={160}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.eyeText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              }
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* API error banner */}
            {apiError ? (
              <View style={styles.apiErrorBox}>
                <Text style={styles.apiErrorIcon}>⚠️</Text>
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.82 }]}
                onPress={handleLogin}
                activeOpacity={0.88}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Signup link ── */}
          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => navigation.navigate("Signup")}
            hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Text style={styles.signupLink}>Create one</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12 },

  // Header
  header: { paddingBottom: 24, paddingTop: 8 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkInner: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: C.white,
    opacity: 0.9,
  },
  brandName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.crimson,
    letterSpacing: 0.6,
  },

  // Welcome block
  welcomeBlock: { alignItems: "flex-start", gap: 2 },
  welcomeIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.crimsonPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  welcomeIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeEmoji: { fontSize: 22 },
  headingLight: {
    fontFamily: F.light,
    fontSize: 34,
    color: C.textDark,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  headingBold: {
    fontFamily: F.extraBold,
    fontSize: 34,
    color: C.crimsonDeep,
    lineHeight: 42,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  subheading: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
  },

  // Card
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 24,
    padding: 24,
    gap: 4,
    shadowColor: "rgba(192,21,42,0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },

  // Inputs
  inputWrapper: { marginBottom: 10 },
  inputContainer: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  floatingLabel: { position: "absolute", left: 16, fontFamily: F.medium },
  input: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textDark,
    height: 26,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputRight: { marginLeft: 10 },
  eyeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.crimson,
    letterSpacing: 0.3,
  },
  errorText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.error,
    marginTop: 5,
    marginLeft: 4,
  },

  // Forgot password
  forgotBtn: { alignSelf: "flex-end", marginTop: -4, marginBottom: 4 },
  forgotText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.crimson,
    letterSpacing: 0.2,
  },

  // API error
  apiErrorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginTop: 2,
  },
  apiErrorIcon: { fontSize: 14 },
  apiErrorText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    color: C.error,
    lineHeight: 19,
  },

  // Submit
  submitBtn: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  submitText: {
    fontFamily: F.bold,
    color: C.white,
    fontSize: 16,
    letterSpacing: 0.4,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 22,
    paddingHorizontal: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F0D0D4" },
  dividerText: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },

  // Signup link
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: { fontFamily: F.regular, fontSize: 14, color: C.textMuted },
  signupLink: { fontFamily: F.bold, fontSize: 14, color: C.crimson },
});
