import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectToken,
  setCredentials,
  logout,
} from "../redux/slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Cloudinary config ────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = "ddsk2zfug";
const CLOUDINARY_UPLOAD_PRESET = "you-first";

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
  amber: "#D97706",
  textDark: "#1A0608",
  textMid: "#5C2D35",
  textMuted: "#9E7A7E",
  textPlaceholder: "#C4A0A5",
  white: "#FFFFFF",
  shadow: "rgba(192,21,42,0.08)",
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
const APP_VERSION = "1.0.0";

// ─── Helpers ──────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ─── Reusable input field ─────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
  rightElement,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldInputWrapper,
          focused && styles.fieldInputFocused,
          !editable && styles.fieldInputDisabled,
        ]}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "none"}
          autoCorrect={false}
          editable={editable}
          selectionColor={C.crimson}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={C.textPlaceholder}
        />
        {rightElement}
      </View>
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────
function RowItem({ icon, label, value, onPress, danger = false }) {
  return (
    <TouchableOpacity
      style={styles.rowItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: danger ? "#FEF2F2" : C.crimsonPale },
        ]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: C.crimson }]}>
          {label}
        </Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      <Text style={[styles.rowChevron, danger && { color: C.crimson }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose, token }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setForm({ current: "", newPass: "", confirm: "" });
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      Alert.alert("Required", "All fields are required.");
      return;
    }
    if (form.newPass.length < 6) {
      Alert.alert("Too short", "New password must be at least 6 characters.");
      return;
    }
    if (form.newPass !== form.confirm) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.newPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to change password.");
        return;
      }
      Alert.alert("Success", "Password changed successfully.");
      onClose();
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Field
            label="Current Password"
            value={form.current}
            onChangeText={(v) => setForm((p) => ({ ...p, current: v }))}
            secureTextEntry={!showCurrent}
            rightElement={
              <TouchableOpacity onPress={() => setShowCurrent((p) => !p)}>
                <Text style={styles.eyeText}>
                  {showCurrent ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            }
          />
          <Field
            label="New Password"
            value={form.newPass}
            onChangeText={(v) => setForm((p) => ({ ...p, newPass: v }))}
            secureTextEntry={!showNew}
            rightElement={
              <TouchableOpacity onPress={() => setShowNew((p) => !p)}>
                <Text style={styles.eyeText}>{showNew ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            }
          />
          <Field
            label="Confirm New Password"
            value={form.confirm}
            onChangeText={(v) => setForm((p) => ({ ...p, confirm: v }))}
            secureTextEntry={!showNew}
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function ProfileTab() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);

  // ── Profile form state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ── Photo state
  const [photoUploading, setPhotoUploading] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(user?.profilePhoto || null);

  // ── Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(avatarScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Photo upload handler
  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setPhotoUploading(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "profile.jpg" });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "vitatrack/profiles");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.secure_url;

      // Save URL to backend
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePhoto: photoUrl }),
      });
      const data = await res.json();

      if (res.ok) {
        setLocalPhoto(photoUrl);
        dispatch(setCredentials({ user: data.user, token }));
        await AsyncStorage.setItem("authUser", JSON.stringify(data.user));
      } else {
        Alert.alert("Error", data.message || "Failed to save photo.");
      }
    } catch {
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── Save profile handler
  const handleSaveProfile = async () => {
    if (!form.fullName.trim()) {
      Alert.alert("Required", "Full name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to update profile.");
        return;
      }
      dispatch(setCredentials({ user: data.user, token }));
      await AsyncStorage.setItem("authUser", JSON.stringify(data.user));
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Logout handler
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["authToken", "authUser"]);
          dispatch(logout());
        },
      },
    ]);
  };

  // ── Delete account handler
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "Confirm Password",
              "Enter your password to confirm account deletion:",
              async (password) => {
                if (!password) return;
                try {
                  const res = await fetch(`${API_URL}/account`, {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ password }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    Alert.alert(
                      "Error",
                      data.message || "Failed to delete account.",
                    );
                    return;
                  }
                  await AsyncStorage.multiRemove([
                    "authToken",
                    "authUser",
                    "hasOnboarded",
                  ]);
                  dispatch(logout());
                } catch {
                  Alert.alert("Error", "Network error. Please try again.");
                }
              },
              "secure-text",
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Static header ── */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => (editing ? handleSaveProfile() : setEditing(true))}>
            {saving ? (
              <ActivityIndicator color={C.crimson} size="small" />
            ) : (
              <Text style={styles.editBtnText}>
                {editing ? "Save" : "Edit"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Avatar section ── */}
        <Animated.View
          style={[
            styles.avatarSection,
            { opacity: headerAnim, transform: [{ scale: avatarScale }] },
          ]}>
          {/* Avatar ring */}
          <View style={styles.avatarRing}>
            {localPhoto ? (
              <Image
                source={{ uri: localPhoto }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user?.fullName)}
                </Text>
              </View>
            )}
          </View>

          {/* Change photo button */}
          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={handleChangePhoto}
            disabled={photoUploading}>
            {photoUploading ? (
              <ActivityIndicator color={C.crimson} size="small" />
            ) : (
              <Text style={styles.changePhotoText}>Change Photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.avatarName}>{user?.fullName}</Text>
          <Text style={styles.avatarEmail}>{user?.email}</Text>

          <View style={styles.memberBadge}>
            <View style={styles.memberDot} />
            <Text style={styles.memberText}>Active Member</Text>
          </View>
        </Animated.View>

        {/* ── Personal Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
          <View style={styles.sectionCard}>
            <Field
              label="Full Name"
              value={form.fullName}
              onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))}
              autoCapitalize="words"
              editable={editing}
            />
            <Field
              label="Email Address"
              value={form.email}
              onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
              keyboardType="email-address"
              editable={editing}
            />
            <Field
              label="Phone Number"
              value={form.phone}
              onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              editable={editing}
            />
            {editing && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditing(false);
                  setForm({
                    fullName: user?.fullName || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                  });
                }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Security ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SECURITY</Text>
          <View style={styles.sectionCard}>
            <RowItem
              icon="🔒"
              label="Change Password"
              onPress={() => setShowPasswordModal(true)}
            />
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.sectionCard}>
            <RowItem icon="🚪" label="Log Out" onPress={handleLogout} />
            <View style={styles.rowDivider} />
            <RowItem
              icon="🗑️"
              label="Delete Account"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>

        {/* ── App info ── */}
        <View style={styles.appInfo}>
          <View style={styles.appLogoMark}>
            <View style={styles.appLogoInner} />
          </View>
          <Text style={styles.appName}>VitaTrack</Text>
          <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
          <Text style={styles.appTagline}>
            Your health, beautifully measured
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        token={token}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  headerSafe: { backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 24,
    color: C.textDark,
    letterSpacing: -0.5,
  },
  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: C.crimsonPale,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  editBtnText: { fontFamily: F.bold, fontSize: 14, color: C.crimson },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: C.crimson,
    padding: 3,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 42 },
  avatarInitials: { fontFamily: F.extraBold, fontSize: 30, color: C.white },
  changePhotoBtn: {
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  changePhotoText: { fontFamily: F.semiBold, fontSize: 13, color: C.crimson },
  avatarName: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: C.textDark,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  avatarEmail: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textMuted,
    marginBottom: 12,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.emeraldPale,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  memberDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.emerald,
  },
  memberText: { fontFamily: F.semiBold, fontSize: 12, color: C.emerald },

  // Sections
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },

  // Fields
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.textMid,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  fieldInputFocused: { borderColor: C.crimson },
  fieldInputDisabled: {
    backgroundColor: "#FAF5F5",
    borderColor: "transparent",
  },
  fieldInput: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textDark,
  },
  eyeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.crimson,
    marginLeft: 8,
  },
  cancelBtn: { alignItems: "center", paddingTop: 4 },
  cancelBtnText: { fontFamily: F.semiBold, fontSize: 13, color: C.textMuted },

  // Row items
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { fontSize: 16 },
  rowInfo: { flex: 1 },
  rowLabel: { fontFamily: F.semiBold, fontSize: 15, color: C.textDark },
  rowValue: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 1,
  },
  rowChevron: { fontSize: 22, color: C.textMuted, fontFamily: F.light },
  rowDivider: { height: 1, backgroundColor: "#FFF0F1" },

  // Save button
  saveBtn: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.3,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,6,8,0.5)",
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.inputBorder,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalTitle: {
    flex: 1,
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.textDark,
  },
  modalClose: {
    fontSize: 16,
    color: C.textMuted,
    fontFamily: F.bold,
    padding: 4,
  },

  // App info
  appInfo: { alignItems: "center", marginTop: 32, gap: 4 },
  appLogoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.crimson,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appLogoInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.white,
    opacity: 0.9,
  },
  appName: { fontFamily: F.extraBold, fontSize: 16, color: C.textDark },
  appVersion: { fontFamily: F.regular, fontSize: 12, color: C.textMuted },
  appTagline: {
    fontFamily: F.light,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: "italic",
  },
});
