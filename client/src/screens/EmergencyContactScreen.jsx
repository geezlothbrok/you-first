import React, { useState, useEffect, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/slices/authSlice";

const { width } = Dimensions.get("window");

// ─── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8F8",
  bgCard: "#FFFFFF",
  crimson: "#C0152A",
  crimsonDeep: "#8B0F1E",
  crimsonLight: "#E8394D",
  crimsonPale: "#FDECEA",
  inputBorder: "#F0D0D4",
  inputBg: "#FFF4F5",
  emerald: "#2EAF6F",
  emeraldPale: "#EDFBF3",
  amber: "#D97706",
  amberPale: "#FFFBEB",
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

const API_URL = "http://localhost:3000/api/sos";
const CACHE_KEY = "sosContacts_cache";

const RELATIONSHIPS = [
  "parent",
  "spouse",
  "sibling",
  "child",
  "friend",
  "doctor",
  "colleague",
  "other",
];
const RELATIONSHIP_LABELS = {
  parent: "Parent",
  spouse: "Spouse",
  sibling: "Sibling",
  child: "Child",
  friend: "Friend",
  doctor: "Doctor",
  colleague: "Colleague",
  other: "Other",
};
const RELATIONSHIP_EMOJIS = {
  parent: "👨‍👩‍👦",
  spouse: "💑",
  sibling: "👫",
  child: "👶",
  friend: "🤝",
  doctor: "👨‍⚕️",
  colleague: "💼",
  other: "👤",
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  relationship: "other",
  priority: 1,
  sendLocation: true,
  customMessage: "",
};

// ─── Priority badge ───────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const colors = [
    "",
    C.crimson,
    C.crimsonLight,
    C.amber,
    "#7C3AED",
    C.textMuted,
  ];
  const labels = ["", "1st", "2nd", "3rd", "4th", "5th"];
  return (
    <View
      style={[
        styles.priorityBadge,
        {
          backgroundColor: `${colors[priority]}18`,
          borderColor: `${colors[priority]}40`,
        },
      ]}>
      <Text style={[styles.priorityText, { color: colors[priority] }]}>
        {labels[priority]}
      </Text>
    </View>
  );
}

// ─── Contact card ─────────────────────────────────────────────────────────
function ContactCard({ contact, onEdit, onDelete, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Animated.View
      style={[
        styles.contactCard,
        { opacity: anim, transform: [{ translateX: slideAnim }] },
      ]}>
      {/* Left — avatar + info */}
      <View style={styles.contactLeft}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitials}>
            {getInitials(contact.name)}
          </Text>
          <Text style={styles.contactRelationEmoji}>
            {RELATIONSHIP_EMOJIS[contact.relationship] || "👤"}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.contactNameRow}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <PriorityBadge priority={contact.priority} />
          </View>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
          <View style={styles.contactMeta}>
            <Text style={styles.contactRelationLabel}>
              {RELATIONSHIP_LABELS[contact.relationship]}
            </Text>
            {contact.sendLocation && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>📍 Location</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right — actions */}
      <View style={styles.contactActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(contact)}>
          <Text style={styles.actionEdit}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDelete(contact)}>
          <Text style={styles.actionDelete}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────
