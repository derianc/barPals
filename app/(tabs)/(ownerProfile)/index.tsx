import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  Switch,
  Pressable
} from "react-native";
//import * as DocumentPicker from 'expo-document-picker';
import { VStack } from "@/components/ui/vstack";
import UserProfileHeader from "@/components/shared/custom-header/userProfileHeader";
import { Camera } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Calendar, Bell } from "lucide-react-native";
import OwnerProfileCard from "@/components/screens/ownerProfile/profile-card/ownerProfileCard";
import { getVenuesForProfile } from "@/services/sbVenueService";
import { useUser } from "@/contexts/userContext";
import { Venue } from "@/types/Venue";
import { router } from "expo-router";
import { Text as AppText } from "@/components/ui/text";

const OwnerProfileDetails = () => {
  const [loading, setLoading] = useState(true);
  const [venuesList, setVenueList] = useState<Venue[]>([]);
  const { user, rehydrated } = useUser();

  useEffect(() => {
    const fetchVenues = async () => {
      if (!user?.id) return;
      const venues = await getVenuesForProfile(user.id);
      setVenueList(venues);
      setLoading(false);
    };

    fetchVenues();
  }, [user]);


  if (loading || !user || !rehydrated) {
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

      {/* Username + Join Date */}
      <View style={styles.profileSummary}>
        <Text style={styles.userName}>@{user?.username}</Text>
        <Text style={styles.joinDate}>
          <Icon as={Calendar} size="sm" className="text-typography-500" />
          Joined{" "}
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
            : "N/A"}
        </Text>
      </View>

      <OwnerProfileCard
        userId={user?.id || ""}
        full_name={user?.full_name || ""}
        username={user?.username || ""}
        created_at={user?.created_at || ""}
        allow_notifications={user?.allow_notifications ?? false}
        onEditName={(val) => { if (user) return; }}
        onToggleNotifications={(val) => { if (user) return; }}
        venues={venuesList}
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

export default OwnerProfileDetails;
