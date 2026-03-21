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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/slices/authSlice";


const { width } = Dimensions.get("window");

const C = {
  bg: "#FFF8F8",
  bgCard: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
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

// ─── Password Strength ──────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const { label, color } =
    score <= 1
      ? { label: "Weak", color: C.error }
      : score <= 3
        ? { label: "Fair", color: "#F59E0B" }
        : { label: "Strong", color: C.emerald };
  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i <= score ? color : C.inputBorder },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function SignupScreen({ navigation }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const headerAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const setField = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    else if (form.fullName.trim().length < 2) e.fullName = "Name is too short";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
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
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Signup failed. Please try again.");
        return;
      }

      // ── Dispatch to Redux — redux-persist handles caching to AsyncStorage
      dispatch(setCredentials({ user: data.user, token: data.token }));

      // Navigation is handled automatically by AppNavigator
      // watching isAuthenticated state — no need to navigate manually
    } catch (error) {
      setApiError("Network error. Check your connection and try again.");
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
          {/* Header */}
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
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <View style={styles.brandMarkInner} />
              </View>
              <Text style={styles.brandName}>VitaTrack</Text>
            </View>
            <Text style={styles.headingLight}>Create your</Text>
            <Text style={styles.headingBold}>account</Text>
            <Text style={styles.subheading}>
              Join thousands managing their health with confidence.
            </Text>
          </Animated.View>

          {/* Form card */}
          <View style={styles.card}>
            <FloatingInput
              label="Full Name"
              value={form.fullName}
              onChangeText={(v) => setField("fullName", v)}
              autoCapitalize="words"
              error={errors.fullName}
              delay={80}
            />
            <FloatingInput
              label="Email Address"
              value={form.email}
              onChangeText={(v) => setField("email", v)}
              keyboardType="email-address"
              error={errors.email}
              delay={160}
            />
            <FloatingInput
              label="Password"
              value={form.password}
              onChangeText={(v) => setField("password", v)}
              secureTextEntry={!showPassword}
              error={errors.password}
              delay={240}
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
            <PasswordStrength password={form.password} />

            {apiError ? (
              <View style={styles.apiErrorBox}>
                <Text style={styles.apiErrorIcon}>⚠️</Text>
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            <Text style={styles.terms}>
              By signing up you agree to our{" "}
              <Text style={styles.termsLink}>Terms</Text> &{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.82 }]}
                onPress={handleSignup}
                activeOpacity={0.88}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login link */}
          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => navigation.navigate("Login")}
            hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12 },
  header: { paddingBottom: 28, paddingTop: 8 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
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
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    width: 46,
    textAlign: "right",
  },
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
  terms: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 2,
  },
  termsLink: { fontFamily: F.semiBold, color: C.crimson },
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 22,
    paddingHorizontal: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F0D0D4" },
  dividerText: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: { fontFamily: F.regular, fontSize: 14, color: C.textMuted },
  loginLink: { fontFamily: F.bold, fontSize: 14, color: C.crimson },
});
