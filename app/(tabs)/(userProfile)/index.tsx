import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text} from "react-native";
//import * as DocumentPicker from 'expo-document-picker';
import { VStack } from "@/components/ui/vstack";
import { getLoggedInUser, UserProfileData } from "@/services/sbUserService";
import UserProfileHeader from "@/components/shared/custom-header/userProfileHeader";
import { Camera } from "lucide-react-native";
import ProfileCard from "@/components/screens/userProfile/profile-card/profileCard";
import { Icon } from "@/components/ui/icon";
import { Calendar } from "lucide-react-native";
import { useUser } from "@/contexts/userContext";


const UserProfileDetails = () => {
  const { session, rehydrated } = useUser();
  const [localUser, setLocalUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!rehydrated || !session) return;

      setLoading(true);
      const userData = await getLoggedInUser();
      setLocalUser(userData);
      setLoading(false);
    };

    fetchUserData();
  }, [session, rehydrated]);

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
        {localUser?.avatar_url ? (
          <Image
            source={{ uri: localUser.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarImage} />
        )}

        <TouchableOpacity style={styles.cameraButton} >
          <Camera size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Username + Join Date */}
      <View style={styles.profileSummary}>
        <Text style={styles.userName}>@{localUser?.username}</Text>
        <Text style={styles.joinDate}>
          <Icon as={Calendar} size="sm" className="text-typography-500" />
          Joined{" "}
          {localUser?.created_at
            ? new Date(localUser.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
            : "N/A"}
        </Text>
      </View>

      <ProfileCard
        userId={localUser?.id || ""}
        full_name={localUser?.full_name || ""}
        username={localUser?.username || ""}
        created_at={localUser?.created_at || ""}
        allow_notifications={localUser?.allow_notifications ?? false}
        onEditName={(val) => setLocalUser((prev) => prev && { ...prev, full_name: val })}
        onToggleNotifications={(val) =>
          setLocalUser((prev) => prev && { ...prev, allow_notifications: val })
        }
      />


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
  profileSummary: {
  marginTop: 80,
  alignItems: "center",
},
userName: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#F9FAFB",
},
joinDate: {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 4,
},

accountCard: {
  backgroundColor: "#F3F4F6", // soft gray
  marginTop: 24,
  marginHorizontal: 20,
  borderRadius: 16,
  padding: 16,
},
accountTitle: {
  fontSize: 14,
  fontWeight: "bold",
  color: "#374151",
  marginBottom: 12,
},
accountRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
},
accountLabel: {
  fontSize: 14,
  color: "#4B5563",
},
input: {
  backgroundColor: "#fff",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 6,
  fontSize: 14,
  color: "#111827",
  minWidth: 160,
  elevation: 1,
},


});

export default UserProfileDetails;
