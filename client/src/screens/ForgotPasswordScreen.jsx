import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8F8",
  bgCard: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonPale: "#FDECEA",
  inputBorder: "#F0D0D4",
  inputBg: "#FFF4F5",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
  textDark: "#1A0608",
  textMid: "#5C2D35",
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

// ─── Step indicator ───────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              current === step && styles.stepDotActive,
              current > step && styles.stepDotDone,
            ]}>
            <Text
              style={[
                styles.stepDotText,
                (current === step || current > step) &&
                  styles.stepDotTextActive,
              ]}>
              {current > step ? "✓" : step}
            </Text>
          </View>
          {step < 3 && (
            <View
              style={[styles.stepLine, current > step && styles.stepLineDone]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

// ─── OTP input boxes ──────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const digits = value.split("");
    digits[index] = text.replace(/[^0-9]/g, "").slice(-1);
    const newVal = digits.join("");
    onChange(newVal.padEnd(6, "").slice(0, 6));

    // Auto focus next
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <TextInput
          key={i}
          ref={(ref) => (inputs.current[i] = ref)}
          style={[styles.otpBox, value[i] && styles.otpBoxFilled]}
          value={value[i] || ""}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectionColor={C.crimson}
          textAlign="center"
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const animateStep = (toStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(toStep);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const pressBtn = (callback) => {
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
    ]).start(callback);
  };

  // ── Step 1: Send code
  const handleSendCode = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    pressBtn(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert("Error", data.message || "Something went wrong.");
          return;
        }
        setResendTimer(60);
        animateStep(2);
      } catch {
        Alert.alert("Error", "Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  };

  // ── Step 2: Verify code
  const handleVerifyCode = async () => {
    if (code.length < 6) {
      Alert.alert("Incomplete", "Please enter the full 6-digit code.");
      return;
    }
    pressBtn(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/verify-reset-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert("Error", data.message || "Invalid code.");
          return;
        }
        animateStep(3);
      } catch {
        Alert.alert("Error", "Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  };

  // ── Step 3: Reset password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Too short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    pressBtn(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code,
            newPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert("Error", data.message || "Failed to reset password.");
          return;
        }
        Alert.alert(
          "✅ Password Reset",
          "Your password has been reset successfully. You can now log in.",
          [{ text: "Log In", onPress: () => navigation.replace("Login") }],
        );
      } catch {
        Alert.alert("Error", "Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  };

  // ── Resend code
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setCode("");
      setResendTimer(60);
      Alert.alert("Sent", "A new code has been sent to your email.");
    } catch {
      Alert.alert("Error", "Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ["Forgot Password", "Enter Code", "New Password"];
  const stepSubtitles = [
    "Enter your email and we'll send you a reset code.",
    `We sent a 6-digit code to\n${email}`,
    "Choose a new strong password.",
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{stepTitles[step - 1]}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* Subtitle */}
          <Text style={styles.subtitle}>{stepSubtitles[step - 1]}</Text>

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={C.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={C.crimson}
              />
            </View>
          )}

          {/* ── Step 2: Code ── */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>6-Digit Code</Text>
              <OTPInput value={code} onChange={setCode} />
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                disabled={resendTimer > 0}>
                <Text
                  style={[
                    styles.resendText,
                    resendTimer > 0 && styles.resendTextDisabled,
                  ]}>
                  {resendTimer > 0
                    ? `Resend code in ${resendTimer}s`
                    : "Resend code"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: New password ── */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.textPlaceholder}
                  secureTextEntry={!showPassword}
                  selectionColor={C.crimson}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}>
                  <Text style={styles.eyeText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Confirm Password
              </Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat new password"
                placeholderTextColor={C.textPlaceholder}
                secureTextEntry={!showPassword}
                selectionColor={C.crimson}
              />
            </View>
          )}

          {/* CTA Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.8 }]}
              onPress={
                step === 1
                  ? handleSendCode
                  : step === 2
                    ? handleVerifyCode
                    : handleResetPassword
              }
              disabled={loading}
              activeOpacity={0.88}>
              {loading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={styles.btnText}>
                  {step === 1
                    ? "Send Reset Code"
                    : step === 2
                      ? "Verify Code"
                      : "Reset Password"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Back to login */}
          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginText}>Back to </Text>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  headerSafe: { backgroundColor: C.crimsonDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.crimsonDeep,
  },
  backBtn: { width: 40, padding: 4 },
  backArrow: {
    fontSize: 28,
    color: C.white,
    fontFamily: F.light,
    lineHeight: 32,
  },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: C.crimson, borderColor: C.crimson },
  stepDotDone: { backgroundColor: C.emerald, borderColor: C.emerald },
  stepDotText: { fontFamily: F.bold, fontSize: 13, color: C.textMuted },
  stepDotTextActive: { color: C.white },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: C.inputBorder,
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: C.emerald },

  // Subtitle
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "rgba(192,21,42,0.08)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },

  // Fields
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textMid,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textDark,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: { paddingHorizontal: 4 },
  eyeText: { fontFamily: F.bold, fontSize: 12, color: C.crimson },

  // OTP
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    backgroundColor: C.inputBg,
    fontFamily: F.extraBold,
    fontSize: 22,
    color: C.textDark,
  },
  otpBoxFilled: { borderColor: C.crimson, backgroundColor: C.crimsonPale },

  // Resend
  resendBtn: { alignItems: "center", marginTop: 16 },
  resendText: { fontFamily: F.semiBold, fontSize: 13, color: C.crimson },
  resendTextDisabled: { color: C.textMuted },

  // Button
  btn: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  btnText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.4,
  },

  // Login link
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { fontFamily: F.regular, fontSize: 14, color: C.textMuted },
  loginLink: { fontFamily: F.bold, fontSize: 14, color: C.crimson },
});