function ContactModal({ visible, contact, onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setForm(
        contact
          ? {
              name: contact.name,
              phone: contact.phone,
              relationship: contact.relationship,
              priority: contact.priority,
              sendLocation: contact.sendLocation,
              customMessage: contact.customMessage || "",
            }
          : EMPTY_FORM,
      );

      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, contact]);

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const isEditing = !!contact;

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
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Contact" : "Add SOS Contact"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Name */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.name}
                onChangeText={(v) => setField("name", v)}
                placeholder="John Mensah"
                placeholderTextColor={C.textPlaceholder}
                autoCapitalize="words"
                selectionColor={C.crimson}
              />
            </View>

            {/* Phone */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Phone Number *</Text>
              <TextInput
                style={styles.modalInput}
                value={form.phone}
                onChangeText={(v) => setField("phone", v)}
                placeholder="+233 20 000 0000"
                placeholderTextColor={C.textPlaceholder}
                keyboardType="phone-pad"
                selectionColor={C.crimson}
              />
            </View>

            {/* Relationship */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Relationship</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}>
                {RELATIONSHIPS.map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.pill,
                      form.relationship === rel && styles.pillActive,
                    ]}
                    onPress={() => setField("relationship", rel)}>
                    <Text style={styles.pillEmoji}>
                      {RELATIONSHIP_EMOJIS[rel]}
                    </Text>
                    <Text
                      style={[
                        styles.pillText,
                        form.relationship === rel && styles.pillTextActive,
                      ]}>
                      {RELATIONSHIP_LABELS[rel]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Priority */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Alert Priority</Text>
              <View style={styles.priorityRow}>
                {[1, 2, 3, 4, 5].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      form.priority === p && styles.priorityBtnActive,
                    ]}
                    onPress={() => setField("priority", p)}>
                    <Text
                      style={[
                        styles.priorityBtnText,
                        form.priority === p && styles.priorityBtnTextActive,
                      ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.priorityHint}>
                1 = contacted first during SOS
              </Text>
            </View>

            {/* Send location toggle */}
            <View style={styles.modalToggleRow}>
              <View>
                <Text style={styles.modalToggleLabel}>
                  Include Location in SMS
                </Text>
                <Text style={styles.modalToggleHint}>
                  Sends your live location with the alert
                </Text>
              </View>
              <Switch
                value={form.sendLocation}
                onValueChange={(v) => setField("sendLocation", v)}
                trackColor={{ false: C.inputBorder, true: C.emerald }}
                thumbColor={C.white}
              />
            </View>

            {/* Custom message */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>
                Custom SMS Message (optional)
              </Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMulti]}
                value={form.customMessage}
                onChangeText={(v) => setField("customMessage", v)}
                placeholder="Leave blank to use default alert message..."
                placeholderTextColor={C.textPlaceholder}
                multiline
                maxLength={300}
                selectionColor={C.crimson}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {form.customMessage.length}/300
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && { opacity: 0.8 }]}
              onPress={() => onSave(form)}
              disabled={saving}
              activeOpacity={0.88}>
              {saving ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>
                  {isEditing ? "Save Changes" : "Add Contact"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function EmergencyContactsScreen({ navigation }) {
  const token = useSelector(selectToken);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      // 1. Show cached immediately
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setContacts(JSON.parse(cached));
        setLoading(false);
      }

      // 2. Fetch fresh from API
      const res = await fetch(`${API_URL}/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setContacts(data.contacts);
        // Always cache — SOS must work offline
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.contacts));
      }
    } catch {
      // Network failed — cached data already showing
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert("Required", "Name and phone number are required.");
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingContact;
      const url = isEditing
        ? `${API_URL}/contacts/${editingContact._id}`
        : `${API_URL}/contacts`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          customMessage: form.customMessage.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to save contact.");
        return;
      }

      await loadContacts(); // refresh + re-cache
      setModalVisible(false);
      setEditingContact(null);
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact) => {
    Alert.alert(
      "Remove Contact",
      `Remove ${contact.name} from your SOS contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_URL}/contacts/${contact._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadContacts();
            } catch {
              Alert.alert("Error", "Failed to remove contact.");
            }
          },
        },
      ],
    );
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingContact(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.crimsonDeep} />

      {/* Static header */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SOS Contacts</Text>
          {contacts.length < 5 && (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={C.crimson} size="large" />
          <Text style={styles.loadingText}>Loading contacts…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerEmoji}>🆘</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoBannerTitle}>Who gets alerted?</Text>
              <Text style={styles.infoBannerText}>
                These contacts receive an SMS and phone call when SOS is
                triggered. Add up to 5, ordered by priority.
              </Text>
            </View>
          </View>

          {/* Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>
              <Text style={styles.counterNum}>{contacts.length}</Text>
              <Text style={styles.counterOf}> / 5</Text> contacts added
            </Text>
            {contacts.length === 0 && (
              <Text style={styles.counterWarning}>
                ⚠️ Add at least one contact
              </Text>
            )}
          </View>

          {/* Contact list */}
          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No SOS Contacts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add emergency contacts so they can be reached when you need help
                most.
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={handleAdd}>
                <Text style={styles.emptyAddBtnText}>
                  Add Your First Contact
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactList}>
              {contacts.map((contact, i) => (
                <ContactCard
                  key={contact._id}
                  contact={contact}
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}

          {/* Add more button */}
          {contacts.length > 0 && contacts.length < 5 && (
            <TouchableOpacity style={styles.addMoreBtn} onPress={handleAdd}>
              <Text style={styles.addMoreText}>+ Add Another Contact</Text>
            </TouchableOpacity>
          )}

          {contacts.length === 5 && (
            <View style={styles.maxBanner}>
              <Text style={styles.maxBannerText}>
                ✓ Maximum of 5 contacts reached
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add / Edit modal */}
      <ContactModal
        visible={modalVisible}
        contact={editingContact}
        onClose={() => {
          setModalVisible(false);
          setEditingContact(null);
        }}
        onSave={handleSave}
        saving={saving}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontFamily: F.medium, fontSize: 14, color: C.textMuted },

  // Header
  headerSafe: { backgroundColor: C.crimsonDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: C.crimsonDeep,
  },
  backBtn: { padding: 4, marginRight: 8 },
  backArrow: {
    fontSize: 28,
    color: C.white,
    fontFamily: F.light,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.white,
    letterSpacing: -0.3,
  },
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { fontFamily: F.bold, fontSize: 13, color: C.white },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Info banner
  infoBanner: {
    margin: 20,
    backgroundColor: C.crimsonPale,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  infoBannerEmoji: { fontSize: 22 },
  infoBannerTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.crimson,
    marginBottom: 3,
  },
  infoBannerText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMid,
    lineHeight: 18,
  },

  // Counter
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  counterText: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  counterNum: { fontFamily: F.extraBold, fontSize: 16, color: C.textDark },
  counterOf: { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  counterWarning: { fontFamily: F.semiBold, fontSize: 12, color: C.amber },

  // Contact list
  contactList: { paddingHorizontal: 20, gap: 12 },
  contactCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  contactLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.crimsonPale,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  contactInitials: { fontFamily: F.extraBold, fontSize: 16, color: C.crimson },
  contactRelationEmoji: {
    position: "absolute",
    bottom: -2,
    right: -2,
    fontSize: 14,
    backgroundColor: C.white,
    borderRadius: 10,
    overflow: "hidden",
  },
  contactInfo: { flex: 1 },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  contactName: { fontFamily: F.bold, fontSize: 14, color: C.textDark },
  contactPhone: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 5,
  },
  contactMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactRelationLabel: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: C.textMid,
  },
  locationBadge: {
    backgroundColor: C.emeraldPale,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  locationBadgeText: { fontFamily: F.semiBold, fontSize: 10, color: C.emerald },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityText: { fontFamily: F.bold, fontSize: 10 },

  // Contact actions
  contactActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 8 },
  actionEdit: { fontSize: 16 },
  actionDelete: { fontSize: 16 },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontFamily: F.extraBold,
    fontSize: 20,
    color: C.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: C.crimson,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyAddBtnText: { fontFamily: F.bold, fontSize: 15, color: C.white },

  // Add more
  addMoreBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    borderRadius: 14,
    borderStyle: "dashed",
    paddingVertical: 14,
    alignItems: "center",
  },
  addMoreText: { fontFamily: F.bold, fontSize: 14, color: C.crimson },
  maxBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: C.emeraldPale,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  maxBannerText: { fontFamily: F.semiBold, fontSize: 13, color: C.emerald },

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
    maxHeight: "90%",
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
  modalCloseBtn: { padding: 4 },
  modalCloseText: { fontSize: 16, color: C.textMuted, fontFamily: F.bold },

  // Modal fields
  modalField: { marginBottom: 16 },
  modalFieldLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textMid,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalInput: {
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textDark,
  },
  modalInputMulti: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  charCount: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    textAlign: "right",
    marginTop: 4,
  },

  // Relationship pills
  pillRow: { gap: 8, paddingVertical: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  pillActive: { backgroundColor: C.crimsonPale, borderColor: C.crimson },
  pillEmoji: { fontSize: 14 },
  pillText: { fontFamily: F.semiBold, fontSize: 12, color: C.textMuted },
  pillTextActive: { color: C.crimson, fontFamily: F.bold },

  // Priority
  priorityRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  priorityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityBtnActive: { backgroundColor: C.crimsonPale, borderColor: C.crimson },
  priorityBtnText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.textMuted,
  },
  priorityBtnTextActive: { color: C.crimson },
  priorityHint: { fontFamily: F.regular, fontSize: 11, color: C.textMuted },

  // Toggle
  modalToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: C.inputBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  modalToggleLabel: { fontFamily: F.bold, fontSize: 13, color: C.textDark },
  modalToggleHint: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  // Modal save
  modalSaveBtn: {
    backgroundColor: C.crimson,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: C.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalSaveBtnText: {
    fontFamily: F.extraBold,
    fontSize: 16,
    color: C.white,
    letterSpacing: 0.3,
  },
});
