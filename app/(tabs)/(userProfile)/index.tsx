import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
//import * as DocumentPicker from 'expo-document-picker';
import { VStack } from "@/components/ui/vstack";
import { supabase } from "@/supabase";
import { getProfile } from "@/services/sbUserService";
import UserProfileHeader from "@/components/shared/custom-header/userProfileHeader";
import { Camera } from "lucide-react-native";

interface UserProfileData {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  allow_notifications: boolean;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UserProfileDetails = () => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

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

  // const handlePickImage = async () => {
  //   const result = await DocumentPicker.getDocumentAsync({
  //     type: "image/*",
  //     copyToCacheDirectory: true,
  //   });

  //   if (result.assets && result.assets.length > 0) {
  //     const file = result.assets[0];

  //     const response = await fetch(file.uri);
  //     const blob = await response.blob();

  //     const filePath = `avatars/${Date.now()}_${file.name}`;
  //     const { error: uploadError } = await supabase.storage
  //       .from("user-avatars")
  //       .upload(filePath, blob, {
  //         contentType: file.mimeType || "image/jpeg",
  //         upsert: true,
  //       });

  //     if (uploadError) {
  //       console.error("Upload failed:", uploadError.message);
  //       Alert.alert("Upload failed", uploadError.message);
  //       return;
  //     }

  //     const { data: urlData } = supabase.storage
  //       .from("user-avatars")
  //       .getPublicUrl(filePath);

  //     const avatarUrl = urlData.publicUrl;

  //     // Update profile with the new avatar URL
  //     const { error: updateError } = await supabase
  //       .from("profiles")
  //       .update({ avatar_url: avatarUrl })
  //       .eq("id", user?.id); // Replace with actual ID logic

  //     if (updateError) {
  //       console.error("Profile update failed:", updateError.message);
  //       Alert.alert("Profile update failed", updateError.message);
  //       return;
  //     }

  //     setUser((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : prev));
  //   }
  // };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <VStack space="md" className="flex-1 bg-background-0">
      <UserProfileHeader />

      {/* Overlapping Avatar */}
      <View style={styles.avatarContainer}>
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarImage} />
        )}

        <TouchableOpacity style={styles.cameraButton} >
          <Camera size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </VStack>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    width: 140,
    height: 140,
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ccc",
    borderWidth: 2,
    borderColor: "#6A11CB",
  },
  cameraButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default UserProfileDetails;
