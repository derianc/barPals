import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import {
  Mail,
  Tag,
  ShieldCheck,
  CheckCircle,
  XCircle,
  UserCircle,
} from "lucide-react-native";
import { supabase } from "@/supabase";
import { getProfile } from "@/services/sbUserService";

interface UserProfileData {
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UserProfileDetails: React.FC<{ colorMode: string }> = ({ colorMode }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const textColor = colorMode === "dark" ? "#fff" : "#000";
  const subTextColor = colorMode === "dark" ? "#aaa" : "#555";
  const avatarBgColor = colorMode === "dark" ? "#333" : "#eee";
  const activeColor = colorMode === "dark" ? "#0f0" : "#080";
  const inactiveColor = colorMode === "dark" ? "#f00" : "#a00";

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: session,
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError || !session.user) {
        console.error("Auth error:", sessionError);
        setLoading(false);
        return;
      }

      const { data, error } = await getProfile(session.user.id);
      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setUser(data);
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading || !user) {
    return (
      <View style={[styles.wrapper, styles.center]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  return (
    <VStack space="lg" style={styles.wrapper}>
      {/* Avatar + Name */}
      <HStack space="md" style={styles.rowCenter}>
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={[styles.avatarImage, { backgroundColor: avatarBgColor }]}
          />
        ) : (
          <UserCircle size={64} color={textColor} />
        )}
        <VStack>
          <TextInput
            value={user.full_name || ""}
            placeholder="Full Name"
            placeholderTextColor={subTextColor}
            style={[styles.input, { color: textColor, borderColor: subTextColor }]}
          />
          <TextInput
            value={user.username || ""}
            placeholder="Username"
            placeholderTextColor={subTextColor}
            style={[styles.input, { color: subTextColor, borderColor: subTextColor }]}
          />
        </VStack>
      </HStack>

      {/* Contact Info */}
      <VStack space="sm">
        <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Info</Text>
        <HStack space="sm" style={styles.rowCenter}>
          <Mail size={18} color={subTextColor} style={styles.iconMargin} />
          <TextInput
            value={user.email}
            editable={false}
            style={[styles.input, { color: textColor, borderColor: subTextColor }]}
          />
        </HStack>
      </VStack>

      {/* Account Details */}
      <VStack space="sm">
        <Text style={[styles.sectionTitle, { color: textColor }]}>Account Details</Text>
        <HStack space="sm" style={styles.rowCenter}>
          <ShieldCheck size={18} color={subTextColor} style={styles.iconMargin} />
          <Text style={[styles.bodyText, { color: textColor }]}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </HStack>
        <HStack space="sm" style={styles.rowCenter}>
          {user.is_active ? (
            <CheckCircle size={18} color={activeColor} style={styles.iconMargin} />
          ) : (
            <XCircle size={18} color={inactiveColor} style={styles.iconMargin} />
          )}
          <Text style={[styles.bodyText, { color: textColor }]}>
            {user.is_active ? "Active" : "Inactive"}
          </Text>
        </HStack>
      </VStack>

      {/* Metadata */}
      <VStack space="sm">
        <Text style={[styles.sectionTitle, { color: textColor }]}>Metadata</Text>
        <Text style={[styles.metadataText, { color: subTextColor }]}>
          Created: {new Date(user.created_at).toLocaleDateString()}
        </Text>
        <Text style={[styles.metadataText, { color: subTextColor }]}>
          Updated: {new Date(user.updated_at).toLocaleDateString()}
        </Text>
      </VStack>
    </VStack>
  );
};

export default UserProfileDetails;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  rowCenter: {
    alignItems: "center",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  bodyText: {
    fontSize: 14,
  },
  metadataText: {
    fontSize: 12,
  },
  iconMargin: {
    marginRight: 8,
  },
  input: {
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4,
    minWidth: 200,
  },
});
