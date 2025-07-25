import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Text as RNText,
  TouchableOpacity,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";

interface UserCardProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: "user" | "owner" | "admin";
    is_active: boolean;
  };
  onRoleChange: (id: string, newRole: "user" | "owner" | "admin") => void;
  onStatusToggle: (id: string, isActive: boolean) => void;
  onDisplayNameSave: (id: string, newName: string) => void;
}

export default function UserCard({
  user,
  onRoleChange,
  onStatusToggle,
  onDisplayNameSave,
}: UserCardProps) {
  const [editingName, setEditingName] = useState(user.full_name || "");
  const [nameChanged, setNameChanged] = useState(false);

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSaveName = () => {
    if (nameChanged) {
      onDisplayNameSave(user.id, editingName.trim());
      setNameChanged(false);
    }
  };

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.96), withSpring(1));
  };

  const handlePromote = () => {
    const nextRole = user.role === "user" ? "owner" : user.role === "owner" ? "admin" : "admin";
    onRoleChange(user.id, nextRole);
  };

  const handleDemote = () => {
    const nextRole = user.role === "admin" ? "owner" : user.role === "owner" ? "user" : "user";
    onRoleChange(user.id, nextRole);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        animatedStyle,
        styles.cardContainer,
        user.is_active ? styles.activeCard : styles.inactiveCard,
      ]}
    >
      <HStack style={styles.topRow}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <RNText style={styles.avatarInitial}>{user.full_name?.[0] ?? "?"}</RNText>
          </View>
        )}

        <VStack style={{ flex: 1 }}>
          <TextInput
            value={editingName}
            onChangeText={(text) => {
              setEditingName(text);
              setNameChanged(text.trim() !== user.full_name?.trim());
            }}
            style={styles.nameInput}
            editable={user.is_active}
            placeholder="Name"
            placeholderTextColor="#666"
          />
          <Text style={styles.metaText}>{user.email}</Text>
        </VStack>
      </HStack>

      <HStack style={styles.metricsRow}>
        <HStack style={styles.row}>
          <Icon as={ShieldCheck} size="sm" style={styles.icon} />
          <Text style={styles.metaText}>{user.role.toUpperCase()}</Text>
        </HStack>

        <View style={styles.verticalDivider} />

        <HStack style={styles.row}>
          <Icon as={user.is_active ? CheckCircle : XCircle} size="sm" style={user.is_active ? styles.activeIcon : styles.inactiveIcon} />
          <Text style={styles.metaText}>{user.is_active ? "Active" : "Inactive"}</Text>
        </HStack>
      </HStack>

      <HStack style={styles.actions}>
        {user.role !== "admin" && (
          <TouchableOpacity style={styles.button} onPress={handlePromote}>
            <Text style={styles.buttonText}>Promote</Text>
          </TouchableOpacity>
        )}
        {user.role !== "user" && (
          <TouchableOpacity style={styles.button} onPress={handleDemote}>
            <Text style={styles.buttonText}>Demote</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button} onPress={() => onStatusToggle(user.id, !user.is_active)}>
          <Text style={styles.buttonText}>{user.is_active ? "Deactivate" : "Activate"}</Text>
        </TouchableOpacity>
        {nameChanged && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </HStack>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    borderRadius: 18,
    gap: 12,
    flexDirection: "column",
    marginBottom: 12,
  },
  activeCard: {
    backgroundColor: "#1C1C1E",
  },
  inactiveCard: {
    backgroundColor: "#2C2C2E",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#374151",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  nameInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "dm-sans-bold",
    marginBottom: 2,
  },
  metaText: {
    fontSize: 13,
    color: "#D1D5DB",
    fontFamily: "dm-sans-light",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  icon: {
    color: "#D1D5DB",
  },
  activeIcon: {
    color: "#10B981",
  },
  inactiveIcon: {
    color: "#EF4444",
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#4B5563",
    marginHorizontal: 8,
    borderRadius: 1,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 13,
    color: "#F3F4F6",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "bold",
  },
});
