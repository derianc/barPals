import React, { useContext, useEffect, useState } from "react";
import { Text, View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  User as UserIcon,
  Mail,
  Tag,
  UserCircle,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import CustomHeader from "@/components/shared/custom-header";
import RedirectCard from "@/components/screens/settings/redirect-card";
import { useRouter } from "expo-router";
import { ThemeContext } from "@/contexts/theme-context";
import { getProfile } from "@/services/sbUserService";
import { supabase } from "@/supabase";

interface UserProfileData {
  id: string;
  email: string;
  deviceToken: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const router = useRouter();
  const { colorMode }: any = useContext(ThemeContext);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
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

    fetchProfile();
  }, []);

  const backgroundColor = colorMode === "dark" ? "#000" : "#fff";
  const textColor = colorMode === "dark" ? "#fff" : "#000";
  const subTextColor = colorMode === "dark" ? "#aaa" : "#555";
  const avatarBgColor = colorMode === "dark" ? "#333" : "#eee";
  const activeColor = colorMode === "dark" ? "#0f0" : "#080";
  const inactiveColor = colorMode === "dark" ? "#f00" : "#a00";

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: textColor }}>Unable to load profile.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <CustomHeader variant="general" title="Profile" />

      <VStack space="lg" style={styles.contentWrapper}>
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
            <Text style={[styles.nameText, { color: textColor }]}>
              {user.full_name || user.username || "No Name"}
            </Text>
            {user.username ? (
              <Text style={[styles.usernameText, { color: subTextColor }]}>
                @{user.username}
              </Text>
            ) : null}
          </VStack>
        </HStack>

        {/* Contact Info */}
        <VStack space="sm">
          <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Info</Text>
          <HStack space="sm" style={styles.rowCenter}>
            <Mail size={18} color={subTextColor} style={styles.iconMargin} />
            <Text style={[styles.bodyText, { color: textColor }]}>{user.email}</Text>
          </HStack>
        </VStack>

        {/* Account Details */}
        <VStack space="sm">
          <Text style={[styles.sectionTitle, { color: textColor }]}>Account Details</Text>
          {user.username && (
            <HStack space="sm" style={styles.rowCenter}>
              <Tag size={18} color={subTextColor} style={styles.iconMargin} />
              <Text style={[styles.bodyText, { color: textColor }]}>{user.username}</Text>
            </HStack>
          )}
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
          <HStack space="sm">
            <Text style={[styles.metadataText, { color: subTextColor }]}>
              Created:{" "}
              {new Date(user.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </HStack>
          <HStack space="sm">
            <Text style={[styles.metadataText, { color: subTextColor }]}>
              Updated:{" "}
              {new Date(user.updated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 16,
  },
  rowCenter: {
    alignItems: "center",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "600",
  },
  usernameText: {
    fontSize: 14,
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
});
